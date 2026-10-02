"""A design run: its progress, and at the end the layout, the shading, the series range and the options.

Mirrors rooftop_core: stringing.SeriesRange and System, options.StringOption, simulation.SimResult,
bom.BomLine and CableRow, readouts.Verdict and MpptLoad, shade_summary.ShadeSummary.
"""

from typing import Annotated, Literal

from pydantic import BaseModel, Field

from rooftop_api.schemas.common import Point
from rooftop_api.schemas.equipment import Coefficients, CurrentPerMppt, Inverter, Module
from rooftop_api.schemas.errors import ErrorDetail
from rooftop_api.schemas.layout import Layout, LayoutReadouts
from rooftop_api.schemas.weather import WeatherSummary

NoOptionsCode = Literal[
    "no_positions", "system_voltage_missing", "no_string_length_fits", "too_few_positions"
]
ValueFrom = Literal["weather", "entered"]
DefaultFrom = Literal["roof type", "entered"]
StepKind = Literal["irr_total", "irr", "energy_total", "energy", "result"]


class Shading(BaseModel):
    """What shading costs over the year, counted over every position of the layout.

    The loss chain of an option has the same figures for the modules that option uses.
    """

    near_pct: float = Field(description="Irradiation lost to near shading, all positions together")
    far_pct: float = Field(description="Irradiation lost to the horizon")
    near_pct_by_module: list[float] = Field(description="Near shading of every position, by its idx")
    keepout_area_m2: float = Field(description="Left empty inside the setback because of shadows")


class Equipment(BaseModel):
    """The module and the inverter of the run, as read from the project."""

    module: Module
    inverter: Inverter
    coefficients: Coefficients
    module_notes: list[str]
    max_current_per_mppt: CurrentPerMppt


class Sizing(BaseModel):
    """The temperatures the strings are sized with, and where each comes from."""

    t_min_c: float = Field(description="Lowest ambient temperature")
    t_max_c: float = Field(description="Highest ambient temperature")
    t_min_from: ValueFrom
    t_max_from: ValueFrom
    cell_rise_c: float = Field(description="Cell temperature above ambient, for the hot end")
    cell_rise_from: DefaultFrom
    uc: float = Field(description="Thermal loss factor, W/m2K")
    uc_from: DefaultFrom


class SeriesRange(BaseModel):
    """How many modules may be in series, and what sets the limits."""

    system_v: float
    t_min: float
    t_cell_hot: float
    voc_cold: float = Field(description="Of one module, at the lowest ambient temperature")
    vmp_cold: float
    vmp_hot: float
    vmp_stc: float
    n_min: int
    n_max_voc: int
    n_max_mppt: int
    n_max: int
    n_nominal: int
    limit_v: float
    ok: bool = Field(description="False when no length fits; the message then says why")
    message: str
    upper_limit: Literal["Voc limit", "MPPT max"] = Field(description="What sets n_max")
    limit_note: str


class StringsOfLength(BaseModel):
    n_series: int
    strings: int = Field(description="How many strings of n_series modules the roof holds")


class Verdict(BaseModel):
    """Shown with a tick when ok, with an exclamation mark when not. Never with a cross."""

    ok: bool
    title: str
    detail: str


class PVString(BaseModel):
    """One string: its modules in the order they are wired, and where it is connected."""

    label: str
    modules: list[int] = Field(description="idx of the positions in the layout")
    row: int
    azimuth: float
    start: Point
    extent_m: float
    inverter: int = Field(description="From 1")
    mppt: int = Field(description="From 1, within its inverter")
    shade_pct: float = Field(description="Beam lost over the year to electrical shading of the string")


class InverterPlace(BaseModel):
    label: str
    position: Point


class System(BaseModel):
    n_series: int
    n_strings: int
    n_inverters: int
    n_modules: int
    strings: list[PVString]
    inverters: list[InverterPlace]


class LossStep(BaseModel):
    label: str
    value: float = Field(description="kWh/m2 for steps of irradiance, MWh for steps of energy")
    kind: StepKind
    pct: float = Field(description="Change against the step before; 0 for totals")


class PValue(BaseModel):
    level: int = Field(description="Exceedance probability, as in P90")
    mwh: float


class Energy(BaseModel):
    """The result of the simulation of a year. The hours themselves are the CSV export."""

    energy_mwh: float
    dc_kwp: float
    ac_kw: float
    pr: float = Field(description="Performance ratio as a fraction")
    specific_yield: float = Field(description="kWh/kWp")
    cuf_ac_pct: float
    cuf_dc_pct: float
    poa_kwh_m2: float
    ghi_kwh_m2: float
    clipping_pct: float
    sigma_pct: float
    lid_pct: float
    co2_t: float
    steps: list[LossStep]
    monthly_mwh: list[float]
    p_values: list[PValue]
    years_mwh: list[float] = Field(description="Year 1 to year 25")
    total_25_years_mwh: float


class MpptLoad(BaseModel):
    inverter: int
    mppt: int
    label: str
    strings: int
    imp_a: float
    imp_limit_a: float | None = Field(description="null: the OND gives no limit and none was entered")
    isc_a: float
    isc_limit_a: float | None
    kwp: float
    ok: bool = Field(description="Within both limits. False also when a limit is not known")


class BomLine(BaseModel):
    item: str
    spec: str
    qty: float
    unit: str


class CableRow(BaseModel):
    string: str
    inverter: str
    mppt: int
    modules: int
    voc_cold_v: float
    isc_a: float
    length_m: float
    size: str


class SummaryRow(BaseModel):
    label: str
    value: str


class Option(BaseModel):
    """A stringing the user may choose, with its full results."""

    key: str = Field(
        description='series x strings x inverters, as in 29x22x1; "custom" for the custom option'
    )
    letter: str
    title: str
    caption: str = Field(
        description='What sets the option apart, as in "Recommended" or "Your own"; may be empty'
    )
    n_series: int
    n_strings: int
    n_inverters: int
    n_modules: int
    available_strings: int
    dc_kwp: float
    dcac: float
    ok: bool = Field(description="DC/AC is inside the target")
    note: str
    recommended: bool
    custom: bool
    module_area_m2: float
    roof_covered_pct: float
    verdict: Verdict
    system: System
    energy: Energy
    mppt_loads: list[MpptLoad]
    bom: list[BomLine]
    cable_schedule: list[CableRow]
    summary: list[SummaryRow]


class NoOptions(BaseModel):
    """Why the run has no options, in words for the user."""

    code: NoOptionsCode
    title: str
    message: str


class DesignResult(BaseModel):
    """Everything a run gives. Without options, no_options says why and nothing is chosen."""

    layout: Layout
    readouts: LayoutReadouts
    weather: WeatherSummary
    weather_notes: list[str]
    far_shading_note: str
    shading: Shading
    equipment: Equipment
    sizing: Sizing
    series_range: SeriesRange | None
    strings_by_series: list[StringsOfLength] = Field(
        description="Each length of the series range; empty without a range or when no length fits"
    )
    options: list[Option]
    options_note: str | None
    custom_refused: Verdict | None = Field(
        description="Why the custom option was not simulated; null when it was or there is none"
    )
    chosen_option: str | None
    no_options: NoOptions | None


class DesignProgress(BaseModel):
    type: Literal["progress"] = "progress"
    step: str = Field(description="What the engine is doing, in words for the user")
    fraction: float = Field(description="0 to 1 of the whole run; 1 only when the run is over")


class DesignDone(BaseModel):
    type: Literal["result"] = "result"
    result: DesignResult


class DesignFailed(BaseModel):
    type: Literal["error"] = "error"
    error: ErrorDetail


DesignEvent = Annotated[DesignProgress | DesignDone | DesignFailed, Field(discriminator="type")]
