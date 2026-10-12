import { describe, expect, test } from "bun:test";
import type { LossStep, Project } from "../api";
import { downtimeOf, energyStepsOf, STEP_FIELD_RANGE, withDowntime, withStepField } from "./energy-steps";
import { DOCUMENT, LOSSES, STEPS, STEPS_REAR_OFF } from "./test-fixtures";

const valueOf = (label: string) => STEPS.find((step) => step.label === label)!.value;
const composed = (pcts: number[]) => (pcts.reduce((product, pct) => product * (1 + pct / 100), 1) - 1) * 100;

describe("Where the energy goes (V2 · 8, D104): the eleven plain steps from the engine's 21", () => {
  const view = energyStepsOf(STEPS, DOCUMENT);

  test("before the modules, five steps in the board's words, then the modules' rated output", () => {
    expect(view.before.rows.map((row) => row.label)).toEqual([
      "Sunlight on the tilted modules",
      "Shade from rows, obstacles and the horizon",
      "Dirt on the glass (soiling)",
      "Light reflected off the glass",
      "Light on the back of the modules",
    ]);
    expect(view.before.total).toEqual({ label: "The modules' rated output", value: "706.4 MWh" });
  });

  test("in the system, six steps, then what reaches the grid", () => {
    expect(view.system.rows.map((row) => row.label)).toEqual(["Heat", "Low light and module quality", "Shade on a string", "Cables", "Inverter", "Downtime"]);
    expect(view.system.total).toEqual({ label: "To the grid", value: "617.8 MWh" });
  });

  test("each plain step names the engine's steps it holds, in the engine's words", () => {
    expect(view.before.rows.map((row) => row.engine)).toEqual([
      ["Transposition to plane (15°)"],
      ["Far shading, horizon", "Near shading, linear"],
      ["Soiling"],
      ["IAM"],
      ["Bifacial rear gain"],
    ]);
    expect(view.system.rows.map((row) => row.engine)).toEqual([
      ["Temperature"],
      ["Irradiance level", "Module quality", "LID (PAN)", "Mismatch"],
      ["Electrical shading"],
      ["DC ohmic", "AC ohmic"],
      ["Inverter efficiency", "Inverter clipping", "Night consumption"],
      ["Availability"],
    ]);
  });

  test("a step's change is its engine steps' changes composed, two decimals, the true minus", () => {
    expect(view.before.rows.map((row) => row.change)).toEqual(["+9.60 %", "−0.37 %", "−2.00 %", "−2.22 %", "+3.65 %"]);
    expect(view.system.rows.map((row) => row.change)).toEqual(["−4.08 %", "−1.67 %", "−0.56 %", "−1.70 %", "−4.65 %", "−0.50 %"]);
  });

  test("the steps compose to the engine's chain: GHI to the irradiance on the modules, the rated output to the grid", () => {
    const before = composed(view.before.rows.map((row) => row.pct));
    const system = composed(view.system.rows.map((row) => row.pct));

    expect(before).toBeCloseTo((valueOf("Bifacial rear gain") / valueOf("Global horizontal irradiation") - 1) * 100, 9);
    expect(system).toBeCloseTo((valueOf("Energy to grid") / valueOf("Array nominal energy at STC") - 1) * 100, 9);
  });

  test("the bar is the change on a scale of 10 %, a gain or a loss; a step of nothing is a tick", () => {
    const sunlight = view.before.rows[0]!;
    const heat = view.system.rows[0]!;
    expect([sunlight.look, sunlight.share]).toEqual(["gain", expect.closeTo(0.9604, 4)]);
    expect([heat.look, heat.share]).toEqual(["loss", expect.closeTo(0.408, 3)]);

    const rearOff = energyStepsOf(STEPS_REAR_OFF, DOCUMENT).before.rows[4]!;
    expect([rearOff.change, rearOff.look, rearOff.share]).toEqual(["0.00 %", "zero", 0]);
  });

  test("a change past 10 % fills the bar and no more", () => {
    const steep = STEPS.map((step): LossStep => (step.label.startsWith("Transposition") ? { ...step, pct: 24 } : step));
    expect(energyStepsOf(steep, DOCUMENT).before.rows[0]!.share).toBe(1);
  });

  test("three steps are the user's to change, each with who set it: dirt, mismatch, downtime", () => {
    const fields = [...view.before.rows, ...view.system.rows].flatMap((row) => (row.field ? [[row.label, row.field.id, row.field.value, row.field.setBy]] : []));
    expect(fields).toEqual([
      ["Dirt on the glass (soiling)", "soiling_pct", 2, "Default"],
      ["Low light and module quality", "mismatch_pct", 1, "Default"],
      ["Downtime", "downtime", 0.5, "Default"],
    ]);
  });

  test("a value the user entered is theirs", () => {
    const dirty = { ...DOCUMENT, losses: { ...LOSSES, soiling_pct: 3, availability_pct: 98 } } as Project;
    const rows = [...energyStepsOf(STEPS, dirty).before.rows, ...energyStepsOf(STEPS, dirty).system.rows];
    expect(rows.find((row) => row.field?.id === "soiling_pct")!.field).toMatchObject({ value: 3, setBy: "Yours" });
    expect(rows.find((row) => row.field?.id === "downtime")!.field).toMatchObject({ value: 2, setBy: "Yours" });
  });

  test("the fields' names say what each changes", () => {
    const names = [...view.before.rows, ...view.system.rows].flatMap((row) => (row.field ? [row.field.label] : []));
    expect(names).toEqual(["Soiling", "Mismatch between modules", "Downtime"]);
  });
});

describe("the fields of the steps", () => {
  test("downtime is what availability leaves", () => {
    expect(downtimeOf(LOSSES)).toBe(0.5);
    expect(downtimeOf({ ...LOSSES, availability_pct: 97.25 })).toBe(2.75);
  });

  test("downtime entered sets availability; the same value leaves the document as it was", () => {
    expect(withDowntime(DOCUMENT, 1.5).losses.availability_pct).toBe(98.5);
    expect(withDowntime(DOCUMENT, 0.5)).toBe(DOCUMENT);
  });

  test("dirt and mismatch are the document's losses", () => {
    expect(withStepField(DOCUMENT, "soiling_pct", 3).losses.soiling_pct).toBe(3);
    expect(withStepField(DOCUMENT, "mismatch_pct", 1)).toBe(DOCUMENT);
    expect(withStepField(DOCUMENT, "downtime", 2).losses.availability_pct).toBe(98);
  });

  test("each field holds two decimals within the engine's range", () => {
    expect(STEP_FIELD_RANGE).toEqual({
      soiling_pct: { min: 0, max: 30, decimals: 2 },
      mismatch_pct: { min: 0, max: 10, decimals: 2 },
      downtime: { min: 0, max: 20, decimals: 2 },
    });
  });
});
