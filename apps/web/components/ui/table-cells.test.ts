import { describe, expect, test } from "bun:test";
import { cardOf, columnsOfTable, type Column } from "./table-cells";

type Option = { letter: string; series: number; strings: number; modules: number; kwp: string; dcac: string; fits: boolean };

const A: Option = { letter: "A", series: 29, strings: 22, modules: 638, kwp: "357.28", dcac: "1.30", fits: true };
const D: Option = { letter: "D", series: 26, strings: 27, modules: 702, kwp: "393.12", dcac: "0.71", fits: false };

const COLUMNS: Array<Column<Option>> = [
  { key: "option", head: "Option", kind: "name", value: (row) => row.letter, onCard: (row) => `Option ${row.letter}` },
  { key: "strings", head: "Strings", kind: "text", value: (row) => `${row.series} × ${row.strings}` },
  { key: "modules", head: "Modules", kind: "number", value: (row) => String(row.modules), shown: "card" },
  { key: "kwp", head: "kWp", kind: "number", value: (row) => row.kwp },
  {
    key: "dcac",
    head: "DC/AC",
    kind: "number",
    value: (row) => row.dcac,
    mark: (row) => (row.fits ? { kind: "fits", label: "In target" } : { kind: "note", label: "Below the DC/AC target" }),
  },
];

describe("columnsOfTable", () => {
  test("a column that is for the cards only is not in the table", () => {
    expect(columnsOfTable(COLUMNS).map((column) => column.key)).toEqual(["option", "strings", "kwp", "dcac"]);
  });
});

describe("cardOf: a row as a card on phone", () => {
  test("the name of the row is the title of the card, in the words for the card", () => {
    expect(cardOf(D, COLUMNS).title).toBe("Option D");
  });

  test("without words for the card the title is the value of the name", () => {
    const columns: Array<Column<Option>> = [{ key: "option", head: "Option", kind: "name", value: (row) => row.letter }];

    expect(cardOf(A, columns).title).toBe("A");
  });

  test("every other value is in the list, with the head of its column as its label", () => {
    expect(cardOf(D, COLUMNS).values).toEqual([
      { key: "strings", label: "Strings", value: "26 × 27" },
      { key: "modules", label: "Modules", value: "702" },
      { key: "kwp", label: "kWp", value: "393.12" },
      { key: "dcac", label: "DC/AC", value: "0.71" },
    ]);
  });

  test("the mark of the row stands beside the title", () => {
    expect(cardOf(D, COLUMNS).mark).toEqual({ kind: "note", label: "Below the DC/AC target" });
    expect(cardOf(A, COLUMNS).mark).toEqual({ kind: "fits", label: "In target" });
  });

  test("a row without a mark has none", () => {
    const columns = COLUMNS.map((column) => ({ ...column, mark: undefined }));

    expect(cardOf(A, columns).mark).toBeNull();
  });

  test("a column that is for the table only is not on the card", () => {
    const columns: Array<Column<Option>> = [...COLUMNS, { key: "note", head: "Note", kind: "text", value: () => "wide", shown: "table" }];

    expect(cardOf(A, columns).values.map((one) => one.key)).toEqual(["strings", "modules", "kwp", "dcac"]);
  });
});
