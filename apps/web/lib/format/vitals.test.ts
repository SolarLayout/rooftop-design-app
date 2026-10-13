import { describe, expect, test } from "bun:test";
import {
  acCapacity,
  dcAcRatio,
  dcCapacity,
  energy,
  modulesUsed,
  performanceRatio,
  positions,
  said,
  specificYield,
} from "./vitals";

// docs/design/guidelines.md, "Numbers and units". The numbers are those the API answers for the demo.

describe("the vitals of the demo", () => {
  test("energy: one decimal, MWh", () => {
    expect(energy(617.8405)).toEqual({ number: "617.8", unit: "MWh" });
  });

  test("DC capacity: two decimals, kWp", () => {
    expect(dcCapacity(357.28)).toEqual({ number: "357.28", unit: "kWp" });
  });

  test("AC capacity: whole, kW", () => {
    expect(acCapacity(275.0)).toEqual({ number: "275", unit: "kW" });
  });

  test("DC/AC: two decimals, no unit", () => {
    expect(dcAcRatio(1.2992)).toEqual({ number: "1.30" });
  });

  test("modules: those used, of the positions", () => {
    expect(modulesUsed(638, 790)).toEqual({ number: "638", unit: "of 790" });
  });

  test("PR: a share, shown in percent with one decimal", () => {
    expect(performanceRatio(0.8655)).toEqual({ number: "86.6", unit: "%" });
  });

  test("yield: whole, a comma between thousands, kWh/kWp", () => {
    expect(specificYield(1729.29)).toEqual({ number: "1,729", unit: "kWh/kWp" });
  });
});

describe("the vitals before a system voltage", () => {
  test("the positions, in modules", () => {
    expect(positions(790)).toEqual({ number: "790", unit: "modules" });
  });
});

describe("numbers at their edges", () => {
  test("a share is not rounded twice", () => {
    expect(performanceRatio(0.8665).number).toBe("86.7");
    expect(performanceRatio(0.86649).number).toBe("86.6");
    expect(performanceRatio(1).number).toBe("100.0");
  });

  test("large numbers have commas", () => {
    expect(energy(14554.04).number).toBe("14,554.0");
    expect(modulesUsed(1638, 12790)).toEqual({ number: "1,638", unit: "of 12,790" });
  });

  test("a half goes up", () => {
    expect(dcAcRatio(1.295).number).toBe("1.30");
    expect(acCapacity(274.5).number).toBe("275");
  });

  test("nothing is a number too, and is shown as one", () => {
    expect(energy(0)).toEqual({ number: "0.0", unit: "MWh" });
  });
});

describe("a quantity in words", () => {
  test("a space between number and unit", () => {
    expect(said(energy(617.8405))).toBe("617.8 MWh");
    expect(said(modulesUsed(638, 790))).toBe("638 of 790");
    expect(said(performanceRatio(0.8655))).toBe("86.6 %");
  });

  test("a number without a unit is the number", () => {
    expect(said(dcAcRatio(1.2992))).toBe("1.30");
  });
});
