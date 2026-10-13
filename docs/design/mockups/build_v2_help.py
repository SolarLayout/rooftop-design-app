"""The boards "V2 · 11 · Help" on desktop 1440, tablet 834 and phone 390.

The in-app help kept as built (D80, D81, Phase 15; D100) and every topic rewritten in V2's voice (plan/v2/voice.md §9; audit
V2-83 to V2-87). Today a topic opens with what the control is and how the engine behaves; the answer to "what do I put here?"
comes last or not at all; the disc is the loudest thing after the primary; the tips card and Show me how are a third channel;
Related and In the docs are two lists of the same names. V2: the answer first, then what it changes, then when to change it;
the screen's own words in code formatting; the disc quiet until its sheet is open; how-tos reached from their section's ?;
one list of what is related, the docs in it. The topics drawn are the app's own (apps/web/content/help), rewritten.
Usage: python3 -I build_v2_help.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, ACCENT_INK, CHROME, ICON, LINE, LINE_STRONG, LINE_SUBTLE, MONO_FAMILY, RADIUS, ROOF, SHADOW_FLOAT, STEP_ICON,
    SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3, WELL, Map, board_head, button, changes, frame, icon, mark, roof_svg, style,
    summary_row, tab_bar, text, top_bar, write_board, help_disc,
)

ISSUES = "Answers V2-83 · V2-84 · V2-85 · V2-86 · V2-87 · D80 kept · D100"
LINES = [
    "The help stays as built: the ? beside each section's name, the sheet that names the section, the how-tos with "
    "pictures and clips. What changes is what it says and how loud it is. Every topic answers first what to put here, "
    "then what it changes, then when to change it. It names each control as the screen does, in code formatting.",
    "The disc is quiet, in the line colour, until its sheet is open. The field's own hint carries the one-line answer, so "
    "most users never open the sheet. A how-to is reached from its section's ?, the tips card being gone. Related and In the "
    "docs become one list. A picture that does not load says so, with Try again.",
]


def code(w: str) -> str:
    return (f'<code style="font-family: {MONO_FAMILY}; font-size: 13px; padding: 1px 6px; border-radius: 6px; background: {SURFACE_2}; '
            f'color: {TEXT}">{w}</code>')


def held_disc() -> str:
    return (f'<span style="display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center"><span style="width: 20px; '
            f'height: 20px; border-radius: 50%; border: 1px solid {ACCENT}; color: {ACCENT}; font-size: 12px; line-height: 18px; text-align: center; '
            f'box-sizing: border-box; box-shadow: 0 0 0 2px #0E1218, 0 0 0 4px rgba(255,176,32,.45)">?</span></span>')


def p(words: str, touch: bool = False) -> str:
    return f'<p style="margin: 0; {style("body", touch)}; line-height: {24 if not touch else 24}px">{words}</p>'


def h(words: str, touch: bool = False) -> str:
    return text("section", words, touch, TEXT, "h3", "margin-top: 8px")


def related(items: list, touch: bool) -> str:
    rows = "".join(f'<a href="#" style="display: flex; align-items: center; justify-content: space-between; min-height: 44px; border-top: 1px solid {LINE_SUBTLE}; '
                   f'text-decoration: none; {style("body", touch)}">{a}{icon(STEP_ICON["book"] if ext else ICON["chevron-right"], 14, TEXT_2)}</a>'
                   for a, ext in items)
    return f'<div style="display: flex; flex-direction: column">{h("Related", touch)}<div style="margin-top: 8px">{rows}</div></div>'


def edges_topic(touch: bool) -> str:
    fields = [("Parapet height", "the low wall along the roof's edge. Type 0 if there is none. Usually 0.5 to 1.2 m."),
              ("Edge margin (setback)", "the strip along every edge kept free of modules. Usually 0.5 to 1.5 m; the fire code may set it."),
              ("Walkway width", "and " + code("Walkway every") + ": a path across the rows every 24 modules, to clean and repair them."),
              ("Clearance", "the space kept free round each obstacle. Usually 0.5 m.")]
    lis = "".join(f'<li style="margin: 0 0 10px; {style("body", touch)}; line-height: 24px">{code(a)}{" " if b.startswith("and ") else ": "}{b}</li>' for a, b in fields)
    return (f'{p("Where modules may not go: the strip at the edges, the walkways, and the space round obstacles.", touch)}'
            f'{h("What to set", touch)}{p("Measure the parapet on site: it shades the first row. Keep the other values unless the site\'s rules ask for more.", touch)}'
            f'<ul style="margin: 0; padding-left: 18px">{lis}</ul>'
            f'{h("What it changes", touch)}{p("Each value moves where modules may go. The app lays out the roof again, then runs the design.", touch)}'
            f'{h("When to change it", touch)}{p("When the site has no parapet, when its code asks for a wider margin, or when the roof needs a walkway more often.", touch)}'
            + related([("Roof type", False), ("Obstacles", False), ("Edges and access, in the docs", True)], touch))


def sheet(title: str, body: str, w: int, h_: int, touch: bool = False, back: str = "") -> str:
    head = (f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid {LINE_SUBTLE}">'
            f'<div style="display: flex; align-items: center; gap: 8px">'
            + (f'<button type="button" aria-label="Back" style="width: 32px; height: 32px; background: transparent; border: 0">{icon("<path d=\"M15 6l-6 6 6 6\"></path>", 18, TEXT_2)}</button>' if back else "")
            + f'{text("heading", title, touch)}</div>'
            f'<button type="button" aria-label="Close" style="width: 44px; height: 44px; background: transparent; border: 0">{icon(ICON["close"], 20, TEXT_2)}</button></div>')
    return (f'<aside role="dialog" aria-label="Help: {title}" style="width: {w}px; height: {h_}px; background: {CHROME}; border-left: 1px solid {LINE}; '
            f'box-shadow: -16px 0 40px rgba(0,0,0,.5); display: flex; flex-direction: column; box-sizing: border-box">{head}'
            f'<div style="flex: 1; overflow: hidden; padding: 20px; display: flex; flex-direction: column; gap: 12px">{body}</div></aside>')


def roof_screen_with_help() -> str:
    from build_v2_progression import view_controls
    bar = top_bar({}, "Roof", 1440)
    st = (f'<div style="position: absolute; left: 0; top: 56px; width: 1440px; height: 844px">'
          f'<div style="position: absolute; left: 40px; top: 32px">{text("title", "Roof")}</div>'
          f'<div style="position: absolute; left: 48px; top: 190px">{roof_svg(960, label="3D view of the Pune demo roof")}</div></div>')
    col = (f'<div style="position: absolute; right: 440px; top: 56px; width: 384px; height: 844px; background: {CHROME}; border-left: 1px solid {LINE_SUBTLE}; '
           f'padding: 24px; box-sizing: border-box; display: flex; flex-direction: column; gap: 24px">{text("heading", "Check the roof", False, TEXT, "h2")}<div>'
           + summary_row("Roof type", "Flat · rows facing south", False, state="Yours")
           + summary_row("Edges and access", "Parapet 0.9 m · margin 1.0 m", False, True, "Default").replace(help_disc(False), held_disc(), 1)
           + '</div></div>')
    dim = f'<div style="position: absolute; left: 0; top: 56px; width: 616px; height: 844px; background: rgba(5,7,10,.45)"></div>'
    sh = f'<div style="position: absolute; right: 0; top: 56px">{sheet("Edges and access", edges_topic(False), 440, 844)}</div>'
    return bar + st + col + dim + sh


def today_v2(touch: bool) -> str:
    today = ("The ways to string the roof that the run simulated, each for a full year. Choose one, or add your own. "
             "<br><br>Its letter and a caption, then modules in series × strings, kWp and DC/AC, then the energy of the first year in MWh … "
             "<br><br>The engine tries up to three lengths from the series range: the one nearest the inverter's nominal MPP voltage, the longest, and …")
    v2 = (f'{p("Ways to wire the modules to the inverter, the best first. Choose one, or add your own.", touch)}'
          f'{h("Choosing one", touch)}{p("Press a card to use it. Nothing runs again: every option is computed already.", touch)}'
          f'{h("What a card says", touch)}{p("Why it is there in two words, the modules per string × strings, the system\'s size, the energy in year 1. "
                                              "A tick: it fits. An exclamation mark: its DC/AC ratio is outside the target.", touch)}'
          f'{h("How the options are made", touch)}<ol style="margin: 0; padding-left: 20px">'
          + "".join(f'<li style="margin: 0 0 8px; {style("body", touch)}">{x}</li>' for x in (
              "Each option keeps the DC/AC ratio between 1.10 and 1.30.", "An MPPT takes at most 4 strings.", "The least shaded strings are used first."))
          + '</ol>')
    col = lambda t, inner, c: (f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 20px; background: {SURFACE_1}; border: 1px solid {LINE}; '
                               f'border-radius: {RADIUS["card"]}px; min-width: 0">{text("unit", t, False, TEXT_3)}{text("heading", "Options", touch)}{inner}</div>')
    return (f'<div style="display: grid; grid-template-columns: {"1fr" if touch else "1fr 1fr"}; gap: 24px">'
            + col("Today", f'<p style="margin: 0; {style("body", touch, TEXT_2)}; line-height: 24px">{today}</p>', TEXT_2)
            + col("V2: the answer first, the mechanism after, the screen's words", v2, TEXT) + '</div>')


def howto(touch: bool, w: int) -> str:
    m1 = Map(w - 40, round((w - 40) * 0.56), 3.6 if w < 500 else 4.2).outline([(0, 0), (90, 0), (90, 40)], False, cursor=(1, 39)).length((0, 0), (90, 0), "90.0 m", (0, 18)).length((90, 0), (90, 40), "40.0 m", (-36, 0)).svg()
    m2 = Map(w - 40, round((w - 40) * 0.56), 3.6 if w < 500 else 4.2).outline(ROOF, True).svg()

    def pic(svg: str, mark_words: str) -> str:
        return (f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 6px"><div style="position: relative; width: {w - 40}px; '
                f'height: {round((w - 40) * 0.56)}px; overflow: hidden; border-radius: {RADIUS["control"]}px">{svg}</div>'
                f'<figcaption style="{style("body", touch, TEXT_2)}">{mark_words}</figcaption></figure>')
    step = lambda n, t, body: (f'<li style="list-style: none; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; gap: 10px; align-items: center">'
                               f'<span style="width: 24px; height: 24px; border-radius: 50%; background: {SURFACE_2}; display: inline-flex; align-items: center; '
                               f'justify-content: center; {style("strong", False)}">{n}</span>{text("strong", t, touch)}</div>{body}</li>')
    return (f'{p("Click each corner of the roof, then the first one again to close the outline.", touch)}'
            f'<ol style="margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px">'
            + step(1, "Click each corner of the roof", pic(m1, "Corners placed; the edges show their lengths."))
            + step(2, "Click the first corner again", pic(m2, "The outline is closed. Drag a corner to adjust it."))
            + '</ol>' + f'{h("Undo", touch)}{p("Press " + code("⌘ Z") + " to take back the last corner.", touch)}')


def failed_picture(w: int, touch: bool) -> str:
    return (f'<div style="width: {w - 40}px; height: {round((w - 40) * 0.36)}px; border-radius: {RADIUS["control"]}px; background: {SURFACE_1}; '
            f'border: 1px dashed {LINE_STRONG}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px">'
            f'<span style="display: flex; gap: 8px; align-items: center">{mark("note", 16)}{text("strong", "The picture did not load", touch)}</span>'
            f'{button("Try again", "secondary", "standard", touch)}</div>')


# Every topic of the help in V2: where its ? sits (V2's screen and section), its title in V2 (today's after it where it
# changes), its kind (an answer, or a how-to of numbered steps), and its summary in V2's voice: one sentence of what it
# does for the user, under 20 words. The topics' bodies follow the model of Edges and access and Options above.
TOPICS = [
    ("Find", [
        ("Find the roof", "", "How-to", "Search an address, paste coordinates or a maps link, then outline the roof on the map."),
        ("Outline by its corners", "", "How-to", "Click each corner of the roof, then the first corner again to close the outline."),
        ("Draw a rectangle", "", "How-to", "Drag from one corner of the roof to the opposite one, then turn it to fit."),
        ("Detect the building", "", "How-to", "Click inside the building to get its outline, then drag the corners onto the roof."),
        ("Move or turn the roof", "", "How-to", "Drag the roof to move it, or its round handle to turn it. Its obstacles move with it."),
        ("Add a box", "Draw a box", "How-to", "Drag over a stair room or a plant room, then type its height above the roof."),
        ("Add a tank", "Draw a tank", "How-to", "Drag from the middle of a round tank to its edge, then type its height."),
        ("Add a tree", "", "How-to", "Drag from the middle of a tree to the edge of its crown, then type its height."),
        ("Add a wall", "Draw a wall", "How-to", "Click each point of the wall, end on the last one, then type its height."),
        ("Add a building beside the roof", "Draw a building beside the roof", "How-to", "Outline a building next to the roof and type its height, so its shadow on the roof counts."),
        ("Move, turn or remove an obstacle", "", "How-to", "Select an obstacle on the map, then drag it, turn it by its handle, or remove it."),
        ("Edges", "", "Answer", "Type a length you measured to correct one edge of the outline."),
        ("Place", "", "Answer", "Set where a roof entered by hand stands: search for it, or type its latitude and longitude."),
        ("Shape", "", "Answer", "Type the roof's length and width, or its corners in metres."),
        ("Roof type", "", "Answer", "Choose how the modules sit: rows facing south, rows facing east and west, or flush on a slope."),
        ("Obstacles", "", "Answer", "Add what stands on the roof with its height, so modules keep clear of it and its shade counts."),
    ]),
    ("Roof", [
        ("Outline", "Location", "Answer", "Where the roof is, its size and its corners. Edit the corners in Plan."),
        ("Edges and access", "", "Answer", "Set the parapet height and the strips kept free of modules at the edges and round obstacles."),
    ]),
    ("Array", [
        ("Module", "", "Answer", "Choose the module. Its size sets the layout; its ratings set the strings and the energy."),
        ("Mounting", "", "Answer", "Set the modules' tilt, their orientation, and how many stand in each row's height."),
        ("Spacing", "", "Answer", "How far apart the rows stand so they do not shade each other in the shade-free hours."),
        ("Shade-free hours", "Shade-free window", "Answer", "Set the hours of the design day in which rows and obstacles must not shade the modules."),
        ("Design day", "Day", "Answer", "The day the rows are spaced for. 21 December has the longest shadows."),
    ]),
    ("Sun view", [
        ("Shade over the year", "Shading over the year", "Answer", "How much energy shade costs in a year, by its cause: rows and obstacles, strings, the horizon."),
        ("On the roof", "", "Answer", "Choose what the Sun view draws: the sun's arc, its shade-free hours, shadow outlines, the shade map."),
        ("Shade map", "", "Answer", "Each module coloured by its loss to shade over the year, to see where shade costs most."),
        ("The sun at the time", "Sun at the hour", "Answer", "Where the sun stands at the time on the timeline: how high, and from which direction."),
    ]),
    ("Strings", [
        ("Options", "", "Answer", "Choose how the modules are wired to the inverter. The best option comes first."),
        ("Inverter", "", "Answer", "Choose the inverter the strings are sized for, from the library or your own file (OND)."),
        ("System voltage", "", "Answer", "The highest DC voltage of the system. It caps the modules in a string; it starts from your country."),
        ("Modules per string", "Modules in series", "Answer", "How many modules one string can hold at your system voltage, and what limits it."),
        ("MPPT loading", "", "Answer", "The strings on each input of the inverter, and their current against its limit."),
    ]),
]


def topic_index(touch: bool) -> str:
    """Every topic in V2 by where its ? sits: the title (today's struck through where it changes), its kind, its summary."""
    groups = ""
    for where, rows in TOPICS:
        lines = ""
        for title, was, kind, summary in rows:
            old = (f' <span style="{style("body", touch, TEXT_3)}; text-decoration: line-through">{was}</span>' if was else "")
            if touch:
                lines += (f'<div style="display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}">'
                          f'<span>{text("strong", title, touch)}{old}</span>{text("unit", kind, touch, TEXT_3)}{text("body", summary, touch, TEXT_2)}</div>')
            else:
                lines += (f'<div style="display: grid; grid-template-columns: 340px 80px 1fr; gap: 24px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}; align-items: baseline">'
                          f'<span>{text("strong", title)}{old}</span>{text("unit", kind, False, TEXT_3)}{text("body", summary, False, TEXT_2)}</div>')
        groups += f'<section style="display: flex; flex-direction: column">{text("heading", where, touch, TEXT, "h3", "margin-bottom: 8px")}{lines}</section>'
    n = sum(len(r) for _, r in TOPICS)
    lead = text("body", f"All {n} topics of the help in V2, by where their ? sits: the title as the screen names the section (today's struck "
                        "through where it changes), the kind, and the summary, the sheet's first line. Each body follows the two models above. "
                        "A section V2 adds with a ? gets its topic in the same pull request (D80's gate).", touch, TEXT_2, "p", "max-width: 820px")
    return (f'<section style="display: flex; flex-direction: column; gap: 24px">{text("title", "The topics", touch, TEXT, "h2")}{lead}{groups}</section>')


CHANGES = [
    ("help-content.md · a topic's order", "What the control is, then how the engine behaves; the answer last or missing",
     "What to set first, then What it changes, then When to change it (voice §9)", "V2-83"),
    ("A topic's summary", "A noun phrase with a trailing clause", "One sentence of what the thing does for the user, under 20 words", "V2-52"),
    ("The words in a topic", "Parapet, Setback, Every, Albedo; the engine", "The screen's own labels in code formatting; the app, never the engine", "V2-37, V2-41"),
    ("D80 · the ? disc", "The accent's ring on every heading", "The line colour; the accent only while its sheet is open; 44 to touch", "V2-84"),
    ("D79, D81 · tips and Show me how", "A third channel beside the disc and the docs", "Gone: how-tos from their section's ?", "V2-86"),
    ("The sheet's foot", "Related, then In the docs, the same names twice", "One list, Related, the docs in it with the book", "V2-87"),
    ("A picture's slot", "A loading state with no words when it fails", "The picture did not load, with Try again", "V2-85"),
]


def build_desktop() -> None:
    hd = board_head("V2 · 11 · Help", LINES, False, ISSUES)
    ht = (f'<div style="display: grid; grid-template-columns: 440px 1fr; gap: 40px; align-items: start">'
          f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", "3 · A how-to from the ? of Outline the roof: numbered steps, each a picture", False, TEXT_2)}'
          f'{sheet("Outline by its corners", howto(False, 440), 440, 900, back="1")}</div>'
          f'<div style="display: flex; flex-direction: column; gap: 8px">{text("body", "4 · A picture that did not load", False, TEXT_2)}'
          f'<div style="padding: 20px; background: {CHROME}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; width: 440px; box-sizing: border-box">{failed_picture(440, False)}</div></div></div>')
    screens = (frame("1 · The ? of Edges and access pressed: the disc held in the accent; the sheet answers what to set first", roof_screen_with_help(), 1440, 900)
               + f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 8px">{text("body", "2 · The topic Options, today and in V2", False, TEXT_2)}{today_v2(False)}</figure>'
               + ht + topic_index(False))
    body = f'<div style="padding: 40px; display: flex; flex-direction: column; gap: 40px">{hd}{screens}{changes(CHANGES)}</div>'
    write_board(OUT, "V2Help.dc.html", "V2 · 11 · Help · desktop 1440", 1520, 5120, body)


def touch_help(size: str) -> str:
    w, hh = (834, 1194) if size == "tablet" else (390, 844)
    bar = top_bar({}, "Roof", w, size)
    dim = f'<div style="position: absolute; inset: 0; background: rgba(5,7,10,.72)"></div>'
    if size == "tablet":
        sh = f'<div style="position: absolute; right: 0; top: 0">{sheet("Edges and access", edges_topic(True), 480, hh, True)}</div>'
    else:
        sh = (f'<div style="position: absolute; left: 0; top: 64px; width: 390px; height: 780px; background: {CHROME}; border-radius: 24px 24px 0 0; '
              f'border-top: 1px solid {LINE}; overflow: hidden">{sheet("Edges and access", edges_topic(True), 390, 780, True)}</div>')
    return bar + dim + sh


def touch_howto(size: str) -> str:
    w, hh = (834, 1194) if size == "tablet" else (390, 844)
    bar = top_bar({}, "Roof", w, size)
    dim = f'<div style="position: absolute; inset: 0; background: rgba(5,7,10,.72)"></div>'
    if size == "tablet":
        return bar + dim + f'<div style="position: absolute; right: 0; top: 0">{sheet("Outline by its corners", howto(True, 480), 480, hh, True, back="1")}</div>'
    return (bar + dim + f'<div style="position: absolute; left: 0; top: 64px; width: 390px; height: 780px; background: {CHROME}; border-radius: 24px 24px 0 0; '
            f'border-top: 1px solid {LINE}; overflow: hidden">{sheet("Outline by its corners", howto(True, 390), 390, 780, True, back="1")}</div>')


def build_touch(size: str) -> None:
    w, hh = (834, 1194) if size == "tablet" else (390, 844)
    side = 20 if size == "tablet" else 16
    hd = board_head("V2 · 11 · Help", LINES, True, ISSUES)
    words = "The sheet from the right edge, the whole height" if size == "tablet" else "The sheet from the bottom, as D80 set it"
    body = (f'<div style="padding: 40px 0; display: flex; flex-direction: column; gap: 40px"><div style="padding: 0 {side}px">{hd}</div>'
            f'{frame(words, touch_help(size), w, hh)}'
            f'{frame("A how-to from the ? of Outline the roof: numbered steps, each a picture; Back to the topic", touch_howto(size), w, hh)}'
            f'<div style="padding: 0 {side}px; display: flex; flex-direction: column; gap: 8px">{text("body", "A picture that did not load", True, TEXT_2)}'
            f'{failed_picture(w - 2 * side + 40, True)}</div>'
            f'<div style="padding: 0 {side}px">{today_v2(True)}</div>'
            f'<div style="padding: 0 {side}px">{topic_index(True)}</div>'
            f'<div style="padding: 0 {side}px">{changes(CHANGES, True)}</div></div>')
    write_board(OUT, f"V2Help{size.capitalize()}.dc.html", f"V2 · 11 · Help · {size} {w}", w, 8360 if size == "tablet" else 8800, body)


if __name__ == "__main__":
    build_desktop()
    build_touch("tablet")
    build_touch("phone")
