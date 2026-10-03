import { describe, expect, test } from "bun:test";
import type { Column } from "./table-cells";
import { ariaSortOf, nextSort, sortedRows, type Sort } from "./table-sort";

type Row = { string: string; inverter: string; mppt: number; length: number };

const ROWS: Row[] = [
  { string: "S1", inverter: "INV-2", mppt: 1, length: 131.9 },
  { string: "S2", inverter: "INV-1", mppt: 2, length: 97.3 },
  { string: "S10", inverter: "INV-1", mppt: 1, length: 131.9 },
  { string: "S3", inverter: "INV-2", mppt: 2, length: 20.7 },
];

const COLUMNS: Array<Column<Row>> = [
  { key: "string", head: "String", kind: "name", value: (row) => row.string, sortBy: (row) => Number(row.string.slice(1)) },
  { key: "inverter", head: "Inverter", kind: "text", value: (row) => row.inverter, sortBy: (row) => row.inverter },
  { key: "mppt", head: "MPPT", kind: "number", value: (row) => String(row.mppt), sortBy: (row) => row.mppt },
  { key: "length", head: "DC cable (m)", kind: "number", value: (row) => row.length.toFixed(1), sortBy: (row) => row.length },
  { key: "cable", head: "Cable", kind: "text", value: () => "4 mm²" },
];

const strings = (rows: Row[]) => rows.map((row) => row.string);

describe("sortedRows: the rows in the order of a sort (docs/design/components.md, \"Table\"; plan/phase-09-plan.md, decision 7)", () => {
  test("without a sort, the rows as given", () => {
    expect(sortedRows(ROWS, COLUMNS, null)).toEqual(ROWS);
  });

  test("by a number, up and down", () => {
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "length", direction: "ascending" }))).toEqual(["S3", "S2", "S1", "S10"]);
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "length", direction: "descending" }))).toEqual(["S1", "S10", "S2", "S3"]);
  });

  test("by a string, up and down", () => {
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "inverter", direction: "ascending" }))).toEqual(["S2", "S10", "S1", "S3"]);
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "inverter", direction: "descending" }))).toEqual(["S1", "S3", "S2", "S10"]);
  });

  test("by the number a column sorts by, not by its words: S10 after S3", () => {
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "string", direction: "ascending" }))).toEqual(["S1", "S2", "S3", "S10"]);
  });

  test("stable: rows that are equal keep the order given, up and down", () => {
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "mppt", direction: "ascending" }))).toEqual(["S1", "S10", "S2", "S3"]);
    expect(strings(sortedRows(ROWS, COLUMNS, { key: "mppt", direction: "descending" }))).toEqual(["S2", "S3", "S1", "S10"]);
  });

  test("a column that does not sort, or none of that key: the rows as given", () => {
    expect(sortedRows(ROWS, COLUMNS, { key: "cable", direction: "ascending" })).toEqual(ROWS);
    expect(sortedRows(ROWS, COLUMNS, { key: "nothing", direction: "ascending" })).toEqual(ROWS);
  });

  test("the rows given are not changed", () => {
    const given = [...ROWS];
    sortedRows(given, COLUMNS, { key: "length", direction: "ascending" });
    expect(given).toEqual(ROWS);
  });
});

describe("nextSort: a press on a head", () => {
  test("a first press sorts upwards, a second downwards, a third gives the order given back", () => {
    const up = nextSort(null, "length");
    expect(up).toEqual({ key: "length", direction: "ascending" });
    const down = nextSort(up, "length");
    expect(down).toEqual({ key: "length", direction: "descending" });
    expect(nextSort(down, "length")).toBeNull();
  });

  test("a press on another head sorts upwards by it", () => {
    const sort: Sort = { key: "length", direction: "descending" };
    expect(nextSort(sort, "mppt")).toEqual({ key: "mppt", direction: "ascending" });
  });
});

describe("ariaSortOf: what a head says", () => {
  test("the active head says its direction, the others none", () => {
    const sort: Sort = { key: "length", direction: "descending" };
    expect(ariaSortOf(sort, "length")).toBe("descending");
    expect(ariaSortOf(sort, "mppt")).toBe("none");
    expect(ariaSortOf(null, "length")).toBe("none");
  });
});
