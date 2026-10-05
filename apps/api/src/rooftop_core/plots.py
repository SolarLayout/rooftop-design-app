# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""Matplotlib drawings shared by the window and the PDF report (no Qt here)."""

from __future__ import annotations

import numpy as np
from matplotlib.collections import PolyCollection
from matplotlib.colors import to_rgba
from matplotlib.patches import PathPatch, Rectangle
from matplotlib.patches import Polygon as MplPolygon
from matplotlib.path import Path as MplPath
from shapely.geometry import MultiPolygon, Polygon

from .geometry import Roof, casters_shadow, sun_solar_time
from .placement import Layout
from .simulation import LossStep
from .stringing import System

MPPT_COLORS = ["#185FA5", "#1d9e75", "#7a52b3", "#0f8a9d", "#3f6fb5", "#5a8f3a", "#a0602a", "#b0457d",
               "#2c7c8a", "#6b6f1d", "#4a5fc1", "#8a4b2d"]
ROOF_FILL = "#f3f4f2"
PARAPET = "#5c6773"
SETBACK = "#8a96a3"
OBSTACLE = "#56616d"
OBSTACLE_EDGE = "#2f3740"
KEEPOUT_EDGE = "#b37400"
KEEPOUT_HATCH = "#d9a441"
UNUSED_EDGE = "#b7c2ce"
INVERTER = "#e08a00"
SHADOW = "#1f2d3a"
TEXT = "#1a3a5c"
MUTED = "#6b7a8d"
GRID = "#e6ebf0"
GAIN = "#1d9e75"
LOSS = "#d08a2a"
BAR = "#185FA5"


def _polys(g):
    if g is None or g.is_empty:
        return []
    if isinstance(g, Polygon):
        return [g]
    if isinstance(g, MultiPolygon):
        return list(g.geoms)
    return [p for p in getattr(g, "geoms", []) if isinstance(p, Polygon)]


def _add_poly(ax, poly: Polygon, **kw):
    """A polygon patch whose holes stay holes (a compound path, not paint over the top)."""
    rings = [np.asarray(poly.exterior.coords)] + [np.asarray(r.coords) for r in poly.interiors]
    verts, codes = [], []
    for ring in rings:
        verts.extend(ring.tolist())
        codes.extend([MplPath.MOVETO] + [MplPath.LINETO] * (len(ring) - 2) + [MplPath.CLOSEPOLY])
    ax.add_patch(PathPatch(MplPath(verts, codes), **kw))


def _add_modules(ax, layout: Layout, colors: dict[int, str], dim: bool) -> None:
    """Every module in one collection, coloured by its MPPT or left white: one artist where there were thousands
    (the plan of a roof at the limit drew 7,590 patches)."""
    rings, faces, edges, widths = [], [], [], []
    for m in layout.modules:
        c = colors.get(m.idx)
        rings.append(np.asarray(m.poly.exterior.coords))
        if c:
            faces.append(to_rgba(c, 0.35 if dim else 1.0))
            edges.append(to_rgba("white", 0.35 if dim else 1.0))
            widths.append(0.3)
        else:
            faces.append(to_rgba("white"))
            edges.append(to_rgba(UNUSED_EDGE))
            widths.append(0.4)
    ax.add_collection(PolyCollection(rings, facecolors=faces, edgecolors=edges, linewidths=widths, zorder=3))


def string_colors(system: System | None) -> dict[int, str]:
    """Module index → colour of its MPPT (MPPTs numbered across inverters)."""
    out = {}
    if not system:
        return out
    per_inv = max(system.mppt_of) + 1 if system.mppt_of else 1
    for s, st in enumerate(system.strings):
        k = system.inverter_of[s] * per_inv + system.mppt_of[s]
        for i in st.modules:
            out[i] = MPPT_COLORS[k % len(MPPT_COLORS)]
    return out


def draw_plan(ax, roof: Roof, layout: Layout | None, system: System | None = None, *, show_keepout=True,
              shadow_hour: float | None = None, dim=False, labels=True, fs: float = 7.0):
    ax.clear()
    ax.set_aspect("equal")
    ax.axis("off")
    rp = roof.polygon
    _add_poly(ax, rp, facecolor=ROOF_FILL, edgecolor=PARAPET, linewidth=2.2 if roof.parapet_h > 0 else 1.0,
              zorder=1)
    inner = roof.inner()
    if not inner.is_empty:
        ax.add_patch(MplPolygon(np.asarray(inner.exterior.coords), closed=True, fill=False, edgecolor=SETBACK,
                                linestyle=(0, (4, 3)), linewidth=0.8, zorder=2))
    if layout is not None and show_keepout:
        for p in _polys(layout.keepout.intersection(rp)):
            _add_poly(ax, p, facecolor="none", edgecolor=KEEPOUT_EDGE, hatch="////", linewidth=0.5, alpha=0.7,
                      zorder=2)
    colors = string_colors(system)
    if layout is not None:
        _add_modules(ax, layout, colors, dim)
        if system and labels:
            for s, st in enumerate(system.strings):
                if layout.kind == "flat_ew":   # strings snake across units: label the first module
                    cx, cy = layout.modules[st.modules[0]].center
                else:
                    cx, cy = np.array([layout.modules[i].center for i in st.modules]).mean(axis=0)
                ax.text(cx, cy, f"S{s + 1}", color="white", fontsize=fs * 0.85, ha="center", va="center",
                        fontweight="bold", zorder=5, alpha=0.4 if dim else 1)
    for ob in roof.obstacles:
        for p in _polys(ob.footprint()):
            _add_poly(ax, p, facecolor=OBSTACLE, edgecolor=OBSTACLE_EDGE, linewidth=0.8, zorder=4)
    if labels:
        for text, fp in obstacle_labels(roof):
            c = fp.centroid
            ax.text(c.x, fp.bounds[3] + 0.8, text, fontsize=fs, color=OBSTACLE_EDGE, ha="center", va="bottom",
                    zorder=6, bbox=dict(boxstyle="round,pad=0.15", fc=ROOF_FILL, ec="none", alpha=0.85))
    if system:
        for i, (x, y) in enumerate(system.inverter_xy):
            ax.add_patch(Rectangle((x - 1.0, y - 0.6), 2.0, 1.2, facecolor=INVERTER, edgecolor="#8a5400", zorder=6))
            if labels:
                ax.text(x, y + 1.0, f"INV-{i + 1}", fontsize=fs, color=TEXT, ha="center", va="bottom", zorder=6)
    if shadow_hour is not None and layout is not None:
        el, az = sun_solar_time(roof.lat, layout.design_doy, shadow_hour)
        z = layout.modules[0].z_mid if layout.modules else 0.5
        sh = casters_shadow(roof.all_casters(), z, el, az)
        for p in _polys(sh):
            _add_poly(ax, p, facecolor=SHADOW, edgecolor=SHADOW, alpha=0.28, linewidth=0.5, zorder=7)
    x0, y0, x1, y1 = rp.bounds
    pad = max(x1 - x0, y1 - y0) * 0.04 + 1
    ax.set_xlim(x0 - pad, x1 + pad * 2)
    ax.set_ylim(y0 - pad * 1.6, y1 + pad)
    # North arrow and 10 m scale bar.
    ax.annotate("N", xy=(x1 + pad * 1.2, y1), xytext=(x1 + pad * 1.2, y1 - pad * 1.6), ha="center",
                fontsize=fs + 1, color=TEXT, arrowprops=dict(arrowstyle="-|>", color=TEXT, lw=1.2))
    bar = 10 if (x1 - x0) > 25 else 5
    ax.plot([x0, x0 + bar], [y0 - pad * 0.9] * 2, color=TEXT, lw=1.3)
    ax.text(x0 + bar + 0.8, y0 - pad * 0.9, f"{bar} m", fontsize=fs, color=TEXT, va="center")


def obstacle_labels(roof: Roof):
    """One label per group of like obstacles ("AC unit 1–4 · h 1.2 m"), placed over the group."""
    import re

    from shapely.ops import unary_union

    groups: dict[tuple[str, float, str], list] = {}
    for ob in roof.obstacles:
        m = re.match(r"^(.*?)\s*(\d+)$", ob.name)
        base = m.group(1) if m else ob.name
        groups.setdefault((base, ob.height, ob.kind), []).append((m.group(2) if m else "", ob))
    out = []
    for (base, h, _), items in groups.items():
        if len(items) > 1 and all(n for n, _ in items):
            nums = sorted(int(n) for n, _ in items)
            name = f"{base} {nums[0]}–{nums[-1]}"
        else:
            name = items[0][1].name
            if len(items) > 1:
                name = f"{base} ×{len(items)}"
        out.append((f"{name} · h {h:g} m", unary_union([ob.footprint() for _, ob in items])))
    return out


def draw_loss(ax, steps: list[LossStep], fs: float = 7.5):
    ax.clear()
    ax.axis("off")
    n = len(steps)
    ax.set_xlim(0, 1)
    ax.set_ylim(n + 0.5, -1.4)
    ax.text(0.0, -1.1, "Loss diagram · year 1", fontsize=fs + 1.5, color=TEXT, fontweight="bold", va="center")
    maxpct = max([abs(s.pct) for s in steps if s.kind in ("irr", "energy")] + [1.0])
    for i, s in enumerate(steps):
        bold = s.kind in ("irr_total", "energy_total", "result")
        weight = "bold" if bold else "normal"
        ax.text(0.0, i, s.label, fontsize=fs, color=TEXT, va="center", fontweight=weight)
        if bold:
            unit = "kWh/m²" if s.kind == "irr_total" else "MWh"
            ax.text(0.60, i, f"{s.value:,.1f}", fontsize=fs, color=TEXT, va="center", ha="right", fontweight="bold")
            ax.text(0.62, i, unit, fontsize=fs, color=MUTED, va="center")
            ax.plot([0, 1], [i - 0.5, i - 0.5], color=GRID, lw=0.8)
        else:
            ax.text(0.60, i, f"{s.pct:+.1f} %", fontsize=fs, color=TEXT, va="center", ha="right")
            w = abs(s.pct) / maxpct * 0.36
            ax.add_patch(Rectangle((0.62, i - 0.22), w, 0.44, color=GAIN if s.pct > 0 else LOSS, lw=0))


def draw_monthly(ax, monthly: list[float], fs: float = 7.5, unit: str = "MWh"):
    ax.clear()
    months = "JFMAMJJASOND"
    x = np.arange(12)
    ax.bar(x, monthly, color=BAR, width=0.7, zorder=3)
    ax.set_xticks(x, list(months), fontsize=fs, color=MUTED)
    ax.tick_params(axis="y", labelsize=fs, colors=MUTED, length=0)
    ax.tick_params(axis="x", length=0)
    ax.grid(axis="y", color=GRID, lw=0.8, zorder=0)
    for sp in ax.spines.values():
        sp.set_visible(False)
    ax.set_ylabel(unit, fontsize=fs, color=MUTED)
    if monthly:
        for k in (int(np.argmax(monthly)), int(np.argmin(monthly))):
            ax.text(k, monthly[k], f"{monthly[k]:.1f}", ha="center", va="bottom", fontsize=fs, color=TEXT,
                    fontweight="bold")
        ax.set_ylim(0, max(monthly) * 1.15)


def draw_sld(ax, system: System, module_label: str, inverter_label: str, n_mppt: int, fs: float = 7.0):
    """Single-line diagram: strings → MPPT → inverter → ACDB → meter → grid."""
    ax.clear()
    ax.axis("off")
    k = system.n_inverters
    h_inv = max(n_mppt, 2) * 1.1 + 1.0
    total_h = k * (h_inv + 1.2)
    ax.set_xlim(-0.5, 18.0)
    ax.set_ylim(total_h + 0.5, -1.6)
    ax.text(0, -1.0, f"Single-line diagram · {system.n_strings} strings of {system.n_series} × {module_label}",
            fontsize=fs + 1.5, color=TEXT, fontweight="bold")
    acdb_y = []
    for i in range(k):
        y0 = i * (h_inv + 1.2)
        ax.add_patch(Rectangle((6.2, y0), 2.6, h_inv, facecolor="#e3edf7", edgecolor=TEXT, lw=1))
        ax.text(7.5, y0 + 0.35, f"INV-{i + 1}", ha="center", fontsize=fs, color=TEXT, fontweight="bold")
        ax.text(7.5, y0 + 0.75, inverter_label, ha="center", fontsize=fs - 1, color=MUTED)
        for j in range(n_mppt):
            cnt = sum(1 for a, b in zip(system.inverter_of, system.mppt_of, strict=False) if a == i and b == j)
            yj = y0 + 1.2 + j * 1.1
            color = MPPT_COLORS[(i * n_mppt + j) % len(MPPT_COLORS)]
            if cnt:
                ax.add_patch(Rectangle((0.2, yj - 0.3), 2.2, 0.6, facecolor=color, edgecolor="none"))
                ax.text(1.3, yj, f"{cnt} × {system.n_series} mod", ha="center", va="center", fontsize=fs - 0.5,
                        color="white")
                ax.plot([2.4, 6.2], [yj, yj], color=TEXT, lw=0.8)
                ax.text(4.3, yj - 0.12, f"MPPT {j + 1} · DC", ha="center", va="bottom", fontsize=fs - 1, color=MUTED)
            else:
                ax.text(4.3, yj, f"MPPT {j + 1} · not used", ha="center", va="center", fontsize=fs - 1, color=MUTED)
        ym = y0 + h_inv / 2
        ax.plot([8.8, 10.6], [ym, ym], color=TEXT, lw=1.2)
        ax.text(9.7, ym - 0.12, "AC", ha="center", va="bottom", fontsize=fs - 1, color=MUTED)
        acdb_y.append(ym)
    top, bot = min(acdb_y) - 0.6, max(acdb_y) + 0.6
    ax.add_patch(Rectangle((10.6, top), 1.4, bot - top, facecolor="white", edgecolor=TEXT, lw=1))
    ax.text(11.3, top - 0.15, "ACDB", ha="center", va="bottom", fontsize=fs, color=TEXT, fontweight="bold")
    ym = (top + bot) / 2
    ax.plot([12.0, 13.4], [ym, ym], color=TEXT, lw=1.2)
    ax.add_patch(Rectangle((13.4, ym - 0.45), 1.1, 0.9, facecolor="white", edgecolor=TEXT, lw=1))
    ax.text(13.95, ym, "kWh", ha="center", va="center", fontsize=fs - 0.5, color=TEXT)
    ax.text(13.95, ym + 0.75, "Net meter", ha="center", va="top", fontsize=fs - 1, color=MUTED)
    ax.plot([14.5, 16.0], [ym, ym], color=TEXT, lw=1.2)
    ax.text(16.1, ym, "Grid /\nLT panel", va="center", fontsize=fs - 0.5, color=TEXT)
