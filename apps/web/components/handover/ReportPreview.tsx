"use client";

import type { KeyboardEvent } from "react";
import { FailedRow } from "@/components/shell/UnderTheTitle";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { pageAfterKey, type PageThumb, type ReportView } from "@/lib/handover/report-view";
import { PAGE_IMAGE, PAPER, PageImage } from "./paper";

type Props = {
  view: ReportView;
  /** A page was chosen: by a thumbnail, by previous or next, by the keys. */
  onPage: (page: number) => void;
  /** Try again under the head: the pages are asked for once more. */
  onTryAgain: () => void;
};

// The paper (components.md, "Paper preview"; the boards "Handover" on three sizes) takes the focus, so that Left and Right
// turn its pages.
const BODY = "flex min-w-0 flex-col gap-3 tablet:gap-4";
const FOCUSED_PAPER = classNames(PAPER, "focus-ring");
// The thumbnails, under the paper (V2 · 9: the report takes the preview's width): a row of 96 on desktop, 8 apart; of 72 on
// tablet, 6 apart; on phone of 56, 4 apart, that scrolls sideways if it must. Each is a button: the page scaled down in a slot of
// 70 (45, 35) and its caption, "2 · Layout" on desktop and tablet, the number alone on phone; the current one has the accent
// border on surface-2.
const THUMBNAILS = "flex min-w-0 gap-1 overflow-x-auto tablet:gap-1.5 desktop:gap-2";
const THUMBNAIL = classNames(
  "flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-control border p-0.75 text-left select-none",
  "tablet:w-18 tablet:p-1 desktop:w-24 desktop:items-start desktop:p-1.5",
  "press-motion focus-ring hovered:bg-surface-2",
);
const CURRENT = "border-accent bg-surface-2 text-text";
const OTHER = "border-line bg-transparent text-text-2";
const SLOT = "flex h-8.75 w-full items-center justify-center tablet:h-11.25 desktop:h-15";
const THUMB_IMAGE = "block h-auto max-h-full w-auto max-w-full rounded-swatch";
// The caption: 11 on tablet, where the thumbnail is 72 wide and "5 · Schedule" at 12 would not fit; 12 on desktop, as the board.
const CAPTION = "hidden max-w-full truncate type-unit tablet:block";
const NUMBER = "type-unit tablet:hidden";
/** The row of the phone (the board "Handover, tablet and phone"): previous and next of 44 with the page's words between. */
const PHONE_ROW = "flex items-center gap-3 tablet:hidden";

const THUMBNAIL_SKELETONS = 6;

/**
 * The first load, and the pages on their way (the board "Handover, states", "The first load"): the paper as a breathing
 * block of the page's shape, six thumbnails as blocks with their lines. It says nothing to a screen reader: the head says
 * what is waited for.
 */
export function ReportSkeleton() {
  return (
    <div data-testid="report-skeleton" aria-hidden="true" className={BODY}>
      <div className="w-full min-w-0 aspect-paper rounded-control bg-surface-2 breathing" />
      <div className={THUMBNAILS}>
        {Array.from({ length: THUMBNAIL_SKELETONS }, (_, index) => (
          <span key={index} className={classNames(THUMBNAIL, OTHER)}>
            <span className={SLOT}>
              <span className="h-full aspect-paper rounded-swatch bg-surface-2 breathing" />
            </span>
            <span className="hidden h-3 w-2/3 rounded-control bg-surface-2 breathing tablet:block" />
          </span>
        ))}
      </div>
    </div>
  );
}

type Direction = "previous" | "next";

const BUTTON: Record<Direction, { icon: "chevron-left" | "chevron-right"; label: string; step: number }> = {
  previous: { icon: "chevron-left", label: "Previous page", step: -1 },
  next: { icon: "chevron-right", label: "Next page", step: 1 },
};

/** Previous or next: a secondary icon button, 40 on desktop and 44 on touch; dim and not to be used at its end. */
export function PageButton({ direction, view, onPage }: { direction: Direction; view: ReportView; onPage: (page: number) => void }) {
  const { icon, label, step } = BUTTON[direction];
  const can = direction === "previous" ? view.hasPrevious : view.hasNext;
  return <IconButton kind="secondary" size="m" icon={icon} label={label} aria-disabled={can ? undefined : "true"} onClick={can ? () => onPage(view.page + step) : undefined} />;
}

function Thumbnail({ page, isCurrent, onPage }: { page: PageThumb; isCurrent: boolean; onPage: (page: number) => void }) {
  return (
    <button
      type="button"
      aria-label={page.name}
      aria-current={isCurrent ? "true" : undefined}
      data-page={page.number}
      onClick={() => onPage(page.number)}
      className={classNames(THUMBNAIL, isCurrent ? CURRENT : OTHER)}
    >
      <span className={SLOT}>
        <PageImage src={page.src} alt="" width={page.width} height={page.height} className={THUMB_IMAGE} />
      </span>
      <span className={CAPTION}>{page.caption}</span>
      <span className={NUMBER}>{page.number}</span>
    </button>
  );
}

/**
 * The body of the design report (plan/phase-09-plan.md, step 11, decisions 4 and 5): the engine's page in the paper frame,
 * the thumbnails as buttons, on phone previous and next with the page's words between them; Left and Right on the focused
 * paper or thumbnails. While the pages come, skeletons; when they do not, the API's words under the head with Try again;
 * the pages of the edit before stay, dimmed, while the new ones come.
 */
export function ReportPreview({ view, onPage, onTryAgain }: Props) {
  if (view.current === null) return view.failed ? <FailedRow failed={view.failed} onTryAgain={onTryAgain} /> : <ReportSkeleton />;
  const { current } = view;

  /** The keys on the paper or on the thumbnails; on the thumbnails the focus follows the page. */
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const next = pageAfterKey(event.key, view.page, view.count);
    if (next === null) return;
    event.preventDefault();
    onPage(next);
    event.currentTarget.querySelector<HTMLElement>(`[data-page="${next}"]`)?.focus();
  }

  return (
    <>
      {view.failed ? <FailedRow failed={view.failed} onTryAgain={onTryAgain} /> : null}
      <div className={classNames(BODY, view.isStale && "opacity-updating")}>
        <figure tabIndex={0} aria-label={view.head ?? undefined} data-testid="paper" onKeyDown={onKeyDown} className={FOCUSED_PAPER}>
          <PageImage src={current.src} alt={current.title} width={current.width} height={current.height} data-testid="page-image" className={PAGE_IMAGE} />
        </figure>
        <div className={PHONE_ROW}>
          <PageButton direction="previous" view={view} onPage={onPage} />
          <span data-testid="page-words" className="grow text-center type-body-touch desktop:type-body text-text-2">
            {view.head}
          </span>
          <PageButton direction="next" view={view} onPage={onPage} />
        </div>
        <nav aria-label="Report pages" data-testid="thumbnails" onKeyDown={onKeyDown} className={THUMBNAILS}>
          {view.pages.map((page) => (
            <Thumbnail key={page.number} page={page} isCurrent={page.number === view.page} onPage={onPage} />
          ))}
        </nav>
      </div>
    </>
  );
}
