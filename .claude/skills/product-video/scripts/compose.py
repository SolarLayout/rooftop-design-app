#!/usr/bin/env python3
"""Composes a cut from the recorded frames: the shots of a plan in order, the captions faded in and out, crossfades, a
push-in on still screens; and the email GIF. Pipes raw frames to the e2e workspace's ffmpeg (H.264).

  uv run --with pillow python compose.py <video> wide       -> <work>/<video>/out/<name>-1920x1080.mp4   (plan.json)
                                                               and <name>-thumbnail-1920x1080.png and .jpg
  uv run --with pillow python compose.py <video> square     -> <work>/<video>/out/<name>-1080x1080.mp4   (plan.json)
                                                               and <name>-thumbnail-1080x1080.png
  uv run --with pillow python compose.py <video> gif-640    -> <work>/<video>/out/<name>.gif             (plan-gif-640.json)

A cut comes with its thumbnail (every video has one, the owner's rule of 2026-10-10): the one overlays.cjs rendered over
the frame plan.json names ("thumb"), written beside the cut. Without it the cut is refused before the minutes of encoding.

The plans are assets/videos/<video>/plan*.json. A plan is a list of shots: a segment of the video's frames with a frame range, its speed (frames skipped), its captions with
the frames they fade in and out at, a push-in, and for the square cut the centre of the window kept ("sq_cx", in 1920
coordinates) or "box" for the whole frame letterboxed; or a card held for so many frames (the end card).
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
WORK_ROOT = Path(os.environ.get("PRODUCT_VIDEO_WORK") or HERE.parents[3] / ".product-video")
FRAMES = OVER = OUT = Path()  # the video's, set by main
FPS = 30
GROUND = (11, 14, 19)
XFADE = 12  # frames of crossfade between shots
CAP_FADE = 10  # frames a caption fades in and out
SRC_W, SRC_H = 3840, 2160  # the frames: 1920x1080 at twice the pixels


def ffmpeg() -> str:
    return subprocess.run(["node", str(HERE / "paths.cjs"), "ffmpeg"], capture_output=True, text=True, check=True).stdout.strip()


def ease(t: float) -> float:
    return 2 * t * t if t < 0.5 else 1 - (-2 * t + 2) ** 2 / 2


class Shot:
    def __init__(self, seg=None, start=0, end=0, speed=1.0, captions=(), push=0.0, square="box", sq_cx=960, card=None, hold=None):
        self.seg, self.start, self.end, self.speed = seg, start, end, speed
        self.captions, self.push = list(captions), push
        self.square, self.sq_cx, self.card, self.hold = square, sq_cx, card, hold
        self.n = hold if card else int((end - start) / speed)

    def source(self, i: int) -> Path:
        return FRAMES / self.seg / f"{self.start + int(i * self.speed):05d}.jpg"


CAPTIONS: dict = {}


def caption(name: str, kind: str) -> Image.Image:
    key = (name, kind)
    if key not in CAPTIONS:
        CAPTIONS[key] = Image.open(OVER / f"{name}-{kind}.png").convert("RGBA")
    return CAPTIONS[key]


def with_alpha(img: Image.Image, a: float) -> Image.Image:
    if a >= 1:
        return img
    r, g, b, al = img.split()
    return Image.merge("RGBA", (r, g, b, al.point(lambda v: int(v * a))))


def render_wide(shot: Shot, i: int, src: Image.Image) -> Image.Image:
    z = 1 + shot.push * (i / max(1, shot.n - 1))
    w, h = SRC_W / z, SRC_H / z
    return src.resize((1920, 1080), Image.LANCZOS, box=((SRC_W - w) / 2, (SRC_H - h) / 2, (SRC_W + w) / 2, (SRC_H + h) / 2))


def render_square(shot: Shot, i: int, src: Image.Image) -> Image.Image:
    z = 1 + shot.push * (i / max(1, shot.n - 1))
    if shot.square == "full":
        side = SRC_H / z
        cx = shot.sq_cx * 2
        return src.resize((1080, 1080), Image.LANCZOS, box=(cx - side / 2, (SRC_H - side) / 2, cx + side / 2, (SRC_H + side) / 2))
    frame = src.resize((1080, 608), Image.LANCZOS, box=((SRC_W - SRC_W / z) / 2, (SRC_H - SRC_H / z) / 2, (SRC_W + SRC_W / z) / 2, (SRC_H + SRC_H / z) / 2))
    canvas = Image.new("RGB", (1080, 1080), GROUND)
    canvas.paste(frame, (0, 112))
    ImageDraw.Draw(canvas).rectangle((0, 112, 1079, 719), outline=(35, 42, 54))
    return canvas


def captions_at(shot: Shot, i: int) -> list:
    """The captions shown at frame i of the shot, each with its alpha; "fade": 1 shows one whole from its first frame."""
    shown = []
    for c in shot.captions:
        start = c.get("in", 0)
        out = c.get("out") if c.get("out") is not None else shot.n
        if i < start or i >= out:
            continue
        fade = c.get("fade", CAP_FADE)
        a = min(1, (i - start + 1) / fade, (out - i) / fade)
        if a > 0:
            shown.append((c["name"], a))
    return shown


def frame_of(shot: Shot, i: int, kind: str) -> Image.Image:
    if shot.card:
        return Image.open(OVER / f"{shot.card}-{kind}.png").convert("RGB")
    src = Image.open(shot.source(i)).convert("RGB")
    img = render_wide(shot, i, src) if kind == "wide" else render_square(shot, i, src)
    shown = captions_at(shot, i)
    if shown:
        img = img.convert("RGBA")
        for name, a in shown:
            img.alpha_composite(with_alpha(caption(name, kind), a))
        img = img.convert("RGB")
    return img


def sequence(shots: list, kind: str):
    """The final frames: the shots crossfaded, each one's last XFADE frames blended with the next one's first."""
    timeline = []
    for s_index, shot in enumerate(shots):
        for i in range(shot.n):
            timeline.append([(shot, i)])
        if s_index < len(shots) - 1:
            for k in range(XFADE):
                timeline[-XFADE + k].append((shots[s_index + 1], k))
            shots[s_index + 1]._skip = XFADE
    for entry in timeline:
        shot, i = entry[0]
        if getattr(shot, "_skip", 0) and i < shot._skip and len(entry) == 1:
            continue  # shown already, inside the crossfade of the shot before
        img = frame_of(shot, i, kind)
        if len(entry) == 2:
            nshot, ni = entry[1]
            img = Image.blend(img, frame_of(nshot, ni, kind), ease((ni + 1) / XFADE))
        yield img


def total_frames(shots: list) -> int:
    return sum(s.n for s in shots) - XFADE * (len(shots) - 1)


def encode(shots: list, kind: str, path: Path, crf: int = 18) -> int:
    w, h = (1920, 1080) if kind == "wide" else (1080, 1080)
    fade_out_at = total_frames(shots) - 24
    cmd = [ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart",
           "-vf", f"fade=t=in:st=0:d=0.5,fade=t=out:st={fade_out_at / FPS:.2f}:d=0.8", str(path)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    count = 0
    for img in sequence(shots, kind):
        proc.stdin.write(img.tobytes())
        count += 1
        if count % 300 == 0:
            print(kind, count, "frames", flush=True)
    proc.stdin.close()
    proc.wait()
    print(kind, "done:", count, "frames,", f"{count / FPS:.1f} s ->", path, flush=True)
    return count


def thumbnail(kind: str, name: str) -> list:
    """The cut's thumbnail from the overlays, beside the cut: png for both cuts, and jpg for the wide one (what an upload
    form takes). Refused plainly when overlays.cjs has not rendered it."""
    rendered = OVER / f"thumb-{kind}.png"
    if not rendered.exists():
        raise SystemExit(f"No thumbnail for the {kind} cut: {rendered} is missing. Run `node overlays.cjs <video> captions` first (it renders the thumbnails over plan.json's thumb frame).")
    size = "1920x1080" if kind == "wide" else "1080x1080"
    written = [OUT / f"{name}-thumbnail-{size}.png"]
    shutil.copyfile(rendered, written[0])
    if kind == "wide":
        written.append(OUT / f"{name}-thumbnail-{size}.jpg")
        Image.open(rendered).convert("RGB").save(written[1], quality=92)
    return written


def gif(plan: dict, path: Path) -> None:
    """The email GIF: the shots without crossfades, the wide composition scaled down, one palette for the whole GIF."""
    shots = [Shot(**s) for s in plan["shots"]]
    width, fps, colors = plan.get("width", 800), plan.get("fps", 10), plan.get("colors", 128)
    tmp = Path(tempfile.mkdtemp(prefix="gif-"))
    n = 0
    for shot in shots:
        for i in range(shot.n):
            frame_of(shot, i, "wide").resize((width, round(width * 9 / 16)), Image.LANCZOS).save(tmp / f"{n:05d}.png")
            n += 1
    filters = f"[0:v]split[a][b];[a]palettegen=max_colors={colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle"
    subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-framerate", str(fps), "-i", str(tmp / "%05d.png"), "-filter_complex", filters, "-loop", "0", str(path)], check=True)
    shutil.rmtree(tmp)
    print("gif:", n, "frames,", f"{n / fps:.1f} s,", f"{path.stat().st_size / 1e6:.2f} MB ->", path, flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 3 or not (sys.argv[2] in {"wide", "square"} or sys.argv[2].startswith("gif")):
        raise SystemExit(__doc__)
    video, kind = sys.argv[1], sys.argv[2]
    work = WORK_ROOT / video
    FRAMES, OVER, OUT = work / "frames", work / "overlays", work / "out"
    OUT.mkdir(parents=True, exist_ok=True)
    plan_file = ASSETS / "videos" / video / (f"plan-{kind}.json" if kind.startswith("gif") else "plan.json")
    if not plan_file.exists():
        raise SystemExit(f"No {plan_file}")
    plan = json.load(open(plan_file))
    if kind.startswith("gif"):
        gif(plan, OUT / plan["name"])
    else:
        thumbs = thumbnail(kind, plan["name"])
        encode([Shot(**s) for s in plan["shots"]], kind, OUT / f"{plan['name']}-{'1920x1080' if kind == 'wide' else '1080x1080'}.mp4")
        for thumb in thumbs:
            print(kind, "thumbnail ->", thumb, flush=True)
