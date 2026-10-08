import { describe, expect, test } from "bun:test";
import { arePagesWantedOf, pageViewOf } from "./page-view";
import { BEFORE_A_VOLTAGE, DEMO } from "./test-fixtures";

const UNREACHABLE = { code: "api_unreachable", message: "The server cannot be reached. Check the connection and try again." };
const AT_REST = { name: "Pune demo roof", design: DEMO, designStatus: "idle", failure: null, pages: null } as const;

describe("the design (plan/phase-09-plan.md, decision 11)", () => {
  test("at rest: the rows with their facts, nothing dimmed, no decision, nothing failed", () => {
    const view = pageViewOf(AT_REST);

    expect(view.kind).toBe("design");
    expect(view.rows[1]!.facts).toBe("22 strings of 29 × 560 Wp · 1 inverter, 6 MPPT");
    expect(view.rows.every((row) => !row.waits)).toBe(true);
    expect(view.isDimmed).toBe(false);
    expect(view.decision).toBeNull();
    expect(view.failed).toBeNull();
  });

  test.each(["waiting", "running"] as const)("a run %s: the rows of before, dimmed", (designStatus) => {
    const view = pageViewOf({ ...AT_REST, designStatus });

    expect(view.kind).toBe("design");
    expect(view.rows[2]!.facts).toBe("638 modules · 27 tables · 1,681 m DC cable");
    expect(view.isDimmed).toBe(true);
  });
});

describe("the first load", () => {
  test("no value was ever there: the rows without facts, every row but the named project file waiting", () => {
    const view = pageViewOf({ ...AT_REST, design: null, designStatus: "running" });

    expect(view.kind).toBe("loading");
    expect(view.rows.slice(0, 7).every((row) => row.facts === null && row.waits)).toBe(true);
    expect(view.rows[7]).toMatchObject({ facts: "Pune-demo-roof.rtd · opens again here", waits: false });
    expect(view.isDimmed).toBe(false);
  });

  test("before the design itself is there", () => {
    const view = pageViewOf({ name: null, design: null, designStatus: "idle", failure: null, pages: null });

    expect(view.kind).toBe("loading");
    expect(view.rows.every((row) => row.facts === null && row.waits)).toBe(true);
  });
});

describe("before options", () => {
  test("the API's title and message, word for word, leading to the Strings lens; every row but the project file waits with the title", () => {
    const view = pageViewOf({ ...AT_REST, design: BEFORE_A_VOLTAGE });

    expect(view.kind).toBe("decision");
    expect(view.decision).toEqual({
      title: "Choose a system voltage to size the strings",
      message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
      path: "/studio/strings",
    });
    expect(view.rows.slice(0, 7).every((row) => row.waits && row.facts === "Choose a system voltage to size the strings")).toBe(true);
    expect(view.rows[7]!.waits).toBe(false);
  });
});

describe("a run that failed", () => {
  test("with a design of before: its rows stay, not dimmed, with the note in the API's words and Try again", () => {
    const view = pageViewOf({ ...AT_REST, designStatus: "failed", failure: UNREACHABLE });

    expect(view.kind).toBe("failed");
    expect(view.rows[1]!.facts).toBe("22 strings of 29 × 560 Wp · 1 inverter, 6 MPPT");
    expect(view.isDimmed).toBe(false);
    expect(view.failed).toEqual({
      title: "The files were not updated",
      detail: "They are of the design before",
      action: "Try again",
      message: "The server cannot be reached. Check the connection and try again.",
    });
    expect(view.decision).toBeNull();
  });

  test("at the first load: there are no files yet", () => {
    const view = pageViewOf({ ...AT_REST, design: null, designStatus: "failed", failure: UNREACHABLE });

    expect(view.kind).toBe("failed");
    expect(view.rows.slice(0, 7).every((row) => row.facts === null && row.waits)).toBe(true);
    expect(view.failed).toMatchObject({ title: "The files were not made", detail: "There are no files yet", action: "Try again" });
  });

  test("before options, the decision stands with the note", () => {
    const view = pageViewOf({ ...AT_REST, design: BEFORE_A_VOLTAGE, designStatus: "failed", failure: UNREACHABLE });

    expect(view.kind).toBe("failed");
    expect(view.decision?.title).toBe("Choose a system voltage to size the strings");
  });
});

describe("the report's pages, asked at the workspace's open (plan/phase-11-plan.md, step 33)", () => {
  test("wanted as soon as the report's row is live, whatever item is open, so that the row counts its pages from the start", () => {
    expect(arePagesWantedOf(pageViewOf(AT_REST))).toBe(true);
    expect(arePagesWantedOf(pageViewOf({ ...AT_REST, designStatus: "running" }))).toBe(true);
  });

  test("not before the run has an option: there are no pages to draw", () => {
    expect(arePagesWantedOf(pageViewOf({ ...AT_REST, design: null, designStatus: "running" }))).toBe(false);
    expect(arePagesWantedOf(pageViewOf({ ...AT_REST, design: BEFORE_A_VOLTAGE }))).toBe(false);
    expect(arePagesWantedOf(pageViewOf({ ...AT_REST, design: null, designStatus: "failed", failure: UNREACHABLE }))).toBe(false);
  });
});
