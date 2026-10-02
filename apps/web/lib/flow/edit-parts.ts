// What a committed edit changes, and so what must be asked for again (plan/phase-07-plan.md, decision 2).
// Documents are never changed in place: a part that is the same object is the same part.
import type { Project, Roof } from "../api";

/** What the layout is made of (`/layout`) besides the roof: the array and the module. */
const OF_THE_LAYOUT = ["array", "pan_text", "pan_path"] as const satisfies readonly (keyof Project)[];

/** Of the roof, what only the run reads: the engine's memo leaves it out of the shading too (plan/phase-08-plan.md, decision 7). */
const OF_THE_ROOF_NOT_FOR_THE_LAYOUT = ["albedo"] as const satisfies readonly (keyof Roof)[];

/** What the run's answer holds already: every option is in it, so choosing one asks for nothing. */
const ANSWERED = ["chosen_option"] as const satisfies readonly (keyof Project)[];

export type EditParts = {
  /** The layout is asked for again. */
  layout: boolean;
  /** The design is run again. */
  run: boolean;
};

const changedKeysOf = <Thing extends object>(before: Thing, after: Thing): string[] => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => !Object.is(before[key as keyof Thing], after[key as keyof Thing]));
};

/** Whether the roof changed in what the layout reads. */
const roofOfTheLayoutChanged = (before: Roof, after: Roof): boolean =>
  before !== after && changedKeysOf(before, after).some((key) => !(OF_THE_ROOF_NOT_FOR_THE_LAYOUT as readonly string[]).includes(key));

/** Which of the layout and the run an edit from *before* to *after* asks for. */
export function partsOfAnEdit(before: Project, after: Project): EditParts {
  const changed = changedKeysOf(before, after);
  return {
    layout: changed.some((key) => (OF_THE_LAYOUT as readonly string[]).includes(key)) || roofOfTheLayoutChanged(before.roof, after.roof),
    run: changed.some((key) => !(ANSWERED as readonly string[]).includes(key)),
  };
}
