// What the Performance page shows, made of the results and their status (plan/phase-08-plan.md, decision 15;
// docs/design/guidelines.md, "States"; the board "Performance, states"). The words of a run on its way, of the first
// load and of a failure are the vitals' (components/shell/vitals-view.ts), not written a second time. Pure.
import { ENERGY_NOT_COMPUTED, ENERGY_NOT_UPDATED, openingOf, TRY_AGAIN, UPDATING_ENERGY } from "../../components/shell/vitals-view";
import type { DesignProgress, DesignResult, LayoutReadouts } from "../api";
import { pathOfLens } from "../routes";
import type { Failure, Status } from "../stores/results-store";
import { headerOf, type HeaderView } from "./header";
import { kpisOf, type KpisView } from "./kpis";
import { chainViewOf, type ChainView } from "./loss-chain";
import { summaryRowsOf, type SummaryRowView } from "./summary";

/** A run on its way: what is done in a word, the engine's step, and how far from 0 to 1. */
export type RunRow = { title: string; step: string | null; share: number };

/** A run that failed: what did not happen, what the values are, the action, and why in the API's words. */
export type FailedRow = { title: string; detail: string; action: string; message: string };

/** Why there are no options, in the API's words, and where that is decided. */
export type Decision = { title: string; message: string; path: string };

/** The figures of the chosen option. */
export type Values = { kpis: KpisView; chain: ChainView; summary: SummaryRowView[] };

export type PageView =
  /** No value was ever there: skeletons in every place of a value, and what is opened under the title. */
  | { kind: "loading"; header: null; run: RunRow }
  /** There are no options, and why in the API's words (null only if the API gave no reason): nothing of energy, the header counting the positions. */
  | { kind: "decision"; header: HeaderView; decision: Decision | null; run: RunRow | null }
  /** The chosen option's figures; while a run is on its way they are of before and dimmed, with the step under the title. */
  | { kind: "design"; header: HeaderView; values: Values; isDimmed: boolean; run: RunRow | null }
  /** The run failed: the values of before stay, not dimmed, with the note; at the first load there are none. */
  | { kind: "failed"; header: HeaderView | null; values: Values | null; decision: Decision | null; failed: FailedRow };

type Asked = {
  /** The name of the design that is open. */
  name: string | null;
  design: DesignResult | null;
  /** The read-outs of the layout: of the newer of layout and design. */
  readouts: LayoutReadouts | null;
  designStatus: Status;
  progress: DesignProgress | null;
  failure: Failure | null;
};

function valuesOf(design: DesignResult): Values | null {
  const option = design.options.find((one) => one.key === design.chosen_option);
  return option ? { kpis: kpisOf(option), chain: chainViewOf(option, design.equipment.module), summary: summaryRowsOf(option) } : null;
}

function decisionOf(design: DesignResult): Decision | null {
  if (!design.no_options) return null;
  const { title, message } = design.no_options;
  return { title, message, path: pathOfLens("strings") };
}

export function pageViewOf({ name, design, readouts, designStatus, progress, failure }: Asked): PageView {
  const isOnItsWay = designStatus === "waiting" || designStatus === "running";
  const step = progress?.step ?? null;
  const share = progress?.fraction ?? 0;

  if (designStatus === "failed") {
    const { title, detail } = design ? ENERGY_NOT_UPDATED : ENERGY_NOT_COMPUTED;
    return {
      kind: "failed",
      header: design ? headerOf(design, readouts) : null,
      values: design ? valuesOf(design) : null,
      decision: design ? decisionOf(design) : null,
      failed: { title, detail, action: TRY_AGAIN, message: failure?.message ?? "" },
    };
  }
  // Before the first answer, and before the design itself is there, nothing has failed and nothing is shown yet.
  if (design === null) return { kind: "loading", header: null, run: { title: openingOf(name), step, share } };

  const header = headerOf(design, readouts);
  const values = valuesOf(design);
  const run = isOnItsWay ? { title: UPDATING_ENERGY, step, share } : null;
  if (values) return { kind: "design", header, values, isDimmed: isOnItsWay, run };
  // Without a chosen option the API says why there are none (decision D37); the page says it in the API's words.
  return { kind: "decision", header, decision: decisionOf(design), run };
}
