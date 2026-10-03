import { describe, expect, test } from "bun:test";
import type { DesignOption, LossStep } from "../api";
import { ENERGY_LABEL, figuresOf } from "./figures";

// The figures of the last scene (plan/phase-10-plan.md, step 19; the board "Present", frame 6): the energy of year 1 as
// the hero number, and the chain's cascade from the array's nominal energy to the grid, the first and the last total named,
// every word and number the engine's.

const STEPS: LossStep[] = [
  { kind: "irr_total", label: "Global horizontal irradiation", pct: 0, value: 1822.9 },
  { kind: "irr", label: "Transposition to the plane of array", pct: 9.6, value: 1997.9 },
  { kind: "energy_total", label: "Array nominal energy at STC", pct: 0, value: 706.4 },
  { kind: "energy", label: "Temperature", pct: -4.08, value: 677.6 },
  { kind: "energy", label: "Rear-side gain", pct: 0, value: 677.6 },
  { kind: "energy", label: "Inverter", pct: -1.5, value: 667.4 },
  { kind: "result", label: "Energy to grid", pct: 0, value: 617.8 },
];

const OPTION = { energy: { energy_mwh: 617.8405, steps: STEPS } } as unknown as DesignOption;

describe("the figures", () => {
  test("the energy of year 1 under the board's label, as Performance says it", () => {
    const figures = figuresOf(OPTION);
    expect(figures.label).toBe(ENERGY_LABEL);
    expect(ENERGY_LABEL).toBe("Energy to grid, year 1");
    expect(figures.mwh).toBe(617.8405);
  });

  test("the chain from the array's nominal energy to the grid: a marker, the energy steps' bars, the result's marker", () => {
    const { chain } = figuresOf(OPTION);
    expect(chain.map((mark) => mark.kind)).toEqual(["marker", "bar", "bar", "bar", "marker"]);
    expect(chain[0]).toEqual({ kind: "marker", at: 1 });
    expect(chain[1]).toMatchObject({ kind: "bar", from: 1, look: "loss" });
    expect(chain[2]).toMatchObject({ kind: "bar", look: "zero" });
    expect(chain[4]).toEqual({ kind: "marker", at: 0 });
  });

  test("the first and the last total named, in the engine's words and numbers", () => {
    const { first, last } = figuresOf(OPTION);
    expect(first).toEqual({ label: "Array nominal energy at STC", figure: "706.4" });
    expect(last).toEqual({ label: "Energy to grid", figure: "617.8 MWh" });
  });

  test("a run whose chain has no energy total draws the whole chain", () => {
    const irradianceAlone = { energy: { energy_mwh: 1, steps: STEPS.slice(0, 2) } } as unknown as DesignOption;
    expect(figuresOf(irradianceAlone).chain).toHaveLength(2);
    expect(figuresOf(irradianceAlone).first.label).toBe("Global horizontal irradiation");
  });
});
