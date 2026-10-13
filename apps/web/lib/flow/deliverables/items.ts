// The eight files of Handover (V2 · 9, D105; audit V2-90), grouped by who they are for: the client, the utility, the
// installer and you. Each says what it is in plain words, its numbers the run's chosen option's, and its size once the zip
// has told it (`lib/handover/zip-sizes.ts`); its badge is its format alone. Before options every row but the project file
// waits and says the API's title (plan/phase-09-plan.md, decision 11). Pure.
import { shown } from "../../../components/ui/number-entry";
import type { DesignOption, DesignResult, ExportKind } from "../../api";
import { HANDOVER_ITEMS, type HandoverItem } from "../../routes";

export type Deliverable = {
  id: HandoverItem;
  name: string;
  /** The format, in the badge of the row: PDF, PNG, CSV, DXF, RTD, KMZ. */
  badge: string;
  /** The file the API writes for the item. */
  kind: ExportKind;
  /** Who the file is for: "For the client". */
  forWhom: string;
  /** The press of the item's preview: "Download PDF". */
  action: string;
  /** The line under the name, what the file is and its size; null while nothing was ever there, where a skeleton stands. */
  facts: string | null;
  /**
   * The line under the item's name in its preview: who it is for, then the row's line; before options what is known
   * without an option (the report's paper size), else the API's title as the row; null while nothing was ever there.
   */
  about: string | null;
  /** The item waits: before options it cannot be downloaded. The project file never waits. */
  waits: boolean;
};

export type DeliverableGroup = { title: string; rows: Deliverable[] };

type Asked = {
  /** The name of the design that is open; null while none is. */
  name: string | null;
  design: DesignResult | null;
  /** How many pages the report has, once they are known; null before. */
  pages: number | null;
  /** The size of each file in bytes, once the zip has told them; none before. */
  sizes: Partial<Record<ExportKind, number>>;
};

type Shape = { badge: string; kind: ExportKind; forWhom: string };

const FOR_THE_CLIENT = "For the client";
const FOR_THE_UTILITY = "For the utility";
const FOR_THE_INSTALLER = "For the installer";
const FOR_YOU = "For you";

const SHAPES: Record<HandoverItem, Shape> = {
  report: { badge: "PDF", kind: "pdf", forWhom: FOR_THE_CLIENT },
  "single-line-diagram": { badge: "PNG", kind: "sld", forWhom: FOR_THE_UTILITY },
  "bill-of-materials": { badge: "CSV", kind: "bom", forWhom: FOR_THE_INSTALLER },
  "cable-schedule": { badge: "CSV", kind: "cables", forWhom: FOR_THE_INSTALLER },
  "cad-layout": { badge: "DXF", kind: "dxf", forWhom: FOR_THE_INSTALLER },
  "project-file": { badge: "RTD", kind: "rtd", forWhom: FOR_YOU },
  "hourly-data": { badge: "CSV", kind: "csv", forWhom: FOR_YOU },
  "earth-model": { badge: "KMZ", kind: "kmz", forWhom: FOR_YOU },
};

const GROUPS = [FOR_THE_CLIENT, FOR_THE_UTILITY, FOR_THE_INSTALLER, FOR_YOU] as const;

export const PROJECT_FILE: HandoverItem = "project-file";

/** What the files are, the same with or without an option. */
const ALWAYS: Partial<Record<HandoverItem, string>> = {
  "cad-layout": "The roof and its strings, in metres",
  "project-file": "The whole design, to open again in the app",
  "earth-model": "The roof and the modules on the map",
};
const PAPER = "A4 landscape";

const DC_CABLE = "DC cable";
const count = (value: number) => shown(value, 0);
/** "1 inverter", "22 strings". */
const plural = (value: number, one: string) => `${count(value)} ${one}${value === 1 ? "" : "s"}`;

/** A size: KB under a thousand, at least 1; MB above, one decimal. */
export function sizeOf(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1000) return `${shown(Math.max(1, Math.round(kb)), 0)} KB`;
  return `${shown(kb / 1024, 1)} MB`;
}

/** What each file is, from the run's chosen option, once there is one. */
function whatOf(item: HandoverItem, design: DesignResult, option: DesignOption, pages: number | null): string {
  switch (item) {
    case "report":
      return pages === null ? PAPER : `${plural(pages, "page")}, ${PAPER}`;
    case "single-line-diagram":
      return `${plural(option.n_inverters, "inverter")}, ${count(design.equipment.inverter.n_mppt)} MPPT, ${plural(option.n_strings, "string")}`;
    case "bill-of-materials":
      return `${count(option.n_modules)} modules, ${plural(option.n_inverters, "inverter")}, ${plural(option.bom.length, "line")}`;
    case "cable-schedule": {
      const metres = option.bom.filter((line) => line.item === DC_CABLE).reduce((total, line) => total + line.qty, 0);
      return `${plural(option.n_strings, "string")}, ${count(metres)} m of DC cable`;
    }
    case "hourly-data":
      return `${count(design.weather.hours)} hours of sunlight, temperature and power`;
    default:
      return ALWAYS[item] ?? "";
  }
}

const withSize = (words: string, bytes: number | undefined) => (bytes === undefined ? words : `${words} · ${sizeOf(bytes)}`);

const chosenOf = (design: DesignResult | null): DesignOption | null => design?.options.find((option) => option.key === design.chosen_option) ?? null;

/** The eight files, in the order of the list, with their lines from the run and the document. */
export function deliverablesOf({ name, design, pages, sizes }: Asked): Deliverable[] {
  const option = chosenOf(design);
  return HANDOVER_ITEMS.map(({ id, name: itemName }): Deliverable => {
    const shape = SHAPES[id];
    const base = { id, name: itemName, ...shape, action: `Download ${shape.badge}` };
    const about = (line: string) => `${shape.forWhom} · ${line}`;
    if (id === PROJECT_FILE) {
      const facts = name === null ? null : withSize(ALWAYS[id]!, sizes.rtd);
      return { ...base, facts, about: facts === null ? null : about(facts), waits: name === null };
    }
    if (design === null) return { ...base, facts: null, about: null, waits: true };
    if (option === null) {
      const title = design.no_options?.title ?? null;
      const known = id === "report" ? PAPER : id === "cad-layout" ? ALWAYS[id]! : null;
      return { ...base, facts: title, about: known === null ? title : about(known), waits: true };
    }
    const facts = withSize(whatOf(id, design, option, pages), sizes[shape.kind]);
    return { ...base, facts, about: about(facts), waits: false };
  });
}

/** The rows in their four groups, by who they are for. */
export const groupsOf = (rows: readonly Deliverable[]): DeliverableGroup[] =>
  GROUPS.map((title) => ({ title, rows: rows.filter((row) => row.forWhom === title) }));

/** The file the API writes for an item. */
export const kindOf = (item: HandoverItem): ExportKind => SHAPES[item].kind;
