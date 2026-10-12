// Where a design with no options leads: the lens where the reason is put right (#179, item 13). No position for a module
// is the roof's (its outline, its setback, its obstacles); no system voltage, no string length that fits, and too few
// positions for a string are the strings'. The vitals, Performance and Handover all lead there. Pure.
import type { NoOptions } from "../api";
import { LENSES, pathOfLens } from "../routes";

export function pathOfNoOptions({ code }: Pick<NoOptions, "code">): string {
  return pathOfLens(code === "no_positions" ? "roof" : "strings");
}

/** The press that leads to the step of `path`: "Open Roof", "Open Strings". */
export function openWordsOf(path: string): string {
  const step = LENSES.find((lens) => path.endsWith(`/${lens.id}`));
  return step ? `Open ${step.name}` : "Open the step";
}
