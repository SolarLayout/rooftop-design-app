import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { DEGRADATION_RANGE, withDegradation } from "./degradation";

const LOSSES = { degradation_pct: 0.5, soiling_pct: 2 } as unknown as Project["losses"];
const document = { name: "Demo", losses: LOSSES } as unknown as Project;

describe("the degradation field (plan/phase-08-plan.md, step 14; inventory 1.7)", () => {
  test("0 to 3 % a year, two decimals", () => {
    expect(DEGRADATION_RANGE).toEqual({ min: 0, max: 3, decimals: 2 });
  });

  test("a value entered is the document's, the other losses kept; the document of before is left as it was", () => {
    const after = withDegradation(document, 0.7);

    expect(after.losses).toEqual({ ...LOSSES, degradation_pct: 0.7 });
    expect(document.losses.degradation_pct).toBe(0.5);
    expect(after).not.toBe(document);
  });

  test("the same value is the same document: nothing is run", () => {
    expect(withDegradation(document, 0.5)).toBe(document);
  });
});
