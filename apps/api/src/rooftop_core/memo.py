"""Results kept between design runs, so that a run does not work out again what it has (decision D6).

Two stages are worth keeping. The hourly shading of every module takes two thirds of a run and
depends on the roof, the array, the module and where the sun stands; not on the irradiance, the
losses or the inverter. The options with their simulations take the rest and depend on everything
else but the figures after the year: the uncertainty, the exceedance values, the 25 years and the CO2
follow from the year's energy alone, so they are not kept but worked out again for every run
(`simulation.after_the_year`, decision 5 of Phase 8), and the losses they come from are left out of
the key. The custom option is kept apart from the options offered (decision 10): adding, changing or
removing it simulates it alone.
A key is the fingerprint of what its stage depends on: the same inputs give the same key, in every
process. What is kept is handed out read-only, so that a result is the same with and without a memo.
"""

from __future__ import annotations

import dataclasses
import hashlib
import json
import threading
from collections import OrderedDict
from collections.abc import Callable
from typing import TYPE_CHECKING, Any, Protocol, TypeVar

import numpy as np
import pandas as pd

from .options import StringOption
from .shading import ShadingResult

if TYPE_CHECKING:
    from .project import Design

T = TypeVar("T")
MEGABYTE = 2**20
SHADING_BYTES = 512 * MEGABYTE  # the demo takes 55 MB: two numbers for every hour and position
OPTIONS_BYTES = 64 * MEGABYTE  # the demo takes 4 MB: the hours of the year of five options
NAMES = ("source",)  # fields that name the file a module or an inverter came from
NOT_FOR_SHADING = ("albedo",)  # fields of the roof that only the simulation looks at
# Fields of the losses that only the figures after the year look at: no hour of a simulation depends on them.
AFTER_THE_YEAR = ("degradation_pct", "co2_t_per_mwh", "p_levels", "weather_sigma_pct", "model_sigma_pct")


class Memo(Protocol):
    """Where a design keeps results. *make* is called when the key is not there."""

    def shading(self, key: str, make: Callable[[], ShadingResult]) -> ShadingResult: ...

    def options(self, key: str, make: Callable[[], list[StringOption]]) -> list[StringOption]: ...


class Store:
    """Values by key, up to a size. When full, the value used longest ago goes first.

    Many threads may use it at once. Two that ask for the same missing key both make the value;
    the values are equal, and one of them is kept.
    """

    def __init__(self, max_bytes: int, size_of: Callable[[Any], int]):
        self.max_bytes = max_bytes
        self._size_of = size_of
        self._values: OrderedDict[str, tuple[Any, int]] = OrderedDict()
        self._bytes = 0
        self._lock = threading.Lock()

    @property
    def entries(self) -> int:
        return len(self._values)

    @property
    def bytes(self) -> int:
        return self._bytes

    def keys(self) -> list[str]:
        """The keys, the one used longest ago first."""
        with self._lock:
            return list(self._values)

    def get_or_make(self, key: str, make: Callable[[], T]) -> T:
        with self._lock:
            found = self._values.get(key)
            if found is not None:
                self._values.move_to_end(key)
                return found[0]
        value = make()
        self._keep(key, value, self._size_of(value))
        return value

    def _keep(self, key: str, value: Any, size: int) -> None:
        if size > self.max_bytes:
            return
        with self._lock:
            if key in self._values:
                self._bytes -= self._values.pop(key)[1]
            self._values[key] = (value, size)
            self._bytes += size
            while self._bytes > self.max_bytes:
                _, (_, freed) = self._values.popitem(last=False)
                self._bytes -= freed


class MemoryMemo:
    """Results kept in this process."""

    def __init__(self, shading_bytes: int = SHADING_BYTES, options_bytes: int = OPTIONS_BYTES):
        self.shadings = Store(shading_bytes, _bytes_of_shading)
        self.option_sets = Store(options_bytes, _bytes_of_options)

    def shading(self, key: str, make: Callable[[], ShadingResult]) -> ShadingResult:
        return self.shadings.get_or_make(key, lambda: _read_only(make()))

    def options(self, key: str, make: Callable[[], list[StringOption]]) -> list[StringOption]:
        kept = self.option_sets.get_or_make(key, lambda: tuple(make()))
        return [dataclasses.replace(option) for option in kept]


# ── keys ─────────────────────────────────────────────────────────────────────
def shading_key(design: Design) -> str:
    """The fingerprint of what the layout and the hourly shading depend on. Needs the weather."""
    return _fingerprint("shading", *_shading_inputs(design))


def options_key(design: Design) -> str:
    """The fingerprint of what the options offered and their simulations depend on: every input of the
    engine but the custom option and the figures after the year."""
    p, weather = design.p, design.weather
    return _fingerprint(
        "options",
        *_shading_inputs(design),
        {name: getattr(p.roof, name) for name in NOT_FOR_SHADING},
        _without(p.losses, AFTER_THE_YEAR),
        _without(design.inverter, NAMES),
        [p.system_voltage, design.t_min, design.t_max, design.cell_rise, p.voc_coefficient_pct],
        hashlib.sha256(pd.util.hash_pandas_object(weather.data, index=True).to_numpy().tobytes()).hexdigest(),
    )


def custom_key(design: Design) -> str:
    """The fingerprint of what the custom option depends on: what the options do, and the custom itself."""
    return _fingerprint("custom", options_key(design), design.p.custom)


def _shading_inputs(design: Design) -> list[Any]:
    p, weather = design.p, design.weather
    hours = weather.data.index.asi8
    return [
        _without(p.roof, NOT_FOR_SHADING),
        p.array,
        _without(design.module, NAMES),
        [weather.lat, weather.lon, weather.horizon],
        hashlib.sha256(hours.tobytes()).hexdigest(),
    ]


def _without(thing: Any, names: tuple[str, ...]) -> dict[str, Any]:
    return {name: value for name, value in dataclasses.asdict(thing).items() if name not in names}


def _fingerprint(stage: str, *parts: Any) -> str:
    text = json.dumps([stage, *parts], sort_keys=True, separators=(",", ":"), default=_plain)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _plain(value: Any) -> Any:
    """What json does not know: the dataclasses of the engine and the numbers of numpy."""
    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return dataclasses.asdict(value)
    if isinstance(value, np.generic):
        return value.item()
    raise TypeError(f"{type(value).__name__} cannot be part of a key")


# ── what is kept ─────────────────────────────────────────────────────────────
def _arrays(shading: ShadingResult) -> list[np.ndarray]:
    return [getattr(shading, field.name) for field in dataclasses.fields(shading)]


def _read_only(shading: ShadingResult) -> ShadingResult:
    for array in _arrays(shading):
        array.flags.writeable = False
    return shading


def _bytes_of_shading(shading: ShadingResult) -> int:
    return sum(array.nbytes for array in _arrays(shading))


def _bytes_of_options(options: tuple[StringOption, ...]) -> int:
    return sum(
        int(option.result.hourly.memory_usage(index=True).sum()) + option.result.per_string_shade.nbytes
        for option in options
    )
