import { describe, expect, test } from "bun:test";
import { localDayOf } from "./day";

// The day of the report is the reader's, as the browser's clock has it (plan/phase-09-plan.md, decision 2).
describe("the browser's local day as YYYY-MM-DD", () => {
  test("the day of the clock, in local time", () => {
    expect(localDayOf(new Date(2026, 9, 3, 23, 59))).toBe("2026-10-03");
  });

  test("a month and a day under ten are padded", () => {
    expect(localDayOf(new Date(2026, 0, 7, 0, 0))).toBe("2026-01-07");
  });

  test("the last day of the year, and the first", () => {
    expect(localDayOf(new Date(2025, 11, 31, 12))).toBe("2025-12-31");
    expect(localDayOf(new Date(2026, 0, 1, 0, 0, 1))).toBe("2026-01-01");
  });
});
