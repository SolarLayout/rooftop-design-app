#!/usr/bin/env python3
"""The narration: each line of assets/videos/<video>/narration.json spoken by ElevenLabs into <work>/<video>/audio/<id>.mp3,
placed at its second of the cut (from the plan's shots), loudness-normalised and muxed into the cuts as ...-voice.mp4.
A video without a narration.json has no voice: nothing to do here.

The key and the voice are in <work>/.env (gitignored, never printed):
  ELEVENLABS_API_KEY=...
  ELEVENLABS_VOICE_ID=...
A key scoped to text-to-speech alone is enough (the voice's name then cannot be read back; that is only a note).

  python3 -I narrate.py <video> speak             every line, with its length against its screen
  python3 -I narrate.py <video> speak 05-sun      one line again, after a change of words or voice
  python3 -I narrate.py <video> check             the lines' seconds against the plan, without speaking: overlaps and overruns
  python3 -I narrate.py <video> mix               <work>/<video>/audio/narration.wav, then the cuts with sound
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / "assets"
WORK = Path(os.environ.get("PRODUCT_VIDEO_WORK") or HERE.parents[3] / ".product-video")
AUDIO = OUT = NARRATION = PLAN = Path()  # the video's, set by main
API = "https://api.elevenlabs.io/v1"
FPS, XFADE = 30, 12


def ffmpeg() -> str:
    return subprocess.run(["node", str(HERE / "paths.cjs"), "ffmpeg"], capture_output=True, text=True, check=True).stdout.strip()


def env(name: str):
    file = WORK / ".env"
    if not file.exists():
        raise SystemExit(f"No {file}: put ELEVENLABS_API_KEY=... and ELEVENLABS_VOICE_ID=... there (it is gitignored).")
    for line in file.read_text().splitlines():
        if line.startswith(name + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def key() -> str:
    value = env("ELEVENLABS_API_KEY")
    if not value:
        raise SystemExit("No ELEVENLABS_API_KEY in " + str(WORK / ".env"))
    return value


def call(path: str, body=None, accept: str = "application/json") -> bytes:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, headers={"xi-api-key": key(), "content-type": "application/json", "accept": accept})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read()


def seconds_of(path: Path) -> float:
    out = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(path)], capture_output=True, text=True).stderr
    for token in out.split("\n"):
        if "Duration:" in token:
            h, m, s = token.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError("no duration: " + str(path))


def timeline() -> list:
    """When each shot of the plan begins, in seconds, as compose.py cuts them; the last value is the end of the video."""
    plan = json.loads(PLAN.read_text())
    starts, t = [], 0
    for shot in plan["shots"]:
        n = shot["hold"] if "card" in shot else int((shot["end"] - shot["start"]) / shot.get("speed", 1.0))
        starts.append(t / FPS)
        t += n - XFADE
    starts.append((t + XFADE) / FPS)
    return starts


def timed(plan: dict) -> list:
    """The lines with their seconds: `at` from the shot and the offset, `until` a little into the next shot's crossfade."""
    starts = timeline()
    for line in plan["lines"]:
        line["at"] = round(starts[line["shot"]] + line["offset"], 2)
        line["until"] = round(starts[line["shot"] + 1] + 0.3, 2) if line["shot"] + 1 < len(starts) else starts[-1]
    return plan["lines"]


def voice_of(plan: dict):
    return plan.get("voice") or env("ELEVENLABS_VOICE_ID")


def speak(only=None) -> None:
    plan = json.loads(NARRATION.read_text())
    voice = voice_of(plan)
    if not voice:
        raise SystemExit("No voice: ELEVENLABS_VOICE_ID in the .env, or \"voice\" in narration.json.")
    try:
        about = json.loads(call(f"/voices/{voice}"))
        print("voice:", about.get("name"))
    except urllib.error.HTTPError as error:
        print(f"voice: (the key cannot read its name: HTTP {error.code}; the lines are spoken all the same)")
    AUDIO.mkdir(parents=True, exist_ok=True)
    for line in timed(plan):
        if only and line["id"] != only:
            continue
        audio = call(f'/text-to-speech/{voice}?output_format=mp3_44100_128', {"text": line["text"], "model_id": plan["model"], "voice_settings": plan["settings"]}, accept="audio/mpeg")
        path = AUDIO / f'{line["id"]}.mp3'
        path.write_bytes(audio)
        length = seconds_of(path)
        slot = line["until"] - line["at"]
        flag = f"  <-- runs past its screen by {length - slot:.1f} s" if length > slot else ""
        print(f'  at {line["at"]:5.1f} s  {line["id"]:<16} {length:5.1f} s of {slot:4.1f} s{flag}')
    check()


def check() -> None:
    plan = json.loads(NARRATION.read_text())
    prev_end, bad = 0.0, False
    for line in timed(plan):
        path = AUDIO / f'{line["id"]}.mp3'
        if not path.exists():
            print(f'{line["id"]:<16} not spoken yet')
            continue
        end = line["at"] + seconds_of(path)
        overlap = line["at"] < prev_end
        past = end > line["until"] and not line.get("continues", False)
        bad = bad or overlap or past
        print(f'{line["id"]:<16} {line["at"]:5.1f} to {end:5.1f}  screen until {line["until"]:5.1f}{"  OVERLAPS the line before" if overlap else ""}{"  past its screen" if past else ""}')
        prev_end = end
    print("video", f"{timeline()[-1]:.1f} s;", "every line fits" if not bad else "some lines do not fit: lengthen their shots in plan.json (a slower speed or a longer hold), or shorten the words, then speak them again")


def mix() -> None:
    plan = json.loads(NARRATION.read_text())
    inputs, filters, tags = [], [], []
    for i, line in enumerate(timed(plan)):
        inputs += ["-i", str(AUDIO / f'{line["id"]}.mp3')]
        filters.append(f"[{i}:a]aresample=48000,adelay={int(line['at'] * 1000)}|{int(line['at'] * 1000)}[a{i}]")
        tags.append(f"[a{i}]")
    filters.append(f"{''.join(tags)}amix=inputs={len(tags)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[out]")
    narration = AUDIO / "narration.wav"
    subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[out]", "-ar", "48000", str(narration)], check=True)
    print("narration:", f"{seconds_of(narration):.1f} s ->", narration)
    name = json.loads(PLAN.read_text()).get("name", "solarlayout-rooftop-launch")
    for size in ["1920x1080", "1080x1080"]:
        cut = OUT / f"{name}-{size}.mp4"
        if not cut.exists():
            print("no cut to mix into:", cut)
            continue
        out = OUT / f"{name}-{size}-voice.mp4"
        subprocess.run([ffmpeg(), "-hide_banner", "-loglevel", "error", "-y", "-i", str(cut), "-i", str(narration), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", str(out)], check=True)
        print("cut with sound ->", out)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    video = sys.argv[1]
    NARRATION, PLAN = ASSETS / "videos" / video / "narration.json", ASSETS / "videos" / video / "plan.json"
    AUDIO, OUT = WORK / video / "audio", WORK / video / "out"
    if not NARRATION.exists():
        raise SystemExit(f"The video {video} has no narration.json: it is silent, nothing to do.")
    what = sys.argv[2] if len(sys.argv) > 2 else "check"
    if what == "speak":
        speak(sys.argv[3] if len(sys.argv) > 3 else None)
    elif what == "check":
        check()
    elif what == "mix":
        mix()
    else:
        raise SystemExit(__doc__)
