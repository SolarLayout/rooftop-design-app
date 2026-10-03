import { describe, expect, test } from "bun:test";
import type { Project } from "../api";
import { APPEAR_HERE, demoCardOf, NOTHING_LEAVES, onThisDeviceWordsOf } from "./home-view";

// Home (plan/phase-10-plan.md, step 11, decision 5; the boards "Home" on three sizes): the demo's card reads its name and
// its roof from /demo, and shows the capacity and the energy only once the demo has run on this device, from that run;
// "On this device" says where the designs appear while there are none.

const RECTANGLE: Project["roof"]["outline"] = [
  [-45, -20],
  [45, -20],
  [45, 20],
  [-45, 20],
];
const DEMO = {
  name: "Pune demo roof",
  system_voltage: 1500,
  roof: { lat: 18.52, lon: 73.86, outline: RECTANGLE, roof_type: "flat_tilted", source: "coordinates", obstacles: [] },
} as unknown as Project;

describe("the demo's card", () => {
  test("before the demo has run here: the name and the roof's words of the document, no numbers", () => {
    expect(demoCardOf(DEMO, null)).toEqual({ name: "Pune demo roof", roofWords: "90.0 × 40.0 m flat roof, tilted rows", facts: null });
  });

  test("once the demo has run here: the capacity and the energy of that run, as the vitals say them", () => {
    expect(demoCardOf(DEMO, { dcKwp: 357.28, energyMwh: 617.8405373922709 })).toEqual({
      name: "Pune demo roof",
      roofWords: "90.0 × 40.0 m flat roof, tilted rows",
      facts: { capacity: { number: "357.28", unit: "kWp" }, energy: { number: "617.8", unit: "MWh" } },
    });
  });
});

describe("the words of On this device", () => {
  test("none kept: where the designs appear, and that nothing leaves the browser", () => {
    expect(onThisDeviceWordsOf(0)).toBe(`${APPEAR_HERE} ${NOTHING_LEAVES}`);
    expect(onThisDeviceWordsOf(0)).toBe("Designs you save appear here. Nothing leaves this browser until you export.");
  });

  test("some kept: that nothing leaves the browser alone; the cards say the rest", () => {
    expect(onThisDeviceWordsOf(1)).toBe(NOTHING_LEAVES);
    expect(onThisDeviceWordsOf(3)).toBe("Nothing leaves this browser until you export.");
  });
});
