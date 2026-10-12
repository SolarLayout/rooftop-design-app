"""The parts every V2 board is drawn with: the V2 tokens proposed on the board "V2 · Principles" and the controls made of them.

V2 (plan/v2/) re-layers the approved design. The colours of Dusk stay; what changes is the type scale, the spacing scale,
the control heights, the radii and where the accent goes (audit category L). Each V2 board imports this module, so that
every screen of V2 is drawn with the same numbers, and the board of the principles shows them.
"""
from pathlib import Path

HERE = Path(__file__).parent

# Colours: Dusk, unchanged (design-tokens.md).
GROUND, CHROME, SURFACE_1, SURFACE_2 = "#0B0E13", "#0E1218", "#12161D", "#181D26"
CONTROL, CONTROL_HOVER, CONTROL_ACTIVE, WELL = "#151A22", "#1B212B", "#232A36", "#090C10"
LINE_SUBTLE, LINE, LINE_STRONG = "#1C222C", "#232A36", "#2F3847"
TEXT, TEXT_2, TEXT_3 = "#F2F4F7", "#A9B2C0", "#7C8696"
ACCENT, ACCENT_INK, NOTE_SURFACE, NOTE_LINE, OK = "#FFB020", "#1A1204", "#1E1A10", "#3A3220", "#3DD6A0"
SERIES = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300"]
UNUSED = "#8C93A0"
GAIN, LOSS = "#3987E5", "#D95926"

SHADOW_RAISED = "inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 4px 12px rgba(0,0,0,.25)"
SHADOW_PRIMARY = ("inset 0 1px 0 rgba(255,255,255,.45), inset 0 -1px 0 rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.5), "
                  "0 8px 22px rgba(255,176,32,.24)")
SHADOW_WELL = "inset 0 1px 3px rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.04)"
SHADOW_SEGMENT = "inset 0 1px 0 rgba(255,255,255,.10), 0 1px 3px rgba(0,0,0,.55)"
SHADOW_CARD = "inset 0 1px 0 rgba(255,255,255,.05), 0 1px 2px rgba(0,0,0,.35), 0 16px 40px rgba(0,0,0,.28)"
SHADOW_FLOAT = "inset 0 1px 0 rgba(255,255,255,.06), 0 1px 2px rgba(0,0,0,.45), 0 16px 40px rgba(0,0,0,.5)"
HALO_SELECTED = "0 0 0 3px rgba(255,176,32,.14)"
HALO_FOCUS = "0 0 0 3px rgba(255,176,32,.18)"

DISPLAY_FAMILY = "'Bricolage Grotesque', Geist, sans-serif"
SANS_FAMILY = "Geist, system-ui, sans-serif"
MONO_FAMILY = "'Geist Mono', ui-monospace, monospace"

# V2 type: six sizes (12, 14, 16, 20, 26, 36) and two display sizes (48, 64). Nine roles; at most eight on a screen.
# role: (family, weight, desktop size/line, touch size/line, use)
TYPE = {
    "display": (DISPLAY_FAMILY, 600, (64, 68), (48, 52), "The one lead number of a page: energy on Performance, Present's figure"),
    "figure": (DISPLAY_FAMILY, 600, (36, 40), (26, 32), "A figure a buyer reads: the KPIs, the energy in the status"),
    "title": (DISPLAY_FAMILY, 600, (26, 32), (20, 26), "Page and lens titles, Home's title"),
    "heading": (SANS_FAMILY, 600, (20, 28), (20, 28), "The step's question at the head of the work column; a dialog's title"),
    "section": (SANS_FAMILY, 600, (16, 24), (16, 24), "A section's name, a card's title. Sentence case, primary text"),
    "body": (SANS_FAMILY, 400, (14, 20), (15, 22), "Labels, values, facts, prose (72 characters a line at most)"),
    "strong": (SANS_FAMILY, 500, (14, 20), (15, 22), "Button labels, a read-out's value, the active item"),
    "mono": (MONO_FAMILY, 400, (14, 20), (15, 22), "Tables, a field's value, the cable schedule. Nowhere else"),
    "unit": (SANS_FAMILY, 400, (12, 16), (12, 16), "A unit beside its figure, a chart's tick, a format badge"),
}
TRACKING = {"display": "-0.03em", "figure": "-0.02em", "title": "-0.02em"}

# V2 spacing: seven steps on a base of 4. name: (px, use)
SPACE = {
    "hair": (4, "A label to its hint, an icon to its unit"),
    "inside": (8, "Inside a group: label to field, row to row, icon to label"),
    "control": (12, "Padding inside a row or a compact card"),
    "edge-touch": (16, "The page's side on phone; a panel's padding on phone"),
    "group": (24, "Between groups; a card's padding; a panel's padding on desktop"),
    "section": (40, "Between sections; the page's side on desktop"),
    "page": (64, "Above a page's title (Home, Performance)"),
}

# V2 control heights: desktop (compact, standard, primary), touch the same roles.
HEIGHT = {"compact": (32, 44), "standard": (40, 44), "primary": (48, 48)}

# V2 radii: four and full. Inside one another, the inner is the outer less the padding between them.
RADIUS = {"control": 8, "row": 12, "card": 16, "panel": 24, "full": 9999}


def style(role: str, touch: bool = False, color: str = TEXT) -> str:
    family, weight, desk, tch = TYPE[role][:4]
    size, line = tch if touch else desk
    track = TRACKING.get(role, "0")
    nums = "; font-variant-numeric: tabular-nums" if role in ("display", "figure", "mono", "strong", "body") else ""
    return (f"font-family: {family}; font-weight: {weight}; font-size: {size}px; line-height: {line}px; "
            f"letter-spacing: {track}; color: {color}{nums}")


def text(role: str, words: str, touch: bool = False, color: str = TEXT, tag: str = "span", extra: str = "") -> str:
    return f'<{tag} style="margin: 0; {style(role, touch, color)}{"; " + extra if extra else ""}">{words}</{tag}>'


def button(label: str, kind: str = "secondary", size: str = "standard", touch: bool = False, icon: str = "",
           extra: str = "", full: bool = False) -> str:
    h = HEIGHT[size][1 if touch else 0]
    pad = 20 if size == "primary" else (12 if size == "compact" else 16)
    if kind == "primary":
        look = f"background: {ACCENT}; color: {ACCENT_INK}; border: 0; box-shadow: {SHADOW_PRIMARY}; font-weight: 600"
    elif kind == "quiet":
        look = f"background: transparent; color: {TEXT}; border: 0; font-weight: 500"
    else:
        look = (f"background: {CONTROL}; color: {TEXT}; border: 1px solid {LINE_STRONG}; box-shadow: {SHADOW_RAISED}; "
                f"font-weight: 500")
    size_px = 16 if size == "primary" else (15 if touch else 14)
    width = "width: 100%; " if full else ""
    return (f'<button type="button" style="{width}height: {h}px; padding: 0 {pad}px; border-radius: {RADIUS["control"]}px; '
            f'{look}; font-family: {SANS_FAMILY}; font-size: {size_px}px; line-height: 20px; display: inline-flex; '
            f'align-items: center; justify-content: center; gap: 8px; box-sizing: border-box; white-space: nowrap'
            f'{"; " + extra if extra else ""}">{icon}{label}</button>')


def icon(path: str, size: int = 16, color: str = "currentColor", stroke: float = 2) -> str:
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="{stroke}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{path}</svg>')


ICON = {
    "chevron-right": '<path d="M9 6l6 6-6 6"></path>',
    "chevron-down": '<path d="M6 9l6 6 6-6"></path>',
    "tick": '<path d="M5 12.5l4.5 4.5L19 7.5"></path>',
    "note": '<circle cx="12" cy="12" r="9"></circle><path d="M12 7.5v5.5"></path><path d="M12 16.5v.01"></path>',
    "download": '<path d="M12 4v11"></path><path d="M7 10.5l5 5 5-5"></path><path d="M5 19.5h14"></path>',
    "search": '<circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4.2-4.2"></path>',
    "play": '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"></path>',
    "plus": '<path d="M12 5v14"></path><path d="M5 12h14"></path>',
    "close": '<path d="M6 6l12 12"></path><path d="M18 6L6 18"></path>',
    "home": '<path d="M4 11l8-7 8 7"></path><path d="M6 9.5V20h12V9.5"></path>',
    "layers": '<path d="M12 4l9 5-9 5-9-5z"></path><path d="M3 14l9 5 9-5"></path>',
    "arrow-right": '<path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path>',
    "location": '<circle cx="12" cy="12" r="3.5"></circle><path d="M12 3v3"></path><path d="M12 18v3"></path><path d="M3 12h3"></path><path d="M18 12h3"></path>',
    "pencil": '<path d="M4 20h4L19 9l-4-4L4 16z"></path>',
    "undo": '<path d="M9 14L4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 010 11H11"></path>',
}


def mark(kind: str, size: int = 16) -> str:
    """A tick or a note: the status marks of the design (never a cross)."""
    if kind == "fits":
        return icon(ICON["tick"], size, OK, 2.4)
    return icon(ICON["note"], size, ACCENT, 2)


def help_disc(touch: bool = False) -> str:
    """V2's help disc: quiet, the line colour, 20 drawn in a target of 44 on touch."""
    target = 44 if touch else 24
    return (f'<span role="img" aria-label="Help" style="display: inline-flex; width: {target}px; height: {target}px; '
            f'align-items: center; justify-content: center"><span style="width: 20px; height: 20px; border-radius: 50%; '
            f'border: 1px solid {LINE_STRONG}; color: {TEXT_3}; font-family: {SANS_FAMILY}; font-size: 12px; '
            f'line-height: 18px; text-align: center; font-weight: 500; box-sizing: border-box">?</span></span>')


def field(label: str, value: str, unit: str = "", hint: str = "", touch: bool = False, width: int = 112,
          set_by: str = "") -> str:
    """A form row: the label in primary text at the value's weight; the value in mono in a well; the hint under the label."""
    h = 44 if touch else 40
    hint_html = text("body", hint, touch, TEXT_2, "span", "display: block") if hint else ""
    tag = ""
    if set_by:
        tag = text("unit", set_by, False, TEXT_3, "span", "display: block; margin-top: 2px")
    unit_html = text("unit", unit, False, TEXT_2) if unit else ""
    return (
        f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 16px">'
        f'<label style="display: flex; flex-direction: column; gap: 4px; min-width: 0">{text("body", label, touch)}{hint_html}</label>'
        f'<span style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px; width: {width}px; '
        f'height: {h}px; padding: 0 12px; box-sizing: border-box; background: {WELL}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_WELL}; flex: none">'
        f'{text("mono", value, touch)}{unit_html}</span>{tag}</div>'
    )


def segmented(items: list, active: int, touch: bool = False, fill: bool = False) -> str:
    h = 44 if touch else 40
    inner = h - 8
    cells = "".join(
        f'<span style="{"flex: 1; " if fill else ""}height: {inner}px; padding: 0 14px; display: inline-flex; align-items: center; '
        f'justify-content: center; border-radius: {RADIUS["control"]}px; '
        + (f'background: {CONTROL_ACTIVE}; box-shadow: {SHADOW_SEGMENT}; {style("strong", touch)}' if i == active
           else style("body", touch, TEXT_2))
        + f'">{it}</span>'
        for i, it in enumerate(items)
    )
    return (f'<span style="display: {"flex" if fill else "inline-flex"}; gap: 0; padding: 4px; height: {h}px; box-sizing: border-box; '
            f'background: {WELL}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; box-shadow: {SHADOW_WELL}">{cells}</span>')


def summary_row(name: str, facts: str, touch: bool = False, open_: bool = False, state: str = "", note: bool = False) -> str:
    """V2's section as a summary that opens: the name, its facts on one line, a chevron. 56 high (64 on touch)."""
    h = 64 if touch else 56
    chev = icon(ICON["chevron-down" if open_ else "chevron-right"], 16, TEXT_2)
    lead = mark("note", 16) if note else ""
    right = text("unit", state, False, TEXT_3) if state else ""
    return (
        f'<div style="display: flex; align-items: center; gap: 12px; min-height: {h}px; box-sizing: border-box; '
        f'border-top: 1px solid {LINE_SUBTLE}">'
        f'<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px">'
        f'<span style="display: flex; align-items: center; gap: 8px">{lead}{text("section", name, touch)}</span>'
        f'{text("body", facts, touch, TEXT_2, "span", "white-space: nowrap; overflow: hidden; text-overflow: ellipsis")}</div>'
        f'{right}{chev}</div>'
    )


def card(inner: str, pad: int = 24, radius: str = "card", extra: str = "") -> str:
    return (f'<div style="background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {RADIUS[radius]}px; '
            f'box-shadow: {SHADOW_CARD}; padding: {pad}px; box-sizing: border-box{"; " + extra if extra else ""}">{inner}</div>')


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
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
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


def write_board(out: Path, file: str, title: str, width: int, height: int, body: str) -> None:
    root = (f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; background: {GROUND}; color: {TEXT}; '
            f'overflow: hidden; font-family: {SANS_FAMILY}; font-size: 14px; line-height: 20px">{body}</div>\n')
    (out / file).write_text(HEAD.format(title=title) + root + TAIL.format(w=width, h=height), encoding="utf-8")
    print(file, width, height)


def board_head(title: str, lines: list, touch: bool = False, issues: str = "") -> str:
    """The board's own head: its name, the issues it answers, and the few lines of what changed."""
    paras = "".join(text("body", ln, touch, TEXT_2, "p", "max-width: 720px") for ln in lines)
    tag = text("unit", issues, False, TEXT_3, "p", "letter-spacing: 0.02em") if issues else ""
    return (f'<header style="display: flex; flex-direction: column; gap: 8px">{tag}'
            f'{text("title", title, touch, TEXT, "h1")}<div style="display: flex; flex-direction: column; gap: 8px">{paras}</div></header>')
