// The warning before leaving (plan/phase-10-plan.md, step 6): while a file of Handover is on its way, a download of an
// item or Download all, the page left would lose it, so the browser is asked to ask first. The pages of the report are a
// preview, not a download: nothing is lost with them. Pure: the shell registers beforeunload while this says so.
import type { DownloadsState } from "../handover/downloads-store";

export function shouldWarnBeforeLeaving({ byItem, all }: Pick<DownloadsState, "byItem" | "all">): boolean {
  return all.status === "on-its-way" || Object.values(byItem).some((status) => status?.status === "on-its-way");
}
