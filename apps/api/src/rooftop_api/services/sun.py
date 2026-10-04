"""The sun of a day at a place, and the shadows of a roof at one hour of it."""

from rooftop_api import convert, schemas
from rooftop_api.schemas.sun import DESIGN_DAY
from rooftop_core.geometry import casters_shadow, sun_solar_time
from rooftop_core.sunpath import day_of_year, hours_by_step, sun_positions, sunrise_sunset


def sun_of_day(request: schemas.SunRequest) -> schemas.SunResponse:
    doy = day_of_year(None if request.day == DESIGN_DAY else int(request.day), request.lat)
    hours = request.hours if request.hours is not None else hours_by_step(request.step_h or 0.0)
    rise_and_set = sunrise_sunset(request.lat, doy)
    return schemas.SunResponse(
        day_of_year=doy,
        positions=[convert.sun_position_from_engine(p) for p in sun_positions(request.lat, doy, hours)],
        sunrise_h=None if rise_and_set is None else rise_and_set[0],
        sunset_h=None if rise_and_set is None else rise_and_set[1],
        shadows=None if request.shadows is None else shadows_at(request.shadows, request.lat, doy),
    )


def shadows_at(request: schemas.ShadowRequest, lat: float, doy: int) -> schemas.Shadows:
    """Shadows of the parapet and the obstacles on a level plane, with the sun of the place asked for."""
    roof = convert.roof_to_engine(request.roof, at="shadows.roof")
    elevation, azimuth = sun_solar_time(lat, doy, request.hour)
    shape = casters_shadow(roof.all_casters(), request.plane_height_m, elevation, azimuth)
    return schemas.Shadows(
        hour=request.hour,
        elevation_deg=elevation,
        azimuth_deg=azimuth,
        plane_height_m=request.plane_height_m,
        polygons=convert.polygons_from_shape(shape),
    )
