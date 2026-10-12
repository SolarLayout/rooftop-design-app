"""A roof read from a KMZ, KML or DXF file of the user."""

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_api.services.uploads import bytes_of, file_name
from rooftop_core import geometry, project
from rooftop_core.io import roof_import

KML_ENDINGS = (".kmz", ".kml")
DXF_ENDING = ".dxf"
HEIGHTS_SET = "The file has no height for these obstacles. The app uses 1.0 m."


def import_roof(file: schemas.RoofFile) -> schemas.ImportedRoof:
    name = file_name(file.name)
    ending = name[name.rfind(".") :].lower() if "." in name else ""
    if ending not in (*KML_ENDINGS, DXF_ENDING):
        raise ApiError(
            UNPROCESSABLE,
            "unsupported_file",
            f"{name} is not a KMZ, KML or DXF file. Choose a file with one of these endings.",
            "name",
        )
    try:
        roof = (
            _from_dxf(file, name) if ending == DXF_ENDING else roof_import.read_kmz(_bytes(file, name), name)
        )
    except ValueError as error:
        raise ApiError(UNPROCESSABLE, "roof_file_unreadable", str(error), "base64") from error
    # The one check of the limit for a roof read from a file: the file is the field, as for what else
    # is wrong with its content. A DXF read in the wrong units is 10⁶ times too large, and the area says so.
    geometry.require_roof_within_limit(roof.outline, "base64")
    return convert.imported_roof_from_engine(
        roof, name, [HEIGHTS_SET] if roof.missing_heights else [], _project_of(roof, name, file)
    )


def _project_of(roof: roof_import.ImportedRoof, name: str, file: schemas.RoofFile) -> schemas.Project:
    """The whole document of the import, as /roof/from-map makes one: the roof from the file, everything
    else at its default, named after the file (plan/phase-05-plan.md, decision 13)."""
    whole = project.Project(
        name=name[: name.rfind(".")] if "." in name else name,
        roof=geometry.Roof(
            outline=list(roof.outline),
            lat=roof.lat,
            lon=roof.lon,
            source=roof.source,
            obstacles=list(roof.obstacles),
        ),
    )
    whole.roof_input["mode"] = "corners"
    whole.roof_input["file"] = name
    whole.roof_input["dxf_units"] = file.units
    return convert.project_from_engine(whole)


def _bytes(file: schemas.RoofFile, name: str) -> bytes:
    return bytes_of(file.base64, name)


def _from_dxf(file: schemas.RoofFile, name: str) -> roof_import.ImportedRoof:
    if file.lat is None or file.lon is None:
        raise ApiError(
            UNPROCESSABLE,
            "site_missing",
            "A DXF drawing does not say where the roof is. Give its latitude and longitude.",
            "lat" if file.lat is None else "lon",
        )
    return roof_import.read_dxf(_bytes(file, name), file.units, file.lat, file.lon, name)
