"""Losses, rear-side gain and uncertainty. Mirrors rooftop_core.simulation.Losses."""

from typing import Annotated

from pydantic import Field

from rooftop_api.schemas.common import Input

Percent = Annotated[float, Field(ge=0, le=100)]
ExceedanceLevel = Annotated[int, Field(ge=1, le=99)]


class Losses(Input):
    """Percentages unless the name says otherwise. None means: from the PAN file or the roof type."""

    soiling_pct: Percent = 2.0
    lid_pct: Percent | None = None
    quality_pct: Annotated[float, Field(ge=-100, le=100)] = 0.0
    mismatch_pct: Percent = 1.0
    dc_ohmic_pct: Percent = 1.5
    ac_ohmic_pct: Percent = 1.0
    availability_pct: Percent = 99.5
    degradation_pct: Percent = 0.5
    uc: Annotated[float, Field(gt=0)] | None = None
    uv: Annotated[float, Field(ge=0)] = 0.0
    iam_b0: Annotated[float, Field(ge=0, le=1)] = 0.05
    bifacial: bool = True
    rear_loss_pct: Percent = 10.0
    weather_sigma_pct: Percent = 3.0
    model_sigma_pct: Percent = 3.0
    p_levels: tuple[ExceedanceLevel, ...] = (50, 75, 90)
    co2_t_per_mwh: Annotated[float, Field(ge=0)] = 0.716
