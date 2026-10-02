// What a committed edit changes, and so what must be asked for again (plan/phase-07-plan.md, decision 2).
// Documents are never changed in place: a part that is the same object is the same part.
import type { Project } from "../api";

/** What the layout is made of (`/layout`): the roof, the array and the module. */
const OF_THE_LAYOUT = ["roof", "array", "pan_text", "pan_path"] as const satisfies readonly (keyof Project)[];

/** What the run's answer holds already: every option is in it, so choosing one asks for nothing. */
const ANSWERED = ["chosen_option"] as const satisfies readonly (keyof Project)[];

export type EditParts = {
  /** The layout is asked for again. */
  layout: boolean;
  /** The design is run again. */
  run: boolean;
};

const changedKeysOf = (before: Project, after: Project): string[] => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => !Object.is(before[key as keyof Project], after[key as keyof Project]));
};

/** Which of the layout and the run an edit from *before* to *after* asks for. */
export function partsOfAnEdit(before: Project, after: Project): EditParts {
  const changed = changedKeysOf(before, after);
  return {
    layout: changed.some((key) => (OF_THE_LAYOUT as readonly string[]).includes(key)),
    run: changed.some((key) => !(ANSWERED as readonly string[]).includes(key)),
  };
}
