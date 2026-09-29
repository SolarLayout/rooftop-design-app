"""Module (PAN) and inverter (OND) files."""

from fastapi import APIRouter

from rooftop_api import schemas
from rooftop_api.errors import ERROR_RESPONSES
from rooftop_api.services import equipment as service

router = APIRouter(prefix="/equipment", tags=["equipment"], responses=ERROR_RESPONSES)


@router.post("/module", response_model=schemas.ModuleResponse, operation_id="parseModule")
def module(file: schemas.EquipmentFile) -> schemas.ModuleResponse:
    """Read a PAN file: the module, its temperature coefficients and where they come from, and notes."""
    return service.read_module(file)


@router.post("/inverter", response_model=schemas.InverterResponse, operation_id="parseInverter")
def inverter(file: schemas.EquipmentFile) -> schemas.InverterResponse:
    """Read an OND file: the inverter, and the default of the largest current per MPPT."""
    return service.read_inverter(file)
