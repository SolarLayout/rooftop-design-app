import { describe, expect, test } from "bun:test";
import { byCount } from "./plural";

describe("a count said by its number (V2-46)", () => {
  test("one is singular, any other number is plural", () => {
    expect(byCount("27 strings on 1 inverter(s), DC/AC 1.30")).toBe("27 strings on 1 inverter, DC/AC 1.30");
    expect(byCount("27 strings on 2 inverter(s), DC/AC 0.71")).toBe("27 strings on 2 inverters, DC/AC 0.71");
    expect(byCount("0 position(s) and 1,200 position(s)")).toBe("0 positions and 1,200 positions");
  });

  test("words without a count are left as they are", () => {
    expect(byCount("Each inverter(s) needs a string")).toBe("Each inverter(s) needs a string");
    expect(byCount("Nothing to change.")).toBe("Nothing to change.");
  });
});
