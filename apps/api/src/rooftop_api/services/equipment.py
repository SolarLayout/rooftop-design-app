"""A PAN or OND file read for the user: its fields, what follows from them, and notes."""

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_api.services.uploads import bytes_of, file_name
from rooftop_core.io.pvsyst import Inverter, decode_pvsyst, parse_ond, parse_pan
from rooftop_core.onediode import ModuleModel

FROM_THE_OND = "From the OND file."
NO_CURRENT_AT_ALL = (
    "Not in the OND, and the OND has no IMaxDC to work it out from. Enter the datasheet value."
)


def content_of(file: schemas.EquipmentFile) -> tuple[str, str]:
    """(the text of the file, the field of the request it came in)."""
    if file.text is not None:
        return file.text, "text"
    return decode_pvsyst(bytes_of(file.base64 or "", file_name(file.name))), "base64"


def read_module(file: schemas.EquipmentFile) -> schemas.ModuleResponse:
    name = file_name(file.name)
    text, field = content_of(file)
    try:
        module = parse_pan(text, name)
    except ValueError as error:
        raise ApiError(UNPROCESSABLE, "not_a_pan_file", str(error), field) from error
    coefficients = ModuleModel(module).coefficients()
    return schemas.ModuleResponse(
        file=name,
        module=convert.module_from_engine(module),
        coefficients=convert.coefficients_from_engine(coefficients),
        notes=[coefficients.warning] if coefficients.warning else [],
        text=text,
    )


def read_inverter(file: schemas.EquipmentFile) -> schemas.InverterResponse:
    name = file_name(file.name)
    text, field = content_of(file)
    try:
        inverter = parse_ond(text, name)
    except ValueError as error:
        raise ApiError(UNPROCESSABLE, "not_an_ond_file", str(error), field) from error
    return schemas.InverterResponse(
        file=name,
        inverter=convert.inverter_from_engine(inverter),
        max_current_per_mppt=current_per_mppt(inverter),
        text=text,
    )


def current_per_mppt(inverter: Inverter) -> schemas.CurrentPerMppt:
    """The default of the largest current per MPPT: the OND's, else IMaxDC shared among the MPPTs."""
    if inverter.imax_mppt_a:
        return schemas.CurrentPerMppt(value_a=inverter.imax_mppt_a, source="OND file", note=FROM_THE_OND)
    if not inverter.mppt_current_limit:
        return schemas.CurrentPerMppt(value_a=None, source="not in the OND", note=NO_CURRENT_AT_ALL)
    note = (
        f"Not in the OND: IMaxDC {inverter.idc_max_a:.0f} A ÷ {inverter.n_mppt} MPPT. "
        "Enter the datasheet value if it differs."
    )
    return schemas.CurrentPerMppt(
        value_a=inverter.mppt_current_limit, source="IMaxDC over the MPPT count", note=note
    )
