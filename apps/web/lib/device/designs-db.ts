// The designs kept on this device, in the browser's IndexedDB through its own API, no library (plan/phase-10-plan.md,
// decision 1): one database `rooftop`, one store `designs` keyed by the design's id, an index on editedAt so that the
// newest edited come first. A thin layer of I/O: every function is a Promise, and a failure is an Error in words that
// say what could not be done and what the browser said. Nothing of it runs under bun (no IndexedDB there): the browser
// tests exercise it through the app.
import type { KeptDesign } from "./kept-design";

export const DB_NAME = "rooftop";
export const DESIGNS = "designs";
const BY_EDITED = "editedAt";
const VERSION = 1;

/** What the stores need of the device: the real adapter below, a fake one in tests. */
export type DesignsDb = {
  /** Every design kept, the newest edited first. */
  listDesigns: () => Promise<KeptDesign[]>;
  /** The design of this id; null when the device has none. */
  getDesign: (id: string) => Promise<KeptDesign | null>;
  /** Keeps the design, in the place of the one of the same id. */
  putDesign: (kept: KeptDesign) => Promise<void>;
  removeDesign: (id: string) => Promise<void>;
};

const NO_INDEXED_DB = "this browser cannot save designs";

/** What the browser said of a request that failed, or that it said nothing. */
const wordsOf = (error: unknown): string => (error instanceof Error && error.message !== "" ? error.message : error instanceof DOMException && error.name !== "" ? error.name : "the browser gave no reason");

/** The request's answer as a Promise; a failure throws what the browser said. */
function answerOf<Value>(request: IDBRequest<Value>): Promise<Value> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("the browser gave no reason"));
  });
}

/** Opens the database, making its store and index the first time. */
export function openDesignsDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error(NO_INDEXED_DB));
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, VERSION);
    opening.onupgradeneeded = () => {
      const db = opening.result;
      if (!db.objectStoreNames.contains(DESIGNS)) db.createObjectStore(DESIGNS, { keyPath: "id" }).createIndex(BY_EDITED, "editedAt");
    };
    opening.onsuccess = () => resolve(opening.result);
    opening.onerror = () => reject(opening.error ?? new Error("the browser gave no reason"));
    opening.onblocked = () => reject(new Error("the app is open in another tab, which blocks the change"));
  });
}

/** One transaction over the store, closed after; a failure becomes an Error that begins with *what* could not be done. */
async function inTheStore<Value>(what: string, mode: IDBTransactionMode, work: (store: IDBObjectStore) => Promise<Value>): Promise<Value> {
  let db: IDBDatabase | null = null;
  try {
    db = await openDesignsDb();
    const transaction = db.transaction(DESIGNS, mode);
    const value = await work(transaction.objectStore(DESIGNS));
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("the browser gave no reason"));
      transaction.onabort = () => reject(transaction.error ?? new Error("the browser stopped the change"));
    });
    return value;
  } catch (error) {
    throw new Error(`${what}: ${wordsOf(error)}.`);
  } finally {
    db?.close();
  }
}

export async function listDesigns(): Promise<KeptDesign[]> {
  const kept = await inTheStore("The designs on this device could not be read", "readonly", (store) => answerOf(store.index(BY_EDITED).getAll() as IDBRequest<KeptDesign[]>));
  return kept.reverse();
}

export function getDesign(id: string): Promise<KeptDesign | null> {
  return inTheStore("The design on this device could not be read", "readonly", async (store) => ((await answerOf(store.get(id))) as KeptDesign | undefined) ?? null);
}

export function putDesign(kept: KeptDesign): Promise<void> {
  return inTheStore("The design could not be saved on this device", "readwrite", async (store) => {
    await answerOf(store.put(kept));
  });
}

export function removeDesign(id: string): Promise<void> {
  return inTheStore("The design could not be removed from this device", "readwrite", async (store) => {
    await answerOf(store.delete(id));
  });
}

/** The device, for the stores. */
export const designsDb: DesignsDb = { listDesigns, getDesign, putDesign, removeDesign };
