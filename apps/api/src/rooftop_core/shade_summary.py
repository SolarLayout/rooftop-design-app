"""What shading costs over the year: for every position, and for any choice of positions.

The figures are those of the loss chain of a simulation (simulation.simulate), worked out the same
way: far shading takes the beam while the sun is behind the horizon and the sky the horizon hides,
near shading takes the shaded part of the beam and the rest of the hidden sky. The chain of an option
counts the modules the option uses; here any positions can be counted, also before there is an option.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass

import numpy as np

from .simulation import Precomputed


@dataclass
class ShadeSummary:
    modules: list[int]  # the positions counted, as indices of the layout
    near_pct_by_module: np.ndarray  # per position: irradiation lost to near shading, % of what arrives
    near_pct: float  # the same for all the positions together
    far_pct: float  # irradiation lost to the horizon, % of what would arrive without it


def summarise(pre: Precomputed, modules: Sequence[int] | None = None) -> ShadeSummary:
    """The shading losses of *modules*; of every position when none are named."""
    count = pre.shading.n_modules
    chosen = np.arange(count) if modules is None else np.asarray(modules, dtype=int)
    open_sky = np.zeros(len(chosen))  # in plane, as if nothing shaded
    past_horizon = np.zeros(len(chosen))
    past_near = np.zeros(len(chosen))
    beam_passes = ~pre.shading.far_block
    for number, group in enumerate(pre.groups.values()):
        here = np.where(pre.group_of[chosen] == number)[0]
        if not len(here):
            continue
        positions = chosen[here]
        beam = group["beam"] * beam_passes
        diffuse = group["sky"] + group["gnd"]
        seen = 1.0 - pre.shading.sky_loss[positions].astype(float)
        beam_past_near = pre.shading.by_blocks(
            positions, lambda f_lin, beam=beam: beam @ (1.0 - f_lin.astype(float))
        )
        open_sky[here] = float((group["beam"] + diffuse).sum())
        past_horizon[here] = float(beam.sum() + diffuse.sum() * (1.0 - pre.shading.sky_far))
        past_near[here] = beam_past_near + float(diffuse.sum()) * seen
    return ShadeSummary(
        modules=[int(i) for i in chosen],
        near_pct_by_module=lost_pct(past_near, past_horizon),
        near_pct=float(lost_pct(past_near.sum(), past_horizon.sum())),
        far_pct=float(lost_pct(past_horizon.sum(), open_sky.sum())),
    )


def lost_pct(left: np.ndarray | float, of: np.ndarray | float) -> np.ndarray:
    """What is missing in *left* against *of*, in percent; nothing where there was nothing to lose.

    Never below zero: shade gains no light. A hair of a gain is the rounding of the float32 hidden sky
    against the float64 horizon's share, for a position with no near shading.
    """
    left, of = np.asarray(left, dtype=float), np.asarray(of, dtype=float)
    return np.maximum((1.0 - np.divide(left, of, out=np.ones_like(left), where=of > 0)) * 100.0, 0.0)
