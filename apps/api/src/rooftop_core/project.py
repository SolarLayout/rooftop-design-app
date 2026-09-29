# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""The project (everything the user entered) and the design run built from it."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field, fields
from pathlib import Path

from . import weather as wx
from .geometry import Obstacle, Roof
from .io.pvsyst import Inverter, Module, read_ond, read_pan
from .onediode import Coefficients, ModuleModel
from .options import StringOption, build_options, custom_option
from .placement import ArraySpec, Layout, place
from .resources import sample_path
from .simulation import Losses, Precomputed, precompute
from .stringing import CELL_RISE, SeriesRange, series_range

FILE_SUFFIX = ".rtd"
FORMAT_VERSION = 1


@dataclass
class Project:
    name: str = "Untitled roof"
    roof: Roof = field(default_factory=lambda: Roof(outline=[(0, 0), (30, 0), (30, 20), (0, 20)], lat=18.52, lon=73.86))
    array: ArraySpec = field(default_factory=ArraySpec)
    losses: Losses = field(default_factory=Losses)
    pan_path: str = ""                       # empty: the bundled sample
    ond_path: str = ""
    weather_source: str = "pvgis"
    weather_csv: str = ""
    system_voltage: float | None = None      # decision F7: the user must choose
    cell_rise_c: float | None = None         # None: by roof type (decision 14)
    t_min_override: float | None = None
    t_max_override: float | None = None
    imax_mppt_override: float | None = None  # datasheet value when the OND lacks it
    chosen_option: str = ""                  # StringOption.key
    custom: tuple[int, int, int] | None = None
    ac_cable_m: float = 30.0
    # How the roof was entered, so the Roof tab shows it again.
    roof_input: dict = field(default_factory=lambda: {"mode": "rect", "length": 30.0, "width": 20.0,
                                                       "facing": 180.0, "file": "", "dxf_units": "m"})
    weather_json: dict | None = None         # embedded so the project opens offline

    def to_json(self) -> dict:
        d = asdict(self)
        d["format"] = FORMAT_VERSION
        return d

    @classmethod
    def from_json(cls, d: dict) -> Project:
        d = dict(d)
        d.pop("format", None)
        roof_d = dict(d.pop("roof"))
        obs = [Obstacle(**{k: (v if k != "points" else [tuple(p) for p in v]) for k, v in o.items()})
               for o in roof_d.pop("obstacles", [])]
        roof_d["outline"] = [tuple(p) for p in roof_d["outline"]]
        roof = Roof(**_known(Roof, roof_d), obstacles=obs)
        arr = ArraySpec(**_known(ArraySpec, d.pop("array", {})))
        los_d = d.pop("losses", {})
        if "p_levels" in los_d:
            los_d["p_levels"] = tuple(los_d["p_levels"])
        losses = Losses(**_known(Losses, los_d))
        if d.get("custom"):
            d["custom"] = tuple(d["custom"])
        return cls(roof=roof, array=arr, losses=losses, **_known(cls, d))

    def save(self, path: str | Path) -> None:
        Path(path).write_text(json.dumps(self.to_json(), indent=1))

    @classmethod
    def load(cls, path: str | Path) -> Project:
        return cls.from_json(json.loads(Path(path).read_text()))


def _known(cls, d: dict) -> dict:
    names = {f.name for f in fields(cls)} - {"roof", "array", "losses", "obstacles"}
    return {k: v for k, v in d.items() if k in names}


class Design:
    """Runs the pipeline for a project and keeps the intermediate results."""

    def __init__(self, project: Project):
        self.p = project
        self.module: Module = read_pan(project.pan_path or sample_path("Test.PAN"))
        self.inverter: Inverter = read_ond(project.ond_path or sample_path("Test-S.ond"))
        self.ond_imax = self.inverter.imax_mppt_a
        self._ond_iscmax = self.inverter.isc_max_mppt_a
        self.apply_imax(project.imax_mppt_override)
        self.mm = ModuleModel(self.module)
        self.coeffs: Coefficients = self.mm.coefficients()
        self.weather: wx.Weather | None = None
        self.layout: Layout | None = None
        self.pre: Precomputed | None = None
        self.range: SeriesRange | None = None
        self.options: list[StringOption] = []

    @property
    def default_imax(self) -> float:
        inv = self.inverter
        return self.ond_imax or (inv.idc_max_a / inv.n_mppt if inv.idc_max_a and inv.n_mppt else 0.0)

    def apply_imax(self, value: float | None) -> None:
        """Per-MPPT current limit from the datasheet when the OND lacks it (decision F2)."""
        self.p.imax_mppt_override = value
        self.inverter.imax_mppt_a = value or self.ond_imax
        self.inverter.isc_max_mppt_a = value or self._ond_iscmax

    # ── steps ────────────────────────────────────────────────────────────
    def load_weather(self, force: bool = False) -> wx.Weather:
        p = self.p
        if self.weather is not None and not force:
            return self.weather
        j = p.weather_json
        if j and not force and j.get("source") == p.weather_source and \
                abs(j["lat"] - p.roof.lat) < 1e-3 and abs(j["lon"] - p.roof.lon) < 1e-3:
            self.weather = wx.Weather.from_json(j)
        else:
            self.weather = wx.load(p.weather_source, p.roof.lat, p.roof.lon, p.weather_csv or None)
            p.weather_json = self.weather.to_json()
        self.pre = None
        return self.weather

    def generate_layout(self) -> Layout:
        self.layout = place(self.p.roof, self.p.array, self.module)
        self.pre = None
        self.options = []
        return self.layout

    @property
    def t_min(self) -> float:
        if self.p.t_min_override is not None:
            return self.p.t_min_override
        return self.weather.t_min if self.weather else 5.0

    @property
    def t_max(self) -> float:
        if self.p.t_max_override is not None:
            return self.p.t_max_override
        return self.weather.t_max if self.weather else 40.0

    @property
    def cell_rise(self) -> float:
        return self.p.cell_rise_c if self.p.cell_rise_c is not None else CELL_RISE[self.p.roof.roof_type]

    def size_series(self) -> SeriesRange | None:
        if not self.p.system_voltage:
            self.range = None
            return None
        self.range = series_range(self.mm, self.inverter, self.p.system_voltage, self.t_min, self.t_max,
                                  self.cell_rise)
        return self.range

    def prepare(self) -> Precomputed:
        if self.layout is None:
            self.generate_layout()
        self.load_weather()
        if self.pre is None:
            self.pre = precompute(self.weather, self.layout, self.p.roof, self.module, self.p.array.orientation,
                                  self.p.losses)
        return self.pre

    def run_options(self) -> list[StringOption]:
        self.prepare()
        rng = self.size_series()
        if rng is None:
            self.options = []
            return []
        self.options = build_options(self.pre, self.layout, self.module, self.mm, self.inverter, rng,
                                     self.p.losses, self.p.roof)
        if self.p.custom:
            n, s, k = self.p.custom
            self.options.append(custom_option(self.pre, self.layout, self.module, self.mm, self.inverter,
                                              self.p.losses, self.p.roof, n, s, k,
                                              "ABCDEFGH"[len(self.options)]))
        keys = [o.key for o in self.options]
        if self.p.chosen_option not in keys and self.options:
            self.p.chosen_option = self.options[0].key
        return self.options

    @property
    def chosen(self) -> StringOption | None:
        for o in self.options:
            if o.key == self.p.chosen_option:
                return o
        return self.options[0] if self.options else None
