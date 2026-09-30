import { describe, expect, test } from "bun:test";
import { describePytestRun, parsePytestCounts } from "./pytest-summary.ts";

describe("parsePytestCounts", () => {
  test("reads pytest's last line", () => {
    expect(parsePytestCounts("tests/a.py ..\n\n======= 25 passed, 82 deselected in 23.70s =======\n")).toEqual({
      passed: 25, failed: 0, skipped: 0, errors: 0, deselected: 82,
    });
    expect(parsePytestCounts("====== 2 failed, 23 passed, 1 skipped, 3 errors, 82 deselected in 23.70s ======")).toEqual({
      passed: 23, failed: 2, skipped: 1, errors: 3, deselected: 82,
    });
    expect(parsePytestCounts("1 error in 0.5s")).toMatchObject({ errors: 1 });
  });

  test("a run with no tests is all zeros; anything else is refused", () => {
    expect(parsePytestCounts("no tests ran in 1.40s")).toEqual({ passed: 0, failed: 0, skipped: 0, errors: 0, deselected: 0 });
    expect(() => parsePytestCounts("Traceback (most recent call last)")).toThrow(/pytest's summary/);
  });
});

describe("describePytestRun", () => {
  const counts = { passed: 25, failed: 0, skipped: 0, errors: 0, deselected: 82 };

  test("a selection: how many ran of how many, how many were not run and why, and the sentinel", () => {
    expect(describePytestRun({ counts, known: 550, rebuilt: null, changed: "changed files: src/rooftop_core/geo.py" })).toBe(
      "ran 25 of 550 tests, the sentinel among them; 525 not run, unaffected by the change (pytest-testmon: changed files: src/rooftop_core/geo.py)",
    );
  });

  test("a rebuilt data file: everything ran, and the reason", () => {
    expect(describePytestRun({ counts: { ...counts, passed: 550, deselected: 0 }, known: 0, rebuilt: "no testmon data yet", changed: null })).toBe(
      "ran all 550 tests: no testmon data yet",
    );
  });

  test("new tests are counted as run, not as known", () => {
    expect(describePytestRun({ counts: { ...counts, passed: 30 }, known: 549, rebuilt: null, changed: null })).toBe(
      "ran 30 of 549 tests, the sentinel among them; 519 not run, unaffected by the change (pytest-testmon)",
    );
  });

  test("failures and skips are said", () => {
    expect(describePytestRun({ counts: { ...counts, failed: 2, skipped: 1 }, known: 550, rebuilt: null, changed: null })).toMatch(
      /^ran 28 of 550 tests \(2 failed, 1 skipped\), the sentinel among them; 522 not run/,
    );
  });
});
