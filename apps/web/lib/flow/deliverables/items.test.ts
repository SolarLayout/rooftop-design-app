import { describe, expect, test } from "bun:test";
import type { DesignResult } from "../../api";
import { deliverablesOf, type Deliverable } from "./items";
import { A, BEFORE_A_VOLTAGE, D, DEMO } from "../../handover/test-fixtures";

const AT_REST = { name: "Pune demo roof", design: DEMO, pages: null } as const;
const factsOf = (rows: Deliverable[]) => rows.map((row) => [row.id, row.facts]);

describe("the eight items and their facts from the run's chosen option, the weather and the document (plan/phase-09-plan.md, decision 14)", () => {
  test("the board's words, in its order, every number the engine's", () => {
    const rows = deliverablesOf(AT_REST);

    expect(rows.map((row) => [row.id, row.name, row.badge])).toEqual([
      ["report", "Design report", "PDF"],
      ["single-line-diagram", "Single-line diagram", "PNG"],
      ["bill-of-materials", "Bill of materials", "BOM"],
      ["cable-schedule", "DC cable schedule", "DC"],
      ["cad-layout", "CAD layout", "DXF"],
      ["earth-model", "Google Earth model", "KMZ"],
      ["hourly-data", "Hourly data", "CSV"],
      ["project-file", "Project file", "RTD"],
    ]);
    expect(factsOf(rows)).toEqual([
      ["report", "A4 landscape"],
      ["single-line-diagram", "22 strings of 29 × 560 Wp · 1 inverter, 6 MPPT"],
      ["bill-of-materials", "638 modules · 27 tables · 1,681 m DC cable"],
      ["cable-schedule", "22 strings · Voc cold 1,480 V"],
      ["cad-layout", "Metres · one layer per string"],
      ["earth-model", "Roof, obstacles with heights, 638 modules"],
      ["hourly-data", "8,760 rows · irradiance, temperature, power"],
      ["project-file", "Pune-demo-roof.rtd · opens again here"],
    ]);
  });

  test("the report says its pages once they are known", () => {
    expect(deliverablesOf({ ...AT_REST, pages: 6 })[0]!.facts).toBe("A4 landscape · 6 pages");
  });

  test("each item knows the file the API writes for it, or that it opens a view; what the row shows at its right follows", () => {
    const rows = deliverablesOf(AT_REST);

    expect(rows.map((row) => [row.id, row.kind, row.opens])).toEqual([
      ["report", "pdf", "file"],
      ["single-line-diagram", "sld", "file"],
      ["bill-of-materials", null, "view"],
      ["cable-schedule", null, "view"],
      ["cad-layout", "dxf", "file"],
      ["earth-model", "kmz", "file"],
      ["hourly-data", "csv", "file"],
      ["project-file", "rtd", "file"],
    ]);
    expect(rows.map((row) => row.action)).toEqual(["Download PDF", "Download PNG", null, null, "Download DXF", "Download KMZ", "Download CSV", "Save a copy"]);
  });

  test("two inverters, and the option's own numbers", () => {
    const rows = deliverablesOf({ ...AT_REST, design: { ...DEMO, chosen_option: D.key } as DesignResult });

    expect(rows[1]!.facts).toBe("27 strings of 26 × 560 Wp · 2 inverters, 6 MPPT");
    expect(rows[5]!.facts).toBe("Roof, obstacles with heights, 702 modules");
  });

  test("the Voc cold is the highest of the schedule", () => {
    const schedule = [...A.cable_schedule];
    schedule[3] = { ...schedule[3]!, voc_cold_v: 1491.4 };
    const design = { ...DEMO, options: [{ ...A, cable_schedule: schedule }, D] } as DesignResult;

    expect(deliverablesOf({ ...AT_REST, design })[3]!.facts).toBe("22 strings · Voc cold 1,491 V");
  });

  test("the file is named after the design, as the API writes it", () => {
    expect(deliverablesOf({ ...AT_REST, name: "  Warehouse 7 / Block B  " })[7]!.facts).toBe("Warehouse-7-Block-B.rtd · opens again here");
  });

  test("every row is live once there is a chosen option", () => {
    expect(deliverablesOf(AT_REST).every((row) => !row.waits)).toBe(true);
  });
});

describe("before options (decision 11)", () => {
  test("every row but the project file waits, with the API's title as its facts", () => {
    const rows = deliverablesOf({ ...AT_REST, design: BEFORE_A_VOLTAGE });

    for (const row of rows.slice(0, 7)) {
      expect(row.waits).toBe(true);
      expect(row.facts).toBe("Choose a system voltage to size the strings");
    }
    expect(rows[7]).toMatchObject({ waits: false, facts: "Pune-demo-roof.rtd · opens again here" });
  });

  test("the preview's line says what is known of the item without an option, else the API's title", () => {
    const rows = deliverablesOf({ ...AT_REST, design: BEFORE_A_VOLTAGE });

    expect(rows.map((row) => row.about)).toEqual([
      "A4 landscape",
      "Choose a system voltage to size the strings",
      "Choose a system voltage to size the strings",
      "Choose a system voltage to size the strings",
      "Metres · one layer per string",
      "Choose a system voltage to size the strings",
      "Choose a system voltage to size the strings",
      "Pune-demo-roof.rtd · opens again here",
    ]);
  });

  test("with an option the preview's line is the row's", () => {
    expect(deliverablesOf(AT_REST).every((row) => row.about === row.facts)).toBe(true);
  });
});

describe("the first load", () => {
  test("no value was ever there: the names stand, the facts are null, every row waits", () => {
    const rows = deliverablesOf({ name: null, design: null, pages: null });

    expect(rows.map((row) => row.name)).toHaveLength(8);
    expect(rows.every((row) => row.facts === null && row.waits)).toBe(true);
  });

  test("the design that is open is named before it is run: the project file is live and named", () => {
    const rows = deliverablesOf({ name: "Pune demo roof", design: null, pages: null });

    expect(rows[7]).toMatchObject({ waits: false, facts: "Pune-demo-roof.rtd · opens again here" });
    expect(rows[0]!.facts).toBeNull();
  });
});
