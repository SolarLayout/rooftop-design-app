import { describe, expect, test } from "bun:test";
import {
  FIRST_ITEM,
  FIRST_LENS,
  HANDOVER,
  HANDOVER_ITEMS,
  isHandoverItem,
  isLens,
  LENSES,
  pathOfItem,
  pathOfFind,
  pathOfLens,
  placeOfFindAddress,
  pathOfWorkspace,
  workspaceOf,
  WORKSPACES,
} from "./routes";

describe("the lenses of the Studio", () => {
  test("four, in the order of the work", () => {
    expect(LENSES.map((lens) => lens.id)).toEqual(["roof", "array", "sun", "strings"]);
    expect(LENSES.map((lens) => lens.name)).toEqual(["Roof", "Array", "Sun", "Strings"]);
  });

  test.each(["roof", "array", "sun", "strings"])("%s is a lens", (id) => {
    expect(isLens(id)).toBe(true);
  });

  test.each(["", "Roof", "energy", "roof/", "constructor"])("'%s' is none", (id) => {
    expect(isLens(id)).toBe(false);
  });

  test("the Studio opens on the first", () => {
    expect(FIRST_LENS).toBe("roof");
  });

  test("each has its address", () => {
    expect(LENSES.map((lens) => pathOfLens(lens.id))).toEqual(["/studio/roof", "/studio/array", "/studio/sun", "/studio/strings"]);
  });
});

describe("the items of Handover", () => {
  test("eight, in the order of the list", () => {
    expect(HANDOVER_ITEMS.map((item) => [item.id, item.name])).toEqual([
      ["report", "Design report"],
      ["single-line-diagram", "Single-line diagram"],
      ["bill-of-materials", "Bill of materials"],
      ["cable-schedule", "DC cable schedule"],
      ["cad-layout", "CAD layout"],
      ["earth-model", "Google Earth model"],
      ["hourly-data", "Hourly data"],
      ["project-file", "Project file"],
    ]);
  });

  test.each(["report", "cable-schedule", "project-file"])("%s is an item", (id) => {
    expect(isHandoverItem(id)).toBe(true);
  });

  test.each(["", "Report", "pdf", "toString"])("'%s' is none", (id) => {
    expect(isHandoverItem(id)).toBe(false);
  });

  test("Handover opens on the first", () => {
    expect(FIRST_ITEM).toBe("report");
  });

  test("each has its address", () => {
    expect(pathOfItem("report")).toBe("/handover/report");
    expect(pathOfItem("single-line-diagram")).toBe("/handover/single-line-diagram");
  });
});

describe("the workspaces", () => {
  test("three, in the order of the work", () => {
    expect(WORKSPACES.map((workspace) => [workspace.id, workspace.name])).toEqual([
      ["studio", "Studio"],
      ["performance", "Performance"],
      ["handover", "Handover"],
    ]);
  });

  test("the Studio is entered at a lens, Handover at its list (plan/phase-09-plan.md, decision 3)", () => {
    expect(pathOfWorkspace("studio", "sun")).toBe("/studio/sun");
    expect(pathOfWorkspace("performance", "sun")).toBe("/performance");
    expect(pathOfWorkspace("handover", "sun")).toBe("/handover");
    expect(pathOfWorkspace("handover", "sun")).toBe(HANDOVER);
  });

  test.each([
    ["/studio/array", "studio"],
    ["/studio", "studio"],
    ["/performance", "performance"],
    ["/handover/report", "handover"],
    ["/handover", "handover"],
    ["/handover/", "handover"],
  ] as const)("%s is in %s", (path, workspace) => {
    expect(workspaceOf(path)).toBe(workspace);
  });

  test.each(["/", "/kit", "/kit/shell", "/studios", "/find", ""])("'%s' is in none", (path) => {
    expect(workspaceOf(path)).toBeNull();
  });
});

describe("the address of Find", () => {
  test("without a place it is /find", () => {
    expect(pathOfFind()).toBe("/find");
    expect(pathOfFind(null)).toBe("/find");
  });

  test("a place typed as coordinates goes in the address as `at`, and nothing else: its label is made of the coordinates again", () => {
    expect(pathOfFind({ lat: 18.52, lon: 73.86, label: "18.52000° N, 73.86000° E", byWords: false })).toBe("/find?at=18.52%2C73.86");
  });

  test("a place found by words carries its label too, so that the design is named after it (D49)", () => {
    expect(pathOfFind({ lat: 18.5912, lon: 73.7389, label: "Hinjewadi Phase 2, Pune, Maharashtra", byWords: true })).toBe(
      "/find?at=18.5912%2C73.7389&place=Hinjewadi+Phase+2%2C+Pune%2C+Maharashtra",
    );
  });

  test("the place is read back from the address: by words with its label, by coordinates with the label of the coordinates in full", () => {
    expect(placeOfFindAddress(new URLSearchParams("at=18.5912,73.7389&place=Hinjewadi+Phase+2%2C+Pune%2C+Maharashtra"))).toEqual({
      lat: 18.5912,
      lon: 73.7389,
      label: "Hinjewadi Phase 2, Pune, Maharashtra",
      byWords: true,
    });
    expect(placeOfFindAddress(new URLSearchParams("at=18.52,73.86"))).toEqual({ lat: 18.52, lon: 73.86, label: "18.52000° N, 73.86000° E", byWords: false });
  });

  test.each(["", "edit=roof", "at=", "at=18.52", "at=lat,lon", "at=91,73.86", "at=18.52,181", "at=18.52,73.86,5"])("'%s' carries no place", (address) => {
    expect(placeOfFindAddress(new URLSearchParams(address))).toBeNull();
  });
});
