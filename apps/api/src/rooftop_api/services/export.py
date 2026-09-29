"""The files of a design: report, drawing, Google Earth model, hourly data, single-line diagram."""

import re
import threading
from collections.abc import Callable
from dataclasses import dataclass
from urllib.parse import quote

from rooftop_api import schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_api.services import design as design_service
from rooftop_core.export import files
from rooftop_core.project import Design

NAMELESS = "rooftop-design"
LONGEST_NAME = 80
NOT_IN_A_FILE_NAME = re.compile(r'[\\/:*?"<>|\s\x00-\x1f\x7f]+')
# matplotlib keeps the figure it draws on in one place for the whole process: one drawing at a time.
DRAWING = threading.Lock()


@dataclass(frozen=True)
class Kind:
    media_type: str
    ending: str
    write: Callable[[Design], bytes]
    drawn: bool = False  # made with matplotlib


@dataclass(frozen=True)
class File:
    content: bytes
    media_type: str
    stem: str  # from the name of the project
    ending: str

    @property
    def content_disposition(self) -> str:
        """The header that names the download. A name outside ASCII goes as filename*, a plain one beside."""
        name = self.stem + self.ending
        if name.isascii():
            return f'attachment; filename="{name}"'
        return f"attachment; filename=\"{NAMELESS}{self.ending}\"; filename*=UTF-8''{quote(name, safe='-._')}"


KINDS: dict[str, Kind] = {
    "pdf": Kind("application/pdf", "-report.pdf", files.export_pdf_bytes, drawn=True),
    "dxf": Kind("image/vnd.dxf", "-layout.dxf", files.export_dxf_bytes),
    "kmz": Kind("application/vnd.google-earth.kmz", ".kmz", files.export_kmz_bytes),
    "csv": Kind("text/csv; charset=utf-8", "-hourly.csv", files.export_csv_bytes),
    "sld": Kind("image/png", "-single-line-diagram.png", files.export_sld_bytes, drawn=True),
}


def export(kind: str, project: schemas.Project) -> File:
    """The file of *kind* for the option the project has chosen."""
    chosen = project.chosen_option
    design = design_service.prepare(project).design
    design.run_options()
    require_option(design, chosen)
    made = KINDS[kind]
    if made.drawn:
        with DRAWING:
            content = made.write(design)
    else:
        content = made.write(design)
    return File(content, made.media_type, file_stem(project.name), made.ending)


def require_option(design: Design, chosen: str) -> None:
    """The design must have the option the project names. The engine would take the first in silence."""
    if not design.options:
        reason = design_service.no_options(design)
        field = "system_voltage" if reason.code == "system_voltage_missing" else None
        raise ApiError(UNPROCESSABLE, reason.code, f"{reason.title}. {reason.message}", field)
    there = _listed([option.key for option in design.options])
    if not chosen:
        message = f"Choose a stringing option first. This design has {there}."
        raise ApiError(UNPROCESSABLE, "no_option_chosen", message, "chosen_option")
    if design.chosen.key != chosen:
        message = f"This design has no option {chosen}. It has {there}. Choose one of them."
        raise ApiError(UNPROCESSABLE, "option_not_in_design", message, "chosen_option")


def file_stem(name: str) -> str:
    """The name of a project as the beginning of a file name: no path, nothing a file system refuses."""
    words = [word.strip(".") for word in NOT_IN_A_FILE_NAME.split(name)]
    return "-".join(word for word in words if word)[:LONGEST_NAME].rstrip("-.") or NAMELESS


def _listed(keys: list[str]) -> str:
    return keys[0] if len(keys) == 1 else f"{', '.join(keys[:-1])} and {keys[-1]}"
