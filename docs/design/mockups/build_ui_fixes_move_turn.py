"""The boards "UI fixes · Move and turn the roof and its obstacles" on desktop 1440, tablet 834 and phone 390.

The owner (session 18): once the outline is drawn, by corners, a rectangle or Detect building, the user should be able to
move and turn it on the plane of the paper; obstacles too; the cursor should be a hand when the view is panned; and,
since this is heavily interactive, the boards must say how it works, with callouts, and the app should help the user
with short tips that can be closed. Where: on Find's map, against the imagery (the Roof lens's Edit leads there); the
Studio's obstacles already move and turn on the roof (the board "Obstacles on the roof"). Each frame is the app caught
in the browser (move_turn/) with what is proposed drawn over it; the canvas's copies show the same images uploaded to
it (--canvas).
Usage: python3 -I build_ui_fixes_move_turn.py [--canvas]
"""
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from build_phase3_boards import ACCENT, ACCENT_INK, GROUND, LINE, LINE_STRONG, SURFACE_1, TEXT, TEXT_2, TEXT_3  # noqa: E402

DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"
MONO = "font-family: 'Geist Mono', monospace"
CANVAS: dict[str, str] = json.loads((HERE / "move_turn" / "canvas.json").read_text()) if (HERE / "move_turn" / "canvas.json").exists() else {}

TURN = '<path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5"/>'
MOVE = '<path d="M12 2v20M2 12h20"/><path d="m15 19-3 3-3-3M19 9l3 3-3 3M5 9l-3 3 3 3M9 5l3-3 3 3"/>'
HAND = ('<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>'
        '<path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>')
GRAB = ('<path d="M18 11.5V9a2 2 0 0 0-4 0v1.4"/><path d="M14 10V8a2 2 0 0 0-4 0v2"/><path d="M10 9.9V9a2 2 0 0 0-4 0v5"/>'
        '<path d="M6 14a2 2 0 0 0-4 0"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0"/>')
CROSS = '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>'
FINGER = '<circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.28)"/><circle cx="12" cy="12" r="4" fill="#FFFFFF" stroke="none"/>'


def src(name: str, canvas: bool) -> str:
    return CANVAS[name] if canvas and name in CANVAS else f"move_turn/{name}"


def svg_icon(path: str, x: float, y: float, size: int, colour: str = "#FFFFFF", outline: bool = True) -> str:
    """An icon drawn on the frame, white with a dark edge so that it reads on the imagery, as a cursor does."""
    edge = f'<g stroke="#05070A" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round">{path}</g>' if outline else ""
    return (
        f'<svg x="{x - size / 2}" y="{y - size / 2}" width="{size}" height="{size}" viewBox="0 0 24 24" overflow="visible">{edge}'
        f'<g stroke="{colour}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">{path}</g></svg>'
    )


def turned(points: list[tuple[float, float]], degrees: float, centre: tuple[float, float]) -> list[tuple[float, float]]:
    a = math.radians(degrees)
    cx, cy = centre
    return [(cx + (x - cx) * math.cos(a) - (y - cy) * math.sin(a), cy + (x - cx) * math.sin(a) + (y - cy) * math.cos(a)) for x, y in points]


def poly(points: list[tuple[float, float]], style: str) -> str:
    return f'<polygon points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in points)}" {style}/>'


def selected_roof(points: list[tuple[float, float]]) -> str:
    """The roof selected as a whole: a wider accent line with a glow, the fill a shade stronger."""
    return (poly(points, f'fill="rgba(255,176,32,0.16)" stroke="{ACCENT}" stroke-width="7" stroke-opacity="0.25"')
            + poly(points, f'fill="none" stroke="{ACCENT}" stroke-width="3"'))


def turn_handle(foot: tuple[float, float], top: tuple[float, float], touch: bool, held: bool = False) -> str:
    r = 22 if touch else 16
    fx, fy = foot
    tx, ty = top
    ring = f'stroke="{ACCENT}" stroke-width="{4 if held else 2}"'
    return (
        f'<line x1="{fx}" y1="{fy}" x2="{tx}" y2="{ty}" stroke="{ACCENT}" stroke-width="2"/>'
        f'<circle cx="{tx}" cy="{ty}" r="{r}" fill="{SURFACE_1}" {ring}/>'
        + svg_icon(TURN, tx, ty, 18 if not touch else 22, ACCENT, outline=False)
    )


def callout(n: int, x: float, y: float, lx: float, ly: float) -> str:
    """A numbered dot at the place, a leader to its number, which the list beside the frame explains."""
    return (
        f'<line x1="{x}" y1="{y}" x2="{lx}" y2="{ly}" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="3 3"/>'
        f'<circle cx="{x}" cy="{y}" r="4" fill="#FFFFFF"/>'
        f'<circle cx="{lx}" cy="{ly}" r="13" fill="{ACCENT}" stroke="#05070A" stroke-width="2"/>'
        f'<text x="{lx}" y="{ly + 5}" text-anchor="middle" font-size="14" font-weight="700" fill="{ACCENT_INK}" font-family="Geist, sans-serif">{n}</text>'
    )


def live_label(x: float, y: float, words: str) -> str:
    w = 9.2 * len(words) + 20
    return (f'<rect x="{x}" y="{y}" width="{w}" height="26" rx="7" fill="{GROUND}" stroke="{ACCENT}" stroke-width="1"/>'
            f'<text x="{x + 10}" y="{y + 17.5}" font-size="13" fill="{TEXT}" font-family="Geist Mono, monospace">{words}</text>')


def tip(x: int, y: int, width: int, title: str, lines: list[tuple[str, str]], touch: bool) -> str:
    """The tip: a small card floating at the map's edge, never over what is moved; Got it closes it for good on this device."""
    rows = "".join(
        f'<div style="display: flex; gap: 10px; align-items: flex-start"><span style="flex-shrink: 0; min-width: 62px; padding: 1px 6px; border: 1px solid {LINE_STRONG}; '
        f'border-radius: 6px; font-size: 11px; font-weight: 600; color: {TEXT}; text-align: center">{key}</span><span style="font-size: 13px; color: {TEXT_2}">{what}</span></div>'
        for key, what in lines
    )
    return (
        f'<div style="position: absolute; left: {x}px; top: {y}px; width: {width}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; '
        f'padding: 14px 14px 12px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; '
        f'box-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.5)">'
        f'<div style="display: flex; align-items: center; gap: 8px"><span style="width: 8px; height: 8px; border-radius: 50%; background: {ACCENT}"></span>'
        f'<span style="flex-grow: 1; font-weight: 600; font-size: 14px">{title}</span><span style="color: {TEXT_3}; font-size: 16px">×</span></div>{rows}'
        f'<div style="display: flex; justify-content: flex-end"><span style="height: {44 if touch else 30}px; display: inline-flex; align-items: center; padding: 0 12px; '
        f'border-radius: 9px; background: #151A22; border: 1px solid {LINE_STRONG}; font-size: 13px; font-weight: 500">Got it</span></div></div>'
    )


def frame(image: str, width: int, height: int, shown: int, overlay: str, extra: str, canvas: bool) -> str:
    """The shot at its own size with the drawing over it, shown at *shown* wide."""
    scale = shown / width
    return (
        f'<div style="position: relative; width: {shown}px; height: {round(height * scale)}px; flex-shrink: 0; overflow: hidden; border: 1px solid {LINE}; border-radius: 12px">'
        f'<div style="position: absolute; left: 0; top: 0; width: {width}px; height: {height}px; transform: scale({scale:.4f}); transform-origin: 0 0">'
        f'<img src="{src(image, canvas)}" alt="" style="position: absolute; inset: 0; width: {width}px; height: {height}px">'
        f'<svg style="position: absolute; inset: 0" width="{width}" height="{height}" viewBox="0 0 {width} {height}">{overlay}</svg>{extra}</div></div>'
    )


def explained(title: str, the_frame: str, items: list[str], side: bool) -> str:
    rows = "".join(
        f'<li style="display: flex; gap: 10px"><span style="flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: {ACCENT}; color: {ACCENT_INK}; '
        f'font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center">{i}</span><span>{item}</span></li>'
        for i, item in enumerate(items, start=1)
    )
    words = f'<ol style="margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; font-size: 14px; color: {TEXT_2}; max-width: 420px">{rows}</ol>'
    layout = "flex-direction: row; gap: 32px; align-items: flex-start" if side else "flex-direction: column; gap: 16px"
    return (
        f'<section style="display: flex; flex-direction: column; gap: 12px"><h2 style="margin: 0; {DISPLAY}; font-size: 20px; line-height: 26px">{title}</h2>'
        f'<div style="display: flex; {layout}">{the_frame}{words}</div></section>'
    )


# ---------------------------------------------------------------------------------------------------
# The frames, from the corners the app drew (read in the browser)
# ---------------------------------------------------------------------------------------------------

ROOF = {
    "desktop": [(719, 308), (1037, 306), (1038, 448), (720, 450)],
    "tablet": [(416, 263), (734, 261), (735, 403), (417, 405)],
    "phone": [(35, 143), (353, 141), (354, 283), (36, 285)],
}
SHOT = {"desktop": ("find-desktop.png", 1440, 900), "tablet": ("find-tablet.png", 834, 1194), "phone": ("map-phone.png", 390, 520)}
OBSTACLE = {"desktop": "obstacle-desktop.png", "tablet": "obstacle-tablet.png", "phone": "obstacle-tablet.png"}


def centre(points: list[tuple[float, float]]) -> tuple[float, float]:
    return (sum(x for x, _ in points) / len(points), sum(y for _, y in points) / len(points))


def top_middle(points: list[tuple[float, float]]) -> tuple[float, float]:
    (x0, y0), (x1, y1) = points[0], points[1]
    return ((x0 + x1) / 2, (y0 + y1) / 2)


def select_and_move(size: str, canvas: bool, shown: int) -> str:
    touch = size != "desktop"
    image, w, h = SHOT[size]
    roof = ROOF[size]
    cx, cy = centre(roof)
    foot = top_middle(roof)
    top = (foot[0], foot[1] - 44)
    moved = [(x + 16, y + 6) for x, y in roof]
    overlay = (
        poly(roof, f'fill="none" stroke="{ACCENT}" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.7"')
        + selected_roof(moved)
        + turn_handle((foot[0] + 16, foot[1] + 6), (top[0] + 16, top[1] + 6), touch)
        + (svg_icon(FINGER, cx + 16, cy + 6, 36, "#FFFFFF", outline=False) if touch else svg_icon(MOVE, cx + 16, cy + 6, 26))
        + live_label(cx - 40, cy + 30, "1.6 m E · 0.6 m S")
        + callout(1, cx + 16, cy + 6, cx - 70, cy - 40)
        + callout(2, cx + 60, cy + 42, cx + 110, cy + 95)
        + callout(3, top[0] + 16, top[1] + 6, top[0] + 80, top[1] - 26)
    )
    lines = ([("Press", "inside the roof to pick it up"), ("Drag", "with one finger inside it to move it"),
              ("◯", "drag the round handle to turn it"), ("2 fingers", "move the map, as always")] if touch else
             [("Click", "inside the roof to pick it up"), ("Drag", "inside it to move it"), ("◯", "drag the round handle to turn it"),
              ("← ↑ → ↓", "nudge 0.1 m, with Shift 1 m")])
    card = tip(20 if size != "phone" else 12, 88 if size == "desktop" else (90 if size == "tablet" else 300), 300 if size != "phone" else 366,
               "Move or turn the roof", lines, touch)
    if size == "phone":
        card = tip(12, 330, 366, "Move or turn the roof", lines, touch)
    the_frame = frame(image, w, h, shown, overlay, card, canvas)
    words = [
        ("A press inside the roof picks it up whole (a press on a corner still takes the corner). It shows a stronger line and its "
         "fill; the obstacles stay drawn and move with it. Where it was stands dashed until it is let go."),
        ("Dragged, the roof and its obstacles follow; the label says how far: “1.6 m E · 0.6 m S”. The edges, the area and "
         "the obstacles keep their measures; one step of Undo puts it back." + ("" if touch else " The arrow keys nudge it 0.1 m, 1 m with Shift.")),
        "The round handle on its stem, 44 above the middle of the north edge, turns it about its middle (next frame).",
    ]
    return explained("1 · Pick up the roof and move it", the_frame, words, side=size == "desktop")


def turn(size: str, canvas: bool, shown: int) -> str:
    touch = size != "desktop"
    image, w, h = SHOT[size]
    roof = ROOF[size]
    c = centre(roof)
    after = turned(roof, 6, c)
    foot = top_middle(after)
    # The handle on the turned stem: 44 out from the north edge's middle, square to it.
    dx, dy = after[1][0] - after[0][0], after[1][1] - after[0][1]
    length = math.hypot(dx, dy)
    nx, ny = dy / length, -dx / length
    top = (foot[0] + nx * 44, foot[1] + ny * 44)
    overlay = (
        poly(roof, f'fill="none" stroke="{ACCENT}" stroke-width="2" stroke-dasharray="6 5" stroke-opacity="0.7"')
        + selected_roof(after)
        + turn_handle(foot, top, touch, held=True)
        + (svg_icon(FINGER, top[0], top[1], 40, outline=False) if touch else svg_icon(GRAB, top[0] + 14, top[1] + 12, 26))
        + f'<path d="M {top[0] - 70} {top[1] + 10} A 140 140 0 0 1 {top[0] + 6} {top[1] - 30}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4"/>'
        + live_label(top[0] + 34, top[1] - 40, "6.0° · faces 186° S")
        + callout(1, top[0], top[1], top[0] - 90, top[1] - 40)
        + callout(2, top[0] + 120, top[1] - 27, top[0] + 150, top[1] + 20)
        + callout(3, c[0], c[1], c[0] - 60, c[1] + 70)
    )
    words = [
        "The handle is held: its ring thicker" + (", the finger on it." if touch else ", the cursor a closed hand."),
        ("The label follows: the turn and where the roof now faces, “6.0° · faces 186° S”. Near north the turn snaps "
         "within 3°, as the rectangle does; the panel's Faces says the same."),
        ("It turns about its middle, the obstacles with it; let go, the turn is kept, one step of Undo. What follows is said where it "
         "matters: the array's azimuth follows the roof's edge closest to the equator, so the rows turn with it."),
    ]
    return explained("2 · Turn the roof", frame(image, w, h, shown, overlay, "", canvas), words, side=size == "desktop")


def obstacle(size: str, canvas: bool, shown: int) -> str:
    touch = size != "desktop"
    # The close-up: three times the map around the stair room; its box at the middle of the crop's left part.
    box = [(147, 138), (205, 138), (205, 186), (147, 186)]
    after = turned([(x + 30, y + 10) for x, y in box], 12, (206, 172))
    foot = top_middle(after)
    dx, dy = after[1][0] - after[0][0], after[1][1] - after[0][1]
    length = math.hypot(dx, dy)
    top = (foot[0] + dy / length * 44, foot[1] - dx / length * 44)
    corners = "".join(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{11 if touch else 8}" fill="#FFFFFF" stroke="{ACCENT}" stroke-width="3"/>' for x, y in after)
    overlay = (
        poly(box, 'fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="5 4" stroke-opacity="0.8"')
        + poly(after, f'fill="rgba(255,176,32,0.22)" stroke="{ACCENT}" stroke-width="3"') + corners
        + turn_handle(foot, top, touch)
        + (svg_icon(FINGER, 236, 172, 36, outline=False) if touch else svg_icon(MOVE, 236, 172, 26))
        + live_label(250, 320, "Stair room · 5.0 × 4.0 m · turned 12°")
        + callout(1, 236, 172, 110, 250)
        + callout(2, top[0], top[1], top[0] + 70, top[1] - 20)
        + callout(3, after[2][0], after[2][1], after[2][0] + 70, after[2][1] + 60)
    )
    lines = ([("Press", "an obstacle to pick it"), ("Drag", "it to move it"), ("◯", "turns a box or a building")] if touch else
             [("Click", "an obstacle to pick it"), ("Drag", "it to move it"), ("◯", "turns a box or a building"), ("Delete", "removes it")])
    card = tip(520, 12, 248, "Move or turn an obstacle", lines, touch)
    words = [
        ("A press picks the obstacle (as today); a drag inside it moves it, snapped to 0.1 m, kept on the roof: it stops at the "
         "roof's edge. Where it was stands dashed until it is let go."),
        "A box and a building have the turn handle on a stem north of them, as in the Studio; a tank has none (a round thing turned is the same); a wall moves.",
        "The corners still size it, as today. The label says what it is and what changed. Every move is one step of Undo.",
    ]
    return explained("3 · Move and turn an obstacle (close-up, three times the map)", frame(OBSTACLE[size], 780, 420, shown, overlay, card, canvas), words, side=size == "desktop")


def cursors(canvas: bool, shown: int) -> str:
    """Desktop alone: the cursor says what a drag does."""
    stage = (svg_icon(HAND, 300, 520, 30) + svg_icon(GRAB, 640, 300, 30)
             + '<path d="M 560 330 L 630 305" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="4 4"/>'
             + callout(1, 300, 520, 200, 600) + callout(2, 640, 300, 760, 230))
    the_map = (svg_icon(CROSS, 470, 640, 28) + svg_icon(GRAB, 330, 700, 30)
               + callout(3, 470, 640, 560, 600) + callout(4, 330, 700, 220, 760))
    frames = (
        '<div style="display: flex; gap: 16px; flex-wrap: wrap">'
        + frame("stage-desktop.png", 986, 744, shown // 2 - 8, stage, "", canvas)
        + frame("find-desktop.png", 1440, 900, shown // 2 - 8, the_map, "", canvas)
        + "</div>"
    )
    words = [
        "The Studio's stage, over nothing that is picked: an open hand (it says a drag moves the view: turns it in 3D, pans it in Plan).",
        "While the view is dragged: a closed hand. Over an obstacle or a handle the cursor is theirs, as today.",
        "The map in Find, a drawing tool in hand: the crosshair, as today (a press draws).",
        "The map dragged, whatever the tool: a closed hand while it pans; at rest with no tool, an open hand.",
    ]
    return explained("4 · The cursor says what a drag does", frames, words, side=False)


INTRO = (
    "Once the roof is outlined (by corners, a rectangle or Detect building) it can be picked up whole, moved and turned, "
    "on Find's map, against the imagery: the Roof lens's Edit leads there. In the Studio's stage the roof is the origin of "
    "everything, and turning it there would turn the sun, the rows and the energy with nothing to check it against. "
    "Obstacles move and turn on the map as they already do on the Studio's roof. The tips are small cards at the map's "
    "edge, one at a time, shown when a move becomes possible, never over what is moved: Got it closes a tip for good on "
    "this device, and it also goes by itself once the move it explains is done; the ? of the toolbar shows the tips again."
)

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>body{{margin:0;font-family:Geist,system-ui,sans-serif;background:#0B0E13;color:#F2F4F7}}</style>
</helmet>
"""
TAIL = """</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
"""


def board(file: str, title: str, width: int, pad: str, sections: str, height: int, note: str) -> None:
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 36px; padding: {pad}; '
        f'background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f'<div style="display: flex; flex-direction: column; gap: 10px"><h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">'
        f'Move and turn the roof and its obstacles</h1><p style="margin: 0; max-width: 1000px; color: {TEXT_2}">{INTRO} {note}</p></div>{sections}</div>\n'
    )
    (HERE / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, height)


if __name__ == "__main__":
    canvas = "--canvas" in sys.argv
    board("MoveTurn.dc.html", "UI fixes · Move and turn the roof and its obstacles · desktop 1440", 1552, "40px 56px",
          select_and_move("desktop", canvas, 980) + turn("desktop", canvas, 980) + obstacle("desktop", canvas, 980) + cursors(canvas, 1440), 3520,
          "Desktop: a click picks, a drag moves, the arrow keys nudge; the cursor says what a drag does.")
    board("MoveTurnTablet.dc.html", "UI fixes · Move and turn the roof and its obstacles · tablet 834", 834, "40px 24px",
          select_and_move("tablet", canvas, 786) + turn("tablet", canvas, 786) + obstacle("tablet", canvas, 786), 3900,
          "Tablet: one finger inside the picked roof moves it, two fingers move the map; the handles take a press of 44. No cursor on touch.")
    board("MoveTurnPhone.dc.html", "UI fixes · Move and turn the roof and its obstacles · phone 390", 390, "40px 16px",
          select_and_move("phone", canvas, 358) + turn("phone", canvas, 358) + obstacle("phone", canvas, 358), 2700,
          "Phone: as on tablet; the map is shown here without the sheet under it, the tip floats above the sheet.")
