import { describe, expect, test } from "bun:test";
import type { DesignOption } from "../api";
import { cardOf, columnsOfTable } from "../../components/ui/table-cells";
import { SUMMARY_COLUMNS, summaryRowsOf } from "./summary";
import { A, SUMMARY } from "./test-fixtures";

describe("the summary (plan/phase-08-plan.md, decision 16)", () => {
  test("the 14 rows of the option, in the engine's order and words", () => {
    const rows = summaryRowsOf(A);

    expect(rows).toHaveLength(14);
    expect(rows.map((row) => [row.label, row.value])).toEqual(SUMMARY.map((row) => [row.label, row.value]));
  });

  test("each row has a key of its own, from its label", () => {
    const keys = summaryRowsOf(A).map((row) => row.key);

    expect(new Set(keys).size).toBe(14);
    expect(keys[0]).toBe("site");
    expect(keys[13]).toBe("co2-avoided");
  });

  test("two rows with the same label are told apart by their place", () => {
    const twice = { ...A, summary: [{ label: "Weather", value: "one" }, { label: "Weather", value: "two" }] } as DesignOption;

    expect(summaryRowsOf(twice).map((row) => row.key)).toEqual(["weather", "weather-2"]);
  });

  test("the table has two columns, the item as the name of its row and the value as text; both on the cards", () => {
    const [item, value] = columnsOfTable(SUMMARY_COLUMNS);
    const [first] = summaryRowsOf(A);

    expect(SUMMARY_COLUMNS).toHaveLength(2);
    expect([item?.head, item?.kind, value?.head, value?.kind]).toEqual(["Item", "name", "Value", "text"]);
    expect(item?.value(first!)).toBe("Site");
    expect(value?.value(first!)).toBe("18.52000° N, 73.86000° E");
    expect(cardOf(first!, SUMMARY_COLUMNS)).toEqual({ title: "Site", mark: null, values: [{ key: "value", label: "Value", value: "18.52000° N, 73.86000° E" }] });
  });
});
