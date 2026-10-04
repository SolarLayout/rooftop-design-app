import { describe, expect, test } from "bun:test";
import { SAVE_DEBOUNCE } from "../../components/ui/design-numbers";
import type { DesignResult, LayoutResponse, Project } from "../api";
import { clockOfTheTest } from "../clock-of-the-test";
import { canUndo as canUndoOf_, createProjectStore, type ProjectStore } from "../stores/project-store";
import { createResultsStore } from "../stores/results-store";
import type { DesignsDb } from "./designs-db";
import type { KeptDesign } from "./kept-design";
import { createSaving, failureOf, idOf, keptDesignsOf, listedAtOf, savingOf } from "./saving";

// Saving (plan/phase-10-plan.md, step 2, decisions 2 and 3): a committed edit writes the design to the device SAVE_DEBOUNCE
// after the last one; the demo is not kept until it is edited (D32); the id of the open design is remembered; a failure
// says so in words and the next edit tries again.

const RECTANGLE: Project["roof"]["outline"] = [
  [-45, -20],
  [45, -20],
  [45, 20],
  [-45, 20],
];
const DEMO = {
  name: "Pune demo roof",
  system_voltage: 1500,
  chosen_option: "",
  roof: { lat: 18.52, lon: 73.86, outline: RECTANGLE, roof_type: "flat_tilted", source: "map", obstacles: [] },
  array: { tilt_deg: 15 },
} as unknown as Project;
const RUN = { chosen_option: "29x22x1", options: [{ key: "29x22x1", dc_kwp: 357.28, energy: { energy_mwh: 617.84 } }], no_options: null } as unknown as DesignResult;
const BLOCK_B: KeptDesign = {
  id: "kept-b",
  name: "Block B",
  document: { ...DEMO, name: "Block B" },
  facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: null, energyMwh: null },
  thumbnail: null,
  editedAt: 1_000,
  openedAt: 1_000,
};
const LAYOUT = { layout: { inner: [], keepout: [], modules: [{ idx: 0, outline: [[2, 2], [4.3, 2], [4.3, 3.1], [2, 3.1]] }] }, readouts: {} } as unknown as LayoutResponse;

const tilt = (degrees: number) => (project: Project) => ({ ...project, array: { ...project.array, tilt_deg: degrees } });
const named = (name: string) => (project: Project) => ({ ...project, name });

/** Stands in for the device: it keeps what was put, and refuses when told to. */
function fakeDb(kept: KeptDesign[] = []) {
  const records = new Map(kept.map((one) => [one.id, one]));
  const puts: KeptDesign[] = [];
  let refusal: string | null = null;
  const db: DesignsDb = {
    listDesigns: async () => [...records.values()].sort((a, b) => b.editedAt - a.editedAt),
    getDesign: async (id) => records.get(id) ?? null,
    async putDesign(one) {
      if (refusal !== null) {
        const words = refusal;
        refusal = null;
        throw new Error(`The design could not be kept on this device: ${words}.`);
      }
      puts.push(one);
      records.set(one.id, one);
    },
    async removeDesign(id) {
      records.delete(id);
    },
  };
  return {
    db,
    puts,
    records,
    refuseNext(words: string) {
      refusal = words;
    },
  };
}

const canUndoOf = (project: ProjectStore) => canUndoOf_(project.getState());

/** Lets what was promised settle. */
const settled = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function setUp(kept: KeptDesign[] = []) {
  const project = createProjectStore();
  const results = createResultsStore();
  const device = fakeDb(kept);
  const { clock, pass } = clockOfTheTest();
  const remembered: Array<string | null> = [];
  const said: string[] = [];
  let now = 10_000;
  let ids = 0;
  const saving = createSaving({
    project,
    results,
    db: device.db,
    clock,
    remember: (id) => remembered.push(id),
    now: () => now,
    newId: () => `id-${(ids += 1)}`,
    say: (words) => said.push(words),
  });
  return { project, results, device, pass, remembered, said, saving, setNow: (value: number) => (now = value) };
}

describe("the demo", () => {
  test("opened and untouched, it is not kept, and nothing is remembered as open", async () => {
    const { project, saving, device, remembered, pass } = setUp();

    project.getState().open(DEMO);
    pass(SAVE_DEBOUNCE * 2);
    await settled();

    expect(savingOf(saving.getState())).toBe("not-kept");
    expect(idOf(saving.getState())).toBeNull();
    expect(device.puts).toEqual([]);
    expect(remembered).toEqual([null]);
  });

  test("before any design is open nothing is kept", () => {
    const { saving } = setUp();

    expect(savingOf(saving.getState())).toBe("not-kept");
    expect(failureOf(saving.getState())).toBeNull();
  });
});

describe("a committed edit", () => {
  test("says Saving at once, writes once the debounce has passed, then says Saved and remembers the id", async () => {
    const { project, saving, device, remembered, pass, setNow } = setUp();
    project.getState().open(DEMO);
    setNow(20_000);

    project.getState().commit(tilt(20));

    expect(savingOf(saving.getState())).toBe("saving");
    expect(idOf(saving.getState())).toBe("id-1");
    pass(SAVE_DEBOUNCE - 1);
    await settled();
    expect(device.puts).toEqual([]);

    pass(1);
    await settled();
    expect(device.puts).toHaveLength(1);
    expect(device.puts[0]).toEqual({
      id: "id-1",
      name: "Pune demo roof",
      document: project.getState().project!,
      facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: null, energyMwh: null },
      thumbnail: expect.stringContaining('data-part="roof"'),
      editedAt: 20_000,
      openedAt: 10_000,
    });
    expect(savingOf(saving.getState())).toBe("saved");
    expect(remembered).toEqual([null, "id-1"]);
  });

  test("flush writes at once what waits in the debounce (the page is left), and nothing when nothing waits", async () => {
    const { project, saving, device, pass, setNow } = setUp();
    project.getState().open(DEMO);
    setNow(20_000);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE - 100);
    await settled();
    expect(device.puts).toEqual([]);

    saving.getState().flush();
    await settled();

    expect(device.puts).toHaveLength(1);
    expect(device.puts[0]!.document).toBe(project.getState().project!);
    expect(savingOf(saving.getState())).toBe("saved");

    saving.getState().flush();
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.puts).toHaveLength(1);
  });

  test("two commits within the debounce are one write, of the later document", async () => {
    const { project, saving, device, pass } = setUp();
    project.getState().open(DEMO);

    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE / 2);
    project.getState().commit(tilt(25));
    pass(SAVE_DEBOUNCE / 2);
    await settled();
    expect(device.puts).toEqual([]);
    expect(savingOf(saving.getState())).toBe("saving");

    pass(SAVE_DEBOUNCE / 2);
    await settled();

    expect(device.puts).toHaveLength(1);
    expect(device.puts[0]!.document.array.tilt_deg).toBe(25);
    expect(savingOf(saving.getState())).toBe("saved");
  });

  test("a second edit after a write is written under the same id, with the time of the edit", async () => {
    const { project, saving, device, pass, setNow } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();

    setNow(30_000);
    project.getState().commit(tilt(30));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts.map((one) => one.id)).toEqual(["id-1", "id-1"]);
    expect(device.puts[1]).toMatchObject({ editedAt: 30_000, openedAt: 10_000 });
    expect(saving.getState().designs.map((one) => one.id)).toEqual(["id-1"]);
  });

  test("an undo is a commit and is saved; the name follows a rename", async () => {
    const { project, device, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(named("Block B"));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.puts[0]!.name).toBe("Block B");

    project.getState().undo();
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toHaveLength(2);
    expect(device.puts[1]!.name).toBe("Pune demo roof");
    expect(device.puts[1]!.document).toBe(DEMO);
  });

  test("the facts of the card are of the last run: a run that lands for a kept design writes them", async () => {
    const { project, results, device, pass, saving } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.puts[0]!.facts.dcKwp).toBeNull();

    results.getState().designBegan(2);
    results.getState().designArrived(2, RUN);
    expect(savingOf(saving.getState())).toBe("saving");
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toHaveLength(2);
    expect(device.puts[1]!.facts).toEqual({ roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: 357.28, energyMwh: 617.84 });
    expect(device.puts[1]!.editedAt).toBe(device.puts[0]!.editedAt);
    expect(savingOf(saving.getState())).toBe("saved");
  });

  test("a run that lands for the demo untouched keeps nothing: the demo is not kept until it is edited", async () => {
    const { project, results, device, pass, saving } = setUp();
    project.getState().open(DEMO);

    results.getState().designBegan(1);
    results.getState().designArrived(1, RUN);
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toEqual([]);
    expect(savingOf(saving.getState())).toBe("not-kept");
  });

  test("an amendment (the weather loaded) of a kept design is written; of one not kept it keeps nothing", async () => {
    const { project, device, pass } = setUp();
    project.getState().open(DEMO);
    const weather = { label: "PVGIS TMY" } as unknown as Project["weather_json"];

    project.getState().amend(1, (document) => ({ ...document, weather_json: weather }));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.puts).toEqual([]);

    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();
    project.getState().amend(2, (document) => ({ ...document, name: "Amended" }));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toHaveLength(2);
    expect(device.puts[1]!.name).toBe("Amended");
  });
});

describe("a write that fails", () => {
  test("says Not saved with the device's words; the next commit tries again, and Saved follows", async () => {
    const { project, saving, device, remembered, pass } = setUp();
    project.getState().open(DEMO);
    device.refuseNext("QuotaExceededError");

    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(savingOf(saving.getState())).toBe("not-saved");
    expect(failureOf(saving.getState())).toBe("The design could not be kept on this device: QuotaExceededError.");
    expect(remembered).toEqual([null]);

    project.getState().commit(tilt(25));
    expect(savingOf(saving.getState())).toBe("saving");
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(savingOf(saving.getState())).toBe("saved");
    expect(failureOf(saving.getState())).toBeNull();
    expect(device.puts).toHaveLength(1);
    expect(remembered).toEqual([null, "id-1"]);
  });

  test("Try again writes at once, without the debounce", async () => {
    const { project, saving, device, pass } = setUp();
    project.getState().open(DEMO);
    device.refuseNext("the browser gave no reason");
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(savingOf(saving.getState())).toBe("not-saved");

    saving.getState().tryAgain();
    await settled();

    expect(device.puts).toHaveLength(1);
    expect(savingOf(saving.getState())).toBe("saved");
  });
});

describe("another design opened", () => {
  test("by the flow (the demo, a roof built): not kept, nothing remembered; what the design before had on its way is written at once", async () => {
    const { project, saving, device, remembered, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE / 2);

    project.getState().open({ ...DEMO, name: "Untitled roof" });
    await settled();

    expect(device.puts).toHaveLength(1);
    expect(device.puts[0]).toMatchObject({ id: "id-1", name: "Pune demo roof" });
    expect(savingOf(saving.getState())).toBe("not-kept");
    expect(idOf(saving.getState())).toBeNull();
    // The design before is written, and not remembered: the new one is open.
    expect(remembered).toEqual([null, null]);
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.puts).toHaveLength(1);
  });

  test("a write of the design before that fails is said, not shown as the state of the new one", async () => {
    const { project, saving, device, said, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE / 2);
    device.refuseNext("QuotaExceededError");

    project.getState().open({ ...DEMO, name: "Untitled roof" });
    await settled();

    expect(savingOf(saving.getState())).toBe("not-kept");
    expect(said).toEqual(["The design could not be kept on this device: QuotaExceededError."]);
  });

  test("from the device: the document is opened, the state is Saved, the id is remembered, and the time of opening is kept", async () => {
    const { project, saving, device, remembered, setNow } = setUp([BLOCK_B]);
    setNow(50_000);

    expect(await saving.getState().openFromDevice("kept-b")).toBe(true);
    await settled();

    expect(project.getState().project).toEqual(BLOCK_B.document);
    expect(project.getState().openedAt).toBe(1);
    expect(savingOf(saving.getState())).toBe("saved");
    expect(idOf(saving.getState())).toBe("kept-b");
    expect(remembered).toEqual(["kept-b"]);
    expect(device.records.get("kept-b")).toMatchObject({ editedAt: 1_000, openedAt: 50_000, facts: BLOCK_B.facts });
  });

  test("from the device, then edited: written under its id, the time of the edit new, the time of opening carried", async () => {
    const { project, saving, device, pass, setNow } = setUp([BLOCK_B]);
    setNow(50_000);
    await saving.getState().openFromDevice("kept-b");
    await settled();
    setNow(60_000);

    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts.at(-1)).toMatchObject({ id: "kept-b", name: "Block B", editedAt: 60_000, openedAt: 50_000 });
    expect(device.puts.at(-1)!.document.array.tilt_deg).toBe(20);
  });

  test("from the device, an id the device has not: false, and nothing opens", async () => {
    const { project, saving } = setUp([BLOCK_B]);

    expect(await saving.getState().openFromDevice("gone")).toBe(false);

    expect(project.getState().project).toBeNull();
    expect(savingOf(saving.getState())).toBe("not-kept");
  });

  test("from the device, the design that is open already: nothing happens", async () => {
    const { project, saving } = setUp([BLOCK_B]);
    await saving.getState().openFromDevice("kept-b");
    const edit = project.getState().edit;

    expect(await saving.getState().openFromDevice("kept-b")).toBe(true);

    expect(project.getState().edit).toBe(edit);
  });

  test("from the device, a read that fails throws the device's words", async () => {
    const { saving, device } = setUp([BLOCK_B]);
    device.db.getDesign = async () => {
      throw new Error("The design on this device could not be read: the browser gave no reason.");
    };

    await expect(saving.getState().openFromDevice("kept-b")).rejects.toThrow("The design on this device could not be read: the browser gave no reason.");
  });
});

describe("a project opened from a file", () => {
  test("is kept under a new id as a design of its own: opened, Saved, the id remembered, written with the roof's words and no run's facts", async () => {
    const { project, saving, device, remembered, setNow } = setUp();
    setNow(70_000);

    saving.getState().keepAndOpen({ ...DEMO, name: "Block B" });
    await settled();

    expect(project.getState().project).toEqual({ ...DEMO, name: "Block B" });
    expect(project.getState().openedAt).toBe(1);
    expect(savingOf(saving.getState())).toBe("saved");
    expect(idOf(saving.getState())).toBe("id-1");
    expect(remembered).toEqual(["id-1"]);
    expect(device.records.get("id-1")).toMatchObject({
      name: "Block B",
      editedAt: 70_000,
      openedAt: 70_000,
      facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: null, energyMwh: null },
    });
    expect(keptDesignsOf(saving.getState()).map((one) => one.id)).toEqual(["id-1"]);
  });

  test("while a kept design is open: that one keeps its id and its record, the new one has its own", async () => {
    const { saving, device, setNow } = setUp([BLOCK_B]);
    await saving.getState().openFromDevice("kept-b");
    await settled();
    setNow(80_000);

    saving.getState().keepAndOpen(DEMO);
    await settled();

    expect(idOf(saving.getState())).toBe("id-1");
    expect([...device.records.keys()].sort()).toEqual(["id-1", "kept-b"]);
    expect(device.records.get("kept-b")).toMatchObject({ name: "Block B", editedAt: 1_000 });
    expect(device.records.get("id-1")).toMatchObject({ name: "Pune demo roof", editedAt: 80_000 });
  });

  test("then edited: written under the same id, the time of the edit new", async () => {
    const { project, saving, device, pass, setNow } = setUp();
    setNow(70_000);
    saving.getState().keepAndOpen(DEMO);
    await settled();
    setNow(75_000);

    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts.at(-1)).toMatchObject({ id: "id-1", editedAt: 75_000, openedAt: 70_000 });
    expect(device.puts.at(-1)!.document.array.tilt_deg).toBe(20);
    expect(idOf(saving.getState())).toBe("id-1");
  });

  test("a write the device refuses says Not saved with its words", async () => {
    const { saving, device } = setUp();
    device.refuseNext("QuotaExceededError");

    saving.getState().keepAndOpen(DEMO);
    await settled();

    expect(savingOf(saving.getState())).toBe("not-saved");
    expect(failureOf(saving.getState())).toBe("The design could not be kept on this device: QuotaExceededError.");
  });
});

describe("the designs on this device", () => {
  test("are listed when the store is started, the newest edited first, and a design written joins them", async () => {
    const older = { ...BLOCK_B, id: "kept-a", name: "Block A", editedAt: 500 };
    const { project, saving, pass, setNow } = setUp([older, BLOCK_B]);
    expect(keptDesignsOf(saving.getState())).toEqual([]);

    saving.getState().start();
    await settled();
    expect(keptDesignsOf(saving.getState()).map((one) => one.name)).toEqual(["Block B", "Block A"]);

    project.getState().open(DEMO);
    setNow(99_000);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(keptDesignsOf(saving.getState()).map((one) => one.name)).toEqual(["Pune demo roof", "Block B", "Block A"]);
  });

  test("a list that cannot be read is said, and the list stays empty", async () => {
    const project = createProjectStore();
    const results = createResultsStore();
    const said: string[] = [];
    const device = fakeDb();
    device.db.listDesigns = async () => {
      throw new Error("The designs on this device could not be read: the browser gave no reason.");
    };

    const saving = createSaving({ project, results, db: device.db, clock: clockOfTheTest().clock, remember: () => undefined, say: (words) => said.push(words) });
    saving.getState().start();
    await settled();

    expect(keptDesignsOf(saving.getState())).toEqual([]);
    expect(said).toEqual(["The designs on this device could not be read: the browser gave no reason."]);
  });
});

describe("the thumbnail (plan/phase-10-plan.md, step 13, decision 6)", () => {
  test("a design written before its layout came carries the roof alone; the layout landing writes it again with the modules", async () => {
    const { project, results, saving, device, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.puts).toHaveLength(1);
    expect(device.puts[0]!.thumbnail).toContain('data-part="roof"');
    expect(device.puts[0]!.thumbnail).not.toContain("data-module");

    results.getState().layoutAsked(project.getState().edit);
    results.getState().layoutArrived(project.getState().edit, LAYOUT);
    expect(savingOf(saving.getState())).toBe("saving");
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toHaveLength(2);
    expect(device.puts[1]!.thumbnail).toContain('data-module="true"');
    expect(savingOf(saving.getState())).toBe("saved");
  });

  test("a layout that lands for a design not kept (the demo untouched) writes nothing", async () => {
    const { project, results, device, pass } = setUp();
    project.getState().open(DEMO);

    results.getState().layoutAsked(project.getState().edit);
    results.getState().layoutArrived(project.getState().edit, LAYOUT);
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toEqual([]);
  });
});

describe("when the list was last read or changed", () => {
  test("is the store's clock at that moment, so that a card's \"Edited …\" is worked out of a time of the store, never of the render", async () => {
    const { project, saving, pass, setNow } = setUp([BLOCK_B]);
    expect(listedAtOf(saving.getState())).toBe(0);

    setNow(50_000);
    saving.getState().start();
    await settled();
    expect(listedAtOf(saving.getState())).toBe(50_000);

    project.getState().open(DEMO);
    setNow(99_000);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(listedAtOf(saving.getState())).toBe(99_000);
  });
});

describe("a design renamed from its card", () => {
  test("one that is not open: its record is written with the new name, in the document too; the list follows; nothing is said", async () => {
    const { saving, device, said } = setUp([BLOCK_B]);
    saving.getState().start();
    await settled();

    await saving.getState().rename("kept-b", "Block B, east wing");

    expect(device.records.get("kept-b")).toMatchObject({ id: "kept-b", name: "Block B, east wing", document: { name: "Block B, east wing" } });
    expect(keptDesignsOf(saving.getState()).map((one) => one.name)).toEqual(["Block B, east wing"]);
    expect(said).toEqual([]);
  });

  test("the one that is open: the name is a committed edit of the document, which the store then writes as any edit", async () => {
    const { project, saving, device, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();

    await saving.getState().rename("id-1", "Pune demo roof, block B");

    expect(project.getState().project?.name).toBe("Pune demo roof, block B");
    expect(canUndoOf(project)).toBe(true);
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(device.records.get("id-1")?.name).toBe("Pune demo roof, block B");
    expect(savingOf(saving.getState())).toBe("saved");
  });

  test("a record the device refuses to write is said, and the list stays as it was", async () => {
    const { saving, device, said } = setUp([BLOCK_B]);
    saving.getState().start();
    await settled();
    device.refuseNext("QuotaExceededError");

    await saving.getState().rename("kept-b", "Block C");

    expect(said).toEqual(["The design could not be kept on this device: QuotaExceededError."]);
    expect(keptDesignsOf(saving.getState()).map((one) => one.name)).toEqual(["Block B"]);
  });

  test("an id the device has not is nothing to rename: nothing is written, nothing is said", async () => {
    const { saving, device, said } = setUp([BLOCK_B]);
    saving.getState().start();
    await settled();

    await saving.getState().rename("gone", "Block C");

    expect(device.puts).toEqual([]);
    expect(said).toEqual([]);
  });
});

describe("a design removed from its card", () => {
  test("one that is not open: it leaves the device and the list", async () => {
    const { saving, device } = setUp([BLOCK_B]);
    saving.getState().start();
    await settled();

    await saving.getState().remove("kept-b");

    expect(device.records.has("kept-b")).toBe(false);
    expect(keptDesignsOf(saving.getState())).toEqual([]);
  });

  test("the one that is open stays open, not kept any more: the id is forgotten, and its next edit keeps it anew under a new id", async () => {
    const { project, saving, device, remembered, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(savingOf(saving.getState())).toBe("saved");

    await saving.getState().remove("id-1");

    expect(device.records.has("id-1")).toBe(false);
    expect(savingOf(saving.getState())).toBe("not-kept");
    expect(idOf(saving.getState())).toBeNull();
    expect(remembered.at(-1)).toBeNull();
    expect(project.getState().project?.array.tilt_deg).toBe(20);

    project.getState().commit(tilt(25));
    pass(SAVE_DEBOUNCE);
    await settled();
    expect(idOf(saving.getState())).toBe("id-2");
    expect([...device.records.keys()]).toEqual(["id-2"]);
  });

  test("a device that refuses is said, and the design stays listed", async () => {
    const { saving, device, said } = setUp([BLOCK_B]);
    saving.getState().start();
    await settled();
    device.db.removeDesign = async () => {
      throw new Error("The design could not be removed from this device: the browser gave no reason.");
    };

    await saving.getState().remove("kept-b");

    expect(said).toEqual(["The design could not be removed from this device: the browser gave no reason."]);
    expect(keptDesignsOf(saving.getState()).map((one) => one.name)).toEqual(["Block B"]);
  });
});

describe("stopped", () => {
  test("hears no more edits and writes nothing more", async () => {
    const { project, saving, device, pass } = setUp();
    project.getState().open(DEMO);
    project.getState().commit(tilt(20));

    saving.getState().stop();
    project.getState().commit(tilt(25));
    pass(SAVE_DEBOUNCE);
    await settled();

    expect(device.puts).toEqual([]);
  });
});
