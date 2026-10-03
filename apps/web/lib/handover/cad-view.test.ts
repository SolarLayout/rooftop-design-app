import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { cadViewOf, PLAN_PAGE_TITLE, planOf } from "./cad-view";
import { reportViewOf } from "./report-view";
import { A, D, DEMO, DOCUMENT } from "./test-fixtures";

// The CAD layout's preview (plan/phase-09-plan.md, step 19, decision 8; the board "Handover, previews"): the DXF's layers
// from the run, the seven fixed ones with what is on each, then one layer per string; the line under them; the engine's plan,
// page 2 of the report, in the paper frame.

const AT_REST = { document: DOCUMENT, design: DEMO, option: A } as const;
const named = (rows: { name: string; words: string }[]) => rows.map((row) => [row.name, row.words]);

describe("the layers of the demo's option A", () => {
  test("the seven fixed layers with the board's words, every number the engine's, then the strings as one row", () => {
    const view = cadViewOf(AT_REST);

    expect(named(view.layers)).toEqual([
      ["ROOF", "the outline"],
      ["SETBACK", "the inner line"],
      ["OBSTACLES", "6 footprints"],
      ["KEEPOUT", "the kept-clear areas"],
      ["MODULES_UNUSED", "152 positions"],
      ["INVERTERS", "1"],
      ["TEXT", "the names and heights, INV-1"],
      ["STRING_S01 to STRING_S22", "29 modules each"],
    ]);
  });

  test("the line under the layers: the format, the unit, the axes", () => {
    expect(cadViewOf(AT_REST).about).toBe("R2010 · metres · x east, y north");
  });

  test("the unused positions are the layout's positions less the option's modules; two inverters are counted and named", () => {
    const two = { ...D, system: { ...A.system, n_inverters: 2, n_strings: 27, n_series: 26, n_modules: 702, inverters: [{ label: "INV-1", position: [10, 10] }, { label: "INV-2", position: [50, 10] }] } } as DesignOption;
    const view = cadViewOf({ ...AT_REST, option: two });

    expect(named(view.layers).slice(4)).toEqual([
      ["MODULES_UNUSED", "88 positions"],
      ["INVERTERS", "2"],
      ["TEXT", "the names and heights, INV-1, INV-2"],
      ["STRING_S01 to STRING_S27", "26 modules each"],
    ]);
  });

  test("one string is one layer, and one module on it is said in the singular", () => {
    const one = { ...A, system: { ...A.system, n_strings: 1, n_series: 1 } } as DesignOption;

    expect(named(cadViewOf({ ...AT_REST, option: one }).layers).at(-1)).toEqual(["STRING_S01", "1 module"]);
  });

  test("a roof without obstacles still has the layer, empty", () => {
    const bare = { ...DOCUMENT, roof: { ...DOCUMENT.roof, obstacles: [] } };

    expect(named(cadViewOf({ ...AT_REST, document: bare }).layers)[2]).toEqual(["OBSTACLES", "0 footprints"]);
  });

  test("a large count has a comma between thousands", () => {
    const large = { ...DEMO, readouts: { ...DEMO.readouts, positions: 2638 } };

    expect(named(cadViewOf({ ...AT_REST, design: large }).layers)[4]).toEqual(["MODULES_UNUSED", "2,000 positions"]);
  });
});

describe("the engine's plan: the page of the report titled Layout (decision 8)", () => {
  const PAGES = {
    day: "2026-10-03",
    dpi: 150,
    pages: ["Summary", "Layout", "Shadows"].map((title, index) => ({ number: index + 1, title, width: 1753, height: 1240, png: `PNG${index + 1}` })),
  };
  const kept = { edit: 3, answer: PAGES };
  const IDLE = { status: "idle" } as const;

  test("the page by its title, with its image, its size and its name", () => {
    const plan = planOf(reportViewOf({ kept, edit: 3, status: IDLE, shown: null }));

    expect(PLAN_PAGE_TITLE).toBe("Layout");
    expect(plan).toMatchObject({ number: 2, title: "Layout", src: "data:image/png;base64,PNG2", width: 1753, height: 1240, name: "Page 2, Layout" });
  });

  test("null while the pages are not there, or when no page bears the title", () => {
    expect(planOf(reportViewOf({ kept: null, edit: 3, status: IDLE, shown: null }))).toBeNull();
    const without = { edit: 3, answer: { ...PAGES, pages: PAGES.pages.filter((page) => page.title !== "Layout") } };
    expect(planOf(reportViewOf({ kept: without, edit: 3, status: IDLE, shown: null }))).toBeNull();
  });
});
