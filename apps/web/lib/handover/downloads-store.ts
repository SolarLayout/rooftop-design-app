// The downloads of Handover (plan/phase-09-plan.md, decision 12): a store without React. `download(item)` asks the API for
// the item's file with the document and the reader's day, saves it, and keeps the item's state: on its way, failed with the
// API's words, or at rest. A failure is said in a toast with Try again; a download done says nothing, the browser shows the
// file. A file is kept per edit of the document, so that the project file asked for when its item opens is the one Save a
// copy saves (decision 9).
import { createStore } from "zustand/vanilla";
import type { ToastAsked } from "../../components/ui/toast-queue";
import type { Api, ExportedFile, ExportKind, Project } from "../api";
import { failureOf } from "../flow/design-flow";
import type { HandoverItem } from "../routes";
import { todayOfTheBrowser } from "./day";
import { kindOf } from "./items";
import { saveBlob } from "./save-file";

export type DownloadStatus = { status: "idle" } | { status: "on-its-way" } | { status: "failed"; message: string };

/** A file the API handed out, with the edit of the document it is of. */
export type KeptFile = { edit: number; file: ExportedFile };

/** The design that is open, as the downloads need it: the document and its edit. */
export type Open = { document: Project; edit: number };

export type DownloadsState = {
  byItem: Partial<Record<HandoverItem, DownloadStatus>>;
  kept: Partial<Record<ExportKind, KeptFile>>;
  /** Asks for the item's file and saves it. A second press while it is on its way does nothing; an item without a file nothing. */
  download: (item: HandoverItem) => Promise<void>;
  /** Asks again after a failure. */
  tryAgain: (item: HandoverItem) => Promise<void>;
  /** The file of *kind* for the document as it is now: from the API once per edit, then kept. */
  ask: (kind: ExportKind) => Promise<ExportedFile>;
  /** Another design is opened: nothing of the one before stays. */
  clear: () => void;
};

export type DownloadsStore = ReturnType<typeof createDownloadsStore>;

type Options = {
  api: Pick<Api, "exportDesign">;
  /** Saves a file in the browser; `saveBlob` unless a test gives its own. */
  save?: (blob: Blob, name: string) => void;
  /** The reader's day, YYYY-MM-DD; the browser's today unless a test gives its own. */
  day?: () => string;
  /** Where a failure is said. */
  toasts: { show: (asked: ToastAsked) => number };
  /** The design that is open; null while none is. */
  open: () => Open | null;
};

const IDLE: DownloadStatus = { status: "idle" };
const ON_ITS_WAY: DownloadStatus = { status: "on-its-way" };
const TRY_AGAIN = "Try again";

export function createDownloadsStore({ api, save = saveBlob, day = todayOfTheBrowser, toasts, open }: Options) {
  /** The requests on their way, by kind, with the edit each is for. */
  const asking = new Map<ExportKind, { edit: number; file: Promise<ExportedFile> }>();

  return createStore<DownloadsState>()((set, get) => {
    const setStatus = (item: HandoverItem, status: DownloadStatus) => set({ byItem: { ...get().byItem, [item]: status } });

    function ask(kind: ExportKind): Promise<ExportedFile> {
      const now = open();
      if (now === null) return Promise.reject(new Error("No design is open: open one before its files are asked for."));
      const kept = get().kept[kind];
      if (kept && kept.edit === now.edit) return Promise.resolve(kept.file);
      const onItsWay = asking.get(kind);
      if (onItsWay && onItsWay.edit === now.edit) return onItsWay.file;
      // Another edit: what was kept is of the document before.
      if (kept) set({ kept: { ...get().kept, [kind]: undefined } });
      const file = api.exportDesign(kind, now.document, { day: day() }).then(
        (answer) => {
          if (asking.get(kind)?.file === file) asking.delete(kind);
          if (open()?.edit === now.edit) set({ kept: { ...get().kept, [kind]: { edit: now.edit, file: answer } } });
          return answer;
        },
        (error: unknown) => {
          if (asking.get(kind)?.file === file) asking.delete(kind);
          throw error;
        },
      );
      asking.set(kind, { edit: now.edit, file });
      return file;
    }

    async function download(item: HandoverItem): Promise<void> {
      const kind = kindOf(item);
      if (kind === null || open() === null || get().byItem[item]?.status === "on-its-way") return;
      setStatus(item, ON_ITS_WAY);
      try {
        const file = await ask(kind);
        save(file.blob, file.name);
        setStatus(item, IDLE);
      } catch (error) {
        const { message } = failureOf(error);
        setStatus(item, { status: "failed", message });
        toasts.show({ kind: "note", words: message, action: { label: TRY_AGAIN, run: () => void download(item) } });
      }
    }

    return {
      byItem: {},
      kept: {},
      download,
      tryAgain: download,
      ask,
      clear() {
        asking.clear();
        set({ byItem: {}, kept: {} });
      },
    };
  });
}

/** The state of an item's download; at rest unless something is known of it. */
export const statusOf = (state: DownloadsState, item: HandoverItem): DownloadStatus => state.byItem[item] ?? IDLE;
export const byItemOf = (state: DownloadsState) => state.byItem;
/** The file of *kind* kept for *edit*; null when none is, or it is of another edit. */
export const keptOf = (state: DownloadsState, kind: ExportKind, edit: number | null): ExportedFile | null => {
  const kept = state.kept[kind];
  return kept && kept.edit === edit ? kept.file : null;
};
