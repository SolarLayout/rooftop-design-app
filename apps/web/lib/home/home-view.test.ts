import { describe, expect, test } from "bun:test";
import { DEMO, DESIGN_COLUMNS, designsHeadOf, HOME, WAYS_IN } from "./home-view";

// Home (D120, direction A of "Rooftop Home · Three directions"): the title and the app's line over the demo's picture, the
// search the largest thing, the other ways in; the demo's card on the picture; Your designs a table with the demo first.

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

describe("Your designs", () => {
  test("the head counts the designs of this device; none to count before there is one", () => {
    expect(designsHeadOf(0)).toEqual({ title: "Your designs · on this device", count: null });
    expect(designsHeadOf(1)).toEqual({ title: "Your designs · on this device", count: "1 design" });
    expect(designsHeadOf(3)).toEqual({ title: "Your designs · on this device", count: "3 designs" });
  });

  test("the table's columns, as direction B draws them", () => {
    expect(DESIGN_COLUMNS).toEqual(["Design", "Place", "kWp", "MWh per year", "Edited"]);
  });
});

describe("the demo", () => {
  test("its row, first in the table: its name, marked Demo, its place and its figures, Open the demo", () => {
    expect(DEMO).toEqual({
      name: "Pune demo roof",
      badge: "Demo",
      place: "Pune · 90 × 40 m",
      kwp: "348.00",
      mwh: "586.4",
      action: "Open the demo",
      open: "Open",
    });
  });
});
