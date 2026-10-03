import { describe, expect, test } from "bun:test";
import type { ReportPages } from "../api";
import { pageAfterKey, reportViewOf, type ReportView } from "./report-view";

// The paper preview of the report (plan/phase-09-plan.md, step 11, decisions 4 and 5; the boards "Handover" on three
// sizes and "Handover, states"): the page shown, 1 unless another was chosen for these very pages; the bounds; the words of
// the head "Page 1 of 6 · Summary"; the thumbnails' captions and names; skeletons while the pages come; a failure in the
// API's words with Try again; the pages of the edit before kept and dimmed while the new ones come.

const TITLES = ["Summary", "Layout", "Shadows", "Energy", "Schedule", "SLD"];
const PAGES: ReportPages = {
  day: "2026-10-03",
  dpi: 150,
  pages: TITLES.map((title, index) => ({ number: index + 1, title, width: 1753, height: 1240, png: `PNG${index + 1}` })),
};
const KEPT = { edit: 3, answer: PAGES };
const IDLE = { status: "idle" } as const;
const ON_ITS_WAY = { status: "on-its-way" } as const;
const FAILED = { status: "failed", message: "Choose a stringing option first." } as const;
const AT_REST = { kept: KEPT, edit: 3, status: IDLE, shown: null } as const;

const captions = (view: ReportView) => view.pages.map((page) => page.caption);
const names = (view: ReportView) => view.pages.map((page) => page.name);

describe("the pages, once they are there", () => {
  test("the first page by default: the head's words, the first page as the image, no previous, a next", () => {
    const view = reportViewOf(AT_REST);

    expect(view.kind).toBe("pages");
    expect(view.page).toBe(1);
    expect(view.count).toBe(6);
    expect(view.head).toBe("Page 1 of 6 · Summary");
    expect(view.current).toMatchObject({ number: 1, title: "Summary", width: 1753, height: 1240, src: "data:image/png;base64,PNG1" });
    expect(view.hasPrevious).toBe(false);
    expect(view.hasNext).toBe(true);
    expect(view.isStale).toBe(false);
    expect(view.failed).toBeNull();
  });

  test("each thumbnail: its number and the engine's title as its caption, 'Page n, Title' as its name, the same image", () => {
    const view = reportViewOf(AT_REST);

    expect(captions(view)).toEqual(["1 · Summary", "2 · Layout", "3 · Shadows", "4 · Energy", "5 · Schedule", "6 · SLD"]);
    expect(names(view)).toEqual(["Page 1, Summary", "Page 2, Layout", "Page 3, Shadows", "Page 4, Energy", "Page 5, Schedule", "Page 6, SLD"]);
    expect(view.pages.map((page) => page.src)).toEqual(TITLES.map((_, index) => `data:image/png;base64,PNG${index + 1}`));
    expect(view.pages[1]).toMatchObject({ number: 2, width: 1753, height: 1240 });
  });

  test("a page chosen for these pages is the one shown, with the words and the bounds that follow", () => {
    const third = reportViewOf({ ...AT_REST, shown: { edit: 3, page: 3 } });
    expect(third.head).toBe("Page 3 of 6 · Shadows");
    expect(third.current?.number).toBe(3);
    expect(third.hasPrevious).toBe(true);
    expect(third.hasNext).toBe(true);

    const last = reportViewOf({ ...AT_REST, shown: { edit: 3, page: 6 } });
    expect(last.head).toBe("Page 6 of 6 · SLD");
    expect(last.hasNext).toBe(false);
    expect(last.hasPrevious).toBe(true);
  });

  test("a page chosen for the pages of another edit does not count: a new run begins at the first page", () => {
    const view = reportViewOf({ ...AT_REST, shown: { edit: 2, page: 4 } });

    expect(view.page).toBe(1);
    expect(view.head).toBe("Page 1 of 6 · Summary");
  });

  test("a page beyond the count is the last; one before the first is the first", () => {
    expect(reportViewOf({ ...AT_REST, shown: { edit: 3, page: 9 } }).page).toBe(6);
    expect(reportViewOf({ ...AT_REST, shown: { edit: 3, page: 0 } }).page).toBe(1);
  });

  test("the pages of the edit before, while the new ones come: shown, and said to be of before", () => {
    const view = reportViewOf({ ...AT_REST, edit: 4, status: ON_ITS_WAY });

    expect(view.kind).toBe("pages");
    expect(view.isStale).toBe(true);
    expect(view.head).toBe("Page 1 of 6 · Summary");
    expect(view.failed).toBeNull();
  });

  test("a long schedule: seven pages, the words count them", () => {
    const pages = { ...PAGES, pages: [...PAGES.pages.slice(0, 5), { number: 6, title: "Schedule (continued)", width: 1753, height: 1240, png: "PNG6" }, { ...PAGES.pages[5]!, number: 7 }] };
    const view = reportViewOf({ ...AT_REST, kept: { edit: 3, answer: pages }, shown: { edit: 3, page: 6 } });

    expect(view.count).toBe(7);
    expect(view.head).toBe("Page 6 of 7 · Schedule (continued)");
    expect(captions(view)[6]).toBe("7 · SLD");
  });
});

describe("while the pages come, and when they do not", () => {
  test("nothing kept and the pages on their way, or not yet asked: skeletons, no words", () => {
    for (const status of [ON_ITS_WAY, IDLE]) {
      const view = reportViewOf({ kept: null, edit: 3, status, shown: null });

      expect(view.kind).toBe("loading");
      expect(view.pages).toEqual([]);
      expect(view.current).toBeNull();
      expect(view.head).toBeNull();
      expect(view.count).toBe(0);
      expect(view.hasPrevious).toBe(false);
      expect(view.hasNext).toBe(false);
      expect(view.failed).toBeNull();
    }
  });

  test("nothing kept and the pages refused: what did not happen, what there is, Try again, and the API's words", () => {
    const view = reportViewOf({ kept: null, edit: 3, status: FAILED, shown: null });

    expect(view.kind).toBe("failed");
    expect(view.pages).toEqual([]);
    expect(view.failed).toEqual({ title: "The pages were not made", detail: "There is no preview yet", action: "Try again", message: "Choose a stringing option first." });
  });

  test("the pages of the edit before kept and the new ones refused: the pages of before stand, said to be of before, with the API's words", () => {
    const view = reportViewOf({ ...AT_REST, edit: 4, status: FAILED });

    expect(view.kind).toBe("pages");
    expect(view.isStale).toBe(true);
    expect(view.head).toBe("Page 1 of 6 · Summary");
    expect(view.failed).toEqual({ title: "The pages were not updated", detail: "They are of the design before", action: "Try again", message: "Choose a stringing option first." });
  });

  test("a failure of before is not said over the pages of this edit", () => {
    const view = reportViewOf({ ...AT_REST, status: FAILED });

    expect(view.failed).toBeNull();
    expect(view.kind).toBe("pages");
  });
});

describe("the keys Left and Right on the paper or the thumbnails", () => {
  test("Right goes to the next page, Left to the one before", () => {
    expect(pageAfterKey("ArrowRight", 2, 6)).toBe(3);
    expect(pageAfterKey("ArrowLeft", 2, 6)).toBe(1);
  });

  test("the ends hold: the first page has none before, the last none after", () => {
    expect(pageAfterKey("ArrowLeft", 1, 6)).toBe(1);
    expect(pageAfterKey("ArrowRight", 6, 6)).toBe(6);
  });

  test("another key is not a page", () => {
    expect(pageAfterKey("ArrowUp", 2, 6)).toBeNull();
    expect(pageAfterKey("Enter", 2, 6)).toBeNull();
  });
});
