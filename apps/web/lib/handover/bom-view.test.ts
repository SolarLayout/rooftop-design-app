import { describe, expect, test } from "bun:test";
import { cardOf, cellLinesOf } from "../../components/ui/table-cells";
import { bomViewOf } from "./bom-view";
import { tableAsText } from "./copy-table";
import { A, BOM } from "./test-fixtures";

describe("the bill of materials as a table (plan/phase-09-plan.md, step 15, decision 7; the board \"Handover, previews\")", () => {
  const view = bomViewOf(A);

  test("four columns in the board's order: the item names the row, the specification is words, the quantity a number, the unit words", () => {
    expect(view.columns.map((column) => [column.head, column.kind])).toEqual([
      ["Item", "name"],
      ["Specification", "text"],
      ["Qty", "number"],
      ["Unit", "text"],
    ]);
    expect(view.columns[1]!.words).toBe(true);
  });

  test("the rows are the engine's lines, in its order, word for word, the quantities with a comma between thousands and no decimals", () => {
    expect(view.rows).toBe(A.bom);
    const cells = view.rows.map((row) => view.columns.map((column) => cellLinesOf(row, column)[0]!.value));
    expect(cells[0]).toEqual(["PV module", "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80", "638", "pcs"]);
    expect(cells[1]).toEqual(["String inverter", "WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT", "1", "pcs"]);
    expect(cells[3]).toEqual(["DC cable", "4 mm² Cu, 1500 V DC, red + black", "1,681", "m"]);
    expect(new Set(view.rows.map(view.keyOf)).size).toBe(BOM.length);
  });

  // Since each string's DC cable is sized for itself (#191), an option can list a DC cable line per size: the rows are told
  // apart by their spec too, or React gives two of them one key.
  test("two lines of one item, a DC cable of two sizes, have keys of their own", () => {
    const twoSizes = [...A.bom.slice(0, 3), { ...A.bom[3]!, spec: "4 mm² Cu, 1500 V DC, red + black" }, { ...A.bom[3]!, spec: "6 mm² Cu, 1500 V DC, red + black", qty: 147 }, ...A.bom.slice(4)];
    const keys = bomViewOf({ ...A, bom: twoSizes }).rows.map(view.keyOf);
    expect(new Set(keys).size).toBe(twoSizes.length);
  });

  test("the caption names the option; the toast says what was done", () => {
    expect(view.caption).toBe("The bill of materials of option A");
    expect(view.copied).toBe("Copied");
  });

  test("the text for the clipboard is the table as shown, with a header line", () => {
    expect(view.text).toBe(tableAsText(view.columns, view.rows));
    expect(view.text.split("\n")[0]).toBe("Item\tSpecification\tQty\tUnit");
    expect(view.text.split("\n")[4]).toBe("DC cable\t4 mm² Cu, 1500 V DC, red + black\t1,681\tm");
  });

  test("a card on phone: the item as the title, the specification across the width, then the quantity and the unit under their labels", () => {
    const card = cardOf(view.rows[0]!, view.columns);
    expect(card.title).toBe("PV module");
    expect(card.values).toEqual([
      { key: "spec", label: "Specification", value: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80", words: true },
      { key: "qty", label: "Qty", value: "638" },
      { key: "unit", label: "Unit", value: "pcs" },
    ]);
  });
});
