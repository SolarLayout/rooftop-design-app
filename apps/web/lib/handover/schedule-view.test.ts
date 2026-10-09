import { describe, expect, test } from "bun:test";
import { cardOf, cellLinesOf } from "../../components/ui/table-cells";
import { tableAsText } from "./copy-table";
import { scheduleViewOf, type ScheduleLine } from "./schedule-view";
import { A } from "./test-fixtures";

const cells = (view: ReturnType<typeof scheduleViewOf>, row: ScheduleLine) => view.columns.map((column) => cellLinesOf(row, column)[0]!.value);

describe("the DC cable schedule as a table (plan/phase-09-plan.md, step 16, decision 7; the board \"Handover, previews\")", () => {
  const view = scheduleViewOf(A, null);

  test("the nine columns in the engine's order, the first eight sortable, the cable words", () => {
    expect(view.columns.map((column) => column.head)).toEqual(["String", "Inverter", "MPPT", "Modules", "Voc cold (V)", "Isc (A)", "DC cable (m)", "Drop (%)", "Cable"]);
    expect(view.columns.map((column) => column.kind)).toEqual(["name", "text", "number", "number", "number", "number", "number", "number", "text"]);
    expect(view.columns.map((column) => column.sortBy !== undefined)).toEqual([true, true, true, true, true, true, true, true, false]);
    expect(view.columns[8]!.words).toBe(true);
  });

  test("every string in the engine's order, Voc cold without decimals, Isc and the drop with two, the length with one; then the total row", () => {
    expect(view.rows).toHaveLength(23);
    expect(view.rows.slice(0, 22).map((row) => row.key)).toEqual(A.cable_schedule.map((row) => row.string));
    expect(cells(view, view.rows[0]!)).toEqual(["S1", "INV-1", "1", "29", "1,480", "14.30", "131.9", "0.91", "4 mm² Cu, 1500 V DC"]);
    expect(cells(view, view.rows[21]!)).toEqual(["S22", "INV-1", "6", "29", "1,480", "14.30", "55.3", "0.38", "4 mm² Cu, 1500 V DC"]);
  });

  test("the total row: the count of strings as its name, the lengths' sum with one decimal under DC cable, nothing else", () => {
    const total = view.rows[22]!;
    expect(view.total).toBe(total.key);
    expect(cells(view, total)).toEqual(["22 strings", "", "", "", "", "", "1,681.0", "", ""]);
  });

  test("the caption in the engine's order; the toast's words", () => {
    expect(view.caption).toBe("The DC cable schedule of option A, in the engine's order, by string");
    expect(view.copied).toBe("DC cable schedule copied as a table");
  });

  test("the text for the clipboard is what is shown in the order shown, the total row last", () => {
    expect(view.text).toBe(tableAsText(view.columns, view.rows));
    const lines = view.text.split("\n");
    expect(lines[0]).toBe("String\tInverter\tMPPT\tModules\tVoc cold (V)\tIsc (A)\tDC cable (m)\tDrop (%)\tCable");
    expect(lines[1]).toBe("S1\tINV-1\t1\t29\t1,480\t14.30\t131.9\t0.91\t4 mm² Cu, 1500 V DC");
    expect(lines[23]).toBe("22 strings\t\t\t\t\t\t1,681.0\t\t");
  });

  test("a drop within 1 % has no mark; a string that drops more, even at 10 mm², has an exclamation mark that says so (issue 179, item 27)", () => {
    const drop = view.columns.find((column) => column.key === "drop")!;
    expect(view.rows.slice(0, 22).map((row) => drop.mark?.(row) ?? null)).toEqual(Array(22).fill(null));
    const long = { ...A.cable_schedule[0]!, length_m: 400, cross_section_mm2: 10, size: "10 mm² Cu, 1500 V DC", drop_pct: 1.27 };
    const over = scheduleViewOf({ ...A, cable_schedule: [long] }, null);
    expect(cells(over, over.rows[0]!).slice(6)).toEqual(["400.0", "1.27", "10 mm² Cu, 1500 V DC"]);
    expect(drop.mark?.(over.rows[0]!)).toEqual({ kind: "note", label: "More than 1 % even at 10 mm²: a shorter run, or the inverter nearer, brings it down" });
    expect(drop.mark?.(over.rows[1]!)).toBeNull();
  });

  test("the card of the total row on phone shows its sum alone", () => {
    const card = cardOf(view.rows[22]!, view.columns);
    expect(card.title).toBe("22 strings");
    expect(card.values).toEqual([{ key: "length", label: "DC cable (m)", value: "1,681.0" }]);
  });
});

describe("sorted", () => {
  test("by DC cable downwards the longest string is first, the total row stays last, the copy follows, the caption says so", () => {
    const view = scheduleViewOf(A, { key: "length", direction: "descending" });
    expect(view.rows[0]!.key).toBe("S1");
    expect(cells(view, view.rows[0]!)[6]).toBe("131.9");
    expect(view.rows[1]!.key).toBe("S4");
    expect(view.rows[21]!.key).toBe("S21");
    expect(view.rows[22]!.key).toBe(view.total);
    expect(view.text.split("\n")[1]!.startsWith("S1\t")).toBe(true);
    expect(view.text.split("\n")[2]!.startsWith("S4\t")).toBe(true);
    expect(view.caption).toBe("Sorted by DC cable (m), downwards. The order of the engine, by string, is the default");
  });

  test("by string, upwards, S10 comes after S9: the number, not the words", () => {
    const view = scheduleViewOf(A, { key: "string", direction: "ascending" });
    expect(view.rows.slice(0, 22).map((row) => row.key)).toEqual(A.cable_schedule.map((row) => row.string));
    expect(view.caption).toBe("Sorted by String, upwards. The order of the engine, by string, is the default");
  });

  test("by MPPT downwards, stable: the strings of MPPT 6 first in the engine's order", () => {
    const view = scheduleViewOf(A, { key: "mppt", direction: "descending" });
    expect(view.rows.slice(0, 3).map((row) => row.key)).toEqual(["S20", "S21", "S22"]);
  });
});
