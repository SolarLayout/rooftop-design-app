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


# ---- The shell of V2: the progression, the top bar, the tab bar, the roof (shared by the boards from "V2 · 2") ----

STEPS = ["Roof", "Array", "Strings", "Performance", "Handover"]
STEP_ICON = {
    "Roof": '<path d="M3 11l9-6 9 6"></path><path d="M5 10v9h14v-9"></path>',
    "Array": '<rect x="3.5" y="5" width="17" height="14" rx="1.5"></rect><path d="M3.5 12h17"></path><path d="M9.5 5v14"></path><path d="M14.5 5v14"></path>',
    "Strings": '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"></path>',
    "Performance": '<path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M21 20H3"></path>',
    "Handover": '<path d="M12 4v11"></path><path d="M7 10.5l5 5 5-5"></path><path d="M5 19.5h14"></path>',
    "Sun": '<circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v2"></path><path d="M12 19.5v2"></path><path d="M2.5 12h2"></path><path d="M19.5 12h2"></path><path d="M5.3 5.3l1.4 1.4"></path><path d="M17.3 17.3l1.4 1.4"></path><path d="M5.3 18.7l1.4-1.4"></path><path d="M17.3 6.7l1.4-1.4"></path>',
    "book": '<path d="M5 4.5h9.5a3 3 0 013 3V20H8a3 3 0 01-3-3z"></path><path d="M5 17a3 3 0 013-3h9.5"></path>',
}
LOGO = ('<svg width="26" height="26" viewBox="0 0 26 26" fill="none" role="img" aria-label="SolarLayout Rooftop">'
        '<rect width="26" height="26" rx="7" fill="#FFB020"></rect><path d="M6 15.5l7-6 7 6" stroke="#1A1204" stroke-width="2.2" '
        'stroke-linecap="round" stroke-linejoin="round"></path><path d="M8.5 14v5h9v-5" stroke="#1A1204" stroke-width="2.2" '
        'stroke-linecap="round" stroke-linejoin="round"></path></svg>')


def step_mark(state: str, n: int, size: int = 16) -> str:
    """A step's mark: done (a tick), needs you (a note), or its number (to do, or where the user is)."""
    if state == "done":
        return mark("fits", size)
    if state == "needs":
        return mark("note", size)
    col = TEXT if state == "current" else TEXT_3
    return (f'<span style="width: {size}px; height: {size}px; border-radius: 50%; border: 1px solid {col}; color: {col}; '
            f'display: inline-flex; align-items: center; justify-content: center; font-family: {SANS_FAMILY}; font-size: 11px; '
            f'font-weight: 600; box-sizing: border-box; flex: none">{n}</span>')


def progression(states: dict, current: str, touch: bool = False, compact: bool = False) -> str:
    """The order of work as one row of steps: each a link with its mark; the one the user is in pressed."""
    items = []
    for i, name in enumerate(STEPS, 1):
        st = states.get(name, "todo")
        here = name == current
        look = (f'background: {CONTROL_ACTIVE}; box-shadow: {SHADOW_SEGMENT}; ' if here else '')
        col = TEXT if (here or st in ("done", "needs")) else TEXT_2
        items.append(
            f'<a href="#" aria-current="{"step" if here else "false"}" style="{look}display: inline-flex; align-items: center; gap: 8px; '
            f'height: 32px; padding: 0 {8 if compact else 12}px; border-radius: {RADIUS["control"]}px; text-decoration: none; '
            f'{style("strong" if here else "body", touch, col)}; white-space: nowrap">'
            f'{step_mark("current" if here and st == "todo" else st, i)}{name}</a>')
    sep = f'<span style="width: {4 if compact else 12}px; height: 1px; background: {LINE_STRONG}; flex: none"></span>'
    return (f'<nav aria-label="Steps" style="display: inline-flex; align-items: center; gap: 4px; padding: 4px; height: 40px; '
            f'box-sizing: border-box; background: {WELL}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; '
            f'box-shadow: {SHADOW_WELL}">' + sep.join(items) + '</nav>')


def project_name(name: str = "Pune demo roof", touch: bool = False, width: str = "auto") -> str:
    return (f'<button type="button" style="display: inline-flex; align-items: center; gap: 8px; height: {44 if touch else 40}px; '
            f'padding: 0 12px; background: transparent; border: 0; border-radius: {RADIUS["control"]}px; max-width: {width}; '
            f'{style("strong", touch)}">'
            f'<span style="width: 8px; height: 8px; border-radius: 50%; background: {OK}; flex: none" aria-label="Saved on this device"></span>'
            f'<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{name}</span>'
            f'{icon(ICON["chevron-down"], 16, TEXT_2)}</button>')


def result_chip(energy: str = "617.8", note: int = 0) -> str:
    """The design's one result in the top bar: the energy of year 1, a note mark when something waits; it opens the summary."""
    lead = (mark("note", 16) + text("strong", f"{note} to review")
            + f'<span style="width: 1px; height: 16px; background: {LINE}"></span>') if note else ""
    return (f'<button type="button" aria-label="Result: {energy} MWh in year 1" style="display: inline-flex; align-items: center; gap: 8px; '
            f'height: 40px; padding: 0 12px; background: transparent; border: 1px solid {LINE}; border-radius: {RADIUS["control"]}px">'
            f'{lead}{text("strong", energy)}{text("body", "MWh a year", False, TEXT_2)}</button>')


def top_bar(states: dict, current: str, width: int, size: str = "desktop", result: str = "617.8", note: int = 0) -> str:
    """V2's top bar: the logo (Home), the design's name with its saved mark, the steps; Docs at the right on desktop."""
    h = {"desktop": 56, "tablet": 60, "phone": 56}[size]
    touch = size != "desktop"
    brand = (f'<a href="#" aria-label="Home" style="display: inline-flex; align-items: center; gap: 10px; text-decoration: none; '
             f'height: 40px">{LOGO}' + (f'<span style="font-family: {DISPLAY_FAMILY}; font-weight: 600; font-size: 17px; color: {TEXT}; '
                                        f'letter-spacing: -0.01em; white-space: nowrap">SolarLayout Rooftop</span>' if size == "desktop" else "")
             + '</a>')
    divider = f'<span style="width: 1px; height: 24px; background: {LINE}; flex: none"></span>'
    left = (f'<div style="display: flex; align-items: center; gap: 12px; min-width: 0">{brand}{divider}'
            f'{project_name("Pune demo roof", touch, "150px" if size != "desktop" else "220px")}</div>')
    mid = progression(states, current, False, size == "tablet") if size != "phone" else ""
    docs = (button("Docs", "quiet", "standard", False, icon(STEP_ICON["book"], 16, TEXT_2)) if size == "desktop" else "")
    if size == "desktop":
        return (f'<header style="height: {h}px; box-sizing: border-box; padding: 0 16px; display: grid; grid-template-columns: 1fr auto 1fr; '
                f'align-items: center; gap: 16px; background: {CHROME}; border-bottom: 1px solid {LINE_SUBTLE}">{left}{mid}'
                f'<div style="display: flex; justify-content: flex-end; gap: 8px">{result_chip(result, note) if result else ""}{docs}</div></header>')
    return (f'<header style="height: {h}px; box-sizing: border-box; padding: 0 {16 if size == "phone" else 20}px; display: flex; '
            f'align-items: center; justify-content: space-between; gap: 12px; background: {CHROME}; '
            f'border-bottom: 1px solid {LINE_SUBTLE}">{left}{mid}</header>')


def tab_bar(states: dict, current: str) -> str:
    """V2's phone tab bar: the five steps, each with its icon and its mark."""
    cells = ""
    for i, name in enumerate(STEPS, 1):
        st = states.get(name, "todo")
        here = name == current
        col = ACCENT if here else (TEXT if st in ("done", "needs") else TEXT_2)
        badge = ""
        if st in ("done", "needs"):
            badge = (f'<span style="position: absolute; right: -8px; top: -6px; background: {CHROME}; border-radius: 50%; '
                     f'display: inline-flex; padding: 1px">{step_mark(st, i, 14)}</span>')
        cells += (f'<a href="#" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; '
                  f'gap: 4px; height: 62px; text-decoration: none; {style("unit", True, col)}; font-weight: {600 if here else 500}">'
                  f'<span style="position: relative; display: inline-flex">{icon(STEP_ICON[name], 22, col, 1.7)}{badge}</span>{name}</a>')
    return (f'<nav aria-label="Steps" style="height: 72px; box-sizing: border-box; padding: 0 4px 10px; display: flex; '
            f'background: {CHROME}; border-top: 1px solid {LINE_SUBTLE}">{cells}</nav>')


def roof_svg(width: int, source: str = "Main.dc.html", label: str = "") -> str:
    """The approved boards' drawing of the Pune demo roof in 3D, scaled to a width."""
    import re
    s = (HERE / source).read_text(encoding="utf-8")
    m = re.search(r'<svg viewBox="0 50 940 480" width="\d+" height="\d+"[\s\S]*?</svg>', s)
    svg = m.group(0)
    h = round(width * 480 / 940)
    svg = re.sub(r'width="\d+" height="\d+"', f'width="{width}" height="{h}"', svg, count=1)
    if label:
        svg = re.sub(r'aria-label="[^"]*"', f'aria-label="{label}"', svg, count=1)
    return svg


def changes(rows: list, touch: bool = False, title: str = "Rules this board changes") -> str:
    """The rules of the approved documents a board changes: rule, today, V2, the issues it answers."""
    if touch:
        body = "".join(
            f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}">'
            f'{text("strong", a, touch)}{text("body", "Today: " + b, touch, TEXT_2)}{text("body", "V2: " + c, touch)}'
            f'{text("unit", d, False, TEXT_3)}</div>' for a, b, c, d in rows)
    else:
        head = "".join(f'<th style="text-align: left; padding: 8px 12px 8px 0; {style("unit", False, TEXT_3)}; font-weight: 400">{h}</th>'
                       for h in ("Rule", "Today", "V2", "Answers"))
        body = (f'<table style="border-collapse: collapse; width: 100%"><thead><tr>{head}</tr></thead><tbody>'
                + "".join(f'<tr style="border-top: 1px solid {LINE_SUBTLE}">'
                          f'<td style="padding: 12px 12px 12px 0; {style("strong", False)}; vertical-align: top; width: 260px">{a}</td>'
                          f'<td style="padding: 12px 12px 12px 0; {style("body", False, TEXT_2)}; vertical-align: top">{b}</td>'
                          f'<td style="padding: 12px 12px 12px 0; {style("body", False)}; vertical-align: top">{c}</td>'
                          f'<td style="padding: 12px 0; {style("unit", False, TEXT_2)}; vertical-align: top; white-space: nowrap">{d}</td></tr>'
                          for a, b, c, d in rows) + '</tbody></table>')
    return (f'<section style="display: flex; flex-direction: column; gap: 8px">{text("heading", title, touch, TEXT, "h2")}{body}</section>')


def frame(caption: str, inner: str, width: int, height: int) -> str:
    """A screen on the board at its size, with its caption over it."""
    return (f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; width: {width}px">'
            f'<figcaption style="{style("body", False, TEXT_2)}">{caption}</figcaption>'
            f'<div style="position: relative; width: {width}px; height: {height}px; overflow: hidden; background: {GROUND}; '
            f'border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; box-sizing: border-box">{inner}</div></figure>')
