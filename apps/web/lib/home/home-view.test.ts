import { describe, expect, test } from "bun:test";
import { DEMO, designsHeadOf, HOME, sectionsOf, WAYS_IN } from "./home-view";

// Home as a start screen (V2 · 9, D105; audit V2-03, V2-05, V2-09, V2-14, V2-115): one title, one line of what the app does,
// the search the largest thing, the other ways in, the designs on this device first when there are any, the demo after.

describe("the head and the search", () => {
  test("the board's words", () => {
    expect(HOME).toEqual({
      title: "Rooftop PV design",
      line: "Outline a roof on the map. The app lays out the modules, the shade, the strings and the energy of a year.",
      placeholder: "Address or coordinates",
      find: "Find the roof",
    });
  });

  test("the placeholder is short enough never to be cut beside the button (V2-05)", () => {
    expect(HOME.placeholder.length).toBeLessThanOrEqual(24);
  });

  test("the other ways in, as links under the search", () => {
    expect(WAYS_IN.map((way) => [way.id, way.words])).toEqual([
      ["locate", "Use my location"],
      ["hand", "Enter the roof by hand"],
      ["import", "Import a drawing"],
      ["open", "Open a project file"],
    ]);
  });
});

describe("the order of the page", () => {
  test("without designs on this device: the demo after the search", () => {
    expect(sectionsOf(0)).toEqual(["demo"]);
  });

  test("with designs: the designs first, then the demo", () => {
    expect(sectionsOf(1)).toEqual(["designs", "demo"]);
    expect(sectionsOf(3)).toEqual(["designs", "demo"]);
  });

  test("the designs' head counts them", () => {
    expect(designsHeadOf(1)).toEqual({ title: "Your designs · on this device", count: "1 design" });
    expect(designsHeadOf(3)).toEqual({ title: "Your designs · on this device", count: "3 designs" });
  });
});

describe("the demo", () => {
  test("one line of what it is and Open the demo; no figures (V2-09)", () => {
    expect(DEMO).toEqual({
      title: "Try the demo",
      line: "A finished design on a 90 × 40 m roof in Pune, to look around before you start your own.",
      action: "Open the demo",
    });
  });
});
