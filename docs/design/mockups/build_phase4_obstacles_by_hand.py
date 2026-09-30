"""Writes the two boards of the third pull request of Phase 4 (plan/phase-04-plan.md, step 13):
ObstaclesOnMap.dc.html, "Obstacles on the map and their heights", and ByHand.dc.html, "Enter dimensions
by hand".

The first shows the tools the toolbar has once the roof is closed (a box, a round tank, a wall, a
building beside the roof), how each is drawn, the height asked right after in a dialog (a sheet on
phone) with nothing preselected, the obstacles listed in the panel and counted on the Roof lens's card,
on desktop and on phone. The second shows the roof entered by its measurements: a rectangle by length,
width and the direction its long side faces, or a table of corners, at a place typed or found; the
stage draws the plan of it when there is no map, and the map shows it when there is one. Every value is
one of docs/design/design-tokens.md. It borrows the helpers of the two builders before it.

Run it in this folder: python3 build_phase4_obstacles_by_hand.py
It is kept so that the boards can be written again; it is not part of the product.
"""

from build_phase3_boards import (
    ACCENT,
    ACCENT_INK,
    ARROW,
    CHROME,
    CONTROL,
    CONTROL_ACTIVE,
    DISPLAY,
    FOOT,
    GROUND,
    HEAD,
    HERE,
    LINE,
    LINE_STRONG,
    LINE_SUBTLE,
    MONO,
    NOTE_LINE,
    NOTE_SURFACE,
    SHADOW_FLOAT,
    SHADOW_PANEL,
    SHADOW_PRIMARY,
    SHADOW_RAISED,
    SHADOW_WELL,
    SURFACE_1,
    SURFACE_2,
    TEXT,
    TEXT_2,
    TEXT_3,
    WELL,
    card,
    icon,
    icon_button,
    note,
    primary,
    quiet,
    section,
    state,
)
from build_phase4_boards import (
    HANDLE,
    OUTLINE_FILL,
    SHADOW_LABEL,
    TEXT_SHADOW,
    UNDO,
    back_button,
    build_button,
    corner,
    edge_label,
    field,
    floating,
    fragment,
    imagery,
    map_buttons,
    roof_type_segmented,
    search_field,
    steps,
    tile,
    tool,
    tool_icon,
)

BOX = '<path d="m12 3 8 4.500v9L12 21l-8-4.500v-9z"/><path d="m4 7.500 8 4.500 8-4.500M12 12v9"/>'
TANK = '<ellipse cx="12" cy="6.500" rx="7" ry="3"/><path d="M5 6.500v11c0 1.700 3.100 3 7 3s7-1.300 7-3v-11"/>'
WALL = '<path d="M3 6h18v12H3zM3 12h18M9 6v6M15 12v6"/>'
BUILDING = '<path d="M4 20V9l8-5 8 5v11M4 20h16M9 20v-5h6v5"/>'
REDO = '<path d="m15 14 5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>'
BIN = '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
CLOSE = '<path d="M6 6l12 12M18 6 6 18"/>'
PLUS = '<path d="M12 5v14M5 12h14"/>'
POINTER = (
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF" stroke="#0B0E13" stroke-width="1.500" stroke-linejoin="round" aria-hidden="true">'
    '<path d="M5 3l14 8-6 1.500L16 20l-3 1.500-3-7.500L5 18z"/></svg>'
)

# What an obstacle is drawn with on the map: a light line over a dark fill, so that the roof stays the
# amber thing on the screen; the selected one is amber with its handles.
OBSTACLE_LINE = HANDLE
OBSTACLE_FILL = "rgba(11,14,19,0.55)"

OBSTACLES_HEIGHT = 2380
BY_HAND_HEIGHT = 2880


# --------------------------------------------------------------------------------------------------
# Pieces: obstacles on the map
# --------------------------------------------------------------------------------------------------


def obstacle_toolbar(active: str = "Box", touch: bool = True, phone: bool = False) -> str:
    """The toolbar once the roof is closed: what can be drawn on it. The phone shows Undo alone after
    the tools, as the toolbar of the outline does."""
    if phone:
        tools = "".join(
            f'<button{" aria-pressed=" + chr(34) + "true" + chr(34) if name == active else ""} style="height: 44px; padding: 0 12px; border: 0; border-radius: 13px; cursor: pointer; '
            + (f"background: {ACCENT}; color: {ACCENT_INK}; font-weight: 600; box-shadow: {SHADOW_PRIMARY}" if name == active else "background: transparent")
            + f'">{name}</button>'
            for name in ("Box", "Tank", "Wall", "Building")
        )
        return (
            f'<div role="toolbar" aria-label="Outline tools" style="display: flex; align-items: center; gap: 4px; padding: 5px; background: {SURFACE_1}; '
            f'border: 1px solid {LINE}; border-radius: 18px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">{tools}{tool_icon("Undo", UNDO)}</div>'
        )
    return (
        f'<div role="toolbar" aria-label="Outline tools" style="display: flex; align-items: center; gap: 4px; padding: 6px; background: {SURFACE_1}; '
        f'border: 1px solid {LINE}; border-radius: 18px; white-space: nowrap; box-shadow: {SHADOW_FLOAT}">'
        + tool("Box", BOX, active == "Box", touch)
        + tool("Tank", TANK, active == "Tank", touch)
        + tool("Wall", WALL, active == "Wall", touch)
        + tool("Building", BUILDING, active == "Building", touch)
        + f'<div style="width: 1px; height: 24px; margin: 0 4px; background: {LINE_STRONG}"></div>'
        + tool_icon("Undo", UNDO)
        + tool_icon("Redo", REDO, dim=True)
        + tool_icon("Clear outline", BIN)
        + "</div>"
    )


def roof_outline(x0: float, y0: float, x1: float, y1: float, labels: bool = True, handles: bool = True) -> str:
    """The closed roof as the boards of Find draw it: fill, line, quiet corners, the two labels."""
    drawn = (
        f'<div aria-hidden="true" style="position: absolute; left: {x0:.0f}px; top: {y0:.0f}px; width: {x1 - x0:.0f}px; height: {y1 - y0:.0f}px; '
        f'box-sizing: border-box; background: {OUTLINE_FILL}; border: 2px solid {ACCENT}"></div>'
    )
    if handles:
        drawn += corner(x0, y0) + corner(x1, y0) + corner(x1, y1) + corner(x0, y1)
    if labels:
        drawn += edge_label((x0 + x1) / 2 - 30, y1 + 12, "90.0 m") + edge_label(x1 + 16, (y0 + y1) / 2 - 12, "40.0 m")
    return drawn


def label(x: float, y: float, words: str, quiet_: bool = False) -> str:
    colour = f"; color: {TEXT_2}" if quiet_ else ""
    return (
        f'<code style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; padding: 3px 9px; background: {GROUND}; border-radius: 7px; '
        f'font-size: 12px; font-weight: 500; white-space: nowrap; box-shadow: {SHADOW_LABEL}{colour}">{words}</code>'
    )


def box_on_map(x: float, y: float, w: float, h: float, turn: float = 0, selected: bool = False, words: str = "") -> str:
    line = ACCENT if selected else OBSTACLE_LINE
    drawn = (
        f'<div aria-hidden="true" style="position: absolute; left: {x:.0f}px; top: {y:.0f}px; width: {w:.0f}px; height: {h:.0f}px; box-sizing: border-box; '
        f'background: {OBSTACLE_FILL}; border: 2px solid {line}; transform: rotate({turn}deg)"></div>'
    )
    if selected:
        drawn += corner(x, y) + corner(x + w, y) + corner(x + w, y + h) + corner(x, y + h)
    if words:
        drawn += label(x, y + h + 8, words, quiet_=not selected)
    return drawn


def tank_on_map(cx: float, cy: float, r: float, selected: bool = False, words: str = "") -> str:
    line = ACCENT if selected else OBSTACLE_LINE
    drawn = (
        f'<div aria-hidden="true" style="position: absolute; left: {cx - r:.0f}px; top: {cy - r:.0f}px; width: {2 * r:.0f}px; height: {2 * r:.0f}px; box-sizing: border-box; '
        f'border-radius: 50%; background: {OBSTACLE_FILL}; border: 2px solid {line}"></div>'
    )
    if selected:
        drawn += corner(cx + r, cy)
    if words:
        drawn += label(cx - r, cy + r + 8, words, quiet_=not selected)
    return drawn


def line_on_map(points: list[tuple[float, float]], closed: bool = False, selected: bool = False, live: bool = False, words: str = "", size: tuple[int, int] = (640, 400)) -> str:
    line = ACCENT if selected or live else OBSTACLE_LINE
    path = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in points) + (" Z" if closed else "")
    fill = f' fill="{OBSTACLE_FILL}"' if closed else ' fill="none"'
    dash = ' stroke-dasharray="6 4"' if live else ""
    drawn = (
        f'<svg width="{size[0]}" height="{size[1]}" viewBox="0 0 {size[0]} {size[1]}" style="position: absolute; left: 0; top: 0; pointer-events: none" aria-hidden="true">'
        f'<path d="{path}"{fill} stroke="{line}" stroke-width="2" stroke-linejoin="round"{dash}/></svg>'
    )
    if selected or live:
        drawn += "".join(corner(x, y, live=live and n == len(points) - 1) for n, (x, y) in enumerate(points))
    if words:
        x, y = points[-1]
        drawn += label(x + 14, y - 12, words, quiet_=not (selected or live))
    return drawn


def tools_card() -> str:
    """The roof closed, two obstacles on it, a wall being drawn."""
    w, h, scale = 640, 400, 5.0
    x0, y0, x1, y1 = 95, 72, 95 + 90 * scale, 72 + 40 * scale
    inside = (
        roof_outline(x0, y0, x1, y1, handles=False)
        + box_on_map(x0 + 14 * scale, y0 + 16 * scale, 5 * scale, 4 * scale, words="Box 1 · 5.0 × 4.0 · h 3.0 m")
        + tank_on_map(x0 + 62 * scale, y0 + 24 * scale, 1.25 * scale, words="Tank 1 · ⌀ 2.5 · h 2.0 m")
        + line_on_map([(x0 + 70 * scale, y0 + 3 * scale), (x0 + 88 * scale, y0 + 3 * scale)], live=True, words="18.0 m", size=(w, h))
        + f'<div style="position: absolute; left: {x0 + 88 * scale + 6:.0f}px; top: {y0 + 3 * scale + 4:.0f}px">{POINTER}</div>'
        + f'<div style="position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%)">{obstacle_toolbar("Wall")}</div>'
    )
    body = (
        state(
            "The roof is closed: the toolbar shows what can be drawn on it. A box and a tank are there; a wall is being drawn along the parapet",
            fragment(w, h, inside, scale=scale, ox=x0, oy=y1, roof=False),
        )
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">While the outline is open the toolbar holds the three ways to outline. Once it is closed it holds the four obstacles; '
        "Undo, Redo and Clear stay, and Clear opens the roof again. Obstacles are drawn light over dark, so that the roof stays the amber thing on the screen. "
        "The heights of the desktop app (1.5, 2, 6 and 8 m) are not preselected here: each is asked.</p>"
    )
    return card("The tools, once the roof is closed", body, gap=12)


def small(width: int, height: int, inside: str) -> str:
    """A small piece of imagery, no roof drawn by the helper."""
    return fragment(width, height, inside, scale=3.0, ox=20, oy=height - 20, roof=False)


def how_card() -> str:
    w, h = 300, 190
    roof = roof_outline(20, 40, 20 + 270, 40 + 120, labels=False, handles=False)
    drag = (
        f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position: absolute; left: 0; top: 0" aria-hidden="true">'
        f'<path d="M120 80 L190 130" stroke="{TEXT}" stroke-width="1.500" stroke-dasharray="3 3" fill="none"/><circle cx="120" cy="80" r="3" fill="{TEXT}"/></svg>'
    )
    box = roof + drag + box_on_map(120, 80, 70, 50, selected=True) + f'<div style="position: absolute; left: 196px; top: 132px">{POINTER}</div>'
    tank = (
        roof
        + tank_on_map(150, 100, 30, selected=True)
        + f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="position: absolute; left: 0; top: 0" aria-hidden="true">'
        f'<path d="M150 100 L180 100" stroke="{TEXT}" stroke-width="1.500" stroke-dasharray="3 3"/><circle cx="150" cy="100" r="3" fill="{TEXT}"/></svg>'
        + label(150 - 24, 100 + 30 + 8, "⌀ 2.5 m")
        + f'<div style="position: absolute; left: 186px; top: 102px">{POINTER}</div>'
    )
    wall = roof + line_on_map([(40, 60), (150, 60), (150, 120)], live=True, words="12.0 m", size=(w, h)) + f'<div style="position: absolute; left: 156px; top: 124px">{POINTER}</div>'
    building = (
        roof_outline(20, 40, 20 + 150, 40 + 120, labels=False, handles=False)
        + line_on_map([(200, 50), (280, 50), (280, 130), (200, 130)], closed=True, selected=True, words="8 × 8 m", size=(w, h))
    )
    grid = (
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px">'
        + state("Box: drag it across the thing, then turn it by its handle", small(w, h, box))
        + state("Tank: drag from its middle to its edge", small(w, h, tank))
        + state("Wall: press each point; press the last again, or Enter, to end it", small(w, h, wall))
        + state("Building beside the roof: press its corners, close on the first", small(w, h, building))
        + "</div>"
    )
    body = (
        grid
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">When the shape is done its height is asked (right). A shape that is answered stands on the map with its name and its height, '
        "and can be selected: its corners drag, Delete removes it, and a press on the map elsewhere leaves it. Trees come with the Roof lens.</p>"
    )
    return card("How each is drawn", body, gap=12)


def height_field(value: str = "", focus: bool = True, unit: str = "m", label_: str = "Height", width: int = 72) -> str:
    look = (
        f"border: 1px solid {ACCENT}; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)"
        if focus
        else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
    )
    name = label_.lower().replace(" ", "-")
    return (
        f'<div style="display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 12px; background: {WELL}; border-radius: 10px; {look}">'
        f'<label for="h-{name}" style="flex-grow: 1; color: {TEXT_2}; font-size: 13px">{label_}</label>'
        f'<input id="h-{name}" value="{value}" inputmode="decimal" style="width: {width}px; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">'
        f'<span style="color: {TEXT_2}; font-size: 12px; white-space: nowrap">{unit}</span></div>'
    )


def disabled_primary(label_: str, height: int = 40) -> str:
    return (
        f'<button aria-disabled="true" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; gap: 8px; height: {height}px; white-space: nowrap; '
        f"padding: 0 16px; background: {ACCENT}; color: {ACCENT_INK}; border: 0; border-radius: 10px; font-weight: 600; "
        f'cursor: default; opacity: 0.45">{label_}</button>'
    )


def height_dialog_card() -> str:
    panel = (
        f'<div role="dialog" aria-labelledby="hd-t" aria-describedby="hd-d" style="width: 380px; box-sizing: border-box; '
        f"display: flex; flex-direction: column; gap: 10px; padding: 22px 22px 20px; background: {SURFACE_1}; "
        f'border: 1px solid {LINE_STRONG}; border-radius: 22px; box-shadow: {SHADOW_PANEL}">'
        '<div style="display: flex; align-items: flex-start; gap: 12px">'
        f'<h3 id="hd-t" style="flex-grow: 1; margin: 0; {DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Height of the box</h3>'
        + icon_button("Close", CLOSE, 32)
        + "</div>"
        f'<p id="hd-d" style="margin: 0; color: {TEXT_2}">The imagery cannot give it. Enter its height above the roof surface.</p>'
        + f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px">{height_field("Box 1", focus=False, unit="", label_="Name", width=64)}{height_field()}</div>'
        '<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px">'
        + quiet("Remove")
        + disabled_primary("Add the box")
        + "</div></div>"
    )
    typed = (
        f'<div style="display: flex; flex-direction: column; gap: 8px; width: 380px">'
        + f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">{height_field("Box 1", focus=False, unit="", label_="Name", width=64)}{height_field("3.0")}</div>'
        f'<div style="display: flex; justify-content: flex-end; gap: 8px">{quiet("Remove")}{primary("Add the box")}</div></div>'
    )
    stage = (
        f'<div style="flex-grow: 1; display: flex; align-items: center; justify-content: center; min-height: 300px; '
        f'border-radius: 12px; background: rgba(5,7,10,0.72); border: 1px solid {LINE_SUBTLE}">{panel}</div>'
    )
    sheet = (
        f'<div style="display: flex; flex-direction: column; gap: 10px; padding: 8px 16px 16px; background: {CHROME}; '
        f'border: 1px solid {LINE}; border-bottom: 0; border-radius: 22px 22px 0 0">'
        f'<div style="display: flex; justify-content: center; padding: 0 0 4px"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        f'<div style="{DISPLAY}; font-size: 22px; line-height: 28px; letter-spacing: -0.02em">Height of the tank</div>'
        f'<div style="font-size: 15px; color: {TEXT_2}">The imagery cannot give it. Enter its height above the roof surface.</div>'
        + f'<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">{height_field("Tank 1", focus=False, unit="", label_="Name", width=64)}{height_field()}</div>'
        '<div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px">'
        + disabled_primary("Add the tank", 48)
        + quiet("Remove", 44)
        + "</div></div>"
    )
    body = (
        state("Desktop and tablet: the dialog opens when the shape is done, over the dimmed screen. The height is empty; the focus is in it", stage)
        + state("A height typed: Enter, or the primary action, adds the obstacle. The name is the API's until it is changed", typed)
        + state("Phone: a bottom sheet; the primary action on top, Remove last", f'<div style="width: 340px; align-self: center">{sheet}</div>')
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Nothing is preselected: the primary action waits for a number. From 0.05 to 200 m, in metres with two decimals '
        "in the field, as every length in a field. Escape, Remove and the close button take the shape off the map. A tank asks its height alone: its diameter was drawn.</p>"
    )
    return card("The height, asked right after", body, gap=16)


def obstacle_row(path: str, name: str, facts: str, selected: bool = False) -> str:
    ground = f"background: {NOTE_SURFACE}; border: 1px solid {ACCENT}; box-shadow: 0 0 0 3px rgba(255,176,32,0.14)" if selected else f"background: {SURFACE_1}; border: 1px solid {LINE}; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)"
    colour = ACCENT if selected else TEXT_2
    return (
        f'<div style="display: flex; align-items: center; gap: 10px; height: 46px; padding: 0 4px 0 12px; border-radius: 12px; {ground}">'
        f'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{colour}" stroke-width="1.700" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">{path}</svg>'
        f'<span style="flex-grow: 1; font-weight: 500">{name}</span><code style="font-size: 12px; color: {TEXT_2}">{facts}</code>'
        f'{icon_button("Remove " + name, BIN, 36)}</div>'
    )


def obstacles_section(rows: str, count: str) -> str:
    return (
        f'<div style="display: flex; flex-direction: column; gap: 10px; width: 332px">{section("Obstacles · " + count)}'
        f'<div style="display: flex; flex-direction: column; gap: 6px">{rows}</div></div>'
    )


def panel_card() -> str:
    rows = (
        obstacle_row(BOX, "Box 1", "5.0 × 4.0 · h 3.0 m")
        + obstacle_row(TANK, "Tank 1", "⌀ 2.5 · h 2.0 m", selected=True)
        + obstacle_row(WALL, "Wall 1", "18.0 m · h 0.8 m")
    )
    empty = obstacles_section(
        f'<p style="margin: 0; font-size: 13px; color: {TEXT_2}">None yet. Draw a box, a tank, a wall or a building with the tools on the map. Each asks its height.</p>',
        "0",
    )
    roof_card = (
        f'<div style="display: flex; align-items: center; gap: 14px; width: 380px; box-sizing: border-box; padding: 12px 14px; background: {SURFACE_1}; border: 1px solid {LINE}; '
        f'border-radius: 18px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.35), 0 16px 40px rgba(0,0,0,0.28)">'
        f'<span aria-hidden="true" style="display: flex; align-items: center; justify-content: center; width: 44px; height: 56px; flex-shrink: 0; border-radius: 12px; background: {SURFACE_2}">'
        f'<span style="width: 32px; height: 14px; box-sizing: border-box; border: 1px solid {ACCENT}; border-radius: 3px; background: {OUTLINE_FILL}"></span></span>'
        f'<span style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><code style="font-size: 12px; font-weight: 500">18.52000° N, 73.86000° E</code>'
        f'<span style="font-size: 12px; color: {TEXT_2}">Outlined on satellite · 4 corners · 3 obstacles</span><span style="font-size: 12px; color: {TEXT_2}">90.0 × 40.0 m · faces 180° S</span></span>'
        f'<button style="height: 32px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; border-radius: 9px; font-size: 13px; font-weight: 500; cursor: pointer; box-shadow: {SHADOW_RAISED}">Edit</button></div>'
    )
    body = (
        state("In the panel, under the measurements: every obstacle with its size and its height. The selected one is the selected one on the map; a row selects it", obstacles_section(rows, "3"))
        + state("Before any is drawn", empty)
        + state("The card of the Roof lens counts them; its list with every field is the Roof lens itself (Phase 5)", roof_card)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">Sizes are read from the map: a box by its sides, a tank by its diameter, a wall by its length, a building by its area. '
        "The height is the one typed. The rows go to Build with the roof, as the shapes drawn in WGS84 with their heights; the API makes the obstacles of the engine from them.</p>"
    )
    return card("The panel: obstacles listed", body, gap=16)


def phone_field(label_: str, value: str, focus: bool = False) -> str:
    return field(label_, value, focus)


def phone_card() -> str:
    width, height, sheet_h = 390, 844, 384
    scale, x0, y1 = 3.4, 42, 306
    x1, y0 = x0 + 90 * scale, y1 - 40 * scale
    map_h = height - sheet_h
    stage = (
        f'<div style="position: relative; width: {width}px; height: {height}px; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: #2F342D; color: {TEXT}; font-size: 15px; line-height: 20px">'
        + imagery(width, map_h, scale, x0, y1, roof=False)
        + roof_outline(x0, y0, x1, y1, labels=False, handles=False)
        + box_on_map(x0 + 14 * scale, y0 + 14 * scale, 5 * scale, 4 * scale, words="Box 1 · h 3.0 m")
        + tank_on_map(x0 + 62 * scale, y0 + 24 * scale, 1.25 * scale, selected=True, words="Tank 1 · h 2.0 m")
        + '<div style="position: absolute; left: 12px; right: 12px; top: 12px; display: flex; align-items: center; gap: 8px">'
        + back_button()
        + search_field("18.52000, 73.86000", width="auto; flex-grow: 1")
        + "</div>"
        + f'<div style="position: absolute; left: 50%; top: {map_h - 20 - 54}px; transform: translateX(-50%)">{obstacle_toolbar("Box", phone=True)}</div>'
        + f'<div style="position: absolute; left: 12px; top: {map_h - 26}px; font-size: 11px; {TEXT_SHADOW}">Imagery © [MAP PROVIDER]</div>'
        + f'<section aria-label="Outline the roof" style="position: absolute; left: 0; right: 0; bottom: 0; height: {sheet_h}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; '
        f'padding: 8px 16px 16px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 -16px 40px rgba(0,0,0,0.5)">'
        f'<div style="display: flex; justify-content: center"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        '<div style="display: flex; align-items: baseline; gap: 12px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 24px; line-height: 30px; letter-spacing: -0.02em">Outline the roof</h1>'
        f'<span style="margin-left: auto; font-size: 13px; color: {TEXT_2}">Step 2 of 3</span></div>'
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
        + phone_field("South", "90.0")
        + phone_field("East", "40.0")
        + "</div>"
        + section("Obstacles · 2")
        + '<div style="display: flex; flex-direction: column; gap: 6px">'
        + obstacle_row(BOX, "Box 1", "5.0 × 4.0 · h 3.0 m")
        + obstacle_row(TANK, "Tank 1", "⌀ 2.5 · h 2.0 m", selected=True)
        + "</div>"
        + f'<div style="margin-top: auto">{build_button()}</div>'
        + "</section></div>"
    )
    body = (
        state("Phone, 390: the toolbar shows Box, Tank, Wall, Building and Undo; the sheet lists the obstacles under the edges. The tank is selected on both", stage)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The sheet scrolls: the tiles, the roof type and Build are below, as on the board of Find on phone. '
        "A box on touch is dragged the same way, with the loupe when a corner is dragged; its height comes as a sheet.</p>"
    )
    return card("On phone", body, gap=12)


def obstacles_board() -> str:
    width, height = 1440, OBSTACLES_HEIGHT
    column = '<div style="display: flex; flex-direction: column; gap: 16px">\n'
    grid = (
        '<div style="flex-grow: 1; display: grid; grid-template-columns: minmax(0, 1fr) 460px; gap: 16px; align-items: start">\n'
        + column + tools_card() + how_card() + panel_card() + "</div>\n"
        + column + height_dialog_card() + phone_card() + "</div>\n"
        + "</div>\n"
    )
    return (
        HEAD.format(
            title="Obstacles on the map and their heights",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Obstacles on the map and their heights",
            lead="Once the roof is closed, the things on it are drawn with the tools of the map: a box, a round tank, a wall, a taller building beside it. Imagery cannot give a height, so each is asked right after, and nothing is preselected.",
        ).replace("@keyframes spin", "@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,176,32,.55),0 2px 6px rgba(0,0,0,.6)}50%{box-shadow:0 0 0 9px rgba(255,176,32,0),0 2px 6px rgba(0,0,0,.6)}}\n@keyframes spin")
        + grid
        + FOOT.format(width=width, height=height)
    )


# --------------------------------------------------------------------------------------------------
# Pieces: the roof by hand
# --------------------------------------------------------------------------------------------------


def plan_view(
    width: int,
    height: int,
    scale: float,
    cx: float,
    cy: float,
    length: float = 90.0,
    depth: float = 40.0,
    empty: bool = False,
    polygon: list[tuple[float, float]] | None = None,
    north_top: int = 84,
) -> str:
    """The stage without a map: the plan of the roof entered, north up, on a grid of 10 m, with its
    labels, a north mark and a scale bar."""
    step = 10 * scale
    lines = "".join(f'<path d="M{x:.0f} 0V{height}" stroke="{LINE_SUBTLE}" stroke-width="1"/>' for x in _ticks(cx, width, step)) + "".join(
        f'<path d="M0 {y:.0f}H{width}" stroke="{LINE_SUBTLE}" stroke-width="1"/>' for y in _ticks(cy, height, step)
    )
    x0, y0, w, h = cx - length * scale / 2, cy - depth * scale / 2, length * scale, depth * scale
    if polygon:
        path = "M" + " L".join(f"{cx + x * scale:.0f} {cy - y * scale:.0f}" for x, y in polygon) + " Z"
        roof = f'<path d="{path}" fill="{ACCENT}" fill-opacity="0.09" stroke="{ACCENT}" stroke-width="2" stroke-linejoin="round"/>'
        labels = edge_label(cx - 30, cy + 25 * scale + 12, "70.0 m") + label(cx + 35 * scale + 12, cy - 12 * scale, "2,650 m²")
    else:
        roof = "" if empty else f'<rect x="{x0:.0f}" y="{y0:.0f}" width="{w:.0f}" height="{h:.0f}" fill="{ACCENT}" fill-opacity="0.09" stroke="{ACCENT}" stroke-width="2"/>'
        labels = "" if empty else edge_label(cx - 30, y0 + h + 12, f"{length:.1f} m") + edge_label(x0 + w + 16, cy - 12, f"{depth:.1f} m")
    words = (
        f'<div style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; color: {TEXT_2}">'
        f'<span style="font-weight: 500; color: {TEXT}">The plan of the roof is drawn here</span><span style="font-size: 13px">Enter its length and width, or its corners.</span></div>'
        if empty
        else ""
    )
    north = (
        f'<div aria-label="North up" style="position: absolute; right: 20px; top: {north_top}px; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; {floating("; border-radius: 12px")}">'
        f'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2.500 15 9H9z" fill="{ACCENT}"/>'
        f'<path d="M9.500 19v-7l5 7v-7" stroke="{TEXT}" stroke-width="1.600" stroke-linecap="round" stroke-linejoin="round"/></svg></div>'
    )
    return (
        f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" style="position: absolute; left: 0; top: 0" role="img" aria-label="Plan of the roof, north up" aria-hidden="{"true" if empty else "false"}">'
        f'<rect width="{width}" height="{height}" fill="{GROUND}"/>{lines}{roof}</svg>{labels}{words}{north}'
    )


def _ticks(centre: float, extent: int, step: float) -> list[float]:
    ticks = []
    at = centre
    while at > 0:
        at -= step
    while at < extent:
        ticks.append(at)
        at += step
    return ticks


def no_map_line(words: str) -> str:
    return (
        f'<div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: {TEXT_2}">{note(16)}<span>{words}</span></div>'
    )


def scale_bar(px: int, metres: str) -> str:
    return (
        f'<div style="display: flex; flex-direction: column; gap: 3px"><code style="font-size: 12px; {TEXT_SHADOW}">{metres}</code>'
        f'<div style="width: {px}px; height: 5px; box-sizing: border-box; border: 2px solid {TEXT}; border-top: 0"></div></div>'
    )


def segmented(taken: str, options: tuple[str, ...], label_: str, height: int = 40) -> str:
    buttons = "".join(
        (
            f'<button aria-pressed="true" style="height: {height}px; background: {CONTROL_ACTIVE}; border: 0; border-radius: 10px; font-weight: 500; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 1px 3px rgba(0,0,0,0.55)">{name}</button>'
            if name == taken
            else f'<button style="height: {height}px; background: transparent; border: 0; border-radius: 10px; color: {TEXT_2}; cursor: pointer">{name}</button>'
        )
        for name in options
    )
    return (
        f'<div role="group" aria-label="{label_}" style="display: grid; grid-template-columns: repeat({len(options)}, minmax(0, 1fr)); gap: 2px; padding: 3px; background: {WELL}; '
        f'border: 1px solid {LINE}; border-radius: 13px; box-shadow: {SHADOW_WELL}">{buttons}</div>'
    )


def place_fields(lat: str = "18.52000", lon: str = "73.86000", stacked: bool = False) -> str:
    return (
        f'<div style="display: grid; grid-template-columns: repeat({1 if stacked else 2}, minmax(0, 1fr)); gap: 8px">'
        + height_field(lat, focus=False, unit="° N", label_="Latitude", width=88 if stacked else 58)
        + height_field(lon, focus=False, unit="° E", label_="Longitude", width=88 if stacked else 58)
        + "</div>"
    )


def rectangle_fields(length: str = "90.0", width_: str = "40.0", faces: str = "180", focus: str = "") -> str:
    return (
        '<div style="display: flex; flex-direction: column; gap: 8px">'
        '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px">'
        + height_field(length, focus=focus == "length", label_="Length", width=56)
        + height_field(width_, focus=focus == "width", label_="Width", width=56)
        + "</div>"
        + height_field(faces, focus=focus == "faces", unit="°", label_="Long side faces", width=56)
        + "</div>"
    )


def tiles(area: str = "3,600", faces: str = "180° S", corners: str = "4") -> str:
    return (
        '<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px">'
        + tile("Area", area, "m²" if area != "—" else "")
        + tile("Faces", faces)
        + tile("Corners", corners)
        + "</div>"
    )


def roof_type_cards() -> str:
    def one(path: str, name: str, caption: str, taken: bool) -> str:
        ground = f"background: {NOTE_SURFACE}; border: 1px solid {ACCENT}" if taken else f"background: {CONTROL}; border: 1px solid {LINE}"
        colour = ACCENT if taken else TEXT_2
        return (
            f'<button{" aria-pressed=" + chr(34) + "true" + chr(34) if taken else ""} style="display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 14px; {ground}; border-radius: 12px; text-align: left; cursor: pointer; '
            f'box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45)"><svg width="28" height="18" viewBox="0 0 28 18" fill="none" stroke="{colour}" stroke-width="1.600" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{path}"/></svg>'
            f'<span style="flex-grow: 1; display: flex; flex-direction: column"><span style="font-weight: 500">{name}</span><span style="font-size: 12px; color: {TEXT_2}">{caption}</span></span></button>'
        )

    return (
        '<div role="group" aria-label="Roof type" style="display: flex; flex-direction: column; gap: 6px">'
        + one("M1 16h26M4 14l6-5M12 14l6-5M20 14l6-5", "Flat, tilted rows", "Rows facing the equator", True)
        + one("M1 16h26M3 14l5-4 5 4M15 14l5-4 5 4", "Flat, east-west", "Back-to-back, low tilt", False)
        + one("M1 16 14 5l13 11M5 10.500l9-7.500 9 7.500", "Sloped, flush", "Modules follow the roof pitch", False)
        + "</div>"
    )


def by_hand_panel(desktop: bool = True, shape: str = "Rectangle", with_map: bool = False) -> str:
    """The panel of Find while the roof is entered by hand."""
    lead = "Type what you have measured. The roof is drawn as you type; Faces is where its long side looks."
    body = (
        '<div style="display: flex; flex-direction: column; gap: 6px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 28px; line-height: 32px; letter-spacing: -0.02em">Enter the roof by hand</h1>'
        f'<p style="margin: 0; color: {TEXT_2}">{lead}</p></div>'
        + f'<section style="display: flex; flex-direction: column; gap: 10px">{section("Place")}{place_fields()}'
        f'<p style="margin: 0; font-size: 12px; color: {TEXT_3}">From the search above, or typed. Five decimals.</p></section>'
        + f'<section style="display: flex; flex-direction: column; gap: 10px">{section("Shape")}{segmented(shape, ("Rectangle", "Corners"), "Shape")}'
        + (rectangle_fields(focus="width") if shape == "Rectangle" else corner_table())
        + "</section>"
        + tiles()
        + f'<section style="display: flex; flex-direction: column; gap: 10px">{section("Roof type")}{roof_type_cards()}</section>'
        + '<div style="margin-top: auto; display: flex; flex-direction: column; gap: 10px">'
        + build_button().replace("StudioTablet.dc.html", "RoofLens.dc.html")
        + (f'<button style="height: 44px; background: transparent; border: 0; border-radius: 12px; color: {TEXT_2}; cursor: pointer">Draw on the map instead</button>' if with_map else "")
        + "</div>"
    )
    return (
        f'<aside aria-label="Enter the roof by hand" style="position: absolute; right: 20px; top: 20px; bottom: 20px; width: 380px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px; '
        f'padding: 24px; background: {CHROME}; border: 1px solid {LINE}; border-radius: 22px; box-shadow: {SHADOW_PANEL}; overflow: hidden">{body}</aside>'
    )


def corner_table(rows: tuple[tuple[str, str], ...] = (("−45.00", "−20.00"), ("45.00", "−20.00"), ("45.00", "20.00"), ("−45.00", "20.00")), focus: int = -1) -> str:
    def cell(value: str, focused: bool) -> str:
        look = f"border: 1px solid {ACCENT}; box-shadow: inset 0 1px 3px rgba(0,0,0,0.65), 0 0 0 3px rgba(255,176,32,0.18)" if focused else f"border: 1px solid {LINE}; box-shadow: {SHADOW_WELL}"
        return (
            f'<div style="display: flex; align-items: center; gap: 6px; height: 40px; padding: 0 10px; background: {WELL}; border-radius: 10px; {look}">'
            f'<input value="{value}" inputmode="decimal" aria-label="metres" style="width: 100%; min-width: 0; background: transparent; border: 0; outline: 0; text-align: right; {MONO}; font-weight: 500">'
            f'<span style="color: {TEXT_2}; font-size: 12px">m</span></div>'
        )

    head = (
        f'<div style="display: grid; grid-template-columns: 64px 1fr 1fr 36px; gap: 8px; align-items: center; font-size: 12px; color: {TEXT_3}; padding: 0 0 2px">'
        "<span>Corner</span><span style=\"text-align: right; padding-right: 22px\">East</span><span style=\"text-align: right; padding-right: 22px\">North</span><span></span></div>"
    )
    body = "".join(
        f'<div style="display: grid; grid-template-columns: 64px 1fr 1fr 36px; gap: 8px; align-items: center">'
        f'<span style="font-size: 13px">{n + 1}</span>{cell(east, focus == n)}{cell(north, False)}{icon_button("Remove corner " + str(n + 1), BIN, 36)}</div>'
        for n, (east, north) in enumerate(rows)
    )
    add = (
        f'<button style="align-self: flex-start; display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; background: {CONTROL}; border: 1px solid {LINE_STRONG}; '
        f'border-radius: 9px; font-size: 13px; cursor: pointer; box-shadow: {SHADOW_RAISED}">{icon(PLUS, 14, "currentColor", 2.2)}Add a corner</button>'
    )
    return (
        f'<div style="display: flex; flex-direction: column; gap: 6px">{head}{body}{add}'
        f'<p style="margin: 0; font-size: 12px; color: {TEXT_3}">Metres east and north of the middle of the roof, in order around it. Three at least.</p></div>'
    )


def by_hand_desktop() -> str:
    """The screen on desktop without a key: the plan on the stage, the panel with the fields."""
    width, height = 1440, 900
    stage_w = width - 20 - 380 - 20
    plan = plan_view(width, height, 5.0, stage_w / 2, height / 2 + 20)
    top = (
        '<div style="position: absolute; left: 20px; top: 20px; display: flex; align-items: center; gap: 10px">'
        + back_button()
        + search_field("", width="400px", placeholder=True).replace('value=""', 'placeholder="Paste coordinates or a maps link"')
        + steps()
        + "</div>"
    )
    bottom = (
        f'<div style="position: absolute; left: 20px; bottom: 20px; display: flex; flex-direction: column; gap: 10px">{scale_bar(100, "20 m")}'
        + no_map_line("The map is not available: this app has no key for the imagery. The roof is drawn from its measurements.")
        + "</div>"
    )
    return (
        f'<div style="position: relative; width: {width}px; height: {height}px; box-sizing: border-box; overflow: hidden; background: {GROUND}; color: {TEXT}; font-size: 14px; line-height: 20px">'
        + plan
        + top
        + bottom
        + by_hand_panel()
        + "</div>"
    )


def by_hand_phone(scrolled: bool = False) -> str:
    width, height, sheet_h = 390, 844, 584
    map_h = height - sheet_h
    plan = plan_view(width, map_h, 2.4, width / 2, map_h / 2 + 8)
    top = (
        '<div style="position: absolute; left: 12px; right: 12px; top: 12px; display: flex; align-items: center; gap: 8px">'
        + back_button()
        + search_field("18.52000, 73.86000", width="auto; flex-grow: 1")
        + "</div>"
    )
    bottom = f'<div style="position: absolute; left: 12px; top: {map_h - 30}px">{no_map_line("No map key. The roof is drawn from its measurements.")}</div>'
    sheet = (
        f'<section aria-label="Enter the roof by hand" style="position: absolute; left: 0; right: 0; bottom: 0; height: {sheet_h}px; box-sizing: border-box; display: flex; flex-direction: column; gap: 10px; '
        f'padding: 8px 16px 16px; background: {CHROME}; border-top: 1px solid {LINE}; border-radius: 22px 22px 0 0; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 -16px 40px rgba(0,0,0,0.5); overflow: hidden">'
        f'<div style="display: flex; justify-content: center"><div style="width: 40px; height: 4px; border-radius: 2px; background: {LINE_STRONG}"></div></div>'
        '<div style="display: flex; align-items: baseline; gap: 12px">'
        f'<h1 style="margin: 0; {DISPLAY}; font-size: 24px; line-height: 30px; letter-spacing: -0.02em">Enter the roof by hand</h1>'
        f'<span style="margin-left: auto; font-size: 13px; color: {TEXT_2}; white-space: nowrap">Step 2 of 3</span></div>'
        + place_fields(stacked=True)
        + segmented("Rectangle", ("Rectangle", "Corners"), "Shape", 44)
        + rectangle_fields(focus="length")
        + tiles()
        + roof_type_segmented()
        + f'<div style="margin-top: auto">{build_button().replace("StudioTablet.dc.html", "StudioPhone.dc.html")}</div>'
        + "</section>"
    )
    return (
        f'<div style="position: relative; width: {width}px; height: {height}px; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}; background: {GROUND}; color: {TEXT}; font-size: 15px; line-height: 20px">'
        + plan
        + top
        + bottom
        + sheet
        + "</div>"
    )


def by_hand_states_card() -> str:
    # With the map: the rectangle appears on the imagery at the place, turned to where it faces.
    w, h, scale = 640, 360, 4.0
    x0, y1 = 100, 280
    x1, y0 = x0 + 90 * scale, y1 - 40 * scale
    on_map = (
        roof_outline(x0, y0, x1, y1, handles=False)
        + f'<div style="position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%)">{obstacle_toolbar("Box")}</div>'
    )
    with_map = fragment(w, h, on_map, scale=scale, ox=x0, oy=y1, roof=False)
    empty_stage = (
        f'<div style="position: relative; width: 420px; height: 240px; flex-shrink: 0; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}">{plan_view(420, 240, 4.0, 210, 120, empty=True, north_top=12)}</div>'
    )
    empty_fields = (
        '<div style="display: flex; flex-direction: column; gap: 8px; width: 332px; flex-shrink: 0">'
        + rectangle_fields("", "", "", focus="length")
        + tiles("—", "—", "—")
        + '<div style="display: flex; align-items: center; justify-content: center; height: 56px; border-radius: 14px; background: #FFB020; color: #1A1204; font-weight: 600; font-size: 16px; opacity: 0.45">Build this roof</div>'
        + "</div>"
    )
    no_key_search = (
        search_field("Hinjewadi Phase 2")
        + f'<ul role="listbox" aria-label="Places found" style="list-style: none; margin: 6px 0 0; width: 400px; box-sizing: border-box; display: flex; flex-direction: column; gap: 2px; '
        f'padding: 6px; background: {SURFACE_1}; border: 1px solid {LINE_STRONG}; border-radius: 14px; box-shadow: {SHADOW_FLOAT}">'
        f'<li style="display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px; color: {TEXT_2}">{note(16)}'
        "Searching by words needs the map key. Paste coordinates or a maps link, or type them into Place.</li></ul>"
    )
    body = (
        state(
            "With a map: “Enter dimensions by hand instead” under Build switches the panel to the fields; the rectangle stands on the imagery at the place, turned to where it faces, and its corners drag. “Draw on the map instead” goes back",
            with_map,
        )
        + state("Nothing typed yet: the fields are empty, the tiles say nothing, Build waits, and the stage says what goes there", f'<div style="display: flex; gap: 16px; align-items: flex-start">{empty_stage}{empty_fields}</div>')
        + state("Without a key the search reads coordinates and maps links as before; words are answered with what to do instead", no_key_search)
        + f'<p style="margin: 0; font-size: 12px; color: {TEXT_2}">The corners of a rectangle are made from its length, its width and where it faces, about the place; a table of corners is taken as typed. '
        "Both go to Build as the roof drawn on the map does, in WGS84 about the place, and the API makes the metres of the document (D41). Obstacles by hand come with the Roof lens.</p>"
    )
    return card("States", body, gap=16)


def by_hand_board() -> str:
    width, height = 1440, BY_HAND_HEIGHT
    corners_card = card(
        "Corners",
        state("The corner table of the desktop app: a row per corner, east and north of the middle of the roof, added and removed; the plan follows each row", f'<div style="width: 332px">{corner_table(focus=2)}</div>')
        + state("The plan of a roof that is no rectangle: the edges by their number, the area of the polygon", f'<div style="position: relative; width: 332px; height: 220px; overflow: hidden; border-radius: 12px; border: 1px solid {LINE}">{plan_view(332, 220, 2.2, 150, 110, polygon=[(-35, -25), (35, -25), (35, 10), (10, 25), (-35, 25)], north_top=12)}</div>'),
        gap=16,
    )
    phone = card("On phone", state("Phone, 390: the plan above, the sheet pulled up to its top stop with Place, the shape, its fields, the tiles, the roof type and Build", by_hand_phone()), gap=12)
    lower = (
        '<div style="display: grid; grid-template-columns: minmax(0, 1fr) 460px; gap: 16px; align-items: start">\n'
        '<div style="display: flex; flex-direction: column; gap: 16px">\n' + by_hand_states_card() + "</div>\n"
        '<div style="display: flex; flex-direction: column; gap: 16px">\n' + phone + corners_card + "</div>\n"
        "</div>\n"
    )
    screen = (
        f'<div style="margin: 0 -56px; border-top: 1px solid {LINE}; border-bottom: 1px solid {LINE}">{by_hand_desktop()}</div>'
        f'<p style="margin: -12px 0 0; font-size: 12px; color: {TEXT_2}">Desktop, 1440, without a map key: the plan of the roof on the stage, north up on a grid of 10 m, with the scale bar and the reason there is no map where the attribution stands; the panel holds the place, the shape and its fields, then the same tiles, roof type and Build as the outline drawn on the map.</p>'
    )
    return (
        HEAD.format(
            title="Enter dimensions by hand",
            width=width,
            height=height,
            display=DISPLAY,
            heading="Enter dimensions by hand",
            lead="The way on when there is no map key, no WebGL or no connection, and a way for anyone who has measured the roof: a rectangle by its length, its width and where its long side faces, or a table of corners, at a place typed or found. The same Build.",
        ).replace("@keyframes spin", "@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(255,176,32,.55),0 2px 6px rgba(0,0,0,.6)}50%{box-shadow:0 0 0 9px rgba(255,176,32,0),0 2px 6px rgba(0,0,0,.6)}}\n@keyframes spin")
        + screen
        + lower
        + FOOT.format(width=width, height=height)
    )


if __name__ == "__main__":
    (HERE / "ObstaclesOnMap.dc.html").write_text(obstacles_board(), encoding="utf-8")
    (HERE / "ByHand.dc.html").write_text(by_hand_board(), encoding="utf-8")
    print("ObstaclesOnMap.dc.html, ByHand.dc.html")
