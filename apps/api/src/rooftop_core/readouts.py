"""Read-outs of a design in words and tables: the verdict, the notes, the load of every MPPT.

The desktop app built these in its window. The wording is kept as it was (functional inventory,
section 2.8), so that every screen and every export says the same.
"""

from __future__ import annotations

from dataclasses import dataclass

from .bom import BomLine, CableRow, bom, cable_schedule
from .export.files import structure_label, summary_rows
from .options import StringOption
from .project import Design
from .stringing import DCAC_TARGET, DCAC_WARN, form_strings, max_strings_per_inverter, strings_per_mppt
from .weather import Weather

CHOOSE_VOLTAGE = "Choose a system voltage to size the strings"
CHOOSE_VOLTAGE_DETAIL = "600, 1000 or 1500 V. Nothing is sized until you choose."
NO_LENGTH_FITS = "No string length fits this inverter"
CHANGE_OR_REMOVE = "Change your option or remove it."
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


def verdict(design: Design, option: StringOption | None) -> Verdict:
    """Whether the series length of *option* fits, in the words of the desktop app.

    Without an option the design has none: no string length fits the inverter. The series range
    of the design must be there (Design.size_series, with a system voltage).
    """
    rng, inverter = design.range, design.inverter
    if option is None:
        return Verdict(False, NO_LENGTH_FITS, rng.message)
    n = option.n_series
    nominal = f", inverter nominal {inverter.vmpp_nom:,.0f} V" if inverter.vmpp_nom else ""
    return Verdict(
        ok=option.ok,
        title=f"{n} in series fits: Vmp {n * rng.vmp_stc:,.0f} V at STC{nominal}",
        detail=(
            f"Voc at {rng.t_min:.1f} °C is {n * rng.voc_cold:,.0f} V (limit {rng.limit_v:.0f} V); "
            f"Vmp at {rng.t_cell_hot:.1f} °C cell is {n * rng.vmp_hot:,.0f} V (MPPT minimum "
            f"{inverter.vmpp_min:.0f} V). {option.n_strings} strings on {option.n_inverters} inverter(s), "
            f"DC/AC {option.dcac:.2f}" + ("" if option.ok else f" ({option.note})") + "."
        ),
    )


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
            detail=f"Each inverter needs a string at least. {CHANGE_OR_REMOVE}",
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
            f"At least {rng.n_min} are needed: Vmp at {rng.t_cell_hot:.1f} °C cell is "
            f"{n * rng.vmp_hot:,.0f} V, under the MPPT minimum of {inverter.vmpp_min:.0f} V."
        )
    return Verdict(
        ok=False,
        title=f"{n} in series does not fit at {rng.system_v:.0f} V",
        detail=f"{why} {CHANGE_OR_REMOVE}",
    )


def _count(number: int, thing: str) -> str:
    return f"{number} {thing}" + ("" if number == 1 else "s")


def strings_by_series(design: Design) -> list[StringsOfLength]:
    """How many strings of each length in the series range the roof holds. Empty without a range that fits."""
    rng = design.range
    if rng is None or not rng.ok:
        return []
    return [StringsOfLength(n, len(form_strings(design.layout, n))) for n in range(rng.n_min, rng.n_max + 1)]


def limit_note(design: Design) -> str:
    """Which voltage limits the strings. Needs the series range of the design."""
    return (
        f"Limit {design.range.limit_v:.0f} V: the lowest of the system, module "
        f"({design.module.v_max_iec:.0f} V) and inverter ({design.inverter.vabs_max:.0f} V) ratings."
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
        f"{strings} The least shaded strings are used first."
        + (" ! " + "; ".join(missed) + "." if missed else "")
    )


def far_shading_note(weather: Weather) -> str:
    if not weather.horizon:
        return "Far shading: no horizon profile for this weather source"
    return f"Far shading: PVGIS horizon, highest {max(height for _, height in weather.horizon):.1f}°"


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
