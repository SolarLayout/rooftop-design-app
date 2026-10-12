import { describe, expect, test } from "bun:test";
import { changeWords } from "./card-words";

describe("the tooltip of Change on an equipment card", () => {
  test("says how many the library holds, and that a file of one's own is taken", () => {
    expect(changeWords("modules", 119)).toBe("Choose from 119 modules, or use a module file (PAN)");
    expect(changeWords("inverters", 388)).toBe("Choose from 388 inverters, or use an inverter file (OND)");
  });

  test("before the catalog is in, it says the same without the count", () => {
    expect(changeWords("modules", null)).toBe("Choose a module, or use a module file (PAN)");
    expect(changeWords("inverters", null)).toBe("Choose an inverter, or use an inverter file (OND)");
  });
});
