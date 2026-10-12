// What the Handover page shows, made of the results and their status (plan/phase-09-plan.md, decision 11; docs/design/
// guidelines.md, "States"; the board "Handover, states"): the rows with their facts; before options the API's title and
// message leading to the Strings lens, every row but the project file waiting; at the first load skeletons; a run that
// failed the API's words with Try again, the rows of before staying. The web judges nothing itself. Pure.
import { TRY_AGAIN } from "../../components/shell/vitals-view";
import type { DesignResult } from "../api";
import type { Decision, FailedRow } from "../performance/page-view";
import type { Failure, Status } from "../stores/results-store";
import { deliverablesOf, PROJECT_FILE, type Deliverable } from "../flow/deliverables/items";
import { pathOfNoOptions } from "../flow/no-options";

export type { Decision, FailedRow };

export const FILES_NOT_UPDATED = { title: "The files were not updated", detail: "Showing the last result" } as const;
export const FILES_NOT_MADE = { title: "The files were not made", detail: "There are no files yet" } as const;
/** The facts of a row that waits once the first run failed (D93): it says why, as a row before options says the API's title. */
export const NOT_MADE = "Not made · the run failed";

/** The rows of a first run that failed: each that waits for the design says it was not made; the project file keeps its own. */
const notMadeOf = (rows: Deliverable[]): Deliverable[] =>
  rows.map((row) => (row.id !== PROJECT_FILE && row.waits && row.facts === null ? { ...row, facts: NOT_MADE, about: NOT_MADE } : row));

export type PageView = {
  /** Loading: no value was ever there. Decision: there are no options. Failed: the run failed. Design: the chosen option's. */
  kind: "loading" | "decision" | "failed" | "design";
  rows: Deliverable[];
  /** Why there are no options, in the API's words, and where that is decided; null when there are some, or no result. */
  decision: Decision | null;
  /** What did not happen, what the files are, the action, and why in the API's words; null unless the run failed. */
  failed: FailedRow | null;
  /** A run is on its way: what is shown is of before and dimmed. */
  isDimmed: boolean;
};

type Asked = {
  /** The name of the design that is open. */
  name: string | null;
  design: DesignResult | null;
  designStatus: Status;
  failure: Failure | null;
  /** How many pages the report has, once they are known (pull request 2); null before. */
  pages: number | null;
};

function decisionOf(design: DesignResult | null): Decision | null {
  if (!design?.no_options) return null;
  const { title, message } = design.no_options;
  return { title, message, path: pathOfNoOptions(design.no_options) };
}

export function pageViewOf({ name, design, designStatus, failure, pages }: Asked): PageView {
  const rows = deliverablesOf({ name, design, pages });
  const decision = decisionOf(design);

  if (designStatus === "failed") {
    const { title, detail } = design ? FILES_NOT_UPDATED : FILES_NOT_MADE;
    return { kind: "failed", rows: design ? rows : notMadeOf(rows), decision, failed: { title, detail, action: TRY_AGAIN, message: failure?.message ?? "" }, isDimmed: false };
  }
  if (design === null) return { kind: "loading", rows, decision: null, failed: null, isDimmed: false };
  const isOnItsWay = designStatus === "waiting" || designStatus === "running";
  if (decision) return { kind: "decision", rows, decision, failed: null, isDimmed: isOnItsWay };
  return { kind: "design", rows, decision: null, failed: null, isDimmed: isOnItsWay };
}

/** What stands under an item's head: the decision before options, the skeleton at the first load, nothing, or its body. */
export type PreviewBody = "decision" | "skeleton" | "nothing" | "body";

/**
 * What an item's preview holds under its head and any note of a failed run. An item that waits for a design holds the
 * decision before options, the skeleton while the first run is on its way, and nothing once it failed: the note says
 * there are no files yet (#179, item 25). Every other item holds its body.
 */
export function previewBodyOf(view: Pick<PageView, "kind" | "decision" | "failed">, row: Pick<Deliverable, "waits">): PreviewBody {
  if (!row.waits) return "body";
  if (view.decision) return "decision";
  if (view.kind === "loading") return "skeleton";
  return view.failed ? "nothing" : "body";
}

/**
 * Whether the report's pages are wanted: as soon as the report's row is live, whatever item is open, so that the row
 * counts its pages from the workspace's open (plan/phase-11-plan.md, step 33); not before the run has an option, when
 * there are no pages to draw.
 */
export const arePagesWantedOf = (view: PageView): boolean => view.rows.some((row) => row.id === "report" && !row.waits);
