import { describe, expect, test } from "bun:test";
import type { DesignResult } from "../../api";
import { deliverablesOf, groupsOf, sizeOf, type Deliverable } from "./items";
import { BEFORE_A_VOLTAGE, D, DEMO } from "../../handover/test-fixtures";

const AT_REST = { name: "Pune demo roof", design: DEMO, pages: null, sizes: {} } as const;
const linesOf = (rows: Deliverable[]) => rows.map((row) => [row.id, row.facts]);

// The sizes of the demo's files, in bytes, as the zip of the API holds them.
const SIZES = { pdf: 100_352, sld: 64_512, bom: 1_210, cables: 2_600, dxf: 260_096, rtd: 696_320, csv: 493_568, kmz: 19_456 } as const;

describe("the files, by who they are for (V2 · 9, D105; audit V2-90)", () => {
  test("four groups in the board's order and words", () => {
    expect(groupsOf(deliverablesOf(AT_REST)).map((group) => [group.title, group.rows.map((row) => row.id)])).toEqual([
      ["For the client", ["report"]],
      ["For the utility", ["single-line-diagram"]],
      ["For the installer", ["bill-of-materials", "cable-schedule", "cad-layout"]],
      ["For you", ["project-file", "hourly-data", "earth-model"]],
    ]);
  });

  test("each a file with its format alone as its badge, and its Download", () => {
    expect(deliverablesOf(AT_REST).map((row) => [row.id, row.name, row.badge, row.kind, row.action])).toEqual([
      ["report", "Design report", "PDF", "pdf", "Download PDF"],
      ["single-line-diagram", "Single-line diagram", "PNG", "sld", "Download PNG"],
      ["bill-of-materials", "Bill of materials", "CSV", "bom", "Download CSV"],
      ["cable-schedule", "Cable schedule", "CSV", "cables", "Download CSV"],
      ["cad-layout", "CAD layout", "DXF", "dxf", "Download DXF"],
      ["project-file", "Project file", "RTD", "rtd", "Download RTD"],
      ["hourly-data", "Hourly data", "CSV", "csv", "Download CSV"],
      ["earth-model", "Google Earth model", "KMZ", "kmz", "Download KMZ"],
    ]);
  });

  test("each row says what it is, in plain words, the numbers the run's", () => {
    expect(linesOf(deliverablesOf(AT_REST))).toEqual([
      ["report", "A4 landscape"],
      ["single-line-diagram", "1 inverter, 6 MPPT, 22 strings"],
      ["bill-of-materials", "638 modules, 1 inverter, 7 lines"],
      ["cable-schedule", "22 strings, 1,681 m of DC cable"],
      ["cad-layout", "The roof and every string, in metres"],
      ["project-file", "The whole design, to open again in the app"],
      ["hourly-data", "8,760 hours of sunlight, temperature and power"],
      ["earth-model", "The roof and the modules on the map"],
    ]);
  });

  test("the report says its pages once they are known", () => {
    expect(deliverablesOf({ ...AT_REST, pages: 6 })[0]!.facts).toBe("6 pages, A4 landscape");
  });

  test("each file says its size once the zip has told it", () => {
    const rows = deliverablesOf({ ...AT_REST, pages: 6, sizes: SIZES });
    expect(rows.map((row) => row.facts)).toEqual([
      "6 pages, A4 landscape · 98 KB",
      "1 inverter, 6 MPPT, 22 strings · 63 KB",
      "638 modules, 1 inverter, 7 lines · 1 KB",
      "22 strings, 1,681 m of DC cable · 3 KB",
      "The roof and every string, in metres · 254 KB",
      "The whole design, to open again in the app · 680 KB",
      "8,760 hours of sunlight, temperature and power · 482 KB",
      "The roof and the modules on the map · 19 KB",
    ]);
  });

  test("the preview's line says who it is for, then the row's", () => {
    const rows = deliverablesOf({ ...AT_REST, pages: 6, sizes: SIZES });
    expect(rows[0]!.about).toBe("For the client · 6 pages, A4 landscape · 98 KB");
    expect(rows[6]!.about).toBe("For you · 8,760 hours of sunlight, temperature and power · 482 KB");
  });

  test("two inverters, and the option's own numbers", () => {
    const rows = deliverablesOf({ ...AT_REST, design: { ...DEMO, chosen_option: D.key } as DesignResult });

    expect(rows[1]!.facts).toBe("2 inverters, 6 MPPT, 27 strings");
    expect(rows[2]!.facts).toMatch(/^702 modules, 2 inverters, \d+ lines$/);
  });

  test("every row is live once there is a chosen option", () => {
    expect(deliverablesOf(AT_REST).every((row) => !row.waits)).toBe(true);
  });
});

describe("a size", () => {
  test("in KB under a thousand, at least 1; in MB above, one decimal", () => {
    expect([sizeOf(100), sizeOf(100_352), sizeOf(1_048_576), sizeOf(3_355_443)]).toEqual(["1 KB", "98 KB", "1.0 MB", "3.2 MB"]);
  });
});

describe("before options (decision 11)", () => {
  test("every row but the project file waits, with the API's title as its line", () => {
    const rows = deliverablesOf({ ...AT_REST, design: BEFORE_A_VOLTAGE });

    for (const row of rows.filter((one) => one.id !== "project-file")) {
      expect(row.waits).toBe(true);
      expect(row.facts).toBe("Choose a system voltage to size the strings");
    }
    expect(rows.find((row) => row.id === "project-file")).toMatchObject({ waits: false, facts: "The whole design, to open again in the app" });
  });

  test("the preview's line says what is known of the item without an option, else the API's title", () => {
    const rows = deliverablesOf({ ...AT_REST, design: BEFORE_A_VOLTAGE });

    expect(rows.map((row) => row.about)).toEqual([
      "For the client · A4 landscape",
      "Choose a system voltage to size the strings",
      "Choose a system voltage to size the strings",
      "Choose a system voltage to size the strings",
      "For the installer · The roof and every string, in metres",
      "For you · The whole design, to open again in the app",
      "Choose a system voltage to size the strings",
      "Choose a system voltage to size the strings",
    ]);
  });
});

describe("the first load", () => {
  test("no value was ever there: the names stand, the lines are null, every row waits", () => {
    const rows = deliverablesOf({ name: null, design: null, pages: null, sizes: {} });

    expect(rows.map((row) => row.name)).toHaveLength(8);
    expect(rows.every((row) => row.facts === null && row.waits)).toBe(true);
  });

  test("the design that is open is named before it is run: the project file is live", () => {
    const rows = deliverablesOf({ name: "Pune demo roof", design: null, pages: null, sizes: {} });

    expect(rows.find((row) => row.id === "project-file")).toMatchObject({ waits: false, facts: "The whole design, to open again in the app" });
    expect(rows[0]!.facts).toBeNull();
  });
});
