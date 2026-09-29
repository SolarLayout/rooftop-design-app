"""How the modules are set up. Mirrors rooftop_core.placement.ArraySpec."""

from typing import Annotated, Literal, Self

from pydantic import Field, model_validator

from rooftop_api.schemas.common import Compass, DayOfYear, Input, SolarHour

Orientation = Literal["portrait", "landscape"]
Tilt = Annotated[float, Field(ge=0, le=90, description="Degrees from the horizontal")]
Metres = Annotated[float, Field(ge=0)]


class ArraySpec(Input):
    """Tilt, orientation, spacing and the shade-free window. None means: let the engine decide."""

    tilt_deg: Tilt = 15.0
    azimuth_deg: Compass | None = None
    orientation: Orientation = "portrait"
    modules_in_tilt: Annotated[int, Field(ge=1)] = 2
    clearance_m: Metres = 0.5
    module_gap_m: Metres = 0.02
    row_pitch_m: Annotated[float, Field(gt=0)] | None = None
    ew_tilt_deg: Tilt = 10.0
    ew_ridge_gap_m: Metres = 0.3
    flush_clearance_m: Metres = 0.1
    allow_shaded: bool = False
    window_start_h: SolarHour = 9.0
    window_end_h: SolarHour = 16.0
    design_doy: DayOfYear | None = None

    @model_validator(mode="after")
    def window_ends_after_it_starts(self) -> Self:
        if self.window_end_h <= self.window_start_h:
            raise ValueError(
                f"the shade-free window must end after it starts, not run from {self.window_start_h:g} h "
                f"to {self.window_end_h:g} h"
            )
        return self
