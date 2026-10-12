"""The boards "V2 · 13 · Present" on desktop 1440, tablet 834 and phone 390.

Present is the design as a tour on the whole screen, for a client (D72 kept: the scenes, the panel over the stage, the sun's
arc in the day scene, the ground as the Imagery toggle sets it). V2 answers what the audit found (V2-40, V2-96, V2-102,
V2-103) and what a presenter needs and does not have today: a way to pause, to go back or on a scene, to see where the
tour is, and to leave on purpose rather than on any key. The scenes are the approved pictures of the app
(`present_scenes/`), the V2 parts over them.
Usage: python3 -I build_v2_present.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, ICON, LINE, LINE_STRONG, RADIUS, SHADOW_FLOAT, SURFACE_1, TEXT, TEXT_2, TEXT_3, board_head, changes, frame,
    icon, style, text, write_board,
)

ISSUES = "Answers V2-40 · V2-79 · V2-96 · V2-102 · V2-103"
LINES = [
    "Present plays the design as six scenes on the whole screen, for a client. Each scene has one name and one figure, in "
    "the panel at the top left, over the stage as D72 set it: the place, the roof, the array, the sun, the strings, the "
    "energy. The line at the foot names what the scene shows, as a noun.",
    "The presenter has controls: a move of the pointer or a touch shows them, and they fade after three seconds while the "
    "tour plays. Pause, the scene before and after, the six scenes as a track to jump to, and Leave. Keys: Space pauses, "
    "← and → move between scenes, Esc leaves. Any other key does nothing, so a stray key never ends the tour.",
    "With reduced motion the scenes are stills, each held for its time, and they change with a fade; the camera does not move.",
]

# The six scenes: name, the one figure and its label, the line at the foot (a noun, V2-40).
SCENES = [
    ("The place", "Pune", "18.52° N · 73.86° E", "The roof from above"),
    ("The roof", "3,600 m²", "Roof area · 6 obstacles", "The roof in 3D"),
    ("The array", "790", "Module positions · 6 rows", "The array"),
    ("The sun · 21 December", "10:30", "Solar time · sun 42.6° high", "Shadows over the day"),
    ("The strings", "357.28 kWp", "22 strings of 29 modules", "The strings"),
    ("The energy", "617.8 MWh", "Energy to the grid in year 1", "Energy over the year"),
]
FACTS = "Pune demo roof · 357.28 kWp · 617.8 MWh a year"
KEYS = "Space pauses · ← → move between scenes · Esc leaves"
ATTRIBUTION = "Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community"
DIM = "rgba(5,7,10,.58)"  # --color-dim-panel
PAUSE = '<path d="M8 5v14"></path><path d="M16 5v14"></path>'
PREV = '<path d="M15 6l-6 6 6 6"></path>'
NEXT = '<path d="M9 6l6 6-6 6"></path>'


def scene_picture(n: int, w: int, h: int, size: str) -> str:
    """The approved picture of scene n at the size: desktop's for desktop, the tablet's (portrait) for tablet and phone."""
    names = ["1-satellite", "2-rising", "3-filling", "4-day", "5-strings", "6-energy"]
    src = f'present_scenes/{"desktop" if size == "desktop" else "tablet"}-{names[n - 1]}.jpg'
    # The approved pictures carry today's words at their foot: the V2 words are laid over a fade that hides them.
    return (f'<img src="{src}" alt="" style="position: absolute; inset: 0; width: {w}px; height: {h}px; object-fit: cover; object-position: 50% 40%">'
            f'<div style="position: absolute; left: 0; right: 0; bottom: 0; height: {180 if size == "desktop" else 220}px; '
            f'background: linear-gradient(180deg, rgba(11,14,19,0) 0%, rgba(11,14,19,.92) 55%, #0B0E13 100%)"></div>')


def bezier(t: float, p0, p1, p2, p3) -> tuple:
    u = 1 - t
    return tuple(u ** 3 * a + 3 * u * u * t * b + 3 * u * t * t * c + t ** 3 * d for a, b, c, d in zip(p0, p1, p2, p3))


def sun_arc(w: int, h: int, size: str) -> str:
    """The day scene's sun path (D72): the day's arc across the sky, the shade-free hours thicker, the sun at the time."""
    pts = {"desktop": ((1440, 600), (1180, 40), (420, 20), (40, 640)),
           "tablet": ((834, 640), (700, 110), (240, 90), (-40, 700)),
           "phone": ((390, 470), (330, 90), (60, 70), (-60, 520))}[size]
    p0, p1, p2, p3 = pts
    d = f"M {p0[0]} {p0[1]} C {p1[0]} {p1[1]}, {p2[0]} {p2[1]}, {p3[0]} {p3[1]}"
    sx, sy = bezier(0.3, *pts)
    nx, ny = bezier(0.5, *pts)
    return (f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position: absolute; inset: 0" aria-hidden="true">'
            f'<defs><radialGradient id="glow-{size}"><stop offset="0%" stop-color="{ACCENT}" stop-opacity="0.5"/>'
            f'<stop offset="100%" stop-color="{ACCENT}" stop-opacity="0"/></radialGradient></defs>'
            f'<path d="{d}" fill="none" stroke="{ACCENT}" stroke-width="2" stroke-linecap="round"/>'
            f'<path d="{d}" pathLength="100" stroke-dasharray="0 21 58 100" fill="none" stroke="{ACCENT}" stroke-width="5" stroke-linecap="round"/>'
            f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="4" fill="#0B0E13" stroke="{ACCENT}" stroke-width="2"/>'
            f'<g transform="translate({nx:.1f} {ny - 20:.1f})"><rect x="-26" y="-11" width="52" height="22" rx="6" fill="{SURFACE_1}"/>'
            f'<text text-anchor="middle" y="4" font-family="Geist Mono, monospace" font-size="11" fill="{TEXT_2}">12:00</text></g>'
            f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="28" fill="url(#glow-{size})"/>'
            f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="11" fill="{ACCENT}"/><circle cx="{sx:.1f}" cy="{sy:.1f}" r="5.5" fill="#FFD36B"/></svg>')


def panel(n: int, touch: bool, width: int) -> str:
    """The scene's panel (D72's place and look): its name, its one figure, the figure's label (V2-96)."""
    name, figure, label, _ = SCENES[n - 1]
    return (f'<div style="position: absolute; left: {16 if width < 640 else 40}px; top: {16 if width < 640 else 40}px; padding: 16px 20px; '
            f'background: {DIM}; backdrop-filter: blur(12px); border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; '
            f'display: flex; flex-direction: column; gap: 4px; min-width: {200 if width < 640 else 240}px">'
            f'{text("strong", name, touch, TEXT_2)}{text("figure", figure, touch)}{text("body", label, touch, TEXT_2)}</div>')


def words(n: int, touch: bool, width: int, controls: bool) -> str:
    """The design and the scene's noun at the foot (left), the imagery's attribution under them."""
    side = 16 if width < 640 else 40
    bottom = (120 if width < 640 else 112) if controls else 40
    return (f'<div style="position: absolute; left: {side}px; right: {side}px; bottom: {bottom}px; display: flex; flex-direction: column; gap: 2px">'
            f'{text("strong", FACTS, touch)}{text("body", SCENES[n - 1][3], touch, TEXT_2)}</div>'
            f'<p style="position: absolute; left: {side}px; right: {side}px; bottom: {12 if not controls else (96 if width < 640 else 88)}px; margin: 0; '
            f'{style("unit", touch, TEXT_3)}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{ATTRIBUTION}</p>')


def round_button(path: str, label: str, touch: bool, primary: bool = False) -> str:
    s = 48 if primary else (44 if touch else 40)
    look = (f"background: {TEXT}; border: 0" if primary else f"background: transparent; border: 0")
    return (f'<button type="button" aria-label="{label}" title="{label}" style="width: {s}px; height: {s}px; border-radius: 50%; {look}; '
            f'display: inline-flex; align-items: center; justify-content: center; flex: none">'
            f'{icon(path, 20, "#0B0E13" if primary else TEXT, 2.2)}</button>')


def track(current: int, share: float, touch: bool, names: bool) -> str:
    """The six scenes as segments: the done ones full, the current filling, the rest empty; each one a target to jump to."""
    cells = ""
    for i, (name, *_ ) in enumerate(SCENES, 1):
        fill = 100 if i < current else (share * 100 if i == current else 0)
        short = name.split(" · ")[0].replace("The ", "").capitalize()
        cells += (f'<a href="#" aria-label="Scene {i}: {name}" {"aria-current=\"step\" " if i == current else ""}style="flex: 1; min-width: 0; display: flex; '
                  f'flex-direction: column; gap: 6px; padding: {12 if touch else 10}px 0; text-decoration: none">'
                  f'<span style="position: relative; height: 4px; border-radius: 2px; background: rgba(242,244,247,.24); overflow: hidden">'
                  f'<span style="position: absolute; left: 0; top: 0; bottom: 0; width: {fill:.0f}%; background: {TEXT}"></span></span>'
                  + (text("unit", short, touch, TEXT if i == current else TEXT_2) if names else "") + '</a>')
    return f'<div style="flex: 1; min-width: 0; display: flex; gap: 6px">{cells}</div>'


def controls(current: int, share: float, paused: bool, touch: bool, width: int) -> str:
    """The presenter's bar at the foot: Previous, Pause or Play, Next, the scenes' track, Leave (Esc)."""
    side = 16 if width < 640 else 40
    phone = width < 640
    leave = (f'<button type="button" style="height: {44 if touch else 40}px; padding: 0 {12 if phone else 16}px; border-radius: {RADIUS["control"]}px; '
             f'background: transparent; border: 1px solid {LINE_STRONG}; color: {TEXT}; display: inline-flex; align-items: center; gap: 8px; '
             f'{style("strong", touch)}; flex: none">Leave{"" if touch else text("unit", "Esc", False, TEXT_3, "kbd", f"padding: 0 6px; border: 1px solid {LINE_STRONG}; border-radius: 4px")}</button>')
    play = round_button(ICON["play"] if paused else PAUSE, "Play" if paused else "Pause", touch, primary=True)
    state = text("body", "Paused", touch, TEXT_2) if paused else ""
    return (f'<div role="toolbar" aria-label="Present" style="position: absolute; left: {side}px; right: {side}px; bottom: {16 if phone else 24}px; '
            f'padding: 8px {12 if phone else 16}px; box-sizing: border-box; background: {DIM}; backdrop-filter: blur(12px); border: 1px solid {LINE}; '
            f'border-radius: {RADIUS["card"]}px; box-shadow: {SHADOW_FLOAT}; display: flex; align-items: center; gap: {8 if phone else 12}px">'
            f'{round_button(PREV, "Scene before", touch)}{play}{round_button(NEXT, "Scene after", touch)}{state}'
            f'{track(current, share, touch, not phone)}{leave}</div>')


def keys_hint(width: int, touch: bool) -> str:
    """On the first loop, at the foot's right while the controls are hidden: the keys, then it fades."""
    if touch:
        return ""
    return (f'<p style="position: absolute; right: 40px; bottom: 40px; margin: 0; {style("body", False, TEXT_2)}">{KEYS}</p>')


def screen(n: int, size: str, controls_shown: bool, paused: bool = False, share: float = 0.45) -> str:
    w, h = {"desktop": (1440, 900), "tablet": (834, 1194), "phone": (390, 844)}[size]
    touch = size != "desktop"
    out = scene_picture(n, w, h, size)
    if n == 4:
        out += sun_arc(w, h, size)
    out += panel(n, touch, w) + words(n, touch, w, controls_shown)
    out += controls(n, share, paused, touch, w) if controls_shown else keys_hint(w, touch)
    return out


CHANGES = [
    ("Present · the panel", "2 · THE ROOF · Obstacles 3 of 6 · Roof 90.0 × 40.0 m · Parapet 0.9 m: counts and specs",
     "The scene's name, its one figure, its label: The roof · 3,600 m² · Roof area · 6 obstacles", "V2-96"),
    ("Present · the line at the foot", "The satellite from above tilts into 3D · The building and the obstacles rise · The day plays with its shadows …",
     "A noun: The roof from above · The roof in 3D · The array · Shadows over the day · The strings · Energy over the year", "V2-40"),
    ("Present · leaving", "Press any key or touch the screen to return: a stray key ends the tour",
     "Leave in the controls, and Esc; Space pauses, ← → move between scenes; other keys do nothing", "new"),
    ("Present · controls", "None: the tour cannot be paused, sent back or on, and shows no progress",
     "A bar shown on a move of the pointer or a touch, faded after 3 s while playing: before, pause, after, six scenes, Leave", "V2-102"),
    ("Present · reduced motion", "The sun's play stops but the camera still moves", "Stills, each held for its time, changed with a fade", "V2-103"),
    ("Present · the button", "A bare triangle at 834 in the top bar", "Present, with its word, at the head of Performance and Handover (#209)", "V2-79, V2-57"),
    ("Present · the sun scene (D72)", "The sun path and the sun along it", "Kept: the arc, its shade-free hours thicker, the sun moving along it", "kept"),
]


def build_desktop() -> None:
    w, h = 1440, 900
    hd = board_head("V2 · 13 · Present", LINES, False, ISSUES)
    screens = (frame("1 · The sun scene, the pointer moved: the panel's one figure, the sun's arc, the controls at the foot", screen(4, "desktop", True), w, h)
               + frame("2 · The energy scene playing, the controls faded: the panel, the line at the foot, the keys on the first loop", screen(6, "desktop", False, share=0.8), w, h)
               + frame("3 · Paused on the roof: Play in the place of Pause, Paused beside it; the track says where the tour is", screen(2, "desktop", True, paused=True, share=0.6), w, h))
    body = f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{screens}{changes(CHANGES)}</div>'
    write_board(OUT, "V2Present.dc.html", "V2 · 13 · Present · desktop 1440", 1520, 3800, body)


def build_touch(size: str) -> None:
    w, h = (834, 1194) if size == "tablet" else (390, 844)
    side = 20 if size == "tablet" else 16
    hd = board_head("V2 · 13 · Present", LINES, True, ISSUES)
    screens = (frame("The sun scene after a touch: the panel, the sun's arc, the controls at the foot (44 targets)", screen(4, size, True), w, h)
               + frame("The energy scene playing, the controls faded: a touch brings them back", screen(6, size, False, share=0.8), w, h))
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 {side}px">{hd}</div>'
            f'{screens}<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, f"V2Present{size.capitalize()}.dc.html", f"V2 · 13 · Present · {size} {w}", w, 3940 if size == "tablet" else 3720, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
