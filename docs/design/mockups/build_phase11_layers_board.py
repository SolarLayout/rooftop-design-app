"""Writes the board of Phase 11, step 35 (plan/phase-11-plan.md, decision 22): StageLayers.dc.html, "Stage, Layers".

The Layers button of the information architecture ("The ground under the building is satellite imagery when the project
has a location, or a plain dark grid. The Layers button switches between them in any lens") drawn where it lives: in the
view controls of the stage, beside Fit and the north button, an icon button of the same size and look. Pressed, it opens a
small floating panel titled "Layers" with one switch, "Satellite imagery", on by default. Off, the ground is the plain
grid of the 3D palette and the imagery's attribution goes with the imagery.

Drawn: the Studio on desktop 1440 by 900 whole, in the Array lens, the panel open and the imagery on (the approved Main
board with the imagery drawn under the building, as the stage shows it since Phase 5); the states of the button (rest,
hover, focus, open); a part of the desktop stage with the switch off and the plain grid; the tablet stage of 834 by 508
and the phone stage of 390 by 252, each with the button where its view controls are and the panel open.

The desktop, tablet and phone stages are the approved boards' own (Main, StudioTablet, StudioPhone), changed in three
places each: the Layers button after the view controls, the panel under it, and the ground. The imagery under the 3D is
the illustration of the Find boards (build_phase4_boards.imagery), laid on the ground plane of the 3D by the same
projection the boards use for everything else, so that the picture and the roof agree. Every colour is a token of
docs/design/design-tokens.md, by way of the constants of the earlier builders.

Run it in this folder: python3 build_phase11_layers_board.py
It is kept so that the board can be written again; it is not part of the product.
"""

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    CONTROL,
    DISPLAY,
    GROUND,
    HERE,
    LINE,
    LINE_HOVER,
    LINE_STRONG,
    LINE_SUBTLE,
    SHADOW_FLOAT,
    SHADOW_RAISED,
    SURFACE_1,
    TEXT,
    TEXT_2,
    TEXT_3,
    card,
    state,
)
from build_phase4_boards import imagery

from build_phase5_roof_boards import frame, piece
from build_phase6_state_boards import frame_crop, notes, two_columns
from build_phase6_sun_boards import SHADOW_KNOB, SHADOW_TRACK

MAIN = (HERE / "Main.dc.html").read_text(encoding="utf-8")
TABLET = (HERE / "StudioTablet.dc.html").read_text(encoding="utf-8")
PHONE = (HERE / "StudioPhone.dc.html").read_text(encoding="utf-8")

# Tokens this file needs beyond the earlier builders'.
CONTROL_HOVER = "#1B212B"  # --color-control-hover
CONTROL_PRESSED = "#10141A"  # --color-control-pressed
TEXT_ON_IMAGERY = "#D5DAE2"  # --color-text-on-imagery
SHADOW_RAISED_HOVER = "inset 0 1px 0 rgba(255,255,255,0.09), 0 2px 4px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.35)"
SHADOW_PRESSED = "inset 0 2px 4px rgba(0,0,0,0.5)"
SHADOW_TEXT_ON_IMAGERY = "text-shadow: 0 1px 3px rgba(0,0,0,0.9)"
RING_FOCUS = "outline: 2px solid #FFB020; outline-offset: 2px"

SCREEN_W, SCREEN_H = 1440, 900
BOARD_HEIGHT = 3939  # as high as what is on it, measured from a render

# The words.
NAME = "Layers"
SWITCH = "Satellite imagery"
HINT = "Off: the plain grid"
# The attribution the stage carries wherever the imagery is shown (apps/web/lib/map/esri.ts, IMAGERY_ATTRIBUTION).
ATTRIBUTION = "Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community"

# The icon of stacked layers: three sheets seen from above, the top one closed, 20 in a button of 38 (22 in one of 44).
LAYERS = '<path d="m12 3.5 8.5 4.25L12 12 3.5 7.75z"/><path d="m3.5 12 8.5 4.25 8.5-4.25"/><path d="m3.5 16.25 8.5 4.25 8.5-4.25"/>'

# The ground of the approved Studio boards: the grid on the ground plane, 6 m under the roof, in the boards' projection.
GROUND_GROUP = '<g transform="matrix(8.154 -2.187 -3.807 -4.680 180 514.23)">'
GRID_RECT = '<rect x="-60" y="-40" width="220" height="140" fill="url(#grid)"/>'
GROUND_RECT = (-60, -40, 220, 140)


# --------------------------------------------------------------------------------------------------
# The pieces: the button, the panel, the ground, the attribution
# --------------------------------------------------------------------------------------------------


def layers_icon(size: int, colour: str) -> str:
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="2" '
        f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{LAYERS}</svg>'
    )


def layers_button(look: str = "rest", touch: bool = False) -> str:
    """The Layers button as the north button is drawn: a secondary icon button of 38 on desktop (44 on touch), control
    with the line, radius-control (radius-row on touch), shadow-raised, the icon in text-2. Hover: control-hover, the
    line-hover, raised by 1, shadow-raised-hover, the icon in text. Focus: the ring. Open: control-pressed, the
    line-strong, shadow-pressed, the icon in text, aria-expanded."""
    side, radius, size = (44, 12, 22) if touch else (38, 10, 20)
    surface = {
        "rest": f"background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}",
        "hover": f"background: {CONTROL_HOVER}; border: 1px solid {LINE_HOVER}; box-shadow: {SHADOW_RAISED_HOVER}; transform: translateY(-1px)",
        "focus": f"background: {CONTROL}; border: 1px solid {LINE}; box-shadow: {SHADOW_RAISED}; {RING_FOCUS}",
        "open": f"background: {CONTROL_PRESSED}; border: 1px solid {LINE_STRONG}; box-shadow: {SHADOW_PRESSED}",
    }[look]
    colour = TEXT_2 if look in ("rest", "focus") else TEXT
    expanded = ' aria-expanded="true"' if look == "open" else ' aria-expanded="false"'
    return (
        f'<button aria-label="{NAME}" aria-haspopup="dialog"{expanded} style="position: relative; flex-shrink: 0; width: {side}px; height: {side}px; display: flex; '
        f'align-items: center; justify-content: center; border-radius: {radius}px; cursor: pointer; {surface}">{layers_icon(size, colour)}</button>'
    )


def switch(on: bool, touch: bool = False) -> str:
    """The switch of components.md: 44 by 26, knob 20 inset 3; on touch a track of 52 by 30 with a knob of 24 in a hit
    area of 52 by 44. On: accent track, knob accent-ink. Off: line-strong track, knob text-2."""
    track, knob = (ACCENT, ACCENT_INK) if on else (LINE_STRONG, TEXT_2)
    side = "flex-end" if on else "flex-start"
    checked = "true" if on else "false"
    if touch:
        return (
            f'<button role="switch" aria-checked="{checked}" aria-label="{SWITCH}" style="width: 52px; height: 44px; flex-shrink: 0; padding: 7px 0; display: flex; align-items: center; background: transparent; border: 0; cursor: pointer">'
            f'<span style="width: 52px; height: 30px; box-sizing: border-box; padding: 3px; display: flex; justify-content: {side}; background: {track}; border-radius: 15px; box-shadow: {SHADOW_TRACK}">'
            f'<span style="width: 24px; height: 24px; border-radius: 50%; background: {knob}; box-shadow: {SHADOW_KNOB}"></span></span></button>'
        )
    return (
        f'<button role="switch" aria-checked="{checked}" aria-label="{SWITCH}" style="width: 44px; height: 26px; flex-shrink: 0; padding: 3px; display: flex; '
        f'justify-content: {side}; background: {track}; border: 0; border-radius: 13px; cursor: pointer; box-shadow: {SHADOW_TRACK}">'
        f'<span style="width: 20px; height: 20px; border-radius: 50%; background: {knob}; box-shadow: {SHADOW_KNOB}"></span></button>'
    )


def layers_panel(on: bool, touch: bool = False, under: int = 38, floating_: bool = True) -> str:
    """The panel of the Layers button: the FloatingPanel of the Select and the project switcher at the width of a card's
    menu (240), surface-1, border line-strong, radius-card-s, shadow-float, padding 6; 6 under the button, their right
    edges in line so that it stays on the stage. The title "Layers" is a section label; the one row is the switch beside
    its label and its hint, 44 high (48 on touch)."""
    label = f"padding: 8px 10px 4px; font-size: 12px; line-height: 20px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: {TEXT_3}"
    body, hint = (15, 13) if touch else (14, 12)
    row_h = 48 if touch else 44
    place = f"position: absolute; right: 0; top: {under + 6}px; z-index: 2; " if floating_ else ""
    return (
        f'<div role="dialog" aria-label="{NAME}" style="{place}width: 240px; box-sizing: border-box; display: flex; flex-direction: column; padding: 6px; '
        f'background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}; color: {TEXT}; font-size: {body}px; line-height: 20px; text-align: left">'
        f'<div style="{label}">{NAME}</div>'
        f'<div style="display: flex; align-items: center; gap: 12px; min-height: {row_h}px; box-sizing: border-box; padding: 2px 10px 6px">'
        f'<div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><span>{SWITCH}</span>'
        f'<span style="font-size: {hint}px; line-height: 16px; color: {TEXT_3}">{HINT}</span></div>{switch(on, touch)}</div></div>'
    )


def ground_imagery(tag: str) -> str:
    """The imagery of the Find boards laid on the ground plane of the 3D: the drawing in metres (x east, y north, the roof
    of 90 by 40 at the origin) goes into the boards' ground group as it is, clipped to the rect the grid filled, with the
    grain over it. The vignette of the stage stays over the ground, as on every board."""
    picture = imagery(1, 1, 1, 0, 0, roof=False)
    start = '<g transform="matrix(1 0 0 -1 0 0)">'
    a = picture.index(start)
    b = picture.index('<rect width="1" height="1" filter=')
    inside = picture[a + len(start) : b]
    assert inside.endswith("</g>"), "the drawing of the imagery is not where it was"
    x, y, w, h = GROUND_RECT
    return (
        f'<g clip-path="url(#ground-{tag})">{inside[: -len("</g>")]}'
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" filter="url(#grain-{tag})" opacity="0.8"/></g>'
    )


def ground_defs(tag: str) -> str:
    x, y, w, h = GROUND_RECT
    # The grain of the Find boards is per pixel; the ground group is in metres, about 8 px each, so the frequency is 8 times.
    return (
        f'<clipPath id="ground-{tag}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>'
        f'<filter id="grain-{tag}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="6.8" numOctaves="2" seed="7"/>'
        '<feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0.55 -0.12"/></filter>'
    )


def with_ground(html: str, tag: str, on: bool) -> str:
    """The approved stage with the imagery under the building (on), or as it is: the grid of the plain ground (off)."""
    assert html.count(GROUND_GROUP + GRID_RECT) == 1, "the ground of the board is not where it was"
    if not on:
        return html
    html = html.replace("<defs>", "<defs>" + ground_defs(tag), 1)
    return html.replace(GROUND_GROUP + GRID_RECT, GROUND_GROUP + ground_imagery(tag), 1)


def attribution(left: int, bottom: int) -> str:
    """The attribution as the stage shows it (Stage.tsx): text-label-s in text-on-imagery with its shadow, at the bottom
    left, cut short with an ellipsis where the stage is narrower than it."""
    return (
        f'<p style="position: absolute; left: {left}px; right: 0; bottom: {bottom}px; z-index: 1; margin: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; '
        f'font-size: 11px; line-height: 20px; color: {TEXT_ON_IMAGERY}; {SHADOW_TEXT_ON_IMAGERY}; pointer-events: none">{ATTRIBUTION}</p>'
    )


def after_north(html: str, added: str) -> str:
    """The Layers button and its panel after the north button of the view controls."""
    a = html.index('aria-label="North up"')
    b = html.index("</button>", a) + len("</button>")
    return html[:b] + added + html[b:]


# --------------------------------------------------------------------------------------------------
# The three stages
# --------------------------------------------------------------------------------------------------


def desktop_screen(on: bool, tag: str, panel: bool = True) -> str:
    """The approved Studio of the Array lens on desktop 1440 by 900, the Layers button after the north button, its panel
    open, the ground as the switch has it, the attribution with the imagery."""
    root = piece(MAIN, '<div style="width: 1440px; height: 900px', "</x-dc>", keep_end=False)
    root = root.replace('<svg viewBox="0 50 940 480" width="964" height="492" role="img" aria-label="', f'<svg viewBox="0 50 940 480" width="964" height="492" role="img" aria-label="{tag}: ', 1)
    root = with_ground(root, tag, on)
    added = layers_button("open" if panel else "rest") + (layers_panel(on) if panel else "")
    root = after_north(root, added)
    # The view controls' container is positioned, so that the panel hangs from it.
    root = root.replace('<div style="position: absolute; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">', '<div style="position: absolute; z-index: 2; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">', 1)
    if on:
        root = root.replace("</main>", attribution(24, 6) + "</main>", 1)
    return root


def desktop_whole() -> str:
    return (
        f'<div aria-label="Studio, Array lens, desktop 1440 by 900: the Layers panel open, the imagery on" style="position: relative; width: {SCREEN_W}px; height: {SCREEN_H}px; flex-shrink: 0; overflow: hidden">'
        + desktop_screen(True, "whole")
        + "</div>"
    )


def desktop_part(on: bool, tag: str, width: int = 984, height: int = 560) -> str:
    """The stage of the desktop screen alone: the main of 984 by 844 between the rail and the inspector, its top."""
    return frame_crop(width, height, f'<div style="position: absolute; left: -72px; top: -56px; width: {SCREEN_W}px; height: {SCREEN_H}px">{desktop_screen(on, tag)}</div>')


def tablet_stage(on: bool, tag: str) -> str:
    """The stage of the approved tablet board, 834 by 508: the lens switch at the left; at the right the view controls of
    the tablet (ViewControls from tablet up, as the information architecture has them): 3D or Plan at 44, Fit 44, the
    north button 44, Layers 44, 8 apart; the panel under Layers; the attribution 20 from the left, 4 from the bottom."""
    main = piece(TABLET, "<main", "</main>")
    main = main.replace('role="img" aria-label="', f'role="img" aria-label="{tag}: ', 1)
    main = with_ground(main, tag, on)
    # The time pill stands 28 over the stage's bottom on tablet, so that the attribution under it stays clear (Stage.tsx); the approved board drew 16.
    pill = '<div style="position: absolute; left: 20px; bottom: 16px; display: flex; align-items: center; gap: 12px; height: 48px;'
    assert main.count(pill) == 1, "the time pill of the tablet board is not where it was"
    main = main.replace(pill, pill.replace("bottom: 16px", "bottom: 28px"), 1)
    segmented_start = '<div style="position: absolute; right: 20px; top: 16px; display: flex; gap: 2px; padding: 4px;'
    a = main.index(segmented_start)
    b = main.index("</div>", a) + len("</div>")
    segmented = main[a:b].replace("position: absolute; right: 20px; top: 16px; ", "", 1)
    raised = f"background: {CONTROL}; border: 1px solid {LINE}; border-radius: 12px; cursor: pointer; box-shadow: {SHADOW_RAISED}"
    fit = f'<button style="flex-shrink: 0; height: 44px; padding: 0 14px; font-size: 15px; font-weight: 500; color: {TEXT}; {raised}">Fit</button>'
    north = (
        f'<button aria-label="North up" style="flex-shrink: 0; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; {raised}">'
        f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g transform="rotate(25 12 12)"><path d="M12 2.5 15 9H9z" fill="{ACCENT}"/>'
        f'<path d="M9.5 19v-7l5 7v-7" stroke="{TEXT}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></g></svg></button>'
    )
    controls = (
        '<div style="position: absolute; z-index: 2; right: 20px; top: 16px; display: flex; align-items: center; gap: 8px">'
        + segmented
        + fit
        + north
        + layers_button("open", touch=True)
        + layers_panel(on, touch=True, under=44)
        + "</div>"
    )
    main = main[:a] + controls + main[b:]
    if on:
        main = main.replace("</main>", attribution(20, 4) + "</main>", 1)
    return frame_crop(834, 508, main)


def phone_stage(on: bool, tag: str) -> str:
    """The stage of the approved phone board, 390 by 252: 3D or Plan at the top right (44 high, no Fit and no north), and
    Layers beside it, 44 square, 8 apart; the panel under Layers, its right edge 12 from the screen's; the attribution
    16 from the left, 4 from the bottom, cut short with an ellipsis."""
    main = piece(PHONE, "<main", "</main>")
    main = main.replace('role="img" aria-label="', f'role="img" aria-label="{tag}: ', 1)
    main = with_ground(main, tag, on)
    segmented_start = '<div style="position: absolute; right: 12px; top: 4px; display: flex; gap: 2px; padding: 3px;'
    a = main.index(segmented_start)
    b = main.index("</div>", a) + len("</div>")
    segmented = main[a:b].replace("position: absolute; right: 12px; top: 4px; ", "", 1)
    controls = (
        '<div style="position: absolute; z-index: 2; right: 12px; top: 4px; display: flex; align-items: center; gap: 8px">'
        + segmented
        + layers_button("open", touch=True)
        + layers_panel(on, touch=True, under=44)
        + "</div>"
    )
    main = main[:a] + controls + main[b:]
    if on:
        main = main.replace("</main>", attribution(16, 4) + "</main>", 1)
    return frame_crop(390, 252, main)


# --------------------------------------------------------------------------------------------------
# The cards
# --------------------------------------------------------------------------------------------------


def controls_row(look: str) -> str:
    """The view controls of the desktop stage with the Layers button in one state, as a strip of the stage's ground."""
    controls = piece(MAIN, '<div style="position: absolute; right: 20px; top: 20px; display: flex; align-items: center; gap: 8px">', "</div>\n\n")
    controls = controls.replace("position: absolute; right: 20px; top: 20px; ", "position: relative; ", 1)
    controls = after_north(controls, layers_button(look))
    return (
        f'<div style="position: relative; height: 78px; box-sizing: border-box; display: flex; align-items: center; justify-content: flex-end; padding: 20px; '
        f'background: {GROUND}; border: 1px solid {LINE}; border-radius: 12px">{controls}</div>'
    )


def button_card() -> str:
    row = (
        '<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">'
        + state("Rest: control, the line, shadow-raised, the icon in text-2", controls_row("rest"))
        + state("Hover: control-hover, the line-hover, raised by 1, shadow-raised-hover, the icon in text", controls_row("hover"))
        + state("Focus: the ring of 2 in accent, 2 from the button", controls_row("focus"))
        + state("Open: control-pressed, the line-strong, shadow-pressed, the icon in text; aria-expanded", controls_row("open"))
        + "</div>"
    )
    words = notes(
        "The Layers button is the fourth control of the view, after Fit and the north button, 8 from it: a secondary icon button of 38 (44 on tablet and phone), control with the line, "
        "radius-control (radius-row on touch), shadow-raised, as the north button beside it; the icon is three stacked sheets, 20 (22 on touch), stroke 2, in text-2. Its name is “Layers”; "
        "it has no word on the stage, as the north button has none.",
        "Its states are the icon button's (components.md, “Buttons”): hover raised by 1 with shadow-raised-hover and the icon in text; pressed lowered by 1; the focus ring; open, it looks pressed and "
        "stays so while the panel is open (aria-expanded), as the trigger of a Select does. It has no disabled state: the switch inside can always be turned. The button looks the same whether the "
        "imagery is on or off: the ground under the roof says which.",
        "In any lens: the button is of the stage and comes with it, as the view controls and the time control do (components.md, “Top bar and navigation”). What it sets is of the view, not of the "
        "design, kept in the view store: a project file carries no ground.",
    )
    return card("The button and its states", row + words, gap=14)


def panel_card() -> str:
    on = frame_crop(420, 176, f'<div style="position: absolute; right: 20px; top: 20px; z-index: 2; display: flex; align-items: center; gap: 8px">{layers_button("open")}{layers_panel(True)}</div>')
    off = frame_crop(420, 176, f'<div style="position: absolute; right: 20px; top: 20px; z-index: 2; display: flex; align-items: center; gap: 8px">{layers_button("open")}{layers_panel(False)}</div>')
    touch = frame_crop(420, 190, f'<div style="position: absolute; right: 20px; top: 16px; z-index: 2; display: flex; align-items: center; gap: 8px">{layers_button("open", touch=True)}{layers_panel(True, touch=True, under=44)}</div>')
    row = (
        '<div style="display: grid; grid-template-columns: repeat(3, 420px); gap: 16px">'
        + state("Open, the switch on, as the stage first opens with a located project", on)
        + state("The switch off: the ground is the plain grid", off)
        + state("On tablet and phone: the row 48 high, the switch 52 by 30 in a hit area of 52 by 44", touch)
        + "</div>"
    )
    words = notes(
        "The panel is the FloatingPanel of the Select and the project switcher at the width of a card's menu, 240: surface-1, border line-strong, radius-card-s, shadow-float, padding 6; it stands 6 under "
        "the button with their right edges in line, so that it stays on the stage (the panel of a Select has its left edge on its trigger's; here the trigger is at the stage's right edge, and "
        "place-floating keeps the panel on the screen).",
        "Its title, “Layers”, is a section label (text-section, text-3). Its one row is the switch of components.md beside its label, “Satellite imagery”, in body text, and one line of hint in "
        "text-caption text-3, “Off: the plain grid”: what the other position gives, as the switches of the inspector say it (“Off: positions shaded inside the window stay empty”). Nothing else is in "
        "it; a second layer, when there is one, is a second row.",
        "Open, the focus is on the switch; the space bar turns it. Escape, a press on the button and a press beside the panel close it, and the focus goes back to the button. The switch takes effect "
        "at once: the ground changes under the roof while the panel is open, so that the choice is seen. The panel's motion is duration-panel; under reduced motion it cuts.",
        "On tablet and phone the panel stays a floating panel of the stage, not a bottom sheet: it is one switch, and the ground it changes must stay in sight while it is turned; a sheet would cover "
        "the inspector's sheet on phone and the vitals on tablet. The row is 48 high and the switch takes the touch sizes of the kit, 52 by 30 in a hit area of 52 by 44.",
    )
    return card("The panel", row + words, gap=14)


def off_card() -> str:
    part = desktop_part(False, "off")
    words = notes(
        "The switch off: the ground under the building is the plain ground of the 3D palette, groundPlain with a gridLine every 10 m, as the stage draws it before the imagery's tiles come and "
        "where the project has no location (Ground.tsx), and as the approved Studio boards draw it. The building, its shadow on the ground and the vignette of the stage stay as they are; the "
        "imagery alone goes.",
        "The attribution goes with the imagery: it stands under the 3D only while the imagery is shown (guidelines.md, “3D scene”: satellite imagery carries its attribution wherever it is shown). "
        "Off, the stage's bottom left is empty.",
        "Where the project has no location, or there is no map key, the ground is the plain grid whatever the switch says: the switch stays on and the panel says nothing more, since the state "
        "“Offline or no map key” is said where the flow continues (guidelines.md, “States every screen must handle”). The ground that is drawn is said to a screen reader in the stage's text "
        "equivalent, as it is today (“imagery” or “plain”).",
    )
    return card("The switch off: the plain grid", two_columns(state("Desktop, the stage's top 560 of 984: the panel open, Satellite imagery off, the plain grid under the building, no attribution", part), words), gap=14)


def tablet_card() -> str:
    part = tablet_stage(True, "tablet")
    words = notes(
        "Tablet 834: the stage of 508 of the approved board, the lens switch floating at the top left; at the top right the view controls of the tablet, 16 from the top and 20 from the right: 3D or "
        "Plan at 44, Fit 44, the north button 44 and Layers 44, 8 apart (the tablet has Fit and the north button since Phase 5, as the information architecture's table has them; the Array board of "
        "the tablet drew 3D and Plan alone). The panel hangs 6 under Layers, its right edge on the button's, 20 from the stage's edge.",
        "The time pill stands at the bottom left, 28 over the stage's bottom as the stage places it on tablet, and the attribution under it, 20 from the left and 4 from the bottom, in text-label-s on the imagery with its shadow; the vitals are under the stage.",
    )
    return card("Tablet 834", two_columns(state("Tablet 834 by 508: the view controls with Layers, the panel open, the imagery on", part), words), gap=14)


def phone_card() -> str:
    part = phone_stage(True, "phone")
    words = notes(
        "Phone 390: the stage of 252 of the approved board. The view controls float over the top right of the 3D, 4 from the top and 12 from the right: 3D or Plan at 44 (the phone has no Fit and no "
        "north button) and Layers 44 square beside it, 8 apart, radius-row; the touch target is 44 both ways. The panel of 240 hangs 6 under Layers, its right edge on the button's, 12 from the "
        "screen's edge; it is 100 high with the row of 48, so that the roof stays in sight under it.",
        "The attribution stands at the bottom left, 16 from the left and 4 from the bottom, cut short with an ellipsis where the stage is narrower than its words, as the stage has it today. The time, "
        "the play button with the time at the top left, stands as the approved phone board has it; the panel hangs clear of it.",
    )
    return card(
        "Phone 390",
        '<div style="display: grid; grid-template-columns: 390px minmax(0, 1fr); gap: 24px; align-items: start">' + state("Phone 390 by 252: Layers beside 3D or Plan, the panel open, the imagery on", part) + words + "</div>",
        gap=14,
    )


def whole_card() -> str:
    words = notes(
        "Above, the Studio on desktop 1440 by 900 in the Array lens: the approved board with the Layers button after the north button, open, and its panel; Satellite imagery on, as it is at first "
        "for a project with a location; the imagery under the building, the attribution at the stage's bottom left under the vitals, 24 from the left and 6 from the bottom, as the stage shows it "
        "since Phase 5.",
        "The imagery is the illustration of the Find boards laid on the ground of the 3D by the same projection; the product shows Esri World Imagery, stitched about the roof's centroid "
        "(Ground.tsx). The vignette of the stage stays over it, so that the picture fades into the ground at the edges, as the 3D of the boards has always faded.",
        "The words: the button is “Layers”; the panel's title “Layers”; the switch “Satellite imagery” with the hint “Off: the plain grid”. Sentence case, plain words, no new term: the information "
        "architecture's own (“satellite imagery”, “a plain dark grid”).",
    )
    return card("The screen", words, gap=14)


# --------------------------------------------------------------------------------------------------
# The board
# --------------------------------------------------------------------------------------------------


def layers_board() -> str:
    width, height = SCREEN_W, BOARD_HEIGHT
    head = (
        '<div style="display: flex; align-items: flex-end; gap: 40px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 30px; line-height: 36px; letter-spacing: -0.02em">Stage, Layers</h1>'
        f'<p style="margin: 0 0 2px; max-width: 760px; color: {TEXT_2}">The Layers button of the view controls, beside Fit and the north button, in any lens: an icon button that opens a small panel with one switch, Satellite '
        "imagery, on by default. Off, the ground under the building is the plain grid and the attribution goes with the imagery. Desktop whole; the button's states; the switch off; tablet and phone in parts.</p></div>"
    )
    cards = '<div style="display: flex; flex-direction: column; gap: 16px">' + whole_card() + button_card() + panel_card() + off_card() + tablet_card() + phone_card() + "</div>"
    below = f'<section style="display: flex; flex-direction: column; gap: 24px; padding: 36px 56px 48px; border-top: 1px solid {LINE_SUBTLE}">{head}{cards}</section>'
    root = (
        f'<div style="width: {width}px; height: {height}px; box-sizing: border-box; display: flex; flex-direction: column; background: {GROUND}; color: {TEXT}; overflow: hidden; font-size: 14px; line-height: 20px">'
        f"\n{desktop_whole()}\n{below}\n</div>"
    )
    return frame("Stage, Layers", width, height, root)


if __name__ == "__main__":
    (HERE / "StageLayers.dc.html").write_text(layers_board(), encoding="utf-8")
    print("StageLayers.dc.html")
