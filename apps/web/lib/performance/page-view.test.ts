import { describe, expect, test } from "bun:test";
import type { DesignResult } from "../api";
import { pageViewOf } from "./page-view";
import { A, B, BEFORE_A_VOLTAGE, DEMO, READOUTS } from "./test-fixtures";

const SHADING = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.4 } as const;
const FITTING = { type: "progress", step: "Fitting modules on the roof", fraction: 0.08 } as const;
const NO_WEATHER = { code: "weather_not_loaded", message: "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first." };

const AT_REST = { name: "Pune demo roof", design: DEMO, readouts: READOUTS, designStatus: "idle", progress: null, failure: null } as const;

describe("the design (plan/phase-08-plan.md, decision 15)", () => {
  test("at rest: the header, the KPIs and the summary of the chosen option, nothing dimmed, no row under the title", () => {
    const view = pageViewOf(AT_REST);

    expect(view.kind).toBe("design");
    if (view.kind !== "design") return;
    expect(view.header.chosen).toBe("29x22x1");
    expect(view.values.kpis.lead.quantity).toEqual({ number: "617.8", unit: "MWh" });
    expect(view.values.summary).toHaveLength(14);
    expect(view.values.chain.rows).toHaveLength(21);
    expect(view.values.chain.run.module.is_bifacial).toBe(true);
    expect(view.values.energy.monthly_mwh).toHaveLength(12);
    expect(view.isDimmed).toBe(false);
    expect(view.run).toBeNull();
  });

  test("the values are the chosen option's, as the run's answer holds the choice", () => {
    const view = pageViewOf({ ...AT_REST, design: { ...DEMO, chosen_option: B.key } as DesignResult });

    if (view.kind !== "design") throw new Error(view.kind);
    expect(view.values.kpis.lead.quantity.number).toBe("607.7");
    expect(view.header.items.find((item) => item.isChosen)?.key).toBe(B.key);
  });

  test("a run on its way: the values of before, dimmed, and the row with the engine's step and how far", () => {
    const view = pageViewOf({ ...AT_REST, designStatus: "running", progress: SHADING });

    if (view.kind !== "design") throw new Error(view.kind);
    expect(view.values.kpis.lead.quantity.number).toBe("617.8");
    expect(view.isDimmed).toBe(true);
    expect(view.run).toEqual({ title: "Updating energy", step: "Computing hourly shading for every module", share: 0.4 });
  });

  test("during the pause before the run as well, without a step", () => {
    const view = pageViewOf({ ...AT_REST, designStatus: "waiting" });

    if (view.kind !== "design") throw new Error(view.kind);
    expect(view.isDimmed).toBe(true);
    expect(view.run).toEqual({ title: "Updating energy", step: null, share: 0 });
  });
});

describe("the first load", () => {
  test("no value was ever there: skeletons, and the row says what is opened and the engine's step", () => {
    const view = pageViewOf({ ...AT_REST, design: null, designStatus: "running", progress: FITTING });

    expect(view).toEqual({ kind: "loading", header: null, run: { title: "Opening Pune demo roof", step: "Fitting modules on the roof", share: 0.08 } });
  });

  test("before the design itself is there", () => {
    const view = pageViewOf({ name: null, design: null, designStatus: "idle", progress: null, failure: null });

    expect(view).toEqual({ kind: "loading", header: null, run: { title: "Opening the design", step: null, share: 0 } });
  });
});

describe("before options", () => {
  test("the API's title and message, word for word, leading to the Strings lens; no options to choose; nothing of energy", () => {
    const view = pageViewOf({ ...AT_REST, design: BEFORE_A_VOLTAGE });

    expect(view.kind).toBe("decision");
    if (view.kind !== "decision") return;
    expect(view.decision).toEqual({
      title: "Choose a system voltage to size the strings",
      message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
      path: "/studio/strings",
    });
    expect(view.header.items).toEqual([]);
    expect(view.header.items).toEqual([]);
    expect(view.run).toBeNull();
    expect(JSON.stringify(view)).not.toContain("MWh");
  });

  test("the other reasons for no options are said the same way", () => {
    const noLength = { ...BEFORE_A_VOLTAGE, no_options: { code: "no_string_length_fits", title: "No string length fits the inverter", message: "At 600 V the longest string is 11 modules, and the MPPT needs 13." } } as DesignResult;
    const view = pageViewOf({ ...AT_REST, design: noLength });

    if (view.kind !== "decision") throw new Error(view.kind);
    expect(view.decision?.title).toBe("No string length fits the inverter");
    expect(view.decision?.message).toBe("At 600 V the longest string is 11 modules, and the MPPT needs 13.");
  });

  test("an edit meanwhile: the row says the energy is updated", () => {
    const view = pageViewOf({ ...AT_REST, design: BEFORE_A_VOLTAGE, designStatus: "running", progress: SHADING });

    if (view.kind !== "decision") throw new Error(view.kind);
    expect(view.run?.title).toBe("Updating energy");
  });
});

describe("the run failed", () => {
  test("the values of before, not dimmed, and the note with the API's message and Try again", () => {
    const view = pageViewOf({ ...AT_REST, designStatus: "failed", failure: NO_WEATHER });

    expect(view.kind).toBe("failed");
    if (view.kind !== "failed") return;
    expect(view.values?.kpis.lead.quantity.number).toBe("617.8");
    expect(view.values?.summary).toHaveLength(14);
    expect(view.header?.chosen).toBe("29x22x1");
    expect(view.decision).toBeNull();
    expect(view.failed).toEqual({
      title: "Energy not updated",
      detail: "Showing the last result",
      action: "Try again",
      message: "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first.",
    });
  });

  test("at the first load: no values, no header, and the note says there are none yet", () => {
    const view = pageViewOf({ ...AT_REST, design: null, designStatus: "failed", failure: { code: "unavailable", message: "The server cannot be reached." } });

    if (view.kind !== "failed") throw new Error(view.kind);
    expect(view.values).toBeNull();
    expect(view.header).toBeNull();
    expect(view.failed).toEqual({ title: "Energy not computed", detail: "There is no result yet", action: "Try again", message: "The server cannot be reached." });
  });

  test("before options: the decision stays beside the note", () => {
    const view = pageViewOf({ ...AT_REST, design: BEFORE_A_VOLTAGE, designStatus: "failed", failure: NO_WEATHER });

    if (view.kind !== "failed") throw new Error(view.kind);
    expect(view.values).toBeNull();
    expect(view.decision?.title).toBe("Choose a system voltage to size the strings");
  });

  test("the words are the vitals' own, not written twice", () => {
    const view = pageViewOf({ ...AT_REST, design: { ...DEMO, options: [A] } as DesignResult, designStatus: "failed", failure: NO_WEATHER });

    if (view.kind !== "failed") throw new Error(view.kind);
    expect(view.failed.title).toBe("Energy not updated");
  });
});
