"""Read-outs of a design in words and tables: the verdict, the notes, the load of every MPPT.

The desktop app built these in its window. The wording is kept as it was (functional inventory,
section 2.8), so that every screen and every export says the same.
"""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass

from .bom import BomLine, CableRow, bom, cable_schedule
from .export.summary import structure_label, summary_rows
from .io.pvsyst import Inverter
from .options import StringOption
from .project import Design
from .stringing import DCAC_TARGET, DCAC_WARN, max_strings_per_inverter, strings_held, strings_per_mppt
from .weather import Weather

CHOOSE_VOLTAGE = "Choose a system voltage to size the strings"
CHOOSE_VOLTAGE_DETAIL = "600, 1000 or 1500 V."
CHANGE_OR_REMOVE = "Change your option or remove it."
NO_CURRENT_LIMIT = "The inverter file (OND) gives no current limit per MPPT. Enter the datasheet's value."
LOSSES_ROW = 9  # where the desktop app put the row "Losses" among the rows of the summary
CURRENT_TOLERANCE_A = 1e-6


@dataclass(frozen=True)
class Verdict:
    ok: bool  # a tick when true, an exclamation mark when not
    title: str
    detail: str


@dataclass(frozen=True)
class StringsOfLength:
    n_series: int
    strings: int  # how many strings of n_series modules the roof holds


@dataclass(frozen=True)
class MpptLoad:
    inverter: int  # from 1
    mppt: int  # from 1, within its inverter
    label: str
    strings: int
    imp_a: float
    imp_limit_a: float | None  # None: the inverter file gives no limit and the user entered none
    isc_a: float
    isc_limit_a: float | None
    kwp: float
    ok: bool  # within both limits; false also when a limit is not known


def nominal_words(inverter: Inverter) -> str:
    """The inverter's nominal MPP voltage after the string's Vmp, saying so when it is the middle of its
    efficiency voltages (the file gives no VmppNom); nothing when the file gives neither."""
    if not inverter.vmpp_nom:
        return ""
    source = ", from its efficiency curves" if inverter.vmpp_nom_from == "VNomEff" else ""
    return f", inverter nominal {inverter.vmpp_nom:,.0f} V{source}"


def verdict(design: Design, option: StringOption | None) -> Verdict:
    """Whether the series length of *option* fits, in the words of the desktop app.

    Without an option the design has none: no string length fits the inverter. The series range
    of the design must be there (Design.size_series, with a system voltage).
    """
    rng, inverter = design.range, design.inverter
    if option is None:
        return Verdict(False, f"No string length fits at {rng.system_v:.0f} V", rng.message)
    n = option.n_series
    nominal = nominal_words(inverter)
    loads = mppt_loads(design, option)
    currents = _currents(loads)
    ok = option.ok and all(load.ok for load in loads)
    return Verdict(
        ok=ok,
        # "fits" only where it does: a length that misses the target or a current limit is marked, not said
        # to fit (#179, item 17); the detail says what it misses.
        title=f"A string of {n}{' fits' if ok else ''}: Vmp {n * rng.vmp_stc:,.0f} V at STC{nominal}",
        detail=(
            f"Voc at {rng.t_min:.1f} °C is {n * rng.voc_cold:,.0f} V, limit {rng.limit_v:.0f} V. "
            f"Vmp at a cell temperature of {rng.t_cell_hot:.1f} °C is {n * rng.vmp_hot:,.0f} V, MPPT minimum "
            f"{inverter.vmpp_min:.0f} V. {_count(option.n_strings, 'string')} on "
            f"{_count(option.n_inverters, 'inverter')}, DC/AC ratio {option.dcac:.2f}"
            + ("" if option.ok else f", {option.note}")
            + "."
            + (f" {currents}" if currents else "")
        ),
    )


def _currents(loads: list[MpptLoad]) -> str:
    """What the verdict says of the MPPT loads: nothing when every MPPT is within its limits."""
    if any(load.imp_limit_a is None or load.isc_limit_a is None for load in loads):
        return NO_CURRENT_LIMIT
    return over_the_limit(loads)


def over_the_limit(loads: list[MpptLoad]) -> str:
    """The MPPTs over their current limit, named once for those that carry the same (decision 18).

    Imp is said against its limit; an MPPT whose Imp is within it and whose Isc is not says its Isc.
    Every limit must be known. Empty when no MPPT is over.
    """
    over_imp = [load for load in loads if not _within(load.imp_a, load.imp_limit_a)]
    over_isc = [load for load in loads if load not in over_imp and not _within(load.isc_a, load.isc_limit_a)]
    sentences = []
    if over_imp:
        groups = _alike(over_imp, lambda load: load.imp_a)
        said = [f"{who} {'carries' if one else 'carry'} {amps:.1f} A" for who, one, amps in groups]
        sentences.append(f"{_and(said)}, over the limit of {over_imp[0].imp_limit_a:.1f} A.")
    if over_isc:
        groups = _alike(over_isc, lambda load: load.isc_a)
        said = [f"{who} {'has' if one else 'have'} an Isc of {amps:.1f} A" for who, one, amps in groups]
        sentences.append(f"{_and(said)}, over the limit of {over_isc[0].isc_limit_a:.1f} A.")
    return " ".join(sentences)


def _alike(loads: list[MpptLoad], amps_of: Callable[[MpptLoad], float]) -> list[tuple[str, bool, float]]:
    """(who, whether one MPPT, the current) for each inverter and current, in the order of the loads.

    The inverter is named before the first of its MPPTs in the sentence.
    """
    groups: dict[tuple[int, float], list[int]] = {}
    for load in loads:
        groups.setdefault((load.inverter, round(amps_of(load), 1)), []).append(load.mppt)
    named: set[int] = set()
    said = []
    for (inverter, amps), mppts in groups.items():
        prefix = "" if inverter in named else f"INV-{inverter} · "
        named.add(inverter)
        said.append((f"{prefix}MPPT {_numbers(mppts)}", len(mppts) == 1, amps))
    return said


def _numbers(numbers: list[int]) -> str:
    """1, 2 and 4; 1 to 6; runs of three or more as a range."""
    runs: list[list[int]] = []
    for number in numbers:
        if runs and number == runs[-1][-1] + 1:
            runs[-1].append(number)
        else:
            runs.append([number])
    parts: list[str] = []
    for run in runs:
        parts.extend([f"{run[0]} to {run[-1]}"] if len(run) >= 3 else [str(n) for n in run])
    return _and(parts)


def _and(parts: list[str]) -> str:
    return parts[0] if len(parts) == 1 else f"{', '.join(parts[:-1])} and {parts[-1]}"


def caption(design: Design, option: StringOption) -> str:
    """The few words under the letter of an option, after its place among the options (decision 11).

    The engine's title stays as it was; the caption says what sets the option apart, or nothing.
    """
    if option.recommended:
        return "Recommended"
    if option.custom:
        return "Your own option"
    if not option.ok:
        return option.note.capitalize() + (
            f", {option.n_inverters} inverters" if option.n_inverters > 1 else ""
        )
    if option.n_strings == option.n_inverters * max_strings_per_inverter(design.module, design.inverter):
        return "Fills the inverters" if option.n_inverters > 1 else "Fills the inverter"
    recommended = next((other for other in design.options if other.recommended), None)
    if recommended is not None and option.result.clipping_pct < recommended.result.clipping_pct:
        return "Less clipping"
    return ""


def custom_refused(design: Design) -> Verdict | None:
    """Why the custom option of the design was not simulated, or None when it was or there is none."""
    misfit = design.custom_misfit
    if misfit is None:
        return None
    rng, inverter, n = design.range, design.inverter, misfit.n_series
    if misfit.reason == "strings":
        strings, inverters = misfit.n_strings, misfit.n_inverters
        return Verdict(
            ok=False,
            title=f"{_count(strings, 'string')} cannot fill {_count(inverters, 'inverter')}",
            detail=f"Each inverter needs at least 1 string. {CHANGE_OR_REMOVE}",
        )
    if misfit.reason == "voc":
        why = (
            f"At most {rng.n_max} fit: Voc at {rng.t_min:.1f} °C is {n * rng.voc_cold:,.0f} V, over the "
            f"limit of {rng.limit_v:.0f} V."
        )
    elif misfit.reason == "mppt_max":
        why = (
            f"At most {rng.n_max} fit: Vmp at {rng.t_min:.1f} °C is {n * rng.vmp_cold:,.0f} V, over the "
            f"inverter's MPPT maximum of {inverter.vmpp_max:.0f} V."
        )
    else:
        why = (
            f"At least {rng.n_min} are needed: Vmp at a cell temperature of {rng.t_cell_hot:.1f} °C is "
            f"{n * rng.vmp_hot:,.0f} V, under the MPPT minimum of {inverter.vmpp_min:.0f} V."
        )
    return Verdict(
        ok=False,
        title=f"A string of {n} does not fit at {rng.system_v:.0f} V",
        detail=f"{why} {CHANGE_OR_REMOVE}",
    )


def _count(number: int, thing: str) -> str:
    return f"{number} {thing}" + ("" if number == 1 else "s")


def strings_by_series(design: Design) -> list[StringsOfLength]:
    """How many strings of each length in the series range the roof holds. Empty without a range that fits."""
    rng = design.range
    if rng is None or not rng.ok:
        return []
    held = strings_held(design.layout)
    return [StringsOfLength(n, held(n)) for n in range(rng.n_min, rng.n_max + 1)]


def limit_note(design: Design) -> str:
    """Which voltage limits the strings. Needs the series range of the design."""
    module = design.module
    rated = (
        f"{module.v_max_iec:.0f} V"
        if module.v_max_from_file
        else f"{module.v_max_iec:.0f} V by default, as its file gives none"
    )
    return (
        f"Limit {design.range.limit_v:.0f} V: the lowest of the system's, the module's "
        f"({rated}) and the inverter's ({design.inverter.vabs_max:.0f} V) ratings."
    )


def options_note(design: Design) -> str:
    """The target of DC/AC, how many strings an inverter takes, and the options that miss the target."""
    module, inverter = design.module, design.inverter
    per_mppt = strings_per_mppt(module, inverter)
    per_inverter = max_strings_per_inverter(module, inverter)
    missed = [f"{o.letter}: DC/AC {o.dcac:.2f}, {o.note}" for o in design.options if not o.ok]
    if inverter.mppt_current_limit:
        strings = (
            f"At most {per_mppt} strings per MPPT ({per_mppt} × {module.imp:.2f} A ≤ "
            f"{inverter.mppt_current_limit:.1f} A), so one inverter takes {per_inverter} strings."
        )
    else:
        strings = (
            f"The OND gives no current limit per MPPT: one string for each of its {inverter.n_inputs} "
            f"inputs at most, {per_mppt} per MPPT, so one inverter takes {per_inverter} strings. "
            "Enter the datasheet value of the current per MPPT."
        )
    return (
        f"Target DC/AC {DCAC_TARGET[0]:.2f}–{DCAC_TARGET[1]:.2f}, warning above {DCAC_WARN:.2f}. "
        f"{strings} The run uses the least shaded strings in a row first, then those across rows."
        + (" ! " + "; ".join(missed) + "." if missed else "")
    )


def far_shading_note(weather: Weather) -> str:
    """The horizon the run counts, by the plain name of far shading (voice §6, board 12: Horizon)."""
    if not weather.horizon and weather.source == "pvgis":  # PVGIS gives one; this time it did not (#170)
        return "Horizon not counted: the weather for this site came without one"
    if not weather.horizon:
        return "Horizon not counted: this weather has none"
    return f"Horizon from PVGIS, highest {max(height for _, height in weather.horizon):.1f}°"


def mppt_loads(design: Design, option: StringOption) -> list[MpptLoad]:
    """The current and the power on every MPPT that has strings, against the limits of the inverter."""
    module, inverter, system = design.module, design.inverter, option.system
    imp_limit, isc_limit = inverter.mppt_current_limit or None, inverter.mppt_isc_limit or None
    places = list(zip(system.inverter_of, system.mppt_of, strict=True))
    loads = []
    for i in range(option.n_inverters):
        for j in range(inverter.n_mppt):
            strings = places.count((i, j))
            if not strings:
                continue
            imp, isc = strings * module.imp, strings * module.isc
            loads.append(
                MpptLoad(
                    inverter=i + 1,
                    mppt=j + 1,
                    label=f"INV-{i + 1} · MPPT {j + 1}",
                    strings=strings,
                    imp_a=imp,
                    imp_limit_a=imp_limit,
                    isc_a=isc,
                    isc_limit_a=isc_limit,
                    kwp=strings * option.n_series * module.pnom_w / 1000.0,
                    ok=_within(imp, imp_limit) and _within(isc, isc_limit),
                )
            )
    return loads


def _within(current: float, limit: float | None) -> bool:
    return limit is not None and current <= limit + CURRENT_TOLERANCE_A


def bill_of_materials(design: Design, option: StringOption) -> list[BomLine]:
    d = design
    return bom(
        d.layout,
        option.system,
        d.module,
        d.inverter,
        d.range.voc_cold,
        structure_label(d),
        d.p.ac_cable_m,
        d.p.system_voltage,
    )


def cables(design: Design, option: StringOption) -> list[CableRow]:
    d = design
    return cable_schedule(d.layout, option.system, d.module, d.range.voc_cold, d.p.system_voltage)


def summary(design: Design, option: StringOption) -> list[tuple[str, str]]:
    """The rows of the summary for *option*, whichever option the design has as the chosen one."""
    rows = summary_rows(_Seen(design, option))
    result = option.result
    losses = (
        f"Clipping {result.clipping_pct:.1f} % · LID {result.lid_pct:.2f} % · uncertainty σ "
        f"{result.sigma_pct:.2f} %"
    )
    rows.insert(LOSSES_ROW, ("Losses", losses))
    return rows


class _Seen:
    """A design as it looks with *option* chosen. The design itself is not touched."""

    def __init__(self, design: Design, option: StringOption):
        self._design = design
        self.chosen = option

    def __getattr__(self, name: str):
        return getattr(self._design, name)
