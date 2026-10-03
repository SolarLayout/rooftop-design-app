import { describe, expect, test } from "bun:test";
import { SAVE_DEBOUNCE } from "../../components/ui/design-numbers";
import type { DesignResult, Project } from "../api";
import { clockOfTheTest } from "../clock-of-the-test";
import { createProjectStore } from "../stores/project-store";
import { createResultsStore } from "../stores/results-store";
import type { DesignsDb } from "./designs-db";
import type { KeptDesign } from "./kept-design";
import { createSaving, failureOf, idOf, keptDesignsOf, savingOf } from "./saving";

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
  editedAt: 1_000,
  openedAt: 1_000,
};

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
      editedAt: 20_000,
      openedAt: 10_000,
    });
    expect(savingOf(saving.getState())).toBe("saved");
    expect(remembered).toEqual([null, "id-1"]);
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
