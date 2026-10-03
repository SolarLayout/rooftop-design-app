// The paper preview of the report (plan/phase-09-plan.md, step 11, decisions 4 and 5; the boards "Handover" on three sizes
// and "Handover, states"): the engine's pages as images, the one shown (the first unless another was chosen for these very
// pages: a new run begins at the first), the bounds of previous and next, the words of the head "Page 1 of 6 · Summary", the
// thumbnails' captions and names; skeletons while the pages come; a failure in the API's words with Try again; the pages of
// the edit before kept and dimmed while the new ones come. Pure.
import { TRY_AGAIN } from "../../components/shell/vitals-view";
import type { ReportPage } from "../api";
import type { FailedRow } from "../performance/page-view";
import type { DownloadStatus, KeptPages } from "./downloads-store";

export const PAGES_NOT_UPDATED = { title: "The pages were not updated", detail: "They are of the design before" } as const;
export const PAGES_NOT_MADE = { title: "The pages were not made", detail: "There is no preview yet" } as const;

/** The page chosen, for the pages of one edit; null while none was. */
export type ShownPage = { edit: number; page: number } | null;

export type PageThumb = {
  number: number;
  /** The engine's short title: Summary, Layout, Shadows, Energy, Schedule, Schedule (continued), SLD. */
  title: string;
  /** The name of the thumbnail's button, and of the page's image: "Page 2, Layout". */
  name: string;
  /** Under the thumbnail on desktop and tablet: "2 · Layout". On phone the number alone stands. */
  caption: string;
  /** The page's PNG as a data URL. */
  src: string;
  width: number;
  height: number;
};

export type ReportView = {
  /** Loading: no pages were ever there. Failed: none were there and they did not come. Pages: the pages are there. */
  kind: "loading" | "failed" | "pages";
  pages: PageThumb[];
  current: PageThumb | null;
  /** The page shown, from 1; 0 while there are no pages. */
  page: number;
  count: number;
  /** "Page 1 of 6 · Summary"; null while the pages are not there. */
  head: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  /** The pages are of the edit before: the new ones are on their way, or did not come. Shown dimmed. */
  isStale: boolean;
  /** The pages did not come, in the API's words, with Try again; null unless they were refused. */
  failed: FailedRow | null;
};

type Asked = {
  kept: KeptPages | null;
  /** The edit of the document that is open. */
  edit: number;
  status: DownloadStatus;
  shown: ShownPage;
};

const STEP: Partial<Record<string, number>> = { ArrowLeft: -1, ArrowRight: 1 };

const clamp = (page: number, count: number) => Math.min(count, Math.max(1, page));

function thumbOf(page: ReportPage): PageThumb {
  return {
    number: page.number,
    title: page.title,
    name: `Page ${page.number}, ${page.title}`,
    caption: `${page.number} · ${page.title}`,
    src: `data:image/png;base64,${page.png}`,
    width: page.width,
    height: page.height,
  };
}

function failedOf(status: DownloadStatus, isStale: boolean): FailedRow | null {
  if (status.status !== "failed") return null;
  const { title, detail } = isStale ? PAGES_NOT_UPDATED : PAGES_NOT_MADE;
  return { title, detail, action: TRY_AGAIN, message: status.message };
}

export function reportViewOf({ kept, edit, status, shown }: Asked): ReportView {
  if (kept === null) {
    const failed = failedOf(status, false);
    return { kind: failed ? "failed" : "loading", pages: [], current: null, page: 0, count: 0, head: null, hasPrevious: false, hasNext: false, isStale: false, failed };
  }
  const pages = kept.answer.pages.map(thumbOf);
  const count = pages.length;
  const page = shown !== null && shown.edit === kept.edit ? clamp(shown.page, count) : 1;
  const current = pages[page - 1] ?? null;
  const isStale = kept.edit !== edit;
  return {
    kind: "pages",
    pages,
    current,
    page,
    count,
    head: current ? `Page ${page} of ${count} · ${current.title}` : null,
    hasPrevious: page > 1,
    hasNext: page < count,
    isStale,
    failed: isStale ? failedOf(status, true) : null,
  };
}

/** The page after *key* on the paper or the thumbnails: Left and Right, held at the ends; null for another key. */
export function pageAfterKey(key: string, page: number, count: number): number | null {
  const step = STEP[key];
  return step === undefined ? null : clamp(page + step, count);
}
