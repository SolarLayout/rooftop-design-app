// The figures of shading over the year in the Sun lens (plan/phase-06-plan.md, decision 13): the chosen
// option's, as its loss chain has them, for the modules it uses; before an option, near and far over all
// the positions (`Shading`), and the electrical figure waits for strings in the API's words. The area kept
// clear is the layout's. Pure functions of what the API answered.
import { shown } from "../../components/ui/number-entry";
import type { DesignResult } from "../api";

/** A figure: its value in percent as shown, or what it waits for; both null while there is no run. */
export type Figure = { value: string | null; waits: string | null };

export type SunFigures = {
  near: Figure;
  electrical: Figure;
  far: Figure;
  /** Square metres of the roof inside the setback left empty for shade; null before a layout. */
  keptClear: string | null;
  /** What the figures count. */
  of: string | null;
  /** The engine's note on the horizon, as it says it. */
  horizon: string | null;
};

/** The steps of the loss chain that are shading, by the engine's labels. */
const NEAR = "Near shading, linear";
const ELECTRICAL = "Electrical shading";
const FAR = "Far shading, horizon";

const NONE: Figure = { value: null, waits: null };
const percent = (value: number): Figure => ({ value: shown(Math.abs(value), 2), waits: null });

/** The figures of a run, with the area the layout shown keeps clear. */
export function figuresOf(design: DesignResult | null, keptClearM2: number | null): SunFigures {
  const keptClear = keptClearM2 === null ? null : shown(Math.round(keptClearM2), 0);
  if (design === null) return { near: NONE, electrical: NONE, far: NONE, keptClear, of: null, horizon: null };
  const option = design.options.find((one) => one.key === design.chosen_option);
  const horizon = design.far_shading_note;
  if (option) {
    const step = (label: string) => option.energy.steps.find((one) => one.label === label);
    const figure = (label: string) => {
      const found = step(label);
      return found ? percent(found.pct) : NONE;
    };
    return { near: figure(NEAR), electrical: figure(ELECTRICAL), far: figure(FAR), keptClear, of: `Of the ${shown(option.n_modules, 0)} modules of option ${option.letter}`, horizon };
  }
  return {
    near: percent(design.shading.near_pct),
    electrical: { value: null, waits: design.no_options?.title ?? null },
    far: percent(design.shading.far_pct),
    keptClear,
    of: `Of all ${shown(design.layout.modules.length, 0)} positions`,
    horizon,
  };
}
