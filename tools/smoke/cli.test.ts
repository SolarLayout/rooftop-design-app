import { describe, expect, test } from "bun:test";

import { argumentsOf, summaryOf } from "./cli";

describe("the smoke's command line", () => {
  test("a base URL, and a commit if one is named", () => {
    expect(argumentsOf(["https://rooftop.solarlayout.app"])).toEqual({ base: "https://rooftop.solarlayout.app", commit: undefined });
    expect(argumentsOf(["https://rooftop.solarlayout.app", "--commit", "8a4b246"])).toEqual({ base: "https://rooftop.solarlayout.app", commit: "8a4b246" });
  });

  test("anything else is refused with the usage", () => {
    for (const wrong of [[], ["rooftop.solarlayout.app"], ["http://rooftop.solarlayout.app"], ["https://a.app", "--commit"], ["https://a.app", "--fast"]]) {
      expect(() => argumentsOf(wrong)).toThrow("usage: bun tools/smoke.ts <https base URL, or this machine's> [--commit <sha>]");
    }
  });

  test("this machine's stack over plain http, to prove the smoke itself", () => {
    expect(argumentsOf(["http://127.0.0.1:4710"]).base).toBe("http://127.0.0.1:4710");
    expect(argumentsOf(["http://localhost:4710"]).base).toBe("http://localhost:4710");
  });
});

describe("the smoke's summary", () => {
  test("one line per step, its mark, its time and what it found; the last line says whether all passed", () => {
    const text = summaryOf("https://a.app", [
      { name: "the page", ok: true, detail: "HTML", ms: 120.4 },
      { name: "the API's health", ok: false, detail: "502: Bad gateway", ms: 2400 },
    ]);

    expect(text).toBe(
      [
        "smoke of https://a.app",
        "  ✓  the page            0.1 s  HTML",
        "  !  the API's health    2.4 s  502: Bad gateway",
        "1 of 2 steps failed.",
      ].join("\n"),
    );
  });

  test("all passed", () => {
    expect(summaryOf("https://a.app", [{ name: "the page", ok: true, detail: "HTML", ms: 5 }]).split("\n").at(-1)).toBe("All 1 steps passed.");
  });
});
