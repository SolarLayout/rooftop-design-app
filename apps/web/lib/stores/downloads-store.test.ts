import { describe, expect, test } from "bun:test";
import type { ExportKind, ExportedFile, Project, ProjectRequest, ReportPages } from "../api";
import { ApiError } from "../api";
import type { ToastAsked } from "../../components/ui/toast-queue";
import { allStatusOf, createDownloadsStore, pagesOf, pagesStatusOf, statusOf } from "./downloads-store";

// A download (plan/phase-09-plan.md, decision 12): the file of the API saved by the browser, the item's state while it is on
// its way and when it failed, a failure said in a toast with Try again, two presses while on its way one download.

type Call = { kind: ExportKind | "pages"; document: ProjectRequest; day: string | undefined };

const DOCUMENT = { name: "Pune demo roof", format: 2 } as unknown as Project;
const DAY = "2026-10-03";
const REFUSED = new ApiError(422, "no_option_chosen", "Choose a stringing option first.", "chosen_option");
const PAGE = { number: 1, title: "Summary", width: 1753, height: 1240, png: "iVBORw0KGgo=" };
const pagesOfDay = (day: string, count = 6): ReportPages => ({ day, dpi: 150, pages: Array.from({ length: count }, (_, index) => ({ ...PAGE, number: index + 1 })) });

/** Stands in for the API: every export is answered when the test says so. */
function fakeApi() {
  const calls: Call[] = [];
  const pending: { resolve: (answer: ExportedFile | ReportPages) => void; reject: (error: unknown) => void }[] = [];
  return {
    calls,
    pending,
    api: {
      exportDesign(kind: ExportKind, document: Project, options: { day?: string } = {}): Promise<ExportedFile> {
        calls.push({ kind, document, day: options.day });
        return new Promise<ExportedFile>((resolve, reject) => pending.push({ resolve: resolve as (answer: ExportedFile | ReportPages) => void, reject }));
      },
      reportPages(document: ProjectRequest, options: { day?: string } = {}): Promise<ReportPages> {
        calls.push({ kind: "pages", document, day: options.day });
        return new Promise<ReportPages>((resolve, reject) => pending.push({ resolve: resolve as (answer: ExportedFile | ReportPages) => void, reject }));
      },
    },
    answer(index: number, name: string) {
      pending[index]!.resolve({ name, blob: new Blob([name], { type: "application/octet-stream" }) });
    },
    answerPages(index: number, pages: ReportPages) {
      pending[index]!.resolve(pages);
    },
    refuse(index: number, error: unknown = REFUSED) {
      pending[index]!.reject(error);
    },
  };
}

function made(open: { document: Project; edit: number; chosen?: string | null } | null = { document: DOCUMENT, edit: 3 }) {
  const fake = fakeApi();
  const saved: { blob: Blob; name: string }[] = [];
  const toasts: ToastAsked[] = [];
  const store = createDownloadsStore({
    api: fake.api,
    save: (blob, name) => saved.push({ blob, name }),
    day: () => DAY,
    toasts: { show: (asked) => toasts.push(asked) && toasts.length },
    // As the shell's: what is open, read at the moment of the ask, not a thing that changes under a request on its way.
    open: () => (open === null ? null : { chosen: null, ...open }),
  });
  return { ...fake, store, saved, toasts };
}

/** Lets what was answered settle. */
const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("a download", () => {
  test("asks the API for the item's file with the document and the day, is on its way until it comes, then saves it and rests", async () => {
    const { store, api, calls, saved, answer } = made();
    void api;

    const done = store.getState().download("report");

    expect(statusOf(store.getState(), "report")).toEqual({ status: "on-its-way" });
    expect(calls).toEqual([{ kind: "pdf", document: DOCUMENT, day: DAY }]);
    answer(0, "Pune-demo-roof-report.pdf");
    await done;

    expect(statusOf(store.getState(), "report")).toEqual({ status: "idle" });
    expect(saved.map((file) => file.name)).toEqual(["Pune-demo-roof-report.pdf"]);
    expect(await saved[0]!.blob.text()).toBe("Pune-demo-roof-report.pdf");
  });

  test("each item asks for its own kind; the project file needs no option", async () => {
    const { store, calls, answer } = made();

    const first = store.getState().download("project-file");
    const second = store.getState().download("hourly-data");
    answer(0, "Pune-demo-roof.rtd");
    answer(1, "Pune-demo-roof-hourly.csv");
    await Promise.all([first, second]);

    expect(calls.map((call) => call.kind)).toEqual(["rtd", "csv"]);
  });

  test("two presses while it is on its way are one download", async () => {
    const { store, calls, saved, answer } = made();

    const first = store.getState().download("report");
    const second = store.getState().download("report");
    answer(0, "Pune-demo-roof-report.pdf");
    await Promise.all([first, second]);

    expect(calls).toHaveLength(1);
    expect(saved).toHaveLength(1);
  });

  test("a download that failed says so with the API's words, in the item's state and in a toast with Try again; nothing is saved", async () => {
    const { store, saved, toasts, refuse } = made();

    const done = store.getState().download("report");
    refuse(0);
    await done;

    expect(statusOf(store.getState(), "report")).toEqual({ status: "failed", message: "Choose a stringing option first." });
    expect(saved).toEqual([]);
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ kind: "note", words: "Choose a stringing option first." });
    expect(toasts[0]!.action?.label).toBe("Try again");
  });

  test("a fault that is not the API's is said in the app's words, the fault behind Details (V2 · 5)", async () => {
    const { store, toasts, refuse } = made();

    const done = store.getState().download("report");
    refuse(0, new TypeError("blob is not a function"));
    await done;

    expect(statusOf(store.getState(), "report")).toMatchObject({ status: "failed", message: "The app could not finish this step." });
    expect(toasts[0]!.action?.label).toBe("Try again");
  });

  test("Try again asks again, from the toast or from the page, and a file that comes then is saved", async () => {
    const { store, calls, saved, toasts, refuse } = made();
    const failed = store.getState().download("report");
    refuse(0);
    await failed;

    toasts[0]!.action!.run();
    expect(statusOf(store.getState(), "report")).toEqual({ status: "on-its-way" });
    expect(calls).toHaveLength(2);
    refuse(1);
    await settled();
    expect(statusOf(store.getState(), "report")).toMatchObject({ status: "failed" });

    const again = store.getState().tryAgain("report");
    expect(calls).toHaveLength(3);
    refuse(2);
    await again;
    expect(saved).toEqual([]);
    expect(toasts).toHaveLength(3);
  });

  test("a download after one that came saves the kept file again, without a request", async () => {
    const { store, calls, saved, answer } = made();
    const first = store.getState().download("report");
    answer(0, "Pune-demo-roof-report.pdf");
    await first;

    await store.getState().download("report");

    expect(calls).toHaveLength(1);
    expect(saved).toHaveLength(2);
    expect(saved[1]!.blob).toBe(saved[0]!.blob);
  });

  test("a done download says nothing: no toast", async () => {
    const { store, toasts, answer } = made();

    const done = store.getState().download("report");
    answer(0, "Pune-demo-roof-report.pdf");
    await done;

    expect(toasts).toEqual([]);
  });

  test("the bill of materials and the cable schedule are files too (V2 · 9): each asks for its CSV", async () => {
    const { store, calls, answer } = made();

    const first = store.getState().download("bill-of-materials");
    const second = store.getState().download("cable-schedule");
    answer(0, "Pune-demo-roof-bill-of-materials.csv");
    answer(1, "Pune-demo-roof-cable-schedule.csv");
    await Promise.all([first, second]);

    expect(calls.map((call) => call.kind)).toEqual(["bom", "cables"]);
  });

  test("while no design is open nothing is asked", async () => {
    const { store, calls } = made(null);

    await store.getState().download("report");

    expect(calls).toEqual([]);
  });
});

describe("Download all (plan/phase-09-plan.md, step 21, decision 10): the zip of everything", () => {
  test("asks the API for the zip with the document and the day, is on its way until it comes, then saves it and rests", async () => {
    const { store, calls, saved, answer } = made();

    const done = store.getState().downloadAll();

    expect(allStatusOf(store.getState())).toEqual({ status: "on-its-way" });
    expect(calls).toEqual([{ kind: "zip", document: DOCUMENT, day: DAY }]);
    answer(0, "Pune-demo-roof.zip");
    await done;

    expect(allStatusOf(store.getState())).toEqual({ status: "idle" });
    expect(saved.map((file) => file.name)).toEqual(["Pune-demo-roof.zip"]);
  });

  test("two presses while it is on its way are one download; the items' own states are untouched", async () => {
    const { store, calls, saved, answer } = made();

    const first = store.getState().downloadAll();
    const second = store.getState().downloadAll();
    answer(0, "Pune-demo-roof.zip");
    await Promise.all([first, second]);

    expect(calls).toHaveLength(1);
    expect(saved).toHaveLength(1);
    expect(store.getState().byItem).toEqual({});
  });

  test("a zip that failed says so in the API's words, in its state and in a toast with Try again, which asks again", async () => {
    const { store, calls, saved, toasts, refuse, answer } = made();

    const done = store.getState().downloadAll();
    refuse(0);
    await done;

    expect(allStatusOf(store.getState())).toEqual({ status: "failed", message: "Choose a stringing option first." });
    expect(saved).toEqual([]);
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ kind: "note", words: "Choose a stringing option first." });
    toasts[0]!.action!.run();
    expect(allStatusOf(store.getState())).toEqual({ status: "on-its-way" });
    answer(1, "Pune-demo-roof.zip");
    await settled();

    expect(calls).toHaveLength(2);
    expect(saved).toHaveLength(1);
    expect(allStatusOf(store.getState())).toEqual({ status: "idle" });
  });

  test("the zip names the option shown when the document names none, as the files of the design do", async () => {
    const { store, calls } = made({ document: { ...DOCUMENT, chosen_option: "" }, edit: 3, chosen: "26x24x1" });

    void store.getState().downloadAll();
    await settled();

    expect(calls[0]!.document.chosen_option).toBe("26x24x1");
  });

  test("while no design is open nothing is asked; another design opened rests the state", async () => {
    const none = made(null);
    await none.store.getState().downloadAll();
    expect(none.calls).toEqual([]);

    const { store, refuse } = made();
    const done = store.getState().downloadAll();
    refuse(0);
    await done;
    store.getState().clear();

    expect(allStatusOf(store.getState())).toEqual({ status: "idle" });
  });
});

describe("a file kept for the document's edit (decision 9: the .rtd is asked once per edit)", () => {
  test("asked twice for one edit, the file comes from the API once, and the download saves the same bytes", async () => {
    const { store, calls, saved, answer } = made();

    const first = store.getState().ask("rtd");
    const second = store.getState().ask("rtd");
    answer(0, "Pune-demo-roof.rtd");
    const [a, b] = await Promise.all([first, second]);

    expect(calls).toHaveLength(1);
    expect(a).toBe(b);
    expect(store.getState().kept.rtd).toMatchObject({ edit: 3, file: { name: "Pune-demo-roof.rtd" } });

    await store.getState().download("project-file");
    expect(calls).toHaveLength(1);
    expect(saved[0]!.blob).toBe(a.blob);
  });

  test("the CSV asked for the preview of the hourly data and then downloaded is one request, the same bytes (decision 8)", async () => {
    const { store, calls, saved, answer } = made();

    const asked = store.getState().ask("csv");
    answer(0, "Pune-demo-roof-hourly.csv");
    const file = await asked;
    await store.getState().download("hourly-data");

    expect(calls.map((call) => call.kind)).toEqual(["csv"]);
    expect(saved).toEqual([{ blob: file.blob, name: "Pune-demo-roof-hourly.csv" }]);
  });

  test("another edit of the document asks anew, and the file of before is gone", async () => {
    const open = { document: DOCUMENT, edit: 3 };
    const { store, calls, answer } = made(open);
    const first = store.getState().ask("rtd");
    answer(0, "Pune-demo-roof.rtd");
    await first;

    open.edit = 4;
    open.document = { ...DOCUMENT, name: "Block B" };
    const second = store.getState().ask("rtd");
    expect(store.getState().kept.rtd).toBeUndefined();
    answer(1, "Block-B.rtd");
    await second;

    expect(calls).toHaveLength(2);
    expect(calls[1]!.document.name).toBe("Block B");
    expect(store.getState().kept.rtd?.file.name).toBe("Block-B.rtd");
  });

  test("a file that was refused is not kept, and the next ask asks again", async () => {
    const { store, calls, refuse, answer } = made();
    const first = store.getState().ask("rtd");
    refuse(0);
    await expect(first).rejects.toBe(REFUSED);

    const second = store.getState().ask("rtd");
    answer(1, "Pune-demo-roof.rtd");
    await second;

    expect(calls).toHaveLength(2);
  });

  test("another design opened: nothing of the one before stays", async () => {
    const { store, answer } = made();
    const first = store.getState().ask("rtd");
    answer(0, "Pune-demo-roof.rtd");
    await first;

    store.getState().clear();

    expect(store.getState().kept).toEqual({});
    expect(store.getState().byItem).toEqual({});
  });
});

describe("the pages of the report, kept per edit as the files are (plan/phase-09-plan.md, decisions 2 and 5)", () => {
  test("asked once: the API is asked with the document and the day, the pages are on their way, then kept with the edit and at rest", async () => {
    const { store, calls, answerPages } = made();

    const asked = store.getState().askPages();

    expect(pagesStatusOf(store.getState())).toEqual({ status: "on-its-way" });
    expect(pagesOf(store.getState())).toBeNull();
    expect(calls).toEqual([{ kind: "pages", document: DOCUMENT, day: DAY }]);
    answerPages(0, pagesOfDay(DAY));
    await asked;

    expect(pagesStatusOf(store.getState())).toEqual({ status: "idle" });
    expect(pagesOf(store.getState())).toEqual({ edit: 3, answer: pagesOfDay(DAY) });
  });

  test("asked twice for one edit, at once or after the answer, the API is asked once", async () => {
    const { store, calls, answerPages } = made();

    const first = store.getState().askPages();
    const second = store.getState().askPages();
    answerPages(0, pagesOfDay(DAY));
    await Promise.all([first, second]);
    await store.getState().askPages();

    expect(calls).toHaveLength(1);
  });

  test("a new edit of the document asks again; the pages of before stay, as of the edit before, until the new ones come", async () => {
    const open = { document: DOCUMENT, edit: 3 };
    const { store, calls, answerPages } = made(open);
    const first = store.getState().askPages();
    answerPages(0, pagesOfDay(DAY));
    await first;

    open.edit = 4;
    open.document = { ...DOCUMENT, name: "Block B" };
    const second = store.getState().askPages();

    expect(calls).toHaveLength(2);
    expect(calls[1]!.document.name).toBe("Block B");
    expect(pagesOf(store.getState())).toEqual({ edit: 3, answer: pagesOfDay(DAY) });
    expect(pagesStatusOf(store.getState())).toEqual({ status: "on-its-way" });
    answerPages(1, pagesOfDay(DAY, 7));
    await second;
    expect(pagesOf(store.getState())).toEqual({ edit: 4, answer: pagesOfDay(DAY, 7) });
  });

  test("an answer to an edit that is no longer the document's is not kept", async () => {
    const open = { document: DOCUMENT, edit: 3 };
    const { store, answerPages } = made(open);
    const first = store.getState().askPages();
    open.edit = 4;
    answerPages(0, pagesOfDay(DAY));
    await first;

    expect(pagesOf(store.getState())).toBeNull();
  });

  test("a refusal is not kept: the state says failed with the API's words, nothing is said in a toast, and the next ask asks again", async () => {
    const { store, calls, toasts, refuse, answerPages } = made();
    const first = store.getState().askPages();
    refuse(0);
    await first;

    expect(pagesStatusOf(store.getState())).toEqual({ status: "failed", message: "Choose a stringing option first." });
    expect(pagesOf(store.getState())).toBeNull();
    expect(toasts).toEqual([]);

    const second = store.getState().askPages();
    expect(pagesStatusOf(store.getState())).toEqual({ status: "on-its-way" });
    answerPages(1, pagesOfDay(DAY));
    await second;

    expect(calls).toHaveLength(2);
    expect(pagesOf(store.getState())).toEqual({ edit: 3, answer: pagesOfDay(DAY) });
  });

  test("a fault that is not the API's is said in the app's words, the fault behind Details (V2 · 5)", async () => {
    const { store, refuse } = made();
    const asked = store.getState().askPages();
    refuse(0, new TypeError("json is not a function"));
    await asked;

    expect(pagesStatusOf(store.getState())).toMatchObject({ status: "failed", message: "The app could not finish this step." });
  });

  test("while no design is open nothing is asked, and nothing is said", async () => {
    const { store, calls } = made(null);

    await store.getState().askPages();

    expect(calls).toEqual([]);
    expect(pagesStatusOf(store.getState())).toEqual({ status: "idle" });
  });

  test("the pages and the PDF are asked with the same day, the reader's, so that the preview and the file agree (decision 2)", async () => {
    const { store, calls, answerPages, answer } = made();
    const pages = store.getState().askPages();
    answerPages(0, pagesOfDay(DAY));
    await pages;

    const pdf = store.getState().download("report");
    answer(1, "Pune-demo-roof-report.pdf");
    await pdf;

    expect(calls.map((call) => [call.kind, call.day])).toEqual([
      ["pages", DAY],
      ["pdf", DAY],
    ]);
  });

  test("another design opened: nothing of the one before stays", async () => {
    const { store, answerPages } = made();
    const first = store.getState().askPages();
    answerPages(0, pagesOfDay(DAY));
    await first;

    store.getState().clear();

    expect(pagesOf(store.getState())).toBeNull();
    expect(pagesStatusOf(store.getState())).toEqual({ status: "idle" });
  });
});

describe("the option a file is asked for (the API refuses a file of the design without a chosen option)", () => {
  const unchosen = { ...DOCUMENT, chosen_option: "" };

  test("a file of the design names the option shown when the document names none", async () => {
    const { store, calls } = made({ document: unchosen, edit: 3, chosen: "26x24x1" });

    void store.getState().download("report");
    await settled();

    expect(calls[0]!.document.chosen_option).toBe("26x24x1");
  });

  test("the pages of the report the same", async () => {
    const { store, calls } = made({ document: unchosen, edit: 3, chosen: "26x24x1" });

    void store.getState().askPages();
    await settled();

    expect(calls[0]!.document.chosen_option).toBe("26x24x1");
  });

  test("a choice the run no longer holds, left by an edit that changed the options, gives way to the option shown", async () => {
    // The owner's IKEA design: chosen 18x84x7, then the module and the inverter changed; the run shows its first, 23x67x7.
    const stale = { ...DOCUMENT, chosen_option: "18x84x7" };
    const report = made({ document: stale, edit: 3, chosen: "23x67x7" });
    void report.store.getState().download("report");
    const pages = made({ document: stale, edit: 3, chosen: "23x67x7" });
    void pages.store.getState().askPages();
    await settled();

    expect(report.calls[0]!.document.chosen_option).toBe("23x67x7");
    expect(pages.calls[0]!.document.chosen_option).toBe("23x67x7");
  });

  test("the document's own choice, when it is the one shown, stands; the project file is the document as it is; without a run nothing is added", async () => {
    const chosen = made({ document: { ...DOCUMENT, chosen_option: "29x22x1" }, edit: 3, chosen: "29x22x1" });
    void chosen.store.getState().download("report");
    const file = made({ document: { ...DOCUMENT, chosen_option: "18x84x7" }, edit: 3, chosen: "26x24x1" });
    void file.store.getState().download("project-file");
    const noRun = made({ document: unchosen, edit: 3, chosen: null });
    void noRun.store.getState().download("report");
    await settled();

    expect(chosen.calls[0]!.document.chosen_option).toBe("29x22x1");
    expect(file.calls[0]!.document.chosen_option).toBe("18x84x7");
    expect(noRun.calls[0]!.document.chosen_option).toBe("");
  });
});

describe("a copy of a design that is not open (plan/phase-10-plan.md, step 12: Save a copy on a card of Home)", () => {
  const BLOCK_B = { name: "Block B", format: 2 } as unknown as Project;

  test("asks the API for the project file of that document, as it is, and saves it under the name the API gives", async () => {
    const { store, calls, saved, answer } = made();

    const done = store.getState().saveACopyOf(BLOCK_B);

    expect(calls).toEqual([{ kind: "rtd", document: BLOCK_B, day: DAY }]);
    answer(0, "Block-B.rtd");
    await done;

    expect(saved.map((file) => file.name)).toEqual(["Block-B.rtd"]);
    expect(store.getState().kept).toEqual({});
  });

  test("needs no design to be open", async () => {
    const { store, calls, answer } = made(null);

    const done = store.getState().saveACopyOf(BLOCK_B);
    answer(0, "Block-B.rtd");
    await done;

    expect(calls).toHaveLength(1);
  });

  test("a failure is a toast with the API's words and Try again, which asks again", async () => {
    const { store, calls, saved, toasts, refuse, answer } = made();

    await Promise.all([store.getState().saveACopyOf(BLOCK_B), settled().then(() => refuse(0))]);

    expect(saved).toEqual([]);
    expect(toasts).toEqual([{ kind: "note", words: "Choose a stringing option first.", action: { label: "Try again", run: expect.any(Function) } }]);

    toasts[0]!.action!.run();
    await settled();
    answer(1, "Block-B.rtd");
    await settled();
    expect(calls).toHaveLength(2);
    expect(saved.map((file) => file.name)).toEqual(["Block-B.rtd"]);
  });
});
