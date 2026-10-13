import { describe, expect, test } from "bun:test";
import { makerOf } from "./makers";

describe("the makers as people know them (D75)", () => {
  test("a maker the files name otherwise is given its everyday name", () => {
    expect(makerOf("Ginlong Technologies")).toBe("Solis");
    expect(makerOf("Heliene Inc")).toBe("Heliene");
    expect(makerOf("INSOLATION GREEN ENERGY PVT. LTD.")).toBe("Insolation");
    expect(makerOf("WattPower Systems Pvt.Ltd")).toBe("WattPower");
    expect(makerOf("Waaree Energies Ltd.")).toBe("Waaree");
  });

  test("the name is found whatever its case and its spaces at the ends", () => {
    expect(makerOf("  kaco NEW energy ")).toBe("KACO");
    expect(makerOf("Silfab Solar Inc.")).toBe("Silfab");
  });

  test("a maker that is not in the list keeps the file's name", () => {
    expect(makerOf("Sungrow")).toBe("Sungrow");
    expect(makerOf("A Maker Not Listed")).toBe("A Maker Not Listed");
  });
});
