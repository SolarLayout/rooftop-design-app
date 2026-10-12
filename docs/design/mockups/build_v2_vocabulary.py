"""The boards "V2 · 12 · The vocabulary" on desktop 1440, tablet 834 and phone 390.

One name per thing (plan/v2/voice.md §6; audit V2-37, V2-38, V2-40, V2-41, V2-48): every rename V2 proposes, grouped by where
the user meets it, each with every word it replaces and how the new word looks in its control, and the words that never
appear. The renames are proposals until approved; the strings' inventory (plan/v2/strings-inventory.md) is their worklist.
Usage: python3 -I build_v2_vocabulary.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    LINE, LINE_STRONG, LINE_SUBTLE, RADIUS, SURFACE_1, TEXT, TEXT_2, TEXT_3, board_head, style, text, write_board,
)

ISSUES = "Answers V2-37 · V2-38 · V2-40 · V2-41 · V2-48 · voice §6"
LINES = [
    "Every thing has one name, on every screen, in the help and in the docs. Where a new user first meets a term of the "
    "trade, the plain name leads and the term follows in brackets; where the trade reads it (tables, the schedule, the "
    "report), the term stays. Each row is a rename to approve: the thing, every word it has today, its one name in V2.",
]
GROUPS = [
    ("Getting started", [
        ("The way in without a map", "Enter dimensions by hand · Enter dimensions by hand instead · Entered by hand", "Enter the roof by hand", "By hand, as a state"),
        ("Home's search button", "Find my roof", "Find the roof", ""),
        ("Home's title", "Find your roof. Design it in 3D.", "Rooftop PV design", ""),
        ("An obstacle's height, asked", "Height of the box · The imagery cannot give it · Remove", "Height above the roof · Cancel · Add", ""),
        ("A drawing to import", "File · a drawing · KMZ, KML or DXF", "Drawing (KMZ, KML or DXF)", ""),
    ]),
    ("The places", [
        ("The order of work", "Studio, Performance, Handover (workspaces) · Roof, Array, Sun, Strings (lenses)", "Roof · Array · Strings · Performance · Handover (steps)", "Sun, a view"),
        ("The satellite ground", "Layers · Satellite imagery · Off: the plain grid", "Imagery", "A toggle"),
        ("The whole design as files", "Export · Save a copy", "Download all", "One file: Download"),
        ("The design's file", ".rtd alone · a project saved by this app", "Project file (.rtd)", ""),
    ]),
    ("The roof and the array", [
        ("The strip kept free at the edges", "Setback", "Edge margin (setback)", ""),
        ("A path across the rows", "Walkway · Every · 24 · mod", "Walkway every 24 modules", ""),
        ("How much light the roof reflects", "Albedo alone", "Roof albedo", "In Performance alone"),
        ("The distance between rows", "Row pitch · Pitch · GCR · profile angle", "Rows 6.45 m apart (row spacing)", "GCR in the help"),
        ("The hours rows must not shade", "Shade-free window · Shade-free", "Shade-free hours", ""),
        ("The day the rows are spaced for", "Reference day · Winter solstice", "Design day · 21 Dec", ""),
        ("Which way rows face", "Azimuth alone · Orientation · Follows the roof edge closest to the equator", "Direction (azimuth)", "Orientation is portrait or landscape"),
        ("Shade from rows and obstacles", "Near, linear · Near shading, linear", "Rows and obstacles (near shading)", ""),
        ("Shade that holds back a string", "Electrical, beyond linear · Electrical shading", "Strings (string shading)", ""),
        ("Shade from far away", "Far, horizon · Far shading", "Horizon", ""),
    ]),
    ("Equipment and strings", [
        ("The module's data file", "PAN alone", "Module file (PAN)", ""),
        ("The inverter's data file", "OND alone · Replace from an OND", "Inverter file (OND)", ""),
        ("The ways the run wires the roof", "Stringings · configurations", "Options (A to E)", ""),
        ("The stringing the user adds", "Custom · Your own, alone", "Your own option", "Add your own option"),
        ("Modules a string holds", "Series · string length", "Modules a string (in series)", ""),
        ("DC to AC", "DC/AC alone · sizing ratio", "DC/AC ratio", ""),
    ]),
    ("Results", [
        ("The energy with its chances", "P50 · P75 · P90 · σ · exceedance", "Likely (P50) · Conservative (P90)", "σ: Uncertainty, in the assumptions"),
        ("Energy per kWp", "Specific yield", "Yield (kWh/kWp)", ""),
        ("The performance ratio", "PR alone", "Performance ratio (PR)", ""),
        ("Output lost to age", "Degradation", "Ageing (degradation)", ""),
        ("The weather's names", "PVGIS TMY · PVGIS horizon · NASA POWER 2023 · The year 2023 · no horizon · CSV file", "Typical year · 2023, measured · Your file", ""),
        ("The loss chain", "From sunlight to the grid · Loss chain", "Where the energy goes", ""),
    ]),
    ("States", [
        ("A design kept on the device", "Not kept on this device · Not saved on this device · Your designs are kept on this device · It is kept on this device alone",
         "Saved on this device · Saving · Not saved", ""),
        ("The last result while a new one fails", "Values are of the design before · of the design before · the design before", "Showing the last result", ""),
        ("A result that was not made", "Energy was not computed · There are no values yet", "Energy not computed", "Its cause after it"),
        ("Values to look at", "1 note to review · notes to review", "1 to review", ""),
        ("The computation", "The engine · the simulation · the design run", "The run (it runs); the app", ""),
    ]),
]
NEVER = ("bankable engine simply just please easy powerful seamless smart intelligent magic beautiful oops sorry great awesome enjoy "
         "journey experience leverage utilise robust").split() + ["feel free", "note that", "in order to", "as well as", "a number of", "and more", "(s)"]


def group(title: str, rows: list, touch: bool) -> str:
    if touch:
        body = "".join(f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}">'
                       f'{text("body", a, touch, TEXT_2)}<span style="{style("body", touch, TEXT_3)}; text-decoration: line-through">{b}</span>'
                       f'{text("strong", c, touch)}{text("body", d, touch, TEXT_2) if d else ""}</div>' for a, b, c, d in rows)
    else:
        body = "".join(f'<div style="display: grid; grid-template-columns: 260px 1fr 360px; gap: 24px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}; align-items: baseline">'
                       f'{text("body", a, touch, TEXT_2)}<span style="{style("body", touch, TEXT_3)}; text-decoration: line-through">{b}</span>'
                       f'<span style="display: flex; flex-direction: column; gap: 2px">{text("strong", c, touch)}{text("body", d, touch, TEXT_2) if d else ""}</span></div>'
                       for a, b, c, d in rows)
    return f'<section style="display: flex; flex-direction: column">{text("heading", title, touch, TEXT, "h2", "margin-bottom: 8px")}{body}</section>'


def never(touch: bool) -> str:
    chips = "".join(f'<span style="padding: 4px 10px; border: 1px solid {LINE}; border-radius: 9999px; {style("body", touch, TEXT_2)}; '
                    f'text-decoration: line-through">{w}</span>' for w in NEVER)
    return (f'<section style="display: flex; flex-direction: column; gap: 12px">{text("heading", "Words that never appear", touch, TEXT, "h2")}'
            f'<div style="display: flex; flex-wrap: wrap; gap: 8px">{chips}</div>'
            f'{text("body", "Nor an exclamation mark, an emoji, or a semicolon in the interface. Sentence case everywhere; the trade abbreviations keep theirs (MPPT, Voc, kWp).", touch, TEXT_2, "p")}</section>')


def build(file: str, title: str, width: int, height: int, touch: bool) -> None:
    side = 16 if width < 640 else (20 if width < 1100 else 40)
    head = board_head("V2 · 12 · The vocabulary", LINES, touch, ISSUES)
    legend = "" if touch else (f'<div style="display: grid; grid-template-columns: 260px 1fr 360px; gap: 24px">'
                               + "".join(text("unit", w, False, TEXT_3) for w in ("The thing", "Today, every word for it", "V2, its one name")) + '</div>')
    body = (f'<div style="padding: 40px {side}px; display: flex; flex-direction: column; gap: 40px">{head}{legend}'
            + "".join(group(t, r, touch) for t, r in GROUPS) + never(touch) + '</div>')
    write_board(OUT, file, title, width, height, body)


if __name__ == "__main__":
    build("V2Vocabulary.dc.html", "V2 · 12 · The vocabulary · desktop 1440", 1520, 2790, False)
    build("V2VocabularyTablet.dc.html", "V2 · 12 · The vocabulary · tablet 834", 834, 4790, True)
    build("V2VocabularyPhone.dc.html", "V2 · 12 · The vocabulary · phone 390", 390, 5240, True)
