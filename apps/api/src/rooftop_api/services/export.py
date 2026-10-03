"""The files of a design: report, drawing, Google Earth model, hourly data, single-line diagram; the
project file, which is of the request alone; and the pages of the report as images."""

import base64
import re
import threading
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from urllib.parse import quote

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_api.services import design as design_service
from rooftop_core.export import files, report
from rooftop_core.project import Design, Project

NAMELESS = "rooftop-design"
PAGE_DPI = 150  # sharp at the preview's width on a 2x screen (plan/phase-09-plan.md, decision 5)
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
LONGEST_NAME = 80
NOT_IN_A_FILE_NAME = re.compile(r'[\\/:*?"<>|\s\x00-\x1f\x7f]+')
# matplotlib keeps the figure it draws on in one place for the whole process: one drawing at a time.
DRAWING = threading.Lock()


@dataclass(frozen=True)
class Kind:
    media_type: str
    ending: str
    write: Callable[..., bytes]  # of the Design, or of the engine's Project when needs_design is False
    needs_design: bool = True  # False: of the request alone; nothing is prepared or run for it
    drawn: bool = False  # made with matplotlib
    dated: bool = False  # prints the day of the report, which the writer takes after the design


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


def rtd_bytes(project: Project) -> bytes:
    """The project file as the engine writes it, format 2."""
    return project.to_text().encode("utf-8")


KINDS: dict[str, Kind] = {
    "pdf": Kind("application/pdf", "-report.pdf", files.export_pdf_bytes, drawn=True, dated=True),
    "dxf": Kind("image/vnd.dxf", "-layout.dxf", files.export_dxf_bytes),
    "kmz": Kind("application/vnd.google-earth.kmz", ".kmz", files.export_kmz_bytes),
    "csv": Kind("text/csv; charset=utf-8", "-hourly.csv", files.export_csv_bytes),
    "sld": Kind("image/png", "-single-line-diagram.png", files.export_sld_bytes, drawn=True),
    "rtd": Kind("application/json", ".rtd", rtd_bytes, needs_design=False),
}


def export(kind: str, project: schemas.Project, day: date | None = None) -> File:
    """The file of *kind*: of the option the project has chosen, or of the request alone.

    *day* is the reader's day, printed by the kinds that are dated; None prints the server's today.
    """
    made = KINDS[kind]
    if made.needs_design:
        content = _written(made, _design_of(project), day)
    else:
        content = made.write(convert.project_to_engine(project))
    return File(content, made.media_type, file_stem(project.name), made.ending)


def report_pages(project: schemas.Project, day: date | None = None) -> schemas.ReportPages:
    """The pages of the report as PNGs, of the option the project has chosen, for *day* (the server's
    today when None): the same drawing as the PDF of that day, page for page."""
    design = _design_of(project)
    printed = day or date.today()
    with DRAWING:
        pages = [_page_image(page) for page in report.report_pages(design, printed)]
    return schemas.ReportPages(day=printed, dpi=PAGE_DPI, pages=pages)


def _page_image(page: report.Page) -> schemas.ReportPage:
    png = report.page_png(page, PAGE_DPI)
    width, height = png_size(png)
    return schemas.ReportPage(
        number=page.number,
        title=page.title,
        width=width,
        height=height,
        png=base64.b64encode(png).decode("ascii"),
    )


def png_size(png: bytes) -> tuple[int, int]:
    """Width and height of a PNG, read from its header."""
    if not png.startswith(PNG_SIGNATURE):
        raise ValueError("Not a PNG: the file does not start with the PNG signature.")
    return int.from_bytes(png[16:20], "big"), int.from_bytes(png[20:24], "big")


def _design_of(project: schemas.Project) -> Design:
    """The design run, with the option the project has chosen."""
    design = design_service.prepare(project).design
    design.run_options()
    require_option(design, project.chosen_option)
    return design


def _written(made: Kind, design: Design, day: date | None) -> bytes:
    given = (design, day) if made.dated else (design,)
    if made.drawn:
        with DRAWING:
            return made.write(*given)
    return made.write(*given)


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
