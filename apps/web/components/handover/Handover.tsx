"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NotBuiltYet } from "@/components/shell/NotBuiltYet";
import { useDownloads, useProject, useResults, useStores } from "@/components/shell/stores";
import { useHistoryKeys } from "@/components/shell/use-history-keys";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { bomViewOf } from "@/lib/handover/bom-view";
import { allStatusOf, byItemOf, keptOf, pagesOf, pagesStatusOf } from "@/lib/stores/downloads-store";
import { IN_THE_REPORT } from "@/lib/handover/in-the-report";
import { scheduleViewOf } from "@/lib/handover/schedule-view";
import type { Sort } from "@/components/ui/table-sort";
import { withName } from "@/lib/flow/name-field";
import { arePagesWantedOf, pageViewOf } from "@/lib/handover/page-view";
import { reportViewOf, type ShownPage } from "@/lib/handover/report-view";
import { FIRST_ITEM, HANDOVER, type HandoverItem } from "@/lib/routes";
import { editOf, nameOf, projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designFailureOf, designOf, designStatusOf } from "@/lib/stores/results-store";
import { FailedRow } from "@/components/shell/UnderTheTitle";
import { CadPreview } from "./CadPreview";
import { DeliverableList } from "./DeliverableList";
import { EarthPreview } from "./EarthPreview";
import { HourlyPreview } from "./HourlyPreview";
import { Preview } from "./Preview";
import { BillOfMaterials } from "./BillOfMaterials";
import { CableSchedule } from "./CableSchedule";
import { CopyAsTable } from "./CopyAsTable";
import { ProjectFilePreview } from "./ProjectFilePreview";
import { PageButton, ReportPreview, ReportSkeleton } from "./ReportPreview";
import { SingleLineDiagram } from "./SingleLineDiagram";
import { HandoverHead, PinnedDownloadAll } from "./HandoverHead";
import { useAskedFile } from "./use-asked-file";
import { useZipSizes } from "./use-zip-sizes";

type Props = {
  /** The item that is open; null at the list's own address, where desktop and tablet show the first item beside the list. */
  item: HandoverItem | null;
};

// The board "V2 · 9 · Handover and Home" (D105): on desktop the head across the page, the list 420 wide at the left and the
// preview the rest of the width in a card; on tablet and phone the list is the page with Download all pinned at its foot,
// and a file is pushed over it. Only one of the two stands on touch.
const PAGE = "flex grow flex-col desktop:px-page-x-desktop desktop:pt-8 desktop:pb-page-y";
const COLUMNS = "flex min-h-0 grow flex-col desktop:flex-row desktop:items-start desktop:gap-10";
// On desktop the letters of the list's first heading start at the preview card's top edge (the owner, 2026-10-13): the
// list starts 4 higher than the card, the half-leading of the heading's line.
const LIST = classNames("flex-col gap-4 px-2 pt-6 pb-6 tablet:px-2", "desktop:w-handover-list desktop:shrink-0 desktop:px-0 desktop:pt-5 desktop:-ml-3");
const PREVIEW = classNames(
  "min-w-0 grow flex-col gap-4 px-page-x-phone pt-2 pb-6 tablet:px-page-x-tablet",
  "desktop:mt-6 desktop:rounded-card desktop:border desktop:border-line desktop:bg-surface-1 desktop:p-6",
);
/** The name of the back row: the tab bar's link is "Handover" already, and a name is given once. */
const BACK_TO_THE_LIST = "Back to Handover";
const BACK = classNames(
  "-ml-2.5 flex h-touch items-center gap-1.5 self-start rounded-row px-2.5 text-text-2 select-none",
  "press-motion focus-ring hovered:text-text desktop:hidden",
);

/**
 * The Handover workspace (V2 · 9, D105; the boards "V2 · 9 · Handover and Home" and "Handover, states"): the head with
 * Present and Download all, the one primary, with the zip's size; the files by who they are for, each with what it is and
 * its size, read from the zip of them all, asked once per edit (`useZipSizes`); and the preview of the file that is
 * open; before options the API's words leading to the Strings lens, at the first load skeletons, a run that failed the
 * API's words with Try again (decision 11). The report's pages are asked for once per edit as soon as the run has an
 * option, whatever item is open, with the reader's day, as its PDF is (decisions 2 and 5): the report's row counts its
 * pages from the workspace's open (plan/phase-11-plan.md, step 33).
 */
export function Handover({ item }: Props) {
  const { flow, downloads, project } = useStores();
  const name = useProject(nameOf);
  const document = useProject(projectOf);
  const edit = useProject(editOf);
  const byItem = useDownloads(byItemOf);
  const all = useDownloads(allStatusOf);
  const projectFile = useDownloads((state) => keptOf(state, "rtd", edit));
  const keptPages = useDownloads(pagesOf);
  const pagesStatus = useDownloads(pagesStatusOf);
  const [shownPage, setShownPage] = useState<ShownPage>(null);
  // The page's edits (the name) are committed edits like the Studio's: the keys of the history undo and redo them.
  useHistoryKeys();
  const design = useResults(designOf);
  const option = useResults(chosenOptionOf);
  const designStatus = useResults(designStatusOf);
  const failure = useResults(designFailureOf);
  const pages = keptPages?.answer.pages.length ?? null;
  // The zip of every file is asked once per edit as soon as the run has an option: its directory gives every file's size,
  // and Download all saves the same bytes.
  const hasOption = option !== null && designStatus !== "failed";
  const zip = useAskedFile("zip", hasOption);
  const sizes = useZipSizes(zip.file);
  const view = useMemo(() => pageViewOf({ name, design, designStatus, failure, pages, sizes }), [name, design, designStatus, failure, pages, sizes]);
  const shown = item ?? FIRST_ITEM;
  const row = view.rows.find((one) => one.id === shown) ?? view.rows[0]!;
  const download = () => void downloads.getState().download(row.id);
  const isLive = !row.waits && view.kind !== "loading";
  const bom = useMemo(() => (option ? bomViewOf(option) : null), [option]);
  // The schedule's sort is held here, so that the head's copy is of the rows as the body shows them.
  const [scheduleSort, setScheduleSort] = useState<Sort | null>(null);
  const schedule = useMemo(() => (option ? scheduleViewOf(option, scheduleSort) : null), [option, scheduleSort]);
  /** The head of a table: where it stands in the report, and Copy as table; before options the press is shown and cannot be used. */
  const tableActions = (table: { text: string; copied: string } | null) => (
    <>
      <span className="hidden type-body-touch desktop:type-body text-text-2 tablet:inline">{IN_THE_REPORT}</span>
      <CopyAsTable text={table?.text ?? ""} copied={table?.copied ?? ""} disabled={table === null || !isLive} />
    </>
  );
  const tools = shown === "bill-of-materials" ? tableActions(bom) : shown === "cable-schedule" ? tableActions(schedule) : undefined;
  const isProjectFileOpen = shown === "project-file" && document !== null;
  const isReport = shown === "report";
  const isCadLayout = shown === "cad-layout";
  // The CSV is asked once per edit while the hourly data is open with an option, and kept for Download CSV (decision 8).
  const csv = useAskedFile("csv", shown === "hourly-data" && !row.waits);
  // The document, the run and the option the files are of; null until there is a chosen option.
  const files = document !== null && design !== null && option !== null ? { document, design, option } : null;
  // The pages are asked once per edit as soon as the run has an option, whatever item is open: the report's row counts them,
  // the report shows them, the CAD layout has the engine's plan among them (decision 8); the store keeps them (decision 5). A
  // refusal is said by the body of the report and of the CAD layout, with Try again, which asks here too.
  const arePagesWanted = arePagesWantedOf(view);
  useEffect(() => {
    if (!arePagesWanted) return;
    void downloads.getState().askPages();
  }, [downloads, edit, arePagesWanted]);
  const askPagesAgain = () => void downloads.getState().askPages();
  const report = useMemo(() => reportViewOf({ kept: keptPages, edit, status: pagesStatus, shown: shownPage }), [keptPages, edit, pagesStatus, shownPage]);
  /** The page chosen is kept for these very pages: new pages begin at the first. */
  const showPage = (page: number) => setShownPage(keptPages === null ? null : { edit: keptPages.edit, page });
  // The .rtd is asked once per edit of the document while its item is open, for its size; its Download saves the same bytes
  // (decision 9). A file that did not come is said by its Download, in a toast; here its size is left out.
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

  const allProps = {
    canDownload: hasOption && view.rows.some((one) => one.id !== "project-file" && !one.waits),
    isOnItsWay: all.status === "on-its-way",
    bytes: sizes.zip ?? null,
    onDownloadAll: () => void downloads.getState().downloadAll(),
  };

  return (
    <main className={PAGE}>
      <div className={classNames(item === null ? "contents" : "hidden desktop:contents")}>
        <HandoverHead {...allProps} />
      </div>
      <div className={COLUMNS}>
      <nav aria-label="Files" className={classNames(LIST, item === null ? "flex" : "hidden desktop:flex")}>
        <DeliverableList
          rows={view.rows}
          item={item}
          shown={shown}
          downloads={byItem}
          onDownload={(id) => void downloads.getState().download(id)}
          note={view.failed ? <FailedRow failed={view.failed} onTryAgain={flow.tryAgain} /> : null}
        />
      </nav>
      <section aria-label={row.name} data-testid="preview" className={classNames(PREVIEW, item === null ? "hidden desktop:flex" : "flex")}>
        {/* On touch the item is pushed over the list: the row at the top leads back to it. */}
        <h1 className="sr-only desktop:hidden">Handover</h1>
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
          tools={tools}
        >
          {isReport ? (
            <ReportPreview view={report} onPage={showPage} onTryAgain={askPagesAgain} />
          ) : isCadLayout ? (
            files && <CadPreview files={files} report={report} onTryAgain={askPagesAgain} />
          ) : shown === "earth-model" ? (
            files && <EarthPreview files={files} />
          ) : shown === "hourly-data" ? (
            <HourlyPreview file={csv.file} failure={csv.failure} onTryAgain={csv.askAgain} />
          ) : isProjectFileOpen ? (
            <ProjectFilePreview document={document} design={design} bytes={projectFile?.blob.size ?? null} isWaitingForBytes={askFailedFor !== edit} onRename={rename} />
          ) : shown === "single-line-diagram" && option && design ? (
            <SingleLineDiagram option={option} equipment={design.equipment} isDimmed={view.isDimmed} />
          ) : shown === "bill-of-materials" && bom ? (
            <BillOfMaterials view={bom} isDimmed={view.isDimmed} />
          ) : shown === "cable-schedule" && schedule ? (
            <CableSchedule view={schedule} sort={scheduleSort} onSort={setScheduleSort} isDimmed={view.isDimmed} />
          ) : (
            <NotBuiltYet />
          )}
        </Preview>
      </section>
      </div>
      {item === null ? <PinnedDownloadAll {...allProps} /> : null}
    </main>
  );
}
