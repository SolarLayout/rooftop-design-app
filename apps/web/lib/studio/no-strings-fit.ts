// No string length fits (V2 · 5, D101; the board "Problems"): the problem the Strings step carries at its head, and the
// voltage that fits as the step's primary. Made of the strings view and of what the voltage words offer (D87, D88: the
// user's choice, an edit undone in one step). Pure.
import { noStringsFitProblemOf } from "../errors/problem-of";
import type { StringsView } from "./strings-view";
import type { VoltageWords } from "./voltage-words";

export type NoStringsFit = NonNullable<ReturnType<typeof noStringsFitOf>>;

/** The problem and its primary where the API found no string length that fits; null in every other case. */
export function noStringsFitOf(view: StringsView, offer: VoltageWords["offer"]) {
  if (view.kind !== "sized" || view.range === null || !view.noOptions?.noLengthFits) return null;
  return noStringsFitProblemOf({ voltage: view.voltage, range: view.range, fitsAt: offer?.use ?? null });
}
