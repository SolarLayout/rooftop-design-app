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
  pathOfLens,
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
