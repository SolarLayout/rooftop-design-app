# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""The project (everything the user entered) and the design run built from it."""

from __future__ import annotations

import json
from collections.abc import Callable
from dataclasses import asdict, dataclass, field, fields, replace
from pathlib import Path

from . import memo as memo_mod
from . import progress
from . import shading as shading_mod
from . import weather as wx
from .errors import MissingEquipmentFile, UnsupportedProjectFormat, WeatherNotLoaded
from .geometry import Obstacle, Roof
from .io.pvsyst import Inverter, Module, parse_ond, parse_pan, read_ond, read_pan
from .onediode import Coefficients, ModuleModel
from .options import CustomMisfit, StringOption, build_options, custom_misfit, custom_option
from .paths import file_name
from .placement import ArraySpec, Layout, place
from .resources import SAMPLE_OND, SAMPLE_PAN, sample_path
from .simulation import Losses, Precomputed, after_the_year, precompute
from .stringing import CELL_RISE, SeriesRange, series_range

FILE_SUFFIX = ".rtd"
FORMAT_VERSION = 2          # embeds the PAN, OND and CSV text; format 1 held paths to them
READABLE_FORMATS = (1, 2)


@dataclass
class Project:
    name: str = "Untitled roof"
    roof: Roof = field(default_factory=lambda: Roof(outline=[(0, 0), (30, 0), (30, 20), (0, 20)], lat=18.52, lon=73.86))
    array: ArraySpec = field(default_factory=ArraySpec)
    losses: Losses = field(default_factory=Losses)
    pan_path: str = ""                       # empty: the bundled sample. With pan_text: the file's name
    ond_path: str = ""
    pan_text: str = ""                       # the content of the PAN file (format 2)
    ond_text: str = ""
    weather_source: str = "pvgis"
    weather_csv: str = ""                    # the name of the CSV file; its content is weather_csv_text
    weather_csv_text: str = ""
    system_voltage: float | None = None      # decision F7: the user must choose
    cell_rise_c: float | None = None         # None: by roof type (decision 14)
    t_min_override: float | None = None
    t_max_override: float | None = None
    imax_mppt_override: float | None = None  # datasheet value when the OND lacks it
    voc_coefficient_pct: float | None = None  # %/°C from the datasheet; None: the one-diode model's Voc
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
        fmt = d.pop("format", 1)
        if fmt not in READABLE_FORMATS:
            raise UnsupportedProjectFormat(
                f"This project file is format {fmt}. This version reads formats "
                f"{' and '.join(map(str, READABLE_FORMATS))}. Open it with a newer version of the app.",
                field="format")
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

    def to_text(self) -> str:
        """The content of a .rtd file: the one writer of the format."""
        return json.dumps(self.to_json(), indent=1)

    def save(self, path: str | Path) -> None:
        Path(path).write_text(self.to_text())

    @classmethod
    def load(cls, path: str | Path) -> Project:
        return cls.from_json(json.loads(Path(path).read_text()))


def _known(cls, d: dict) -> dict:
    names = {f.name for f in fields(cls)} - {"roof", "array", "losses", "obstacles"}
    return {k: v for k, v in d.items() if k in names}


def not_included(what: str, path: str, kind: str = "") -> str:
    """The words for a file the project names by path without its text: it must be chosen again."""
    name = file_name(path) + (f" ({kind})" if kind else "")
    return f"The {what} file {name} is not included in this project. Choose it again."


def _here(path: str, what: str, kind: str, field_name: str, local_files: bool) -> str:
    """The path of a PAN or OND file of the project, or the error that asks for the file again."""
    if not local_files or not Path(path).is_file():
        raise MissingEquipmentFile(not_included(what, path, kind), field=field_name)
    return path


def module_of(p: Project, local_files: bool = True) -> Module:
    """The module of the project: its embedded PAN, else the file it names, else the bundled sample.

    With *local_files* false a named file is never read from this machine: a server has no business
    with paths that arrive in a request.
    """
    if p.pan_text:
        return parse_pan(p.pan_text, file_name(p.pan_path))
    if not p.pan_path:
        return read_pan(sample_path(SAMPLE_PAN))
    return read_pan(_here(p.pan_path, "module", "PAN", "pan_path", local_files))


def inverter_of(p: Project, local_files: bool = True) -> Inverter:
    """The inverter of the project: its embedded OND, else the file it names, else the bundled sample."""
    if p.ond_text:
        return parse_ond(p.ond_text, file_name(p.ond_path))
    if not p.ond_path:
        return read_ond(sample_path(SAMPLE_OND))
    return read_ond(_here(p.ond_path, "inverter", "OND", "ond_path", local_files))


class Design:
    """Runs the pipeline for a project and keeps the intermediate results."""

    def __init__(self, project: Project, local_files: bool = True, memo: memo_mod.Memo | None = None):
        """*local_files* false: files named by the project are never read from this machine.

        *memo* keeps the hourly shading and the options between runs. The results are the same
        without it.
        """
        self.p = project
        self.local_files = local_files
        self.memo = memo
        self.module: Module = module_of(project, local_files)
        self.inverter: Inverter = inverter_of(project, local_files)
        self.ond_imax = self.inverter.imax_mppt_a
        self._ond_iscmax = self.inverter.isc_max_mppt_a
        self.apply_imax(project.imax_mppt_override)
        self.mm = ModuleModel(self.module)
        self.coeffs: Coefficients = self.mm.coefficients(project.voc_coefficient_pct)
        self.weather: wx.Weather | None = None
        self.layout: Layout | None = None
        self.pre: Precomputed | None = None
        self.range: SeriesRange | None = None
        self.options: list[StringOption] = []
        self.custom_misfit: CustomMisfit | None = None  # why the custom option was not simulated

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
    def load_weather(self, force: bool = False, download: bool = False,
                     cache: wx.WeatherCache | None = None) -> wx.Weather:
        """The weather of the project: the one embedded in it, or its CSV, or a download.

        PVGIS and NASA POWER are only asked when *download* is true. Without it, a project that has
        no weather for its site and source raises WeatherNotLoaded. *force* sets the embedded
        weather aside and reads the source again.
        """
        p = self.p
        if self.weather is not None and not force:
            return self.weather
        j = p.weather_json
        if j and not force and self._embedded_weather_fits():
            self.weather = wx.Weather.from_json(j)
        else:
            if p.weather_source != "csv" and not download:
                raise WeatherNotLoaded(self._weather_missing_message(), field="weather_json")
            if p.weather_source == "csv" and p.weather_csv and not p.weather_csv_text and not self.local_files:
                raise WeatherNotLoaded(not_included("CSV weather", p.weather_csv), field="weather_csv")
            self.weather = wx.load(p.weather_source, p.roof.lat, p.roof.lon, p.weather_csv or None,
                                   p.weather_csv_text, cache)
            p.weather_json = self.weather.to_json()
        self.pre = None
        return self.weather

    def _embedded_weather_fits(self) -> bool:
        j, p = self.p.weather_json, self.p
        return j.get("source") == p.weather_source and \
            abs(j["lat"] - p.roof.lat) < 1e-3 and abs(j["lon"] - p.roof.lon) < 1e-3

    def _weather_missing_message(self) -> str:
        j, p = self.p.weather_json, self.p
        wanted = wx.SOURCE_LABELS.get(p.weather_source, p.weather_source)
        here = f"{p.roof.lat:.4f}, {p.roof.lon:.4f}"
        if not j:
            return f"This project has no weather for {here} yet. Load the {wanted} weather first."
        return (f"The weather in this project is {j['label']} for {j['lat']:.4f}, {j['lon']:.4f}, not for "
                f"this site or source. Load the {wanted} weather for {here}.")

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
                                  self.cell_rise, self.p.voc_coefficient_pct)
        return self.range

    def prepare(self, on_progress: progress.ProgressCallback | None = None) -> Precomputed:
        """Layout, weather, hourly shading and transposition, whatever of them is not there yet.

        *on_progress* hears every step that runs, and at the end an event with fraction 1.
        """
        report = progress.Reporter(on_progress)
        self._prepare(report, share=1.0)
        report.finish(progress.LOSSES)
        return self.pre

    def _prepare(self, report: progress.Reporter, share: float) -> None:
        """The steps of prepare, reported as the first *share* of the run they are part of."""
        if self.layout is None:
            report.begin(progress.FITTING, progress.FITTING_AT * share)
            self.generate_layout()
        if self.weather is None:
            source = wx.SOURCE_LABELS.get(self.p.weather_source, self.p.weather_source)
            report.begin(progress.loading_weather(source), progress.WEATHER_AT * share)
            self.load_weather()
        if self.pre is None:
            report.begin(progress.SHADING, progress.SHADING_AT * share, until=progress.LOSSES_AT * share)
            shading = self._shading(report.part)
            report.begin(progress.LOSSES, progress.LOSSES_AT * share)
            self.pre = precompute(self.weather, self.layout, self.p.roof, self.module, self.p.array.orientation,
                                  self.p.losses, shading=shading)

    def _shading(self, on_part: progress.PartCallback | None = None) -> shading_mod.ShadingResult:
        """Hourly shading of every module, with the sun where precompute puts it."""
        def compute() -> shading_mod.ShadingResult:
            sun = wx.solar_position(self.weather)
            return shading_mod.compute(self.layout, self.p.roof, self.module, self.p.array.orientation,
                                       sun["apparent_elevation"].to_numpy(), sun["azimuth"].to_numpy(),
                                       self.weather.horizon, on_part=on_part)

        if self.memo is None:
            return compute()
        return self.memo.shading(memo_mod.shading_key(self), compute)

    def run_options(self, on_progress: progress.ProgressCallback | None = None) -> list[StringOption]:
        """Prepare, size the strings and simulate the options. Without a system voltage: no options.

        *on_progress* hears every step that runs, and at the end an event with fraction 1.
        """
        report = progress.Reporter(on_progress)
        self._prepare(report, share=progress.OPTIONS_AT)
        rng = self.size_series()
        if rng is not None:
            report.begin(progress.OPTIONS, progress.OPTIONS_AT, until=1.0)
            self._build_options(rng, report.part)
        else:
            self.options, self.custom_misfit = [], None
        report.finish(progress.OPTIONS if rng is not None else progress.LOSSES)
        return self.options

    def _build_options(self, rng: SeriesRange, on_part: progress.PartCallback | None = None) -> None:
        """The options offered, and the custom one after them when it can be built (decision 8).

        When no length fits nothing is said of the custom option: no option is built at all.
        """
        custom = self.p.custom if rng.ok else None
        self.custom_misfit = custom_misfit(rng, self.layout, *custom) if custom else None
        simulated = custom if self.custom_misfit is None else None

        def build() -> list[StringOption]:
            more = 1 if simulated else 0       # the custom option is simulated after the others
            heard = (lambda done, total: on_part(done, total + more)) if on_part else None
            return build_options(self.pre, self.layout, self.module, self.mm, self.inverter, rng,
                                 self.p.losses, self.p.roof, on_option=heard)

        offered = self._kept(memo_mod.options_key, build)
        if simulated:
            n, s, k = simulated

            def build_custom() -> list[StringOption]:
                return [custom_option(self.pre, self.layout, self.module, self.mm, self.inverter,
                                      self.p.losses, self.p.roof, n, s, k, "ABCDEFGH"[len(offered)])]

            offered = offered + self._kept(memo_mod.custom_key, build_custom)
        # The memo keeps the options as simulated; the figures after the year are this project's. Each
        # option is a copy of the kept one (MemoryMemo.options), so the kept one is left as it is.
        self.options = [replace(o, result=after_the_year(o.result, self.p.losses)) for o in offered]
        keys = [o.key for o in self.options]
        if self.p.chosen_option not in keys and self.options:
            self.p.chosen_option = self.options[0].key

    def _kept(self, key_of: Callable[[Design], str], build: Callable[[], list[StringOption]]) -> list[StringOption]:
        """What *build* makes, from the memo under the key *key_of* gives the design, when there is one."""
        return build() if self.memo is None else self.memo.options(key_of(self), build)

    @property
    def chosen(self) -> StringOption | None:
        for o in self.options:
            if o.key == self.p.chosen_option:
                return o
        return self.options[0] if self.options else None
