import { describe, expect, test } from "bun:test";
import { cardOf, cellLinesOf, columnsOfTable, type Column } from "./table-cells";

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

  test("a column of words is marked so on the card: its label is for the screen reader alone, the title says the row", () => {
    const columns: Array<Column<Option>> = [
      { key: "option", head: "Option", kind: "name", value: (row) => row.letter },
      { key: "about", head: "Value", kind: "text", words: true, value: (row) => `${row.strings} strings` },
    ];

    expect(cardOf(D, columns).values).toEqual([{ key: "about", label: "Value", value: "27 strings", words: true }]);
  });

  test("a column that is for the table only is not on the card", () => {
    const columns: Array<Column<Option>> = [...COLUMNS, { key: "note", head: "Note", kind: "text", value: () => "wide", shown: "table" }];

    expect(cardOf(A, columns).values.map((one) => one.key)).toEqual(["strings", "modules", "kwp", "dcac"]);
  });
});

describe("cellLinesOf: what a cell of the table shows (the board \"Inverter and sizing\")", () => {
  type Load = { mppt: string; inverter: string; imp: string; isc: string };
  const LOAD: Load = { mppt: "MPPT 1", inverter: "INV-1", imp: "54.3 of 65.0 A", isc: "57.2 A" };

  test("the value alone, by default", () => {
    expect(cellLinesOf(LOAD, { key: "mppt", head: "MPPT", kind: "name", value: (row) => row.mppt })).toEqual([{ value: "MPPT 1" }]);
  });

  test("a second line under the value: the inverter under its MPPT", () => {
    expect(cellLinesOf(LOAD, { key: "mppt", head: "MPPT", kind: "name", value: (row) => row.mppt, below: (row) => row.inverter })).toEqual([{ value: "MPPT 1" }, { value: "INV-1", isBelow: true }]);
  });

  test("lines of their own, each with its label, and words after a value", () => {
    const current: Column<Load> = {
      key: "current",
      head: "Current",
      kind: "text",
      value: (row) => row.imp,
      lines: (row) => [
        { label: "Imp", value: row.imp },
        { label: "Isc", value: row.isc, words: "of not known" },
      ],
      shown: "table",
    };
    expect(cellLinesOf(LOAD, current)).toEqual([
      { label: "Imp", value: "54.3 of 65.0 A" },
      { label: "Isc", value: "57.2 A", words: "of not known" },
    ]);
  });
});

describe("cardOf: a value that is empty", () => {
  test("is left off the card: the total row of a schedule shows its sum alone", () => {
    type Row = { name: string; a: string; b: string };
    const columns: Array<Column<Row>> = [
      { key: "name", head: "Name", kind: "name", value: (row) => row.name },
      { key: "a", head: "A", kind: "number", value: (row) => row.a },
      { key: "b", head: "B", kind: "number", value: (row) => row.b },
    ];
    expect(cardOf({ name: "22 strings", a: "", b: "1,681.0" }, columns).values).toEqual([{ key: "b", label: "B", value: "1,681.0" }]);
  });
});
