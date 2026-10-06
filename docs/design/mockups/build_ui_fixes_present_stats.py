"""The boards "UI fixes · Present, the figures of each scene" on desktop 1440 and tablet 834 (Present has no phone).

Each scene of the tour, caught midway in the app (the stage's own screenshot, in present_scenes/), with the panel of
its figures over it: a dimmed rectangle at the top left, the figures counting as the scene plays; the day scene with
the sun path and the sun moving along it. Approved by the owner on 2026-10-06 (session 18, D72).
Written beside this script: PresentStats.dc.html and PresentStatsTablet.dc.html, the screenshots by their path in
present_scenes/. With --canvas, the canvas's copies, the screenshots by their uploads to it (/_blob/<id>), into the
folder given after it.
Usage (Python 3.12, as the other board scripts: `uv run python -I` in apps/api):
  build_ui_fixes_present_stats.py [--canvas <folder>] [desktop=H tablet=H]
"""
import math
import sys
from pathlib import Path

# The small cascade of the approved board "Present" (frame 6), drawn by its own script (Python 3.12: `uv run` in apps/api).
sys.path.insert(0, str(Path(__file__).parent))
from build_phase10_part_boards import ENERGY, small_cascade  # noqa: E402
from dataclasses import dataclass

HERE = Path(__file__).parent
CANVAS = sys.argv[sys.argv.index("--canvas") + 1] if "--canvas" in sys.argv else None
OUT = Path(CANVAS) if CANVAS else HERE

ACCENT, SUN_CORE = "#FFB020", "#FFD36B"
GROUND, SURFACE_1, LINE = "#0B0E13", "#12161D", "#232A36"
TEXT, TEXT_2, TEXT_3 = "#F2F4F7", "#A9B2C0", "#7C8696"
SUCCESS = "#3DD6A0"
DIM = "rgba(5,7,10,0.58)"  # a notch under color-dim (0.72), the owner, session 18
DISPLAY = "font-family: 'Bricolage Grotesque', Geist, sans-serif; font-weight: 600"

SHOTS = {
    ("desktop", 1): "aeb1643c322fa18d302e9bd06c538964", ("desktop", 2): "5cc8315a4fe838ea53f7723a0d567423",
    ("desktop", 3): "bbe6702c999624423e12effaa8b21c22", ("desktop", 4): "077b9cc59357e4804b5f6cd9e7f560f9",
    ("desktop", 5): "1f4ceed1f3534f37a37e4c0a42687e9e", ("tablet", 1): "a04cc26122f15faf5fb540e9424624d5",
    ("tablet", 2): "948790416092a333d0044536bfd17e85", ("tablet", 3): "da5801593ea64e622511820af0f172a8",
    ("tablet", 4): "018fd6c35941053abf99a666ecf5b14b", ("tablet", 5): "6a3603d8b723e745df7a4cfb5955baef",
    ("desktop", 6): "6177493839d89e0cc04bc8fd6b58619c", ("tablet", 6): "74b04327d5018d8e952617258cf25088",
}
NAMES = {1: "satellite", 2: "rising", 3: "filling", 4: "day", 5: "strings", 6: "energy"}
# The energy scene's stage was taken with today's full-screen dimming and its figures hidden.
SHOT_OF = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6}


def shot(size: str, scene: int) -> str:
    scene = SHOT_OF[scene]
    if CANVAS is None:
        return f"present_scenes/{size}-{scene}-{NAMES[scene]}.jpg"
    return f"/_blob/{SHOTS[(size, scene)]}"


# --- The sun of the day scene, Pune 18.52° N on 21 December (the design day), solar time -------------------------

LAT, DEC = math.radians(18.52), math.radians(-23.44)


def sun_at(hour: float) -> tuple[float, float]:
    """Elevation and azimuth (from north, clockwise) in degrees at a solar hour."""
    h = math.radians((hour - 12) * 15)
    el = math.asin(math.sin(LAT) * math.sin(DEC) + math.cos(LAT) * math.cos(DEC) * math.cos(h))
    az = math.degrees(math.acos((math.sin(DEC) - math.sin(el) * math.sin(LAT)) / (math.cos(el) * math.cos(LAT))))
    return math.degrees(el), (az if hour <= 12 else 360 - az)


HALF_DAY = math.degrees(math.acos(-math.tan(LAT) * math.tan(DEC))) / 15
SUNRISE, SUNSET = 12 - HALF_DAY, 12 + HALF_DAY
DAY_SHARE = 0.35  # the screenshot: 4.2 s into the scene's 12
HOUR = SUNRISE + DAY_SHARE * (SUNSET - SUNRISE)


def clock(hour: float) -> str:
    minutes = round(hour * 60)
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def compass(az: float) -> str:
    return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][round(az / 45) % 8]


EL, AZ = sun_at(HOUR)


@dataclass(frozen=True)
class Size:
    name: str
    file: str
    width: int
    height: int
    inset: int        # the panel's place from the screen's top left
    panel: int        # the panel's width
    lead: int         # the lead figure's size
    small: int        # the other figures' size
    # The sun path on the screenshot: sunrise, the top of the arc, sunset (pixels of the screen)
    arc: tuple[tuple[float, float], tuple[float, float], tuple[float, float]]


DESKTOP = Size("desktop", "PresentStats.dc.html", 1440, 900, 40, 340, 44, 22, ((1190, 430), (720, 70), (215, 600)))
TABLET = Size("tablet", "PresentStatsTablet.dc.html", 834, 1194, 24, 304, 40, 20, ((800, 470), (470, 250), (30, 820)))


def bezier(arc, t: float) -> tuple[float, float]:
    """A point of the arc drawn as a quadratic curve through the top: the control point lifted so the curve meets it."""
    (x0, y0), (xm, ym), (x2, y2) = arc
    cx, cy = 2 * xm - (x0 + x2) / 2, 2 * ym - (y0 + y2) / 2
    return ((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x2, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y2)


def sun_path(size: Size) -> str:
    points = [bezier(size.arc, i / 80) for i in range(81)]
    line = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points)
    done = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points[: round(DAY_SHARE * 80) + 1])
    mx, my = bezier(size.arc, DAY_SHARE)
    marks = "".join(
        f'<circle cx="{bezier(size.arc, (h - SUNRISE) / (SUNSET - SUNRISE))[0]:.1f}" cy="{bezier(size.arc, (h - SUNRISE) / (SUNSET - SUNRISE))[1]:.1f}" r="4" fill="{GROUND}" stroke="{ACCENT}" stroke-width="2"/>'
        for h in (8, 10, 12, 14, 16)
    )
    chips = "".join(
        f'<code style="position: absolute; left: {bezier(size.arc, (h - SUNRISE) / (SUNSET - SUNRISE))[0]:.0f}px; top: {bezier(size.arc, (h - SUNRISE) / (SUNSET - SUNRISE))[1] - 22:.0f}px; '
        f'transform: translate(-50%, -50%); padding: 0 7px; background: {GROUND}; border-radius: 6px; font-size: 11px; line-height: 20px; color: {TEXT_2}; white-space: nowrap">{h:02d}:00</code>'
        for h in (8, 12, 16)
    )
    return (
        f'<svg width="{size.width}" height="{size.height}" viewBox="0 0 {size.width} {size.height}" style="position: absolute; left: 0; top: 0" aria-hidden="true">'
        f'<defs><radialGradient id="glow-{size.name}"><stop offset="0%" stop-color="{ACCENT}" stop-opacity="0.5"/><stop offset="100%" stop-color="{ACCENT}" stop-opacity="0"/></radialGradient></defs>'
        f'<path d="{line}" fill="none" stroke="{ACCENT}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"/>'
        f'<path d="{done}" fill="none" stroke="{ACCENT}" stroke-width="3" stroke-linecap="round"/>'
        f'{marks}<circle cx="{mx:.1f}" cy="{my:.1f}" r="34" fill="url(#glow-{size.name})"/>'
        f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="13" fill="{ACCENT}"/><circle cx="{mx:.1f}" cy="{my:.1f}" r="6.5" fill="{SUN_CORE}"/></svg>'
        f"{chips}"
    )


def figure(label: str, number: str, unit: str, px: int, after: str = "") -> str:
    unit_px = max(13, round(px * 0.42))
    # A degree stays with its number ("41.7°"); what follows it, the letter of the compass or the words, is the unit.
    if unit.startswith("°"):
        number, unit = number + "°", unit[1:].strip(" ·").strip()
    return (
        f'<div style="display: flex; flex-direction: column; gap: 2px; min-width: 0">'
        f'<span style="font-size: 13px; line-height: 18px; color: {TEXT_2}; white-space: nowrap">{label}</span>'
        f'<span style="display: flex; align-items: baseline; gap: 6px; white-space: nowrap">'
        f'<span style="{DISPLAY}; font-size: {px}px; line-height: {round(px * 1.08)}px; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: {TEXT}">{number}</span>'
        f'<span style="font-size: {unit_px}px; color: {TEXT_2}">{unit}</span>{after}</span></div>'
    )


TICK = f'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="{SUCCESS}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-label="Within the target" style="align-self: center"><path d="m5 12 5 5 9-10"/></svg>'

# The figures of each scene, caught where its screenshot was taken; the lead counts, the others stand.
SCENES = {
    1: ("1 · The place", "The satellite from above tilts into 3D",
        ("Roof area", "3,445", "m²"), [("Latitude", "18.52", "° N"), ("Longitude", "73.86", "° E")],
        "The roof's area counts up to 3,600 m² as the camera tilts; the place stands."),
    2: ("2 · The roof", "The building and the obstacles rise",
        ("Obstacles", "3", "of 6"), [("Roof", "90.0 × 40.0", "m"), ("Parapet", "0.9", "m")],
        "The obstacles count as they rise, one by one, to 6."),
    3: ("3 · The array", "The modules fill row by row",
        ("Positions", "474", "of 790"), [("Rows", "6", ""), ("Tilt", "15", "° · portrait")],
        "The positions count with the rows as they fill, to 790."),
    4: ("4 · The sun, 21 December", "The day plays with its shadows",
        ("Solar time", clock(HOUR), ""), [("Sun height", f"{EL:.1f}", "°"), ("Bearing", f"{AZ:.0f}", f"° {compass(AZ)}")],
        f"The time runs from sunrise {clock(SUNRISE)} to sunset {clock(SUNSET)}; the sun moves along its path over the roof, "
        "the shadows with it; its height and bearing follow."),
    5: ("5 · The strings", "The strings light up by MPPT",
        ("DC capacity", "334.4", "kWp"), [("Strings", "22 × 29", "modules"), ("Inverter", "1 × 275", "kW")],
        "The DC capacity counts up to 357.28 kWp as the strings light up; DC/AC 1.30 with its tick at the end."),
    6: ("6 · The energy", "The energy counts up",
        ("Energy to grid, year 1", f"{ENERGY['energy_mwh']:.1f}", "MWh"),
        [("Yield", f"{ENERGY['specific_yield']:,.0f}", "kWh/kWp"), ("PR", f"{ENERGY['pr'] * 100:.1f}", "%")],
        "In a panel too, no longer the whole screen dimmed: the energy counts up over the first six seconds and the chain "
        "cascades beside it, from the array's nominal energy to the grid; shown here at rest."),
}


PANEL = (
    "box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; padding: 18px 22px 20px; background: {dim}; "
    "backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); border-radius: 18px; "
    "box-shadow: 0 16px 40px rgba(0,0,0,0.35)"
)


def panel(size: Size, scene: int) -> str:
    title, _, lead, others, _ = SCENES[scene]
    smalls = "".join(figure(label, number, unit, size.small) for label, number, unit in others)
    heading = f'<h2 style="margin: 0; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}">{title}</h2>'
    figures = f'{figure(lead[0], lead[1], lead[2], size.lead)}<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">{smalls}</div>'
    place = f"position: absolute; left: {size.inset}px; top: {size.inset}px"
    if scene == 6 and size is DESKTOP:
        # The energy: the figures and the chain side by side.
        return (
            f'<section aria-label="{title}" style="{place}; width: 580px; {PANEL.format(dim=DIM)}">{heading}'
            f'<div style="display: flex; align-items: center; gap: 32px"><div style="display: flex; flex-direction: column; gap: 14px; width: 300px">{figures}</div>'
            f"{small_cascade()}</div></section>"
        )
    chain = f'<div style="padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.08)">{small_cascade()}</div>' if scene == 6 else ""
    return f'<section aria-label="{title}" style="{place}; width: {size.panel}px; {PANEL.format(dim=DIM)}">{heading}{figures}{chain}</section>' 


def screen(size: Size, scene: int) -> str:
    over = sun_path(size) if scene == 4 else ""
    return (
        f'<div style="position: relative; width: {size.width}px; height: {size.height}px; overflow: hidden; background: {GROUND}; border-radius: 4px">'
        f'<img src="{shot(size.name, scene)}" alt="The stage of Present, scene {scene}, caught midway" width="{size.width}" height="{size.height}" style="display: block">'
        f"{over}{panel(size, scene)}</div>"
    )


def block(size: Size, scene: int) -> str:
    title, words, _, _, note = SCENES[scene]
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px">'
        f'<div style="display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; padding: 0 {0 if size is DESKTOP else 4}px">'
        f'<span style="font-size: 15px; font-weight: 600; color: {TEXT}">{title}</span><span style="font-size: 13px; color: {TEXT_3}">“{words}”</span>'
        f'<span style="font-size: 13px; color: {TEXT_2}; flex-basis: 100%">{note}</span></div>{screen(size, scene)}</div>'
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
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
body{{margin:0;font-family:Geist,system-ui,sans-serif;background:#0B0E13;color:#F2F4F7}}
code{{font-family:'Geist Mono',ui-monospace,monospace}}
</style>
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


def board(size: Size, height: int) -> str:
    intro = (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 0 {0 if size is DESKTOP else 4}px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: {36 if size is DESKTOP else 30}px; line-height: 1.15; letter-spacing: -0.02em">Present, the figures of each scene</h1>'
        f'<p style="margin: 0; max-width: 980px; font-size: 14px; line-height: 21px; color: {TEXT_2}">{size.name.capitalize()} {size.width} × {size.height}; the phone has no Present. '
        f'Each scene keeps the stage in full view and shows its figures in one dimmed panel at the top left ({DIM}, blurred behind, radius 18), '
        f'never the whole screen dimmed, the energy’s too (the owner preferred the panel to the dimmed screen). The lead figure counts as the scene plays, '
        f'in tabular figures, in the place of its final value; the others stand. The panel fades in with its scene and out with it. '
        f'The day scene draws the sun path over the roof, as the Sun lens does, and the sun moves along it with the hour. '
        f'The imagery is always the ground in Present. Every figure is the demo’s, caught where the screenshot under it was taken.</p></div>'
    )
    frames = "".join(block(size, scene) for scene in (1, 2, 3, 4, 5, 6))
    root = (
        f'<div style="width: {size.width + 2 * (56 if size is DESKTOP else 0)}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; '
        f'gap: 36px; padding: 48px {56 if size is DESKTOP else 0}px; background: {GROUND}; color: {TEXT}; overflow: hidden">{intro}{frames}</div>\n'
    )
    return HEAD.format(title=f"UI fixes · Present, the figures of each scene · {size.name} {size.width}") + root + TAIL.format(
        w=size.width + 2 * (56 if size is DESKTOP else 0), h=height)


if __name__ == "__main__":
    heights = {"desktop": 6200, "tablet": 8000}
    for arg in sys.argv[1:]:
        if "=" in arg:
            key, value = arg.split("=")
            heights[key] = int(value)
    for size in (DESKTOP, TABLET):
        (OUT / size.file).write_text(board(size, heights[size.name]), encoding="utf-8")
        print(size.file, heights[size.name], f"sun at {clock(HOUR)}: {EL:.1f}° high, {AZ:.0f}° {compass(AZ)}; sunrise {clock(SUNRISE)}, sunset {clock(SUNSET)}")
