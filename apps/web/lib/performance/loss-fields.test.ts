import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { LOSS_RANGES, lossControlOf, withLoss, type LossControl } from "./loss-fields";
import { DOCUMENT, MODULE, MONOFACIAL_MODULE } from "./test-fixtures";

const RUN = { energy: { lid_pct: 0.2 }, module: MODULE };

const withLosses = (change: Partial<Project["losses"]>): Project => ({ ...DOCUMENT, losses: { ...DOCUMENT.losses, ...change } });

const field = (control: LossControl | null) => {
  if (control?.kind !== "field") throw new Error(`No field: ${JSON.stringify(control)}`);
  return control;
};

describe("the fields of the chain (plan/phase-08-plan.md, decision 6; functional-inventory 1.7)", () => {
  test("each step that is the user's has its field by the engine's label, with its range and the document's value", () => {
    const soiling = field(lossControlOf("Soiling", DOCUMENT, RUN));

    expect(soiling).toEqual({ kind: "field", id: "soiling_pct", label: "Soiling", unit: "%", range: { min: 0, max: 30, decimals: 1 }, value: 2, detail: null, reset: null });
    expect(field(lossControlOf("Module quality", DOCUMENT, RUN))).toMatchObject({ id: "quality_pct", value: 0, range: { min: -5, max: 10, decimals: 1 } });
    expect(field(lossControlOf("Mismatch", DOCUMENT, RUN))).toMatchObject({ id: "mismatch_pct", value: 1, range: { min: 0, max: 10, decimals: 1 } });
    expect(field(lossControlOf("DC ohmic", DOCUMENT, RUN))).toMatchObject({ id: "dc_ohmic_pct", value: 1.5, range: { min: 0, max: 10, decimals: 1 } });
    expect(field(lossControlOf("AC ohmic", DOCUMENT, RUN))).toMatchObject({ id: "ac_ohmic_pct", value: 1, range: { min: 0, max: 10, decimals: 1 } });
    expect(field(lossControlOf("Availability", DOCUMENT, RUN))).toMatchObject({ id: "availability_pct", value: 99.5, range: { min: 80, max: 100, decimals: 1 } });
  });

  test("the ranges are the fields', one decimal each, in percent", () => {
    for (const range of Object.values(LOSS_RANGES)) {
      expect(range.decimals).toBe(1);
      expect(range.min).toBeLessThan(range.max);
    }
    expect(LOSS_RANGES.lid_pct).toEqual({ min: 0, max: 10, decimals: 1 });
  });

  test("LID is empty while it is the PAN's and says so inside itself", () => {
    expect(field(lossControlOf("LID (PAN)", DOCUMENT, RUN))).toEqual({
      kind: "field",
      id: "lid_pct",
      label: "LID (PAN)",
      unit: "%",
      range: { min: 0, max: 10, decimals: 1 },
      value: null,
      detail: "PAN 0.2",
      reset: null,
    });
  });

  test("LID entered holds the value; the line under says the PAN's and gives the field back", () => {
    const entered = field(lossControlOf("LID", withLosses({ lid_pct: 1 }), { ...RUN, energy: { lid_pct: 1 } }));

    expect(entered).toMatchObject({ id: "lid_pct", label: "LID", value: 1, detail: "PAN gives 0.2 %", reset: "Use the PAN's" });
  });

  test("a PAN without a LID: the engine's default, said as such; entered, the default is given back", () => {
    const run = { energy: { lid_pct: 1.5 }, module: MONOFACIAL_MODULE };

    expect(field(lossControlOf("LID", DOCUMENT, run))).toMatchObject({ value: null, detail: "default 1.5", reset: null });
    expect(field(lossControlOf("LID", withLosses({ lid_pct: 1 }), { ...run, energy: { lid_pct: 1 } }))).toMatchObject({ value: 1, detail: null, reset: "Use the default" });
  });

  test("the rear gain is a switch, on as the document says", () => {
    expect(lossControlOf("Bifacial rear gain", DOCUMENT, RUN)).toEqual({ kind: "switch", id: "bifacial", label: "Bifacial rear gain", on: true, disabled: false, note: null });
    expect(lossControlOf("Bifacial rear gain", withLosses({ bifacial: false }), RUN)).toMatchObject({ on: false, disabled: false });
  });

  test("with a monofacial module the switch cannot be used, and the row says the desktop's words", () => {
    expect(lossControlOf("Bifacial rear gain", DOCUMENT, { ...RUN, module: MONOFACIAL_MODULE })).toEqual({
      kind: "switch",
      id: "bifacial",
      label: "Bifacial rear gain",
      on: true,
      disabled: true,
      note: "The module is monofacial: no rear gain.",
    });
  });

  // #179, item 23: on a sloped, flush roof the engine applies no rear gain (the rear faces the roof), and the switch said
  // nothing of it.
  test("on a sloped, flush roof the switch cannot be used either, and the row says why", () => {
    const flush = { ...DOCUMENT, roof: { ...DOCUMENT.roof, roof_type: "sloped_flush" as const } };
    expect(lossControlOf("Bifacial rear gain", flush, RUN)).toMatchObject({ disabled: true, note: "Flush modules lie on the roof: no rear gain." });
    expect(lossControlOf("Bifacial rear gain", flush, { ...RUN, module: MONOFACIAL_MODULE })).toMatchObject({ disabled: true, note: "The module is monofacial: no rear gain." });
  });

  test("a step of the engine's own has no control", () => {
    for (const label of ["Global horizontal irradiation", "Transposition to plane (15°)", "IAM", "Temperature", "Inverter clipping", "Energy to grid"]) {
      expect(lossControlOf(label, DOCUMENT, RUN)).toBeNull();
    }
  });
});

describe("the edit of a loss", () => {
  test("a value entered changes that loss of the document and nothing else", () => {
    const after = withLoss(DOCUMENT, "soiling_pct", 3);

    expect(after).not.toBe(DOCUMENT);
    expect(after.losses).toEqual({ ...DOCUMENT.losses, soiling_pct: 3 });
    expect(after.roof).toBe(DOCUMENT.roof);
    expect(DOCUMENT.losses.soiling_pct).toBe(2);
  });

  test("the same value is the same document: nothing to run", () => {
    expect(withLoss(DOCUMENT, "soiling_pct", 2)).toBe(DOCUMENT);
    expect(withLoss(DOCUMENT, "lid_pct", null)).toBe(DOCUMENT);
    expect(withLoss(DOCUMENT, "bifacial", true)).toBe(DOCUMENT);
  });

  test("LID given back is null: the PAN's again", () => {
    const entered = withLoss(DOCUMENT, "lid_pct", 1);

    expect(entered.losses.lid_pct).toBe(1);
    expect(withLoss(entered, "lid_pct", null).losses.lid_pct).toBeNull();
  });

  test("the rear gain switched off", () => {
    expect(withLoss(DOCUMENT, "bifacial", false).losses.bifacial).toBe(false);
  });
});
