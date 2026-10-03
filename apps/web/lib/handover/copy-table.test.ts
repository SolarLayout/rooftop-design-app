import { describe, expect, test } from "bun:test";
import { COULD_NOT_COPY, copyTable, tableAsText } from "./copy-table";
import { BOM } from "./test-fixtures";

type Line = (typeof BOM)[number];

const COLUMNS = [
  { head: "Item", value: (line: Line) => line.item },
  { head: "Specification", value: (line: Line) => line.spec },
  { head: "Qty", value: (line: Line) => line.qty.toLocaleString("en-US") },
  { head: "Unit", value: (line: Line) => line.unit },
];

describe("tableAsText: a table as tab-separated lines with a header line, for a spreadsheet (plan/phase-09-plan.md, decision 7)", () => {
  test("the demo's bill of materials, as it is shown", () => {
    const lines = tableAsText(COLUMNS, BOM).split("\n");

    expect(lines).toHaveLength(8);
    expect(lines[0]).toBe("Item\tSpecification\tQty\tUnit");
    expect(lines[1]).toBe("PV module\tINSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80\t638\tpcs");
    expect(lines[4]).toBe("DC cable\t4 mm² Cu, 1500 V DC, red + black\t1,681\tm");
    expect(lines[7]).toBe("AC distribution board\t1 incomer(s), 1 outgoing\t1\tpcs");
  });

  test("no line ends with a tab, and the text ends without a newline", () => {
    const text = tableAsText(COLUMNS, BOM);
    expect(text.endsWith("\n")).toBe(false);
    expect(text.split("\n").some((line) => line.endsWith("\t"))).toBe(false);
  });

  test("without rows, the header line alone", () => {
    expect(tableAsText(COLUMNS, [])).toBe("Item\tSpecification\tQty\tUnit");
  });
});

describe("copyTable: the text to the clipboard", () => {
  test("writes the text once and resolves", async () => {
    const written: string[] = [];
    await copyTable("a\tb", async (text) => {
      written.push(text);
    });
    expect(written).toEqual(["a\tb"]);
  });

  test("a clipboard that refuses: the promise rejects with what to do, for the toast", async () => {
    await expect(
      copyTable("a\tb", async () => {
        throw new DOMException("Write permission denied.", "NotAllowedError");
      }),
    ).rejects.toThrow(COULD_NOT_COPY);
    expect(COULD_NOT_COPY).toBe("The table could not be copied. Select it and copy by hand.");
  });
});
