"""The project: everything the user entered. Mirrors rooftop_core.project.Project and the .rtd file."""

from typing import Annotated, Literal

from pydantic import Field, PositiveInt

from rooftop_api.schemas.array import ArraySpec
from rooftop_api.schemas.common import Compass, Input
from rooftop_api.schemas.losses import Losses
from rooftop_api.schemas.roof import Roof
from rooftop_api.schemas.weather import Weather, WeatherSource

SYSTEM_VOLTAGES = [600, 1000, 1500]
SystemVoltage = Annotated[
    Literal[600, 1000, 1500],
    Field(
        description=(
            "Volts. The API has no default: without one nothing is sized. "
            "The web app sets it from the user's country (D87)."
        )
    ),
]
VoltageSetBy = Annotated[
    Literal["app", "user"],
    Field(
        description=(
            "Who set the system voltage: the app, from the user's country, or the user. "
            "Null without a voltage."
        )
    ),
]
VocCoefficient = Annotated[
    float,
    Field(
        gt=-1,
        lt=0,
        description="%/degC. Entered by the user from the datasheet; null: the one-diode model's Voc",
    ),
]
FileName = Annotated[str, Field(max_length=1024)]
FileText = Annotated[str, Field(max_length=2_000_000)]
CsvText = Annotated[str, Field(max_length=8_000_000)]


class RoofInput(Input):
    """How the roof was entered, so the same controls can show it again."""

    mode: Literal["rect", "corners"] = "rect"
    length: float = 30.0
    width: float = 20.0
    facing: Compass = 180.0
    file: FileName = ""
    dxf_units: Literal["m", "mm"] = "m"


class Project(Input):
    """A whole project. It is also the content of a .rtd file, format 2 (format 1 is accepted).

    A PAN or OND travels as text (pan_text, ond_text); the path then only names the file. Empty path and
    empty text mean the bundled sample. A path without text names a file that must be chosen again.
    """

    format: Literal[1, 2] = 2
    name: Annotated[str, Field(max_length=200)] = "Untitled roof"
    roof: Roof
    array: ArraySpec = ArraySpec()
    losses: Losses = Losses()
    pan_path: FileName = ""
    ond_path: FileName = ""
    pan_text: FileText = ""
    ond_text: FileText = ""
    weather_source: WeatherSource = "pvgis"
    weather_csv: FileName = ""
    weather_csv_text: CsvText = ""
    system_voltage: SystemVoltage | None = None
    system_voltage_by: VoltageSetBy | None = None
    cell_rise_c: Annotated[float, Field(ge=0, le=100)] | None = None
    t_min_override: Annotated[float, Field(ge=-90, le=60)] | None = None
    t_max_override: Annotated[float, Field(ge=-90, le=70)] | None = None
    imax_mppt_override: Annotated[float, Field(gt=0)] | None = None
    voc_coefficient_pct: VocCoefficient | None = None
    chosen_option: Annotated[str, Field(max_length=40)] = ""
    custom: tuple[PositiveInt, PositiveInt, PositiveInt] | None = None
    ac_cable_m: Annotated[float, Field(ge=0)] = 30.0
    roof_input: RoofInput = RoofInput()
    weather_json: Weather | None = None
