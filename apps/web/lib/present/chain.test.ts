import { describe, expect, test } from "bun:test";
import type { DesignOption, LossStep } from "../api";
import { presentChainOf } from "./chain";

// The chain of the energy scene (D72; restored by the owner, 2026-10-13): the cascade from the modules' rated output to
// the grid, its two totals named in Performance's words (lib/performance/energy-steps.ts), the figures the engine's.

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

describe("the energy scene's chain", () => {
  test("from the modules' rated output to the grid: a marker, the energy steps' bars, the result's marker", () => {
    const { chain } = presentChainOf(OPTION);
    expect(chain.map((mark) => mark.kind)).toEqual(["marker", "bar", "bar", "bar", "marker"]);
    expect(chain[0]).toEqual({ kind: "marker", at: 1 });
    expect(chain[1]).toMatchObject({ kind: "bar", from: 1, look: "loss" });
    expect(chain[2]).toMatchObject({ kind: "bar", look: "zero" });
    expect(chain[4]).toEqual({ kind: "marker", at: 0 });
  });

  test("its two totals in Performance's words, with the engine's figures", () => {
    const { first, last } = presentChainOf(OPTION);
    expect(first).toEqual({ label: "The modules' rated output", figure: "706.4 MWh" });
    expect(last).toEqual({ label: "To the grid", figure: "617.8 MWh" });
  });

  test("a run whose chain has no energy total draws the whole chain", () => {
    const irradianceAlone = { energy: { energy_mwh: 1, steps: STEPS.slice(0, 2) } } as unknown as DesignOption;
    expect(presentChainOf(irradianceAlone).chain).toHaveLength(2);
  });
});
