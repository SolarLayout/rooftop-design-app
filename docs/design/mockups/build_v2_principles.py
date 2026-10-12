"""The boards "V2 · Principles" on desktop 1440, tablet 834 and phone 390: the base every V2 board follows.

A specimen, not a screen (plan/v2/audit.md, category L: V2-106 to V2-112, V2-120): the type scale, the colours of text,
the spacing scale, the control heights, the radii, where the accent goes, and the density budget. Each part says what it
is today, what it is in V2, and the issue it answers. The numbers are those of build_v2_parts.py, which every V2 board is
drawn with. The words follow plan/v2/voice.md.
Usage: python3 -I build_v2_principles.py [--out <folder>]
"""
import sys
from pathlib import Path

HERE = Path(__file__).parent
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else HERE
sys.path.insert(0, str(HERE))
from build_v2_parts import (  # noqa: E402
    ACCENT, ACCENT_INK, CONTROL, CONTROL_ACTIVE, HALO_FOCUS, HALO_SELECTED, HEIGHT, ICON, LINE, LINE_STRONG,
    LINE_SUBTLE, NOTE_LINE, NOTE_SURFACE, RADIUS, SHADOW_WELL, SPACE, SURFACE_1, SURFACE_2, TEXT, TEXT_2, TEXT_3,
    TYPE, WELL, CHROME, board_head, button, field, help_disc, icon, mark, segmented, style, summary_row, text,
    write_board,
)

ISSUES = "Answers V2-106 · V2-107 · V2-108 · V2-109 · V2-110 · V2-111 · V2-112 · V2-120"
LINES = [
    "The base every V2 board follows. The colours of Dusk stay. What changes is how many sizes, steps and heights "
    "there are, and where the accent goes.",
    "Today a Studio lens shows 15 to 18 type styles, 11 control heights and the accent on 15 to 19 things. V2 holds a "
    "screen to 8 styles, 3 heights and 3 to 5 accent marks.",
]
UNITS = {"display": "MWh", "figure": "kWh/kWp"}
SAMPLES = {
    "display": "617.8",
    "figure": "1,729",
    "title": "Strings",
    "heading": "Choose the system voltage",
    "section": "Edges and access",
    "body": "Edge margin (setback) · 1.00 m",
    "strong": "Build this roof",
    "mono": "INV-1 · MPPT 1 · 4 × 29",
    "unit": "kWp · 21 Dec · PDF",
}


def panel(name: str, today: str, v2: str, inner: str, touch: bool) -> str:
    """One part of the specimen: its name, today against V2 in one line each, then the specimen."""
    pad = 16 if touch else 24
    return (
        f'<section style="background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: {RADIUS["card"]}px; '
        f'padding: {pad}px; display: flex; flex-direction: column; gap: 24px; box-sizing: border-box; min-width: 0">'
        f'<div style="display: flex; flex-direction: column; gap: 8px">{text("heading", name, touch, TEXT, "h2")}'
        f'<p style="margin: 0; {style("body", touch, TEXT_2)}"><span style="color: {TEXT_3}">Today</span> {today}</p>'
        f'<p style="margin: 0; {style("body", touch, TEXT)}"><span style="color: {TEXT_3}">V2</span> {v2}</p></div>'
        f'{inner}</section>'
    )


def type_panel(touch: bool) -> str:
    rows = ""
    for role, (family, weight, desk, tch, use) in TYPE.items():
        size, line = tch if touch else desk
        fam = "Bricolage" if "Bricolage" in family else ("Geist Mono" if "Mono" in family else "Geist")
        spec = f"{size} / {line} · {fam} {weight}"
        meta = (f'<div style="display: flex; flex-direction: column; gap: 4px; {"" if touch else "width: 300px; flex: none"}">'
                f'{text("strong", role.capitalize(), touch)}{text("unit", spec, False, TEXT_2)}'
                f'{text("body", use, touch, TEXT_2)}</div>')
        sample = (f'<div style="flex: 1; min-width: 0; display: flex; align-items: center; overflow: hidden">'
                  f'<span style="{style(role, touch)}; white-space: nowrap">{SAMPLES[role]}</span>'
                  + (f'<span style="margin-left: 8px; {style("body", touch, TEXT_2)}">{UNITS[role]}</span>' if role in UNITS else "")
                  + '</div>')
        if touch:
            rows += (f'<div style="display: flex; flex-direction: column; gap: 8px; padding: 16px 0; '
                     f'border-top: 1px solid {LINE_SUBTLE}">{sample}{meta}</div>')
        else:
            rows += (f'<div style="display: flex; gap: 24px; align-items: center; padding: 16px 0; '
                     f'border-top: 1px solid {LINE_SUBTLE}">{meta}{sample}</div>')
    sizes_today = "11 12 13 14 15 16 17 22 26 30 34 44 72 76".split()
    sizes_v2 = ["12", "14", "16", "20", "26", "36", "48", "64"]
    chip = lambda s, on: (f'<span style="display: inline-flex; align-items: center; justify-content: center; min-width: 32px; '
                          f'height: 24px; padding: 0 6px; border-radius: {RADIUS["control"]}px; '
                          f'border: 1px solid {LINE_STRONG if on else LINE}; {style("unit", False, TEXT if on else TEXT_3)}">{s}</span>')
    scale = (f'<div style="display: flex; flex-direction: column; gap: 8px">'
             f'<div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center">{text("unit", "Sizes in use today", False, TEXT_3, "span", "width: 120px")}'
             + "".join(chip(s, False) for s in sizes_today) + '</div>'
             f'<div style="display: flex; flex-wrap: wrap; gap: 4px; align-items: center">{text("unit", "V2", False, TEXT_3, "span", "width: 120px")}'
             + "".join(chip(s, True) for s in sizes_v2) + '</div></div>')
    rules = text("body", "Touch sizes: body 15, title 20, figure 26, display 48. Mono in tables and fields alone; a figure "
                 "in text is Geist with even-width digits. No uppercase, no letter-spacing on labels. 12 is for a unit, "
                 "a tick or a badge, never for words the user must read.", touch, TEXT_2, "p", "max-width: 640px")
    return panel("Type", "14 sizes from 11 to 76; 15 to 18 styles on a lens; 12 px the most used size.",
                 "6 sizes and 2 display sizes, 9 styles, at most 8 on one screen; 14 the floor for reading (15 on touch).",
                 scale + f'<div>{rows}</div>' + rules, touch)


def colour_panel(touch: bool) -> str:
    def swatch(name: str, hexv: str, ratio: str, use: str) -> str:
        return (f'<div style="display: flex; gap: 12px; align-items: flex-start">'
                f'<span style="width: 40px; height: 40px; border-radius: {RADIUS["control"]}px; background: {hexv}; flex: none"></span>'
                f'<div style="display: flex; flex-direction: column; gap: 4px">{text("strong", name, touch)}'
                f'{text("unit", hexv + " · " + ratio, False, TEXT_2)}{text("body", use, touch, TEXT_2)}</div></div>')
    sw = (swatch("Primary text", TEXT, "16.5 : 1", "What the user reads: labels, values, a card's caption, a section's name")
          + swatch("Secondary text", TEXT_2, "8.5 : 1", "What qualifies it: units, sources, hints, a summary's facts")
          + swatch("Tertiary text", TEXT_3, "4.9 : 1", "Placeholders and chart ticks alone"))
    example = (f'<div style="background: {CHROME}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; padding: 16px; '
               f'display: flex; flex-direction: column; gap: 8px">'
               + field("Edge margin (setback)", "1.00", "m", "Usually 0.5 to 1 m", touch, 112)
               + field("Parapet height", "0.90", "m", "", touch, 112) + '</div>')
    return panel("Colour of text", "Secondary grey outnumbers primary text: 80 to 46 on Performance, 48 to 43 on the Roof lens.",
                 "Primary text for what the user reads, secondary for what qualifies it, about 3 to 1. Contrast on surface-1.",
                 f'<div style="display: flex; flex-direction: column; gap: 16px">{sw}</div>' + example, touch)


def spacing_panel(touch: bool) -> str:
    bars = ""
    for name, (px, use) in SPACE.items():
        bars += (f'<div style="display: flex; align-items: center; gap: 12px">'
                 f'<span style="width: 28px; flex: none; text-align: right; {style("mono", False, TEXT)}">{px}</span>'
                 f'<span style="width: 64px; flex: none; display: inline-flex"><span style="width: {px}px; height: 16px; background: {TEXT_2}; opacity: .5; border-radius: 2px"></span></span>'
                 f'{text("body", use, touch, TEXT_2, "span", "min-width: 0")}</div>')

    def group(label_a: str, a: str, label_b: str, b: str, gap: int) -> str:
        return (f'<div style="display: flex; flex-direction: column; gap: {gap}px">'
                + field(label_a, a, "m", "", touch, 96) + field(label_b, b, "m", "", touch, 96) + '</div>')

    v2 = (f'<div style="display: flex; flex-direction: column; gap: 40px">'
          f'<div style="display: flex; flex-direction: column; gap: 24px">'
          + text("section", "Edges and access", touch)
          + group("Parapet height", "0.90", "Edge margin (setback)", "1.00", 8)
          + group("Walkway width", "0.60", "Clearance round obstacles", "0.50", 8)
          + '</div>' + text("section", "Obstacles · 6", touch) + '</div>')
    note = text("body", "8 inside a group, 24 between groups, 40 between sections: each gap three times the one inside it, "
                "so a group reads as one thing.", touch, TEXT_2, "p")
    demo = (f'<div style="background: {CHROME}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; padding: 24px; '
            f'max-width: 400px; box-sizing: border-box">{v2}</div>')
    return panel("Spacing", "17 steps from 2 to 64; in the inspectors gaps of 2, 6, 10 and 22, sections 22 apart, rows 12.",
                 "7 steps on a base of 4: 4, 8, 12, 16, 24, 40, 64.",
                 f'<div style="display: flex; flex-direction: column; gap: 8px">{bars}</div>' + demo + note, touch)


def heights_panel(touch: bool) -> str:
    def ruler(h: int) -> str:
        return (f'<span style="display: inline-flex; align-items: center; gap: 8px; width: 64px; flex: none">'
                f'<span style="width: 1px; height: {h}px; background: {LINE_STRONG}"></span>'
                f'{text("mono", str(h), False, TEXT_2)}</span>')

    def row(role: str, use: str, controls: str) -> str:
        h = HEIGHT[role][1 if touch else 0]
        return (f'<div style="display: flex; flex-direction: column; gap: 12px; padding: 16px 0; border-top: 1px solid {LINE_SUBTLE}">'
                f'<div style="display: flex; gap: 8px; align-items: baseline">{text("strong", role.capitalize(), touch)}'
                f'{text("body", use, touch, TEXT_2)}</div>'
                f'<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap">{ruler(h)}{controls}</div></div>')

    fit = button("Fit", "secondary", "compact", touch)
    seg_small = (segmented(["3D", "Plan"], 0, touch) if touch else
                 f'<span style="display: inline-flex; padding: 3px; height: 32px; box-sizing: border-box; background: {WELL}; '
                 f'border: 1px solid {LINE}; border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_WELL}">'
                 f'<span style="height: 24px; padding: 0 10px; display: inline-flex; align-items: center; border-radius: 5px; '
                 f'background: {CONTROL_ACTIVE}; {style("strong", False)}">3D</span>'
                 f'<span style="height: 24px; padding: 0 10px; display: inline-flex; align-items: center; {style("body", False, TEXT_2)}">Plan</span></span>')
    compact = fit + seg_small + button("Copy", "quiet", "compact", touch)
    standard = (button("Change", "secondary", "standard", touch) + segmented(["Portrait", "Landscape"], 0, touch)
                + f'<span style="display: inline-flex; align-items: center; gap: 6px; height: {44 if touch else 40}px; '
                  f'padding: 0 12px; box-sizing: border-box; background: {WELL}; border: 1px solid {LINE_STRONG}; '
                  f'border-radius: {RADIUS["control"]}px; box-shadow: {SHADOW_WELL}">{text("mono", "1.00", touch)}{text("unit", "m", False, TEXT_2)}</span>')
    primary = button("Build this roof · 3,600 m²", "primary", "primary", touch)
    rows = (row("compact", "Tables and the stage's floating controls" if not touch else "Never under 44 on touch", compact)
            + row("standard", "Every other control: buttons, fields, segments, the top bar's items", standard)
            + row("primary", "The one primary action, at the foot of the work column", primary))
    sizes = "26, 30, 32, 36, 38, 40, 44, 46, 52, 56" if not touch else "26, 30, 36, 44, 56 on touch"
    return panel("Control heights", f"11 heights on one screen ({sizes}); the top bar holds 32, 36 and 40 in one row.",
                 "Three: 32, 40 and 48 on desktop; 44, 44 and 48 on touch. One row, one height.", rows, touch)


def radius_panel(touch: bool) -> str:
    nest = (f'<div style="background: {CHROME}; border: 1px solid {LINE}; border-radius: 24px; padding: 16px; max-width: 360px">'
            f'{text("unit", "Panel 24", False, TEXT_2)}'
            f'<div style="margin-top: 8px; background: {SURFACE_1}; border: 1px solid {LINE}; border-radius: 16px; padding: 4px">'
            f'<div style="background: {SURFACE_2}; border-radius: 12px; padding: 4px; display: flex; align-items: center; gap: 8px">'
            f'<span style="height: 32px; padding: 0 12px; display: inline-flex; align-items: center; border-radius: 8px; '
            f'background: {CONTROL_ACTIVE}; {style("strong", touch)}">Control 8</span>{text("unit", "in a row of 12, in a card of 16", False, TEXT_2)}'
            f'</div></div></div>')
    rule = text("body", "Inside one another, the inner radius is the outer one less the padding between them: a control of 8 "
                "in a row of 12 with 4 between. Pills, switches and round buttons stay full.", touch, TEXT_2, "p")
    return panel("Radius", "13 radii: 3, 4, 6, 7, 8, 9, 10, 12, 14, 16, 18, 22 and full.",
                 "4 and full: control 8, row 12, card 16, panel 24.", nest + rule, touch)


def accent_panel(touch: bool) -> str:
    def use(label: str, thing: str) -> str:
        return (f'<div style="display: flex; flex-direction: column; gap: 8px; min-width: 0; align-items: flex-start">{thing}'
                f'{text("body", label, touch, TEXT_2)}</div>')

    option = (f'<div style="display: flex; align-items: center; gap: 12px; height: {64 if touch else 56}px; padding: 0 12px; '
              f'border-radius: {RADIUS["row"]}px; background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; '
              f'box-shadow: {HALO_SELECTED}; box-sizing: border-box; width: 240px">'
              f'<span style="width: 24px; height: 24px; border-radius: 6px; background: {ACCENT}; color: {ACCENT_INK}; '
              f'display: inline-flex; align-items: center; justify-content: center; {style("strong", False, ACCENT_INK)}">A</span>'
              f'{text("strong", "Recommended", touch)}<span style="margin-left: auto">{mark("fits", 16)}</span></div>')
    note = (f'<div style="display: flex; align-items: center; gap: 8px; height: 40px">{mark("note", 18)}'
            f'{text("strong", "Voc coefficient outside the usual range", touch)}</div>')
    focus = (f'<span style="display: inline-flex; align-items: center; gap: 6px; height: {44 if touch else 40}px; width: 112px; '
             f'justify-content: flex-end; padding: 0 12px; box-sizing: border-box; background: {WELL}; border: 1px solid {ACCENT}; '
             f'border-radius: {RADIUS["control"]}px; box-shadow: {HALO_FOCUS}">{text("mono", "1.00", touch)}{text("unit", "m", False, TEXT_2)}</span>')
    sun = (f'<span style="display: inline-flex; width: 40px; height: 40px; align-items: center; justify-content: center">'
           f'<span style="width: 18px; height: 18px; border-radius: 50%; background: #FFD36B; box-shadow: 0 0 0 4px {ACCENT}, 0 0 16px 4px rgba(255,176,32,.45)"></span></span>')
    yes = (f'<div style="display: grid; grid-template-columns: {"1fr" if touch else "repeat(3, minmax(0, 1fr))"}; gap: 24px">'
           + use("The one primary action of the screen", button("Build this roof", "primary", "primary", touch))
           + use("The selection: an option, an object on the roof", option)
           + use("A note: something outside the usual, with its fix", note)
           + use("The focus ring", focus)
           + use("The sun, on the Sun lens alone", sun) + '</div>')

    heading_today = (f'<span style="font-family: Geist, sans-serif; font-weight: 600; font-size: 12px; letter-spacing: .06em; '
                     f'text-transform: uppercase; color: {ACCENT}; text-shadow: 0 4px 6px rgba(255,176,32,.4), 0 6px 14px rgba(255,176,32,.22)">Edges and access</span>')
    disc_today = (f'<span style="width: 20px; height: 20px; border-radius: 50%; border: 1px solid {ACCENT}; color: {ACCENT}; '
                  f'display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600">?</span>')

    def swap(label: str, before: str, after: str) -> str:
        return (f'<div style="display: flex; align-items: center; gap: 16px; padding: 12px 0; border-top: 1px solid {LINE_SUBTLE}; flex-wrap: wrap">'
                f'<span style="width: {"100%" if touch else "200px"}; flex: none">{text("body", label, touch, TEXT_2)}</span>'
                f'<span style="min-width: {120 if touch else 160}px; display: inline-flex; align-items: center; gap: 8px">{before}</span>'
                f'{icon(ICON["arrow-right"], 16, TEXT_3)}<span style="display: inline-flex; align-items: center; gap: 8px">{after}</span></div>')
    no = (text("section", "The accent leaves", touch, TEXT, "h3", "margin-top: 8px")
          + swap("A section's name", heading_today, text("section", "Edges and access", touch))
          + swap("The help disc", disc_today, help_disc(False))
          + swap("Add, Edit and Change", button("Add", "secondary", "compact", False, extra=f"color: {ACCENT}; border-color: {ACCENT}"),
                 button("Add", "secondary", "compact", False))
          + swap("Export in the top bar", button("Export", "primary", "compact", False),
                 text("body", "A button of Handover, not of the top bar", touch, TEXT_2))
          + swap("The time's track", f'<span style="width: 120px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, {ACCENT} 55%, {LINE_STRONG} 55%)"></span>',
                 f'<span style="width: 120px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></span>'))
    return panel("The accent", "On 15 to 19 things per lens: five glowing section names, the discs, Export, Play, the time's fill, Add.",
                 "On 3 to 5 things per screen, and nothing else glows but the primary and the sun.",
                 yes + f'<div>{no}</div>', touch)


def density_panel(touch: bool) -> str:
    def meter(label: str, value: float, budget: float, scale: float) -> str:
        w = 280 if touch else 360
        fill = min(value / scale, 1) * w
        b = budget / scale * w
        over = value > budget
        return (f'<div style="display: flex; flex-direction: column; gap: 8px">'
                f'<div style="display: flex; justify-content: space-between; gap: 8px">{text("body", label, touch)}'
                f'{text("mono", f"{value:.1f}", touch, TEXT if not over else ACCENT)}</div>'
                f'<span style="position: relative; display: block; width: {w}px; height: 8px; border-radius: 4px; background: {WELL}">'
                f'<span style="position: absolute; left: 0; top: 0; height: 8px; width: {fill:.0f}px; border-radius: 4px; '
                f'background: {TEXT_2 if not over else ACCENT}; opacity: .8"></span>'
                f'<span style="position: absolute; left: {b:.0f}px; top: -4px; width: 2px; height: 16px; background: {TEXT}"></span></span></div>')
    budget = 4 if touch else 2
    scale = 12 if touch else 6
    meters = (meter("Roof lens, today", 1.4 if not touch else 8.8, budget, scale)
              + meter("Strings lens, today", 4.6 if not touch else 10.8, budget, scale)
              + meter("Strings lens, V2: options open, the rest as summaries", 1.9 if not touch else 3.6, budget, scale))
    rows = (summary_row("Inverter", "WattPower WP-330KTL-H1 · 275 kW · 6 MPPT", touch)
            + summary_row("System voltage", "1500 V · Your choice", touch)
            + summary_row("Sizing temperatures", "From the weather · 11.9 °C to 64.3 °C", touch)
            + summary_row("MPPT loading", "4, 4, 4, 4, 3, 3 strings · within limits", touch))
    how = (f'<div style="background: {CHROME}; border: 1px solid {LINE}; border-radius: {RADIUS["row"]}px; padding: 0 16px; '
           f'max-width: 440px">{rows}</div>')
    words = text("body", f"Characters per 1,000 px² at first view. The line is the budget: {budget} on {'touch' if touch else 'desktop'}. "
                 "A section the step does not need is one line of facts that opens; a proof is behind Why.",
                 touch, TEXT_2, "p", "max-width: 560px")
    return panel("Density", "The Strings inspector holds 4.6 characters per 1,000 px², three times the Roof's; Handover's preview 0.56.",
                 f"A budget per region, {budget} on {'touch' if touch else 'desktop'}, met by summaries that open and proofs behind disclosures.",
                 f'<div style="display: flex; flex-direction: column; gap: 16px">{meters}</div>' + words + how, touch)


def rules_panel(touch: bool) -> str:
    rows = [
        ("design-tokens.md · Type styles", "22 styles, 11 to 76 px", "9 styles on 6 sizes and 2 display sizes", "V2-109, V2-112"),
        ("design-tokens.md · Spacing", "17 steps from 2", "7 steps from 4; 8, 24, 40 for group, groups, sections", "V2-107"),
        ("design-tokens.md · Radius", "13 radii", "4 and full; inner = outer less padding", "V2-120"),
        ("components.md · Buttons", "26 to 56 high", "32, 40, 48; 44 at least on touch; one primary per screen", "V2-105, V2-106"),
        ("guidelines.md · Visual language", "Numbers in Geist Mono", "Mono in tables and fields; figures in text in Geist", "V2-67, V2-112"),
        ("guidelines.md · Writing", "Section labels uppercase", "Sentence case, no uppercase anywhere", "V2-112"),
        ("D76 · Section headings", "The accent, 600, a glow under the words", "Primary text, 16, 600, no glow (D76's first ask: bold, primary colour)", "V2-65, V2-110"),
        ("D80 · The help disc", "An accent ring on every heading", "The line colour; the accent only while its sheet is open", "V2-84, V2-110"),
    ]
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
                          f'<td style="padding: 12px 12px 12px 0; {style("strong", False)}; vertical-align: top">{a}</td>'
                          f'<td style="padding: 12px 12px 12px 0; {style("body", False, TEXT_2)}; vertical-align: top">{b}</td>'
                          f'<td style="padding: 12px 12px 12px 0; {style("body", False)}; vertical-align: top">{c}</td>'
                          f'<td style="padding: 12px 0; {style("unit", False, TEXT_2)}; vertical-align: top; white-space: nowrap">{d}</td></tr>'
                          for a, b, c, d in rows) + '</tbody></table>')
    kept = text("body", "Kept: the colours of Dusk, the three families, one accent, three levels of depth, ticks and notes "
                "and never a red cross, 15 on touch and 14 on desktop for body text.", touch, TEXT_2, "p")
    return panel("Rules this board changes", "The tokens, the components and the guidelines as approved.",
                 "Each row changes in the documents when the board is approved.", body + kept, touch)


def build(file: str, title: str, width: int, height: int, touch: bool, columns: int) -> None:
    side = 16 if width < 640 else (20 if width < 1100 else 40)
    head = board_head("V2 · Principles", LINES, touch, ISSUES)
    parts = [type_panel(touch), colour_panel(touch), spacing_panel(touch), heights_panel(touch), radius_panel(touch),
             accent_panel(touch), density_panel(touch), rules_panel(touch)]
    if columns == 2:
        left = parts[0] + parts[1] + parts[4]
        right = parts[2] + parts[3] + parts[6]
        grid = (f'<div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: start">'
                f'<div style="display: flex; flex-direction: column; gap: 24px">{left}</div>'
                f'<div style="display: flex; flex-direction: column; gap: 24px">{right}</div></div>'
                + parts[5] + parts[7])
    else:
        grid = "".join(parts)
    body = (f'<div style="padding: 40px {side}px; display: flex; flex-direction: column; gap: 24px">{head}{grid}</div>')
    write_board(OUT, file, title, width, height, body)


if __name__ == "__main__":
    build("V2Principles.dc.html", "V2 · Principles · desktop 1440", 1440, 3920, False, 2)
    build("V2PrinciplesTablet.dc.html", "V2 · Principles · tablet 834", 834, 7170, True, 1)
    build("V2PrinciplesPhone.dc.html", "V2 · Principles · phone 390", 390, 8930, True, 1)
