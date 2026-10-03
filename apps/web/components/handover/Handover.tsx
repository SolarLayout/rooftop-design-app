"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotBuiltYet } from "@/components/shell/NotBuiltYet";
import { useDownloads, useProject, useResults, useStores } from "@/components/shell/stores";
import { useHistoryKeys } from "@/components/shell/use-history-keys";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { byItemOf, keptOf, pagesOf, pagesStatusOf } from "@/lib/handover/downloads-store";
import { withName } from "@/lib/flow/name-field";
import { pageViewOf } from "@/lib/handover/page-view";
import { reportViewOf, type ShownPage } from "@/lib/handover/report-view";
import { FIRST_ITEM, HANDOVER, type HandoverItem } from "@/lib/routes";
import { editOf, nameOf, projectOf } from "@/lib/stores/project-store";
import { designFailureOf, designOf, designStatusOf } from "@/lib/stores/results-store";
import { DeliverableList } from "./DeliverableList";
import { Preview } from "./Preview";
import { ProjectFilePreview } from "./ProjectFilePreview";
import { PageButton, ReportPreview, ReportSkeleton } from "./ReportPreview";

type Props = {
  /** The item that is open; null at the list's own address, where desktop and tablet show the first item beside the list. */
  item: HandoverItem | null;
};

// The two columns of the boards "Handover" on three sizes (plan/phase-09-plan.md, decision 3): on desktop the list is 440
// wide with a line at its right, on tablet 300 wide beside the preview, on phone the list is the screen and an item is
// pushed over it. Only one of the two stands on phone.
const PAGE = "flex min-h-0 grow flex-col tablet:flex-row tablet:gap-5 tablet:p-6 desktop:gap-0 desktop:p-0";
const LIST = classNames(
  "flex-col gap-3 px-page-x-phone pt-2 pb-5",
  "tablet:w-75 tablet:shrink-0 tablet:gap-4.5 tablet:p-0",
  "desktop:w-handover-list desktop:border-r desktop:border-line-subtle desktop:pt-7 desktop:pr-6 desktop:pb-6 desktop:pl-10",
);
const PREVIEW = classNames("min-w-0 grow flex-col gap-3 px-page-x-phone pt-2 pb-5", "tablet:gap-4 tablet:p-0", "desktop:pt-7 desktop:pr-10 desktop:pb-6 desktop:pl-8");
/** The name of the back row: the tab bar's link is "Handover" already, and a name is given once. */
const BACK_TO_THE_LIST = "Back to Handover";
const BACK = classNames(
  "-ml-2.5 flex h-touch items-center gap-1.5 self-start rounded-row px-2.5 text-text-2 select-none",
  "press-motion focus-ring hovered:text-text tablet:hidden",
);

/**
 * The Handover workspace (the boards "Handover" on three sizes and "Handover, states"): the list of what is delivered, its
 * facts from the run's chosen option, the weather and the document (decision 14), and the preview of the item that is
 * open; before options the API's words leading to the Strings lens, at the first load skeletons, a run that failed the
 * API's words with Try again (decision 11). The report's pages are asked for once per edit while its item is open and has
 * an option, with the reader's day, as its PDF is (decisions 2 and 5).
 */
export function Handover({ item }: Props) {
  const { flow, downloads, project } = useStores();
  const name = useProject(nameOf);
  const document = useProject(projectOf);
  const edit = useProject(editOf);
  const byItem = useDownloads(byItemOf);
  const projectFile = useDownloads((state) => keptOf(state, "rtd", edit));
  const keptPages = useDownloads(pagesOf);
  const pagesStatus = useDownloads(pagesStatusOf);
  const [shownPage, setShownPage] = useState<ShownPage>(null);
  // The page's edits (the name) are committed edits like the Studio's: the keys of the history undo and redo them.
  useHistoryKeys();
  const design = useResults(designOf);
  const designStatus = useResults(designStatusOf);
  const failure = useResults(designFailureOf);
  const pages = keptPages?.answer.pages.length ?? null;
  const view = useMemo(() => pageViewOf({ name, design, designStatus, failure, pages }), [name, design, designStatus, failure, pages]);
  const shown = item ?? FIRST_ITEM;
  const row = view.rows.find((one) => one.id === shown) ?? view.rows[0]!;
  const download = row.kind === null ? undefined : () => void downloads.getState().download(row.id);
  const isProjectFileOpen = shown === "project-file" && document !== null;
  const isReport = shown === "report";
  // The pages are asked once per edit while the report is open with an option; the store keeps them (decision 5). A refusal
  // is said under the head by the body, with Try again, which asks here too.
  const isReportOpen = isReport && !row.waits;
  useEffect(() => {
    if (!isReportOpen) return;
    void downloads.getState().askPages();
  }, [downloads, edit, isReportOpen]);
  const askPagesAgain = () => void downloads.getState().askPages();
  const report = useMemo(() => reportViewOf({ kept: keptPages, edit, status: pagesStatus, shown: shownPage }), [keptPages, edit, pagesStatus, shownPage]);
  /** The page chosen is kept for these very pages: new pages begin at the first. */
  const showPage = (page: number) => setShownPage(keptPages === null ? null : { edit: keptPages.edit, page });
  // The .rtd is asked once per edit of the document while its item is open, for its size; Save a copy saves the same bytes
  // (decision 9). A file that did not come is said by Save a copy, in a toast; here its size is left out.
  const [askFailedFor, setAskFailedFor] = useState<number | null>(null);
  useEffect(() => {
    if (!isProjectFileOpen) return;
    downloads
      .getState()
      .ask("rtd")
      .catch(() => setAskFailedFor(edit));
  }, [downloads, edit, isProjectFileOpen]);

  function rename(next: string) {
    project.getState().commit((before) => withName(before, next));
  }

  return (
    <main className={PAGE}>
      <nav aria-label="Deliverables" className={classNames(LIST, item === null ? "flex" : "hidden tablet:flex")}>
        <DeliverableList rows={view.rows} item={item} shown={shown} downloads={byItem} onSaveACopy={() => void downloads.getState().download("project-file")} />
      </nav>
      <section aria-label={row.name} data-testid="preview" className={classNames(PREVIEW, item === null ? "hidden tablet:flex" : "flex")}>
        {/* On phone the item is pushed over the list: the row at the top leads back to it. */}
        <h1 className="sr-only tablet:hidden">Handover</h1>
        <Link href={HANDOVER} aria-label={BACK_TO_THE_LIST} className={BACK}>
          <Icon name="chevron-left" size={16} />
          Handover
        </Link>
        <Preview
          row={row}
          view={view}
          onTryAgain={flow.tryAgain}
          onAction={download}
          isOnItsWay={byItem[row.id]?.status === "on-its-way"}
          actions={
            isReport ? (
              <>
                <PageButton direction="previous" view={report} onPage={showPage} />
                <PageButton direction="next" view={report} onPage={showPage} />
              </>
            ) : undefined
          }
          words={isReport ? report.head : undefined}
          skeleton={isReport ? <ReportSkeleton /> : undefined}
        >
          {isReport ? (
            <ReportPreview view={report} onPage={showPage} onTryAgain={askPagesAgain} />
          ) : isProjectFileOpen ? (
            <ProjectFilePreview document={document} design={design} bytes={projectFile?.blob.size ?? null} isWaitingForBytes={askFailedFor !== edit} onRename={rename} />
          ) : (
            <NotBuiltYet />
          )}
        </Preview>
      </section>
    </main>
  );
}
