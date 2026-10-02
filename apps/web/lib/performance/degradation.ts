// The degradation of the modules, a field of the document in the head of the 25 years (plan/phase-08-plan.md, step 14
// and decision 6; functional-inventory.md 1.7): 0 to 3 %/yr, two decimals. An entry edits the document's losses; the
// run follows and the figures after the year come from the year's energy without simulating again (decision 5). Pure.
import type { Range } from "../../components/ui/number-entry";
import type { Project } from "../api";

export const DEGRADATION_RANGE: Range & { min: number; max: number } = { min: 0, max: 3, decimals: 2 };

export const DEGRADATION_UNIT = "%/yr";

/** The document with the degradation entered; the same document when it is the value already. */
export function withDegradation(document: Project, pct: number): Project {
  if (document.losses.degradation_pct === pct) return document;
  return { ...document, losses: { ...document.losses, degradation_pct: pct } };
}
