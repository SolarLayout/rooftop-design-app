"""Module (PAN) and inverter (OND). Mirrors rooftop_core.io.pvsyst and rooftop_core.onediode."""

from typing import Annotated, Literal, Self

from pydantic import BaseModel, Field, model_validator

from rooftop_api.schemas.common import Input, Point
from rooftop_api.schemas.limits import MAX_EQUIPMENT_BASE64, MAX_EQUIPMENT_TEXT

CoefficientSource = Literal["one-diode model", "PAN file", "entered"]
CurrentSource = Literal["OND file", "IMaxDC over the MPPT count", "not in the OND"]


class EquipmentFile(Input):
    """A PAN or OND file: its name, and its content either as text or as base64 of its bytes."""

    name: Annotated[str, Field(min_length=1, max_length=255)]
    text: Annotated[str, Field(max_length=MAX_EQUIPMENT_TEXT)] | None = None
    base64: Annotated[str, Field(max_length=MAX_EQUIPMENT_BASE64)] | None = None

    @model_validator(mode="after")
    def has_its_content_once(self) -> Self:
        if (self.text is None) == (self.base64 is None):
            raise ValueError(
                "give the content of the file either as text or as base64, not both and not neither"
            )
        return self


class Module(BaseModel):
    """A PV module as its PAN file describes it."""

    manufacturer: str
    model: str
    pnom_w: float
    length_m: float
    width_m: float
    technology: str
    n_cells_series: int
    n_cells_parallel: int
    n_diodes: int
    half_cell: bool
    isc: float
    voc: float
    imp: float
    vmp: float
    mu_isc_ma: float
    mu_voc_mv: float = Field(description="mV/degC; 0 when the file does not give it")
    mu_pmpp_pct: float = Field(description="%/degC; 0 when the file does not give it")
    r_shunt: float
    r_shunt_0: float
    r_shunt_exp: float
    r_series: float
    gamma: float
    mu_gamma: float
    v_max_iec: float
    v_max_from_file: bool = Field(
        description="Whether the file gives the module's highest system voltage; when not, 1000 V is taken"
    )
    bifaciality: float
    lid_loss_pct: float | None
    iam_profile: list[Point] = Field(description="(angle of incidence in degrees, factor)")
    source: str
    area_m2: float
    efficiency: float
    is_bifacial: bool


class Coefficients(BaseModel):
    """Temperature coefficients, and whether the file gave them, the one-diode model, or the user (the Voc
    coefficient entered in the project)."""

    mu_voc_mv: float
    mu_voc_pct: float
    mu_vmp_pct: float
    mu_pmpp_pct: float
    source: CoefficientSource


class ModuleResponse(BaseModel):
    """A module read from a PAN file."""

    file: str
    module: Module
    coefficients: Coefficients
    notes: list[str]
    text: str = Field(description="The content of the file as text, to embed in the project as pan_text")


class EfficiencyCurve(BaseModel):
    """Input power against output power, in watts, at one DC voltage."""

    voltage: float
    points: list[Point]


class Inverter(BaseModel):
    """A string inverter as its OND file describes it."""

    manufacturer: str
    model: str
    pnom_kw: float
    pmax_kw: float
    vmpp_min: float
    vmpp_max: float
    vmpp_nom: float = Field(
        description="The nominal MPP voltage; 0 when the file gives neither VmppNom nor VNomEff"
    )
    vmpp_nom_from: str = Field(
        description='Where vmpp_nom comes from: "VmppNom", the file\'s own; "VNomEff", the middle of '
        "the voltages its efficiency was measured at, when the file gives no VmppNom; "
        '"" when it gives neither'
    )
    vabs_max: float
    pseuil_w: float
    idc_max_a: float
    n_mppt: int
    n_inputs: int
    imax_mppt_a: float = Field(description="Per MPPT; 0 when the file does not give it")
    isc_max_mppt_a: float = Field(description="Per MPPT; 0 when the file does not give it")
    effic_max_pct: float
    effic_euro_pct: float
    night_loss_w: float
    v_out_v: float
    i_max_ac_a: float
    width_m: float = Field(description="Width of the box; 0 when the file does not give it")
    depth_m: float = Field(description="Depth of the box; 0 when the file does not give it")
    curves: list[EfficiencyCurve]
    curve_euro_pct: list[float]
    source: str
    mppt_current_limit: float
    mppt_isc_limit: float


class CurrentPerMppt(BaseModel):
    """The default of the largest current per MPPT, and where it comes from."""

    value_a: float | None
    source: CurrentSource
    note: str


class InverterResponse(BaseModel):
    """An inverter read from an OND file."""

    file: str
    inverter: Inverter
    max_current_per_mppt: CurrentPerMppt
    text: str = Field(description="The content of the file as text, to embed in the project as ond_text")
