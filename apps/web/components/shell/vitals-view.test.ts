import { describe, expect, test } from "bun:test";
import type { DesignResult, LayoutReadouts } from "../../lib/api";
import type { Note } from "./notes-view";
import { vitalsOf } from "./vitals-view";

// The answer of the API for the demo, as it was asked on 2026-09-29; what the vitals do not read is left out.
const READOUTS = { positions: 790, roof_area_m2: 3600 } as LayoutReadouts;
const EQUIPMENT = { module: { pnom_w: 560 } };

const OPTION_A = {
  key: "29x22x1",
  letter: "A",
  ok: true,
  note: "",
  dc_kwp: 357.28,
  dcac: 1.2992,
  n_modules: 638,
  energy: { energy_mwh: 617.8405, ac_kw: 275.0, pr: 0.8655, specific_yield: 1729.29 },
};
const OPTION_D = { ...OPTION_A, key: "26x27x2", letter: "D", ok: false, note: "below target", dcac: 0.7148, n_modules: 702, dc_kwp: 393.12 };

const DEMO = {
  chosen_option: "29x22x1",
  options: [OPTION_A, OPTION_D],
  no_options: null,
  readouts: READOUTS,
  equipment: EQUIPMENT,
} as unknown as DesignResult;

const BELOW_TARGET = { ...DEMO, chosen_option: "26x27x2" } as DesignResult;

const WAITS_FOR_THE_VOLTAGE = {
  chosen_option: null,
  options: [],
  no_options: {
    code: "system_voltage_missing",
    title: "Choose a system voltage to size the strings",
    message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
  },
  readouts: READOUTS,
  equipment: EQUIPMENT,
} as unknown as DesignResult;

const NO_LENGTH_FITS = {
  ...WAITS_FOR_THE_VOLTAGE,
  no_options: {
    code: "no_string_length_fits",
    title: "No string length fits the inverter",
    message: "At 600 V the longest string is 11 modules, and the MPPT needs 13.",
  },
} as unknown as DesignResult;

const VOC_NOTE: Note = {
  id: "module-0",
  title: "Voc coefficient",
  reason: "Voc coefficient −0.164 %/°C is outside the usual.",
  where: "Module · Array lens",
  action: { kind: "open", label: "Open Array", path: "/studio/array" },
};
const SECOND_NOTE: Note = { ...VOC_NOTE, id: "layout-0", title: "Unit gap" };

const SHADING = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.62 } as const;

const AT_REST = { name: "Pune demo roof", design: DEMO, readouts: READOUTS, designStatus: "idle", progress: null, notes: [VOC_NOTE] } as const;

const shownOf = (view: ReturnType<typeof vitalsOf>) =>
  view.cells.map((cell) => [cell.label, cell.quantity.number, cell.quantity.unit ?? ""]);

describe("the vitals of a design", () => {
  test("the seven numbers of the demo, in their order", () => {
    const view = vitalsOf(AT_REST);

    expect(view.kind).toBe("design");
    expect(shownOf(view)).toEqual([
      ["Energy, year 1", "617.8", "MWh"],
      ["DC capacity", "357.28", "kWp"],
      ["AC capacity", "275", "kW"],
      ["DC/AC", "1.30", ""],
      ["Modules", "638", "of 790"],
      ["PR", "86.6", "%"],
      ["Yield", "1,729", "kWh/kWp"],
    ]);
    expect(view.cells.map((cell) => cell.id)).toEqual(["energy", "dc", "ac", "dcac", "modules", "pr", "yield"]);
    expect(view.isLoading).toBe(false);
    expect(view.isDimmed).toBe(false);
  });

  test("DC/AC in target has a tick and says so", () => {
    const dcac = vitalsOf(AT_REST).cells.find((cell) => cell.id === "dcac");

    expect(dcac?.mark).toEqual({ kind: "fits", label: "In target" });
  });

  test("DC/AC outside the target has a note, in the words of the engine. There is no third mark", () => {
    const dcac = vitalsOf({ ...AT_REST, design: BELOW_TARGET }).cells.find((cell) => cell.id === "dcac");

    expect(dcac?.quantity.number).toBe("0.71");
    expect(dcac?.mark).toEqual({ kind: "note", label: "Below the DC/AC target" });
  });

  test("no other value has a mark", () => {
    const marked = vitalsOf(AT_REST).cells.filter((cell) => cell.mark).map((cell) => cell.id);

    expect(marked).toEqual(["dcac"]);
  });

  test("the positions are those of the layout when it is newer than the design", () => {
    const view = vitalsOf({ ...AT_REST, readouts: { ...READOUTS, positions: 640 } });

    expect(view.cells.find((cell) => cell.id === "modules")?.quantity).toEqual({ number: "638", unit: "of 640" });
  });
});

describe("the last cell: the notes to review", () => {
  test("one note: its count, and what it is about", () => {
    expect(vitalsOf(AT_REST).last).toEqual({ kind: "notes", count: 1, title: "1 note to review", detail: "Voc coefficient" });
  });

  test("several: the first of them", () => {
    expect(vitalsOf({ ...AT_REST, notes: [VOC_NOTE, SECOND_NOTE] }).last).toEqual({
      kind: "notes",
      count: 2,
      title: "2 notes to review",
      detail: "Voc coefficient",
    });
  });

  test("none: it says so", () => {
    expect(vitalsOf({ ...AT_REST, notes: [] }).last).toEqual({
      kind: "notes",
      count: 0,
      title: "Nothing to review",
      detail: "Every check of the design fits.",
    });
  });
});

describe("while the energy is updated", () => {
  test("the values of before stay, dimmed, and the last cell says the step and how far", () => {
    const view = vitalsOf({ ...AT_REST, designStatus: "running", progress: SHADING });

    expect(shownOf(view)[0]).toEqual(["Energy, year 1", "617.8", "MWh"]);
    expect(view.isDimmed).toBe(true);
    expect(view.isLoading).toBe(false);
    expect(view.last).toEqual({
      kind: "run",
      title: "Updating energy",
      step: "Computing hourly shading for every module",
      share: 0.62,
    });
  });

  test("during the pause before the run as well, without a step", () => {
    const view = vitalsOf({ ...AT_REST, designStatus: "waiting" });

    expect(view.isDimmed).toBe(true);
    expect(view.last).toEqual({ kind: "run", title: "Updating energy", step: null, share: 0 });
  });
});

describe("the first load", () => {
  test("skeletons in the place of the seven values, and the last cell says what is opened", () => {
    const view = vitalsOf({ ...AT_REST, design: null, designStatus: "running", progress: SHADING, notes: [] });

    expect(view.kind).toBe("design");
    expect(view.isLoading).toBe(true);
    expect(view.cells).toEqual([]);
    expect(view.isDimmed).toBe(false);
    expect(view.last).toEqual({
      kind: "run",
      title: "Opening Pune demo roof",
      step: "Computing hourly shading for every module",
      share: 0.62,
    });
  });

  test("before the design itself is there", () => {
    const view = vitalsOf({ name: null, design: null, readouts: null, designStatus: "idle", progress: null, notes: [] });

    expect(view.isLoading).toBe(true);
    expect(view.last).toEqual({ kind: "run", title: "Opening the design", step: null, share: 0 });
  });
});

describe("the run failed", () => {
  test("the last good values stay, not dimmed, and the last cell is a note", () => {
    const view = vitalsOf({ ...AT_REST, designStatus: "failed" });

    expect(shownOf(view)).toHaveLength(7);
    expect(view.isDimmed).toBe(false);
    expect(view.last).toEqual({
      kind: "failed",
      title: "Energy was not updated",
      detail: "Values are of the design before · Try again",
    });
  });

  test("at the first load: what the layout gave, and no value that is not there", () => {
    const view = vitalsOf({ ...AT_REST, design: null, designStatus: "failed", notes: [] });

    expect(view.kind).toBe("layout");
    expect(view.isLoading).toBe(false);
    expect(shownOf(view)).toEqual([
      ["Roof", "3,600", "m²"],
      ["Positions", "790", "modules"],
    ]);
    expect(view.last).toEqual({ kind: "failed", title: "Energy was not computed", detail: "There are no values yet · Try again" });
  });

  test("at the first load, the layout too: no cells at all", () => {
    const view = vitalsOf({ ...AT_REST, design: null, readouts: null, designStatus: "failed", notes: [] });

    expect(view.cells).toEqual([]);
    expect(view.isLoading).toBe(false);
    expect(view.last.kind).toBe("failed");
  });
});

describe("before a system voltage", () => {
  const waiting = { ...AT_REST, design: WAITS_FOR_THE_VOLTAGE, notes: [] };

  test("the roof and the positions only, and what they would carry", () => {
    const view = vitalsOf(waiting);

    expect(view.kind).toBe("layout");
    expect(shownOf(view)).toEqual([
      ["Roof", "3,600", "m²"],
      ["Positions", "790", "modules"],
      ["If all were used", "442.40", "kWp"],
    ]);
    expect(view.cells.map((cell) => cell.id)).toEqual(["roof", "positions", "if-all-used"]);
  });

  test("no energy, no ratio, no yield: a value that cannot exist yet is absent", () => {
    const ids = vitalsOf(waiting).cells.map((cell) => cell.id);

    for (const id of ["energy", "dc", "ac", "dcac", "modules", "pr", "yield"]) expect(ids).not.toContain(id);
  });

  test("what is waited for, in the words of the API; it leads to the Strings lens", () => {
    expect(vitalsOf(waiting).last).toEqual({
      kind: "decision",
      title: "Choose a system voltage to size the strings",
      detail: "600, 1000 or 1500 V. Nothing is sized until you choose.",
      path: "/studio/strings",
    });
  });

  test("the other reasons for no options are said the same way", () => {
    expect(vitalsOf({ ...waiting, design: NO_LENGTH_FITS }).last).toEqual({
      kind: "decision",
      title: "No string length fits the inverter",
      detail: "At 600 V the longest string is 11 modules, and the MPPT needs 13.",
      path: "/studio/strings",
    });
  });

  test("an edit meanwhile: the cells are dimmed and the last cell says that it is updated", () => {
    const view = vitalsOf({ ...waiting, designStatus: "running", progress: SHADING });

    expect(view.isDimmed).toBe(true);
    expect(view.last.kind).toBe("run");
  });
});
