"""The boards "UI fixes · Coordinates in the search" on desktop 1440, tablet 834 and phone 390.

Written beside this script: SearchCoordinates.dc.html, SearchCoordinatesTablet.dc.html, SearchCoordinatesPhone.dc.html.
Usage: python3 -I build_ui_fixes_search_coordinates.py [desktop=H tablet=H phone=H]
"""
import sys
from dataclasses import dataclass
from html import escape
from pathlib import Path

PROJECT = Path(__file__).parent


@dataclass(frozen=True)
class Size:
    name: str
    file: str
    width: int
    height: int
    pad: str          # the board's padding
    card_pad: int     # a section's padding
    columns: int      # the cases side by side
    body: int         # body text px (15 on touch, 14 on desktop)
    title: int        # the board's h1 px

    @property
    def inner(self) -> int:
        """The width inside a section."""
        side = int(self.pad.split()[1].rstrip("px"))
        return self.width - 2 * side - 2 * self.card_pad - 2


DESKTOP = Size("desktop", "SearchCoordinates.dc.html", 1440, 1900, "48px 56px", 24, 3, 14, 44)
TABLET = Size("tablet", "SearchCoordinatesTablet.dc.html", 834, 2340, "32px 32px", 20, 2, 15, 36)
PHONE = Size("phone", "SearchCoordinatesPhone.dc.html", 390, 3800, "24px 16px", 16, 1, 15, 28)

CARD = ("display: flex; flex-direction: column; gap: 16px; padding: {p}px; background: #12161D; border: 1px solid #232A36; "
        "border-radius: 18px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.28)")
H2 = "margin: 0; font-size: 12px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: #7C8696"
CAPTION = "font-size: 12px; line-height: 16px; color: #A9B2C0"
FLOAT = ("display: flex; align-items: center; gap: 12px; width: {w}px; min-width: 0; height: 48px; box-sizing: border-box; padding: 0 16px; "
         "background: #12161D; border: 1px solid #232A36; border-radius: 14px; "
         "box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.5)")
PANEL = ("list-style: none; margin: 6px 0 0; width: {w}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; "
         "padding: 6px; background: #12161D; border: 1px solid #2F3847; border-radius: 14px; "
         "box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45), 0 16px 40px rgba(0,0,0,0.5)")
WELL = ("display: flex; align-items: center; gap: 12px; box-sizing: border-box; background: #090C10; border-radius: 16px; "
        "border: 1px solid #FFB020; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)")
ACTION = ("display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0 20px; background: #FFB020; color: #1A1204; "
          "border-radius: 12px; font-weight: 600; font-size: 16px; "
          "box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.5), 0 8px 22px rgba(255,176,32,0.24)")

SEARCH_ICON = ('<svg style="flex-shrink: 0" width="{s}" height="{s}" viewBox="0 0 24 24" fill="none" stroke="#A9B2C0" stroke-width="{w}" '
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/></svg>')
PIN = ('<svg style="flex-shrink: 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C8696" stroke-width="2" stroke-linecap="round" '
       'stroke-linejoin="round" aria-hidden="true"><path d="M12 21s6-5.700 6-11a6 6 0 0 0-12 0c0 5.300 6 11 6 11z"/><circle cx="12" cy="10" r="2.200"/></svg>')
NOTE = ('<svg style="flex-shrink: 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFB020" stroke-width="2" stroke-linecap="round" '
        'stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>')
ARROW = ('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1204" stroke-width="2" stroke-linecap="round" '
         'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6"/></svg>')

DMS = "12°54'50.74\"N 77°29'31.16\"E"
READ = "12.91409° N, 77.49199° E"
LABEL = "Search an address or paste coordinates"

FORMS = [
    ("Degrees, minutes and seconds, as Google Earth copies them", DMS, READ),
    ("The same with typographic marks", "12°54′50.74″N, 77°29′31.16″E", READ),
    ("The letter first", "N 12°54'50.74\" E 77°29'31.16\"", READ),
    ("Spaces for the marks", "12 54 50.74 N 77 29 31.16 E", READ),
    ("Degrees and decimal minutes, as a GPS shows them", "12°54.8456'N 77°29.5193'E", READ),
    ("The longitude first, its letters say so", "77°29'31.16\"E 12°54'50.74\"N", READ),
    ("Decimal degrees, as before", "12.914094, 77.491989", READ),
    ("Decimal degrees with letters", "12.914094N 77.491989E", READ),
    ("A minus for south and west", "-33.856784, 151.215297", "33.85678° S, 151.21530° E"),
    ("Decimal commas, as some countries write them", "12,914094 77,491989", READ),
    ("A maps link, as before", "https://www.google.com/maps/@12.9140944,77.4919889,19z", READ),
]


def field_input(value: str, size: int) -> str:
    return (f'<input aria-label="{LABEL}" value="{escape(value)}" '
            f'style="flex-grow: 1; min-width: 0; background: transparent; border: 0; outline: 0; font-size: {size}px">')


def option(text: str, fact: str, marked: bool = True) -> str:
    background = "#181D26" if marked else "transparent"
    return (f'<li role="option" aria-selected="{"true" if marked else "false"}" style="display: flex; align-items: center; gap: 10px; '
            f'min-height: 44px; padding: 0 10px; border-radius: 8px; background: {background}; cursor: pointer">{PIN}'
            f'<span style="flex-grow: 1">{escape(text)}</span><span style="font-size: 12px; color: #7C8696">{escape(fact)}</span></li>')


def note(text: str) -> str:
    return (f'<li style="display: flex; align-items: flex-start; gap: 10px; min-height: 44px; box-sizing: border-box; padding: 12px 10px; '
            f'color: #A9B2C0"><span style="display: flex; padding-top: 2px">{NOTE}</span><span>{text}</span></li>')


def panel(rows: str, width: int) -> str:
    return f'<ul role="listbox" aria-label="Places found" style="{PANEL.format(w=width)}">{rows}</ul>'


CASES = [
    ("Minutes or seconds of 60 or more", "12°54'65\"N 77°29'31\"E",
     note("Minutes and seconds go up to 59. The latitude has 65″: check where it was copied from.")),
    ("A latitude past 90°", "95°10'00\"N 77°29'31\"E",
     note("A latitude goes up to 90°, and this one is 95°. Check where it was copied from.")),
    ("The longitude first, without letters: what it may mean is offered", "151.215297, -33.856784",
     note("The latitude comes first, and 151.21530 is more than 90°. Did you mean this?")
     + option("33.85678° S, 151.21530° E", "Swapped")),
    ("Two of a kind", "12°54'50\"N 77°29'31\"N",
     note("Both are marked N. The latitude takes N or S, the longitude E or W.")),
    ("One alone", "12°54'50.74\"N",
     note("Only the latitude is here. Add the longitude after it: 12°54′50.74″N 77°29′31.16″E.")),
    ("A minus and a letter that disagree", "-12.914094N 77.491989E",
     note("−12.91409 is marked N, and a minus means south. Keep the minus or the letter, not both.")),
    ("Part of it cannot be read", "12°54'50.74\"N 77°29'",
     note("These look like coordinates, but the longitude cannot be read. Write them as 12°54′50.74″N 77°29′31.16″E, or 12.91409, 77.49199.")),
    ("The address search not available: plain words, never the service’s own (“Invalid Token”)", "MG Road, Bangalore",
     note("The address search is not available right now. Paste coordinates or a maps link instead.")),
]


def section(size: Size, title: str, body: str) -> str:
    return f'<section style="{CARD.format(p=size.card_pad)}"><h2 style="{H2}">{title}</h2>{body}</section>'


def labelled(caption: str, inner: str, width: int) -> str:
    return f'<div style="display: flex; flex-direction: column; gap: 6px; width: {width}px"><span style="{CAPTION}">{caption}</span>{inner}</div>'


def home_wide(width: int) -> str:
    """Home's well on desktop and tablet: 76 high, Find my roof inside it."""
    well = (f'<div style="{WELL}; height: 76px; padding: 0 10px 0 20px">{SEARCH_ICON.format(s=22, w=1.8)}{field_input(DMS, 16)}'
            f'<a href="Locate.dc.html" style="flex-shrink: 0; height: 56px; {ACTION}">Find my roof{ARROW}</a></div>')
    return well + panel(option(READ, "Coordinates"), width)


def home_phone(width: int) -> str:
    """Home's well on phone: the form alone, 56 high; Find my roof under it, and the row floats over it."""
    return (f'<div style="display: flex; flex-direction: column; gap: 10px; width: {width}px">'
            f'<div style="{WELL}; height: 56px; padding: 0 16px">{SEARCH_ICON.format(s=20, w=1.8)}{field_input(DMS, 16)}</div>'
            f'<div style="position: relative; height: 112px">'
            f'<a href="Locate.dc.html" style="position: absolute; left: 0; right: 0; top: 0; height: 48px; {ACTION}">Find my roof{ARROW}</a>'
            f'<div style="position: absolute; left: 0; right: 0; top: -6px">{panel(option(READ, "Coordinates"), width)}</div></div></div>')


def find_field(width: int, body: int) -> str:
    """Find's search, floating over the map."""
    return (f'<div style="{FLOAT.format(w=width)}">{SEARCH_ICON.format(s=18, w=2)}{field_input(DMS, body)}</div>'
            + panel(option(READ, "Coordinates"), width))


def pasted(size: Size) -> str:
    words = (f'<p style="margin: 0; max-width: 900px; color: #A9B2C0">As soon as what is in the field reads as coordinates, one row under '
             f'it says where it lands, marked as the first place found is. Enter, Find my roof or a press on the row goes there. Nothing is '
             f'asked of the address search.</p>')
    if size is DESKTOP:
        shown = (f'<div style="display: flex; gap: 64px; align-items: flex-start">'
                 f'{labelled("Home: the well with Find my roof inside it", home_wide(480), 480)}'
                 f'{labelled("Find: the search floating over the map", find_field(400, size.body), 400)}</div>')
    elif size is TABLET:
        shown = (f'{labelled("Home: the well as wide as the page, Find my roof inside it", home_wide(size.inner), size.inner)}'
                 f'{labelled("Find: the search over the map", find_field(400, size.body), 400)}')
    else:
        shown = (f'{labelled("Home: the row floats over Find my roof, as the places found do", home_phone(size.inner), size.inner)}'
                 f'{labelled("Find: the search over the map", find_field(size.inner, size.body), size.inner)}')
    return section(size, "Pasted or typed: read back before it goes", words + shown)


def read_table(size: Size) -> str:
    if size is DESKTOP:
        td = "padding: 0 16px; height: 44px; border-top: 1px solid #232A36"
        th = "padding: 0 16px 10px; text-align: left; font-size: 12px; font-weight: 500; color: #7C8696"
        rows = "".join(
            f'<tr><td style="{td}; color: #A9B2C0">{escape(how)}</td><td style="{td}"><code style="font-size: 13px">{escape(example)}</code></td>'
            f'<td style="{td}; white-space: nowrap">{escape(read)}</td></tr>'
            for how, example, read in FORMS)
        body = (f'<table style="width: 100%"><thead><tr><th style="{th}">Written as</th><th style="{th}">Example</th>'
                f'<th style="{th}">Read as</th></tr></thead><tbody>{rows}</tbody></table>')
    else:
        # Touch sizes: each form is a block, the example on a line of its own, wrapped when it is long.
        items = "".join(
            f'<li style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-top: 1px solid #232A36">'
            f'<span style="{CAPTION}">{escape(how)}</span>'
            f'<code style="font-size: 13px; line-height: 18px; overflow-wrap: anywhere">{escape(example)}</code>'
            f'<span style="color: #A9B2C0">Read as <span style="color: #F2F4F7">{escape(read)}</span></span></li>'
            for how, example, read in FORMS)
        cols = "grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 24px" if size is TABLET else "grid-template-columns: minmax(0, 1fr)"
        body = f'<ul style="list-style: none; margin: 0; padding: 0; display: grid; {cols}">{items}</ul>'
    return section(size, "What is read", body)


def mistakes(size: Size) -> str:
    gap = 24
    width = (size.inner - gap * (size.columns - 1)) // size.columns
    width = min(width, 400)
    cases = "".join(
        labelled(caption,
                 f'<div style="{FLOAT.format(w=width)}">{SEARCH_ICON.format(s=18, w=2)}{field_input(value, size.body)}</div>{panel(rows, width)}',
                 width)
        for caption, value, rows in CASES)
    words = (f'<p style="margin: 0; max-width: 900px; color: #A9B2C0">What looks like coordinates is never sent to the address search. '
             f'The note comes when Enter or Find my roof is pressed, not while typing. The mark is the note’s exclamation, never a cross.</p>')
    grid = (f'<div style="display: grid; grid-template-columns: repeat({size.columns}, minmax(0, 1fr)); gap: 28px {gap}px; '
            f'align-items: start">{cases}</div>')
    return section(size, "When it cannot be read: it says why, and what to do", words + grid)


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
a{{color:#A9B2C0;text-decoration:none}}a:hover{{color:#F2F4F7}}
button,input{{font:inherit;color:inherit}}
code{{font-family:'Geist Mono',ui-monospace,monospace}}
table{{border-collapse:collapse}}
button,a,input{{transition:transform .16s cubic-bezier(.2,.8,.2,1),box-shadow .16s ease,background-color .16s ease,filter .16s ease}}
a:hover{{filter:brightness(1.14)}}
button:focus-visible,a:focus-visible,input:focus-visible{{outline:2px solid #FFB020;outline-offset:2px}}
@media (prefers-reduced-motion:reduce){{*{{transition:none!important;animation:none!important}}}}
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
    title = f"UI fixes · Coordinates in the search · {size.name} {size.width}"
    heading = (f'<div style="display: flex; flex-direction: {"row" if size is DESKTOP else "column"}; align-items: {"flex-end" if size is DESKTOP else "flex-start"}; gap: {40 if size is DESKTOP else 10}px">'
               f'<h1 style="margin: 0; font-family: \'Bricolage Grotesque\', Geist, sans-serif; font-weight: 600; font-size: {size.title}px; '
               f'line-height: 1.1; letter-spacing: -0.03em">Coordinates in the search</h1>'
               f'<p style="margin: 0 0 4px; max-width: 620px; color: #A9B2C0">Coordinates copied from Google Earth, in degrees, minutes and seconds, '
               f'are read as decimal ones are. What cannot be read says why, and what to do. {size.name.capitalize()} {size.width}.</p></div>')
    root = (f'<div style="width: {size.width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px; '
            f'padding: {size.pad}; background: #0B0E13; color: #F2F4F7; overflow: hidden; font-size: {size.body}px; line-height: 20px">'
            f'{heading}{pasted(size)}{read_table(size)}{mistakes(size)}</div>\n')
    return HEAD.format(title=title) + root + TAIL.format(w=size.width, h=height)


if __name__ == "__main__":
    heights = dict(arg.split("=") for arg in sys.argv[1:])
    for size in (DESKTOP, TABLET, PHONE):
        height = int(heights.get(size.name, size.height))
        (PROJECT / size.file).write_text(board(size, height), encoding="utf-8")
        print(size.file, height)
