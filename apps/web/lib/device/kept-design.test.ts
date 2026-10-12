import { describe, expect, test } from "bun:test";
import type { DesignResult, Layout, Project } from "../api";
import { factsOf, keptOf, roofWordsOf, whenOf } from "./kept-design";

// A design kept on this device (plan/phase-10-plan.md, step 1, decision 1): the document whole, and the facts of its
// card worked out of the document and the last run, so that Home and the switcher show them without a run.

const RECTANGLE: Project["roof"]["outline"] = [
  [-45, -20],
  [45, -20],
  [45, 20],
  [-45, 20],
];

const DEMO = {
  name: "Pune demo roof",
  system_voltage: 1500,
  chosen_option: "",
  roof: { lat: 18.52, lon: 73.86, outline: RECTANGLE, roof_type: "flat_tilted", source: "map", obstacles: [] },
} as unknown as Project;

const RUN = {
  chosen_option: "29x22x1",
  options: [
    { key: "29x22x1", dc_kwp: 357.28, energy: { energy_mwh: 617.8405373922709 } },
    { key: "26x27x2", dc_kwp: 393.12, energy: { energy_mwh: 700.9 } },
  ],
  no_options: null,
} as unknown as DesignResult;

const BEFORE_A_VOLTAGE = { ...RUN, chosen_option: null, options: [] } as unknown as DesignResult;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** 2026-09-24, midday in the local time of the machine: no day boundary within hours of it. */
const NOON = new Date(2026, 8, 24, 12).getTime();

describe("the roof's words", () => {
  test("the demo's roof: its size, and its type as the Roof lens names it", () => {
    expect(roofWordsOf(DEMO)).toBe("90.0 × 40.0 m flat roof, tilted rows");
  });

  test("the other roof types", () => {
    expect(roofWordsOf({ ...DEMO, roof: { ...DEMO.roof, roof_type: "flat_ew" } })).toBe("90.0 × 40.0 m flat roof, east-west");
    expect(roofWordsOf({ ...DEMO, roof: { ...DEMO.roof, roof_type: "sloped_flush" } })).toBe("90.0 × 40.0 m sloped roof");
  });

  test("a roof that is no rectangle is said by its area, as the Roof lens says it", () => {
    const five = { ...DEMO, roof: { ...DEMO.roof, outline: [...RECTANGLE.slice(0, 3), [0, 30], RECTANGLE[3]] } } as Project;

    expect(roofWordsOf(five)).toBe("4,050 m² flat roof, tilted rows");
  });
});

describe("the facts of the card", () => {
  test("after a run with a chosen option: the roof's words, the capacity and the energy of that option", () => {
    expect(factsOf(DEMO, RUN)).toEqual({ roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: 357.28, energyMwh: 617.8405373922709 });
  });

  test("before a run, or before a voltage is chosen, the numbers are not there: the roof's words alone", () => {
    expect(factsOf(DEMO, null)).toEqual({ roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: null, energyMwh: null });
    expect(factsOf(DEMO, BEFORE_A_VOLTAGE)).toEqual({ roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: null, energyMwh: null });
  });

  test("a run whose chosen option is not among its options gives no numbers either", () => {
    expect(factsOf(DEMO, { ...RUN, chosen_option: "custom" } as DesignResult).dcKwp).toBeNull();
  });
});

describe("the kept design", () => {
  test("is the document whole under its id and name, with the facts, edited and opened now", () => {
    const kept = keptOf({ id: "a1", document: DEMO, design: RUN, layout: null, now: NOON });

    expect(kept).toEqual({
      id: "a1",
      name: "Pune demo roof",
      document: DEMO,
      facts: { roofWords: "90.0 × 40.0 m flat roof, tilted rows", dcKwp: 357.28, energyMwh: 617.8405373922709 },
      thumbnail: expect.stringMatching(/^<svg [\s\S]*<\/svg>$/),
      editedAt: NOON,
      openedAt: NOON,
    });
    expect(kept.document).toBe(DEMO);
  });

  test("the name is the document's: a renamed document is kept under its new name", () => {
    expect(keptOf({ id: "a1", document: { ...DEMO, name: "Block B" }, design: null, layout: null, now: NOON }).name).toBe("Block B");
  });

  test("the thumbnail is the plan of the kept layout's positions (decision 6): the roof alone before a layout, the modules once one has come", () => {
    const placed = (idx: number) => ({ idx, outline: [[idx * 3, 2], [idx * 3 + 2.3, 2], [idx * 3 + 2.3, 3.1], [idx * 3, 3.1]] });
    const layout = { inner: [], keepout: [], modules: [placed(0), placed(1)] } as unknown as Layout;

    expect(keptOf({ id: "a1", document: DEMO, design: null, layout: null, now: NOON }).thumbnail).not.toContain("data-module");
    expect(keptOf({ id: "a1", document: DEMO, design: RUN, layout, now: NOON }).thumbnail?.split('data-module="true"')).toHaveLength(3);
  });
});

describe("when it was edited, in words", () => {
  test("within the minute: just now; before that, minutes and hours", () => {
    expect(whenOf(NOON, NOON)).toBe("Edited moments ago");
    expect(whenOf(NOON - 59_000, NOON)).toBe("Edited moments ago");
    expect(whenOf(NOON - MINUTE, NOON)).toBe("Edited 1 minute ago");
    expect(whenOf(NOON - 5 * MINUTE, NOON)).toBe("Edited 5 minutes ago");
    expect(whenOf(NOON - 59 * MINUTE, NOON)).toBe("Edited 59 minutes ago");
    expect(whenOf(NOON - HOUR, NOON)).toBe("Edited 1 hour ago");
    expect(whenOf(NOON - 2 * HOUR, NOON)).toBe("Edited 2 hours ago");
    expect(whenOf(NOON - 23 * HOUR, NOON)).toBe("Edited 23 hours ago");
  });

  test("a day ago is yesterday; up to a week, days; then the date", () => {
    expect(whenOf(NOON - DAY, NOON)).toBe("Edited yesterday");
    expect(whenOf(NOON - 47 * HOUR, NOON)).toBe("Edited yesterday");
    expect(whenOf(NOON - 2 * DAY, NOON)).toBe("Edited 2 days ago");
    expect(whenOf(NOON - 3 * DAY, NOON)).toBe("Edited 3 days ago");
    expect(whenOf(NOON - 6 * DAY, NOON)).toBe("Edited 6 days ago");
    expect(whenOf(NOON - 7 * DAY, NOON)).toBe("Edited 17 Sep 2026");
    expect(whenOf(new Date(2025, 0, 3, 12).getTime(), NOON)).toBe("Edited 3 Jan 2025");
  });

  test("a time ahead of the clock (another device's clock) is just now, never negative", () => {
    expect(whenOf(NOON + HOUR, NOON)).toBe("Edited moments ago");
  });
});
