import { describe, expect, test } from "bun:test";
import { tally } from "./drops.ts";

describe("the tally of the answers", () => {
  test("counts the answers by status, the drops being every answer that is not 200, and says so in one line", () => {
    const counted = tally([200, 200, 500, 200, 502, 500]);
    expect(counted.total).toBe(6);
    expect(counted.good).toBe(3);
    expect(counted.dropped).toBe(3);
    expect(counted.byStatus).toEqual({ 200: 3, 500: 2, 502: 1 });
    expect(counted.line).toBe("6 asked, 3 answered 200, 3 dropped (500 ×2, 502 ×1)");
  });

  test("nothing dropped is said plainly", () => {
    expect(tally([200, 200]).line).toBe("2 asked, 2 answered 200, 0 dropped");
  });

  test("an answer that never came counts as a drop under 'no answer'", () => {
    expect(tally([200, null]).line).toBe("2 asked, 1 answered 200, 1 dropped (no answer ×1)");
  });
});
