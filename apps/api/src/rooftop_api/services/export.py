"""The files of a design: report, drawing, Google Earth model, hourly data, single-line diagram, bill of
materials, cable schedule; the project file, which is of the request alone; the zip of them all; and the
pages of the report as images."""

import base64
import hashlib
import io
import re
import threading
import zipfile
from collections.abc import Callable
from dataclasses import dataclass
from datetime import date
from typing import TYPE_CHECKING
from urllib.parse import quote

from rooftop_api import convert, schemas
from rooftop_api.errors import UNPROCESSABLE, ApiError
from rooftop_api.services import design as design_service
from rooftop_core import memo
from rooftop_core.project import Design, Project

if TYPE_CHECKING:
    from rooftop_core.export import report as report_module

NAMELESS = "rooftop-design"
PAGE_DPI = 150  # sharp at the preview's width on a 2x screen (plan/phase-09-plan.md, decision 5)
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
LONGEST_NAME = 80
NOT_IN_A_FILE_NAME = re.compile(r'[\\/:*?"<>|\s\x00-\x1f\x7f]+')
# matplotlib keeps the figure it draws on in one place for the whole process: one drawing at a time.
DRAWING = threading.Lock()

# The pages drawn, kept by project and day (plan/phase-11-plan.md, step 3): the same pages are asked for by
# every visit to the report, and under the load of the browser tests 110 asks of the demo's pages in five
# minutes queued behind the drawing lock to a median of 33 s (session 14, 2026-10-04). About 940 KB a set;
# some 30 sets.
PAGES_BYTES = 32_000_000
PAGES = memo.Store(PAGES_BYTES, size_of=lambda pages: sum(len(page.png) for page in pages.pages))
# One drawing at a time per key: the Store lets every asker of a missing key make the value, which is right
# for the cheap, and three sizes asking for the same pages at once drew them three times each, behind one
# another on the drawing lock (the API's log under the handover group's load: pages asks of 23 to 133 s).
# The second and the third wait for the first and take what it kept.
_DRAWING_ONE: dict[str, threading.Lock] = {}
_DRAWING_ONE_GUARD = threading.Lock()


def _files():
    """The engine's writers of files, loaded on the first file asked for: they bring matplotlib, which a
    start of the API should not wait for (Phase 13)."""
    from rooftop_core.export import files

    return files


def _report():
    """The engine's report, loaded on the first page asked for (see _files)."""
    from rooftop_core.export import report

    return report


def _writer(name: str) -> Callable[..., bytes]:
    """The writer *name* of the engine's files, found when it is first called."""

    def write(*args, **kwargs) -> bytes:
        return getattr(_files(), name)(*args, **kwargs)

    return write


def _one_at_a_time(key: str) -> threading.Lock:
    with _DRAWING_ONE_GUARD:
        return _DRAWING_ONE.setdefault(key, threading.Lock())


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


# The files, one by one: the seven of the design and the project file. The zip holds them all, in this order.
IN_THE_ZIP: dict[str, Kind] = {
    "pdf": Kind("application/pdf", "-report.pdf", _writer("export_pdf_bytes"), drawn=True, dated=True),
    "dxf": Kind("image/vnd.dxf", "-layout.dxf", _writer("export_dxf_bytes")),
    "kmz": Kind("application/vnd.google-earth.kmz", ".kmz", _writer("export_kmz_bytes")),
    "csv": Kind("text/csv; charset=utf-8", "-hourly.csv", _writer("export_csv_bytes")),
    "sld": Kind("image/png", "-single-line-diagram.png", _writer("export_sld_bytes"), drawn=True),
    "bom": Kind("text/csv; charset=utf-8", "-bill-of-materials.csv", _writer("export_bom_bytes")),
    "cables": Kind("text/csv; charset=utf-8", "-cable-schedule.csv", _writer("export_cables_bytes")),
    "rtd": Kind("application/json", ".rtd", rtd_bytes, needs_design=False),
}
ZIP = "zip"


def export(kind: str, project: schemas.Project, day: date | None = None) -> File:
    """The file of *kind*: of the option the project has chosen, or of the request alone; or the zip of
    them all.

    *day* is the reader's day, printed by the kinds that are dated; None prints the server's today.
    """
    made = KINDS[kind]
    if kind == ZIP:
        content = zipped(project, day)
    elif made.needs_design:
        content = _written(made, _design_of(project), day)
    else:
        content = made.write(convert.project_to_engine(project))
    return File(content, made.media_type, file_stem(project.name), made.ending)


def zipped(project: schemas.Project, day: date | None = None) -> bytes:
    """Every file in one archive, each named as its own download would be (plan/phase-09-plan.md,
    decision 10): the five files of the option the project has chosen, and the project file of the
    request alone, as /export/rtd writes it. The whole archive is written under the drawing lock, since
    the report and the diagram inside are drawn."""
    design = _design_of(project)
    request = convert.project_to_engine(project)
    stem = file_stem(project.name)
    out = io.BytesIO()
    with DRAWING, zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as archive:
        for made in IN_THE_ZIP.values():
            content = _content(made, design, day) if made.needs_design else made.write(request)
            archive.writestr(stem + made.ending, content)
    return out.getvalue()


KINDS: dict[str, Kind] = {**IN_THE_ZIP, ZIP: Kind("application/zip", ".zip", zipped, drawn=True, dated=True)}


def report_pages(project: schemas.Project, day: date | None = None) -> schemas.ReportPages:
    """The pages of the report as PNGs, of the option the project has chosen, for *day* (the server's
    today when None): the same drawing as the PDF of that day, page for page. Drawn once per project and
    day, then kept (PAGES)."""
    printed = day or date.today()
    key = pages_key(project, printed)
    with _one_at_a_time(key):
        return PAGES.get_or_make(key, lambda: _drawn_pages(project, printed))


def pages_key(project: schemas.Project, day: date) -> str:
    """The pages depend on the whole project, the day printed and the dpi, and on nothing else."""
    digest = hashlib.sha256(project.model_dump_json().encode()).hexdigest()
    return f"{digest}:{day.isoformat()}:{PAGE_DPI}"


def _drawn_pages(project: schemas.Project, printed: date) -> schemas.ReportPages:
    design = _design_of(project)
    with DRAWING:
        pages = [_page_image(page) for page in _report().report_pages(design, printed)]
    return schemas.ReportPages(day=printed, dpi=PAGE_DPI, pages=pages)


def _page_image(page: "report_module.Page") -> schemas.ReportPage:
    png = _report().page_png(page, PAGE_DPI)
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
    """The file of a kind of the design, the drawn ones under the lock."""
    if made.drawn:
        with DRAWING:
            return _content(made, design, day)
    return _content(made, design, day)


def _content(made: Kind, design: Design, day: date | None) -> bytes:
    """The file of a kind of the design, written by its writer; the lock is the caller's affair."""
    return made.write(design, day) if made.dated else made.write(design)


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
