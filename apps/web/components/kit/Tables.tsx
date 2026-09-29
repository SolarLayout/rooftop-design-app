import { Table } from "@/components/ui/Table";
import type { Column } from "@/components/ui/table-cells";
import { Example, Row, Section } from "./Example";

type Option = { letter: string; strings: string; modules: string; kwp: string; dcac: string; mwh: string; fits: boolean };

// The stringing options of the Pune demo at 1500 V (plan/reference/demo-numbers.md).
const OPTIONS: Option[] = [
  { letter: "A", strings: "29 × 22", modules: "638", kwp: "357.28", dcac: "1.30", mwh: "617.8", fits: true },
  { letter: "B", strings: "26 × 24", modules: "624", kwp: "349.44", dcac: "1.27", mwh: "607.7", fits: true },
  { letter: "C", strings: "28 × 22", modules: "616", kwp: "344.96", dcac: "1.25", mwh: "602.9", fits: true },
  { letter: "D", strings: "26 × 27", modules: "702", kwp: "393.12", dcac: "0.71", mwh: "700.9", fits: false },
  { letter: "E", strings: "28 × 25", modules: "700", kwp: "392.00", dcac: "0.71", mwh: "700.5", fits: false },
];

const COLUMNS: Array<Column<Option>> = [
  { key: "option", head: "Option", kind: "name", value: (row) => row.letter, onCard: (row) => `Option ${row.letter}` },
  { key: "strings", head: "Strings", kind: "text", value: (row) => row.strings },
  { key: "modules", head: "Modules", kind: "number", value: (row) => row.modules, shown: "card" },
  { key: "kwp", head: "kWp", kind: "number", value: (row) => row.kwp },
  {
    key: "dcac",
    head: "DC/AC",
    kind: "number",
    value: (row) => row.dcac,
    mark: (row) => (row.fits ? { kind: "fits", label: "In target" } : { kind: "note", label: "Below the DC/AC target" }),
  },
  { key: "mwh", head: "MWh", kind: "number", value: (row) => row.mwh },
];

export function Tables() {
  return (
    <Section title="Table">
      <Row label="A table on tablet and desktop; on phone each row is a card. The first row is the one that is chosen">
        <div className="w-full max-w-115">
          <Example name="table" caption="Rows of 44, numbers at the right in mono">
            <Table caption="Stringing options at 1500 V" columns={COLUMNS} rows={OPTIONS} keyOf={(row) => row.letter} chosen="A" className="w-full" />
          </Example>
        </div>
      </Row>
    </Section>
  );
}
