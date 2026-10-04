import { expect, type Page } from "@playwright/test";

// The designs kept on this device in the browser tests (plan/phase-10-plan.md, pull request 1): written into the browser's
// IndexedDB as the app writes them (lib/device/designs-db.ts: database rooftop, store designs by id, an index on
// editedAt), each a copy of the demo under its own name, so that a picture or an axe run has designs without the map.
// A test's browser context is new each time: the device begins empty.

export const DEVICE_DB = "rooftop";
export const OPEN_DESIGN_KEY = "rooftop.open-design";

export type SeededDesign = {
  id: string;
  name: string;
  /** The facts of the card as the app keeps them: the capacity and the energy of the last run, or null before one. */
  dcKwp: number | null;
  energyMwh: number | null;
  roofWords: string;
  editedAt: number;
  /** A design before a system voltage is chosen: its card says what waits (plan/phase-10-plan.md, step 12). */
  withoutAVoltage?: boolean;
};

/** The demo's roof, in the words the app makes of its outline and type. */
export const DEMO_ROOF_WORDS = "90.0 × 40.0 m flat roof, tilted rows";

/**
 * Writes *designs* to the device and remembers *open* as the design that is open, from the app's own origin (Home opens no
 * design, so nothing of the stores is touched meanwhile). Opening a workspace afterwards opens the remembered design.
 */
export async function withDesignsOnTheDevice(page: Page, designs: SeededDesign[], open: string | null): Promise<void> {
  expect((await page.goto("/"))?.status()).toBe(200);
  await page.evaluate(
    async ({ designs, open, dbName, key }) => {
      const demo = (await (await fetch("/api/demo")).json()) as { name: string };
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const opening = indexedDB.open(dbName, 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore("designs", { keyPath: "id" }).createIndex("editedAt", "editedAt");
        opening.onsuccess = () => resolve(opening.result);
        opening.onerror = () => reject(opening.error);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("designs", "readwrite");
        const store = transaction.objectStore("designs");
        for (const design of designs) {
          store.put({
            id: design.id,
            name: design.name,
            document: { ...demo, name: design.name, ...(design.withoutAVoltage ? { system_voltage: null } : {}) },
            facts: { roofWords: design.roofWords, dcKwp: design.dcKwp, energyMwh: design.energyMwh },
            editedAt: design.editedAt,
            openedAt: design.editedAt,
          });
        }
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      db.close();
      if (open === null) localStorage.removeItem(key);
      else localStorage.setItem(key, open);
    },
    { designs, open, dbName: DEVICE_DB, key: OPEN_DESIGN_KEY },
  );
}

/** Removes the designs from the device and leaves the id remembered as open: what a reload then finds is a design no longer there. */
export async function withTheDesignsRemoved(page: Page): Promise<void> {
  await page.evaluate(
    (dbName) =>
      new Promise<void>((resolve, reject) => {
        const deleting = indexedDB.deleteDatabase(dbName);
        deleting.onsuccess = () => resolve();
        deleting.onerror = () => reject(deleting.error);
        deleting.onblocked = () => reject(new Error("The database is open elsewhere and could not be removed."));
      }),
    DEVICE_DB,
  );
}

/** The two designs of the pictures and the axe run: the demo kept with the facts of its run and open, a second one before a run. */
export const TWO_DESIGNS: SeededDesign[] = [
  { id: "demo-kept", name: "Pune demo roof", dcKwp: 357.28, energyMwh: 617.8405373922709, roofWords: DEMO_ROOF_WORDS, editedAt: Date.UTC(2026, 8, 24, 10) },
  { id: "block-b", name: "Block B", dcKwp: null, energyMwh: null, roofWords: DEMO_ROOF_WORDS, editedAt: Date.UTC(2026, 8, 23, 10) },
];

export type KeptRecord = { id: string; name: string; facts: { dcKwp: number | null; energyMwh: number | null }; thumbnail: string | null };

/** The designs the device holds now, as the app wrote them. */
export async function keptDesignsOf(page: Page): Promise<KeptRecord[]> {
  return page.evaluate(async (dbName) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open(dbName, 1);
      opening.onsuccess = () => resolve(opening.result);
      opening.onerror = () => reject(opening.error);
    });
    try {
      return await new Promise<KeptRecord[]>((resolve, reject) => {
        const request = db.transaction("designs", "readonly").objectStore("designs").getAll();
        request.onsuccess = () => resolve(request.result as KeptRecord[]);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  }, DEVICE_DB);
}
