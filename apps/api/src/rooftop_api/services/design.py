"""A design run: layout, hourly shading, series range and the options, each simulated over the year."""

import logging
import queue
import threading
from collections.abc import Callable, Iterator

from fastapi.sse import ServerSentEvent

from rooftop_api import convert, schemas
from rooftop_api.errors import INTERNAL_MESSAGE, UNPROCESSABLE, ApiError, error_detail
from rooftop_api.services import layouts
from rooftop_api.services import weather as weather_service
from rooftop_api.services.equipment import current_per_mppt, module_notes
from rooftop_api.services.uploads import file_name
from rooftop_core import csv_weather, memo, readouts, shade_summary
from rooftop_core.errors import EngineError
from rooftop_core.keepout_parts import keepout_parts
from rooftop_core.progress import ProgressEvent
from rooftop_core.project import Design, Project
from rooftop_core.simulation import UC_BY_ROOF
from rooftop_core.stringing import form_strings

logger = logging.getLogger("rooftop_api")

NO_POSITIONS = schemas.NoOptions(
    code="no_positions",
    title="No module fits on this roof",
    message="Inside the edge setback and clear of shadows there is no room for a module. "
    "Check the outline, the setback and the obstacles.",
)
NO_VOLTAGE = schemas.NoOptions(
    code="system_voltage_missing", title=readouts.CHOOSE_VOLTAGE, message=readouts.CHOOSE_VOLTAGE_DETAIL
)


def new_memo() -> memo.MemoryMemo:
    return memo.MemoryMemo()


# The shadings and the options of this process (decision D6). Without them every answer is the
# same, only slower.
MEMO = new_memo()


class Run:
    """A design that is ready to run: its project was read and its weather is there."""

    def __init__(self, design: Design, weather_notes: list[str]):
        self.design = design
        self.weather_notes = weather_notes


def prepare(project: schemas.Project) -> Run:
    """Everything that can be refused is refused here, before the run and its stream begin."""
    p = convert.project_to_engine(project)
    layouts.require_outline(p.roof)
    layouts.module_for(p)
    design = _design(p)
    notes = _use_csv_weather(p)
    design.load_weather()
    return Run(design, notes)


def events(run: Run) -> Iterator[ServerSentEvent]:
    """The progress of the run as it happens, then its result. A fault of the run is the last event."""
    inbox: queue.SimpleQueue[ServerSentEvent] = queue.SimpleQueue()

    def work() -> None:
        try:
            done = schemas.DesignDone(result=result(run, lambda event: inbox.put(_progress(event))))
            inbox.put(ServerSentEvent(event=done.type, data=done))
        except Exception as error:  # noqa: BLE001  the stream has begun: the fault travels in it
            inbox.put(_failed(error))

    threading.Thread(target=work, name="design-run", daemon=True).start()
    while True:
        event = inbox.get()
        yield event
        if event.event != "progress":
            return


def result(run: Run, on_progress: Callable[[ProgressEvent], None] | None = None) -> schemas.DesignResult:
    design = run.design
    design.p.chosen_option = design.p.chosen_option if design.p.system_voltage else ""
    design.run_options(on_progress)
    layout, roof, module = design.layout, design.p.roof, design.module
    shade = shade_summary.summarise(design.pre)
    return schemas.DesignResult.model_construct(
        layout=convert.layout_from_engine(layout, keepout_parts(roof, design.p.array, layout)),
        readouts=layouts.readouts(roof, layout, module),
        weather=weather_service.summary(design.weather),
        weather_notes=run.weather_notes,
        far_shading_note=readouts.far_shading_note(design.weather),
        shading=schemas.Shading.model_construct(
            near_pct=shade.near_pct,
            far_pct=shade.far_pct,
            near_pct_by_module=[float(value) for value in shade.near_pct_by_module],
            keepout_area_m2=layout.keepout_area_in_roof,
        ),
        equipment=_equipment(design),
        sizing=_sizing(design),
        series_range=_series_range(design),
        options=[_option(design, option) for option in design.options],
        options_note=readouts.options_note(design) if design.options else None,
        chosen_option=design.chosen.key if design.chosen else None,
        no_options=_no_options(design),
    )


def _design(p: Project) -> Design:
    try:
        return Design(p, local_files=False, memo=MEMO)
    except ValueError as error:
        raise ApiError(UNPROCESSABLE, "not_an_ond_file", str(error), "ond_text") from error


def _use_csv_weather(p: Project) -> list[str]:
    """CSV weather that travels as text is checked and becomes the weather of the project."""
    if p.weather_source != "csv" or not p.weather_csv_text:
        return []
    read = csv_weather.read(p.weather_csv_text, p.roof.lat, p.roof.lon, file_name(p.weather_csv))
    p.weather_json = read.weather.to_json()
    return read.notes


def _progress(event: ProgressEvent) -> ServerSentEvent:
    progress = schemas.DesignProgress(step=event.step, fraction=event.fraction)
    return ServerSentEvent(event=progress.type, data=progress)


def _failed(error: Exception) -> ServerSentEvent:
    if isinstance(error, EngineError):
        detail = error_detail(error)
    else:
        logger.error("the design run failed", exc_info=error)
        detail = schemas.ErrorDetail(code="internal_error", message=INTERNAL_MESSAGE, field=None)
    failed = schemas.DesignFailed(error=detail)
    return ServerSentEvent(event=failed.type, data=failed)


def _equipment(design: Design) -> schemas.Equipment:
    module = design.module
    return schemas.Equipment.model_construct(
        module=convert.module_from_engine(module),
        inverter=convert.inverter_from_engine(design.inverter),
        coefficients=convert.coefficients_from_engine(design.coeffs),
        module_notes=module_notes(module, design.coeffs.warning, module.source),
        max_current_per_mppt=_current_of_the_file(design),
    )


def _current_of_the_file(design: Design) -> schemas.CurrentPerMppt:
    """The current per MPPT as the OND gives it, whatever the user entered in its place."""
    entered = design.p.imax_mppt_override
    design.apply_imax(None)
    try:
        return current_per_mppt(design.inverter)
    finally:
        design.apply_imax(entered)


def _sizing(design: Design) -> schemas.Sizing:
    p = design.p
    return schemas.Sizing.model_construct(
        t_min_c=design.t_min,
        t_max_c=design.t_max,
        t_min_from="weather" if p.t_min_override is None else "entered",
        t_max_from="weather" if p.t_max_override is None else "entered",
        cell_rise_c=design.cell_rise,
        cell_rise_from="roof type" if p.cell_rise_c is None else "entered",
        uc=p.losses.uc or UC_BY_ROOF[p.roof.roof_type],
        uc_from="entered" if p.losses.uc else "roof type",
    )


def _series_range(design: Design) -> schemas.SeriesRange | None:
    if design.range is None:
        return None
    return convert.series_range_from_engine(design.range, readouts.limit_note(design))


def _option(design: Design, option) -> schemas.Option:
    return convert.option_from_engine(
        option,
        module_area_m2=design.module.area_m2,
        roof_area_m2=design.p.roof.area_m2,
        verdict=readouts.verdict(design, option),
        loads=readouts.mppt_loads(design, option),
        bill=readouts.bill_of_materials(design, option),
        cables=readouts.cables(design, option),
        summary=readouts.summary(design, option),
    )


def _no_options(design: Design) -> schemas.NoOptions | None:
    """Why there is nothing to choose from; None when there are options."""
    if design.options:
        return None
    if design.layout.n_modules == 0:
        return NO_POSITIONS
    if design.range is None:
        return NO_VOLTAGE
    if not design.range.ok:
        verdict = readouts.verdict(design, None)
        return schemas.NoOptions(code="no_string_length_fits", title=verdict.title, message=verdict.detail)
    return _too_few_positions(design)


def _too_few_positions(design: Design) -> schemas.NoOptions:
    rng, positions = design.range, design.layout.n_modules
    shortest = min(
        (n for n in range(rng.n_min, rng.n_max + 1) if form_strings(design.layout, n)), default=None
    )
    fits = (
        "No row holds a string of that length."
        if shortest is None
        else f"A string of {shortest} would fit: enter it as a custom option."
    )
    return schemas.NoOptions(
        code="too_few_positions",
        title="Too few positions for a string",
        message=f"The roof holds {positions:,} {'position' if positions == 1 else 'positions'}, and a "
        f"string takes {rng.n_min} to {rng.n_max} modules along one row. {fits}",
    )
