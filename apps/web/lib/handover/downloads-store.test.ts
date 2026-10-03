import { describe, expect, test } from "bun:test";
import type { ExportKind, ExportedFile, Project } from "../api";
import { ApiError } from "../api";
import type { ToastAsked } from "../../components/ui/toast-queue";
import { createDownloadsStore, statusOf } from "./downloads-store";

// A download (plan/phase-09-plan.md, decision 12): the file of the API saved by the browser, the item's state while it is on
// its way and when it failed, a failure said in a toast with Try again, two presses while on its way one download.

type Call = { kind: ExportKind; document: Project; day: string | undefined };

const DOCUMENT = { name: "Pune demo roof", format: 2 } as unknown as Project;
const DAY = "2026-10-03";
const REFUSED = new ApiError(422, "no_option_chosen", "Choose a stringing option first.", "chosen_option");

/** Stands in for the API: every export is answered when the test says so. */
function fakeApi() {
  const calls: Call[] = [];
  const pending: { resolve: (file: ExportedFile) => void; reject: (error: unknown) => void }[] = [];
  return {
    calls,
    pending,
    api: {
      exportDesign(kind: ExportKind, document: Project, options: { day?: string } = {}): Promise<ExportedFile> {
        calls.push({ kind, document, day: options.day });
        return new Promise<ExportedFile>((resolve, reject) => pending.push({ resolve, reject }));
      },
    },
    answer(index: number, name: string) {
      pending[index]!.resolve({ name, blob: new Blob([name], { type: "application/octet-stream" }) });
    },
    refuse(index: number, error: unknown = REFUSED) {
      pending[index]!.reject(error);
    },
  };
}

function made(open: { document: Project; edit: number } | null = { document: DOCUMENT, edit: 3 }) {
  const fake = fakeApi();
  const saved: { blob: Blob; name: string }[] = [];
  const toasts: ToastAsked[] = [];
  const store = createDownloadsStore({
    api: fake.api,
    save: (blob, name) => saved.push({ blob, name }),
    day: () => DAY,
    toasts: { show: (asked) => toasts.push(asked) && toasts.length },
    open: () => open,
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

  test("a fault that is not the API's is said in words too", async () => {
    const { store, toasts, refuse } = made();

    const done = store.getState().download("report");
    refuse(0, new TypeError("blob is not a function"));
    await done;

    expect(statusOf(store.getState(), "report")).toMatchObject({ status: "failed", message: expect.stringContaining("blob is not a function") });
    expect(toasts[0]!.words).toContain("Try again");
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

  test("an item that is a view has no file, and nothing is asked", async () => {
    const { store, calls } = made();

    await store.getState().download("bill-of-materials");

    expect(calls).toEqual([]);
    expect(statusOf(store.getState(), "bill-of-materials")).toEqual({ status: "idle" });
  });

  test("while no design is open nothing is asked", async () => {
    const { store, calls } = made(null);

    await store.getState().download("report");

    expect(calls).toEqual([]);
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
