import { describe, expect, test } from "bun:test";
import { chainViewOf, changeOf, readoutOf } from "./loss-chain";
import { A, MODULE, STEPS } from "./test-fixtures";

describe("the rows of the chain (plan/phase-08-plan.md, decision 3; guidelines.md, \"Numbers and units\")", () => {
  const { rows, run } = chainViewOf(A, MODULE);

  test("one row for each step of the engine, in its order and words", () => {
    expect(rows.map((row) => row.label)).toEqual(STEPS.map((step) => step.label));
    expect(rows).toHaveLength(21);
  });

  test("a step: its change with two decimals and a sign, its running total with one and no unit", () => {
    expect(rows[1]).toMatchObject({ label: "Transposition to plane (15°)", isTotal: false, change: "+9.60 %", total: "1,998.0", unit: null });
    expect(rows[4]).toMatchObject({ label: "IAM", change: "−2.22 %", total: "1,946.5" });
    expect(rows[9]).toMatchObject({ label: "Temperature", change: "−4.08 %", total: "674.3" });
  });

  test("a total: no change, its running total with its unit, in bold", () => {
    expect(rows[0]).toMatchObject({ label: "Global horizontal irradiation", isTotal: true, change: null, total: "1,822.9", unit: "kWh/m²" });
    expect(rows[7]).toMatchObject({ label: "Array nominal energy at STC", isTotal: true, change: null, total: "706.4", unit: "MWh" });
    expect(rows[20]).toMatchObject({ label: "Energy to grid", isTotal: true, change: null, total: "617.8", unit: "MWh" });
  });

  test("a step of nothing reads 0.00 %, the night consumption too", () => {
    expect(rows[11]).toMatchObject({ label: "Module quality", change: "0.00 %" });
    expect(rows[17]).toMatchObject({ label: "Night consumption", change: "0.00 %" });
  });

  test("each row carries its mark of the cascade", () => {
    expect(rows[0]!.mark).toEqual({ kind: "marker", at: expect.any(Number) });
    expect(rows[1]!.mark).toMatchObject({ kind: "bar", look: "gain" });
    expect(rows[11]!.mark).toMatchObject({ kind: "bar", look: "zero" });
  });

  test("what the fields read of the run: the LID the engine took, and the module", () => {
    expect(run.energy.lid_pct).toBe(0.2);
    expect(run.module).toBe(MODULE);
  });
});

describe("the readout under the pointer (plan/phase-08-plan.md, decision 18)", () => {
  test("a step: its running total with its unit and its change on one line, then its label", () => {
    expect(readoutOf(STEPS[9]!)).toEqual({ figure: "674.3 MWh · −4.08 %", label: "Temperature" });
    expect(readoutOf(STEPS[1]!)).toEqual({ figure: "1,998.0 kWh/m² · +9.60 %", label: "Transposition to plane (15°)" });
    expect(readoutOf(STEPS[11]!)).toEqual({ figure: "670.5 MWh · 0.00 %", label: "Module quality" });
  });

  test("a total: its value with its unit alone", () => {
    expect(readoutOf(STEPS[0]!)).toEqual({ figure: "1,822.9 kWh/m²", label: "Global horizontal irradiation" });
    expect(readoutOf(STEPS[20]!)).toEqual({ figure: "617.8 MWh", label: "Energy to grid" });
  });

  test("each row carries its readout", () => {
    const { rows } = chainViewOf(A, MODULE);

    expect(rows[9]!.readout).toEqual({ figure: "674.3 MWh · −4.08 %", label: "Temperature" });
  });
});

describe("the change of a step", () => {
  test("a gain has a plus, a loss the true minus, nothing no sign; two decimals", () => {
    expect(changeOf(9.603835)).toBe("+9.60 %");
    expect(changeOf(-2.221339)).toBe("−2.22 %");
    expect(changeOf(0)).toBe("0.00 %");
    expect(changeOf(-0.0034)).toBe("0.00 %");
    expect(changeOf(-0.0109)).toBe("−0.01 %");
  });
});
