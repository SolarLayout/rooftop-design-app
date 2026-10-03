// The eight items of Handover with their facts, in the words of the board (plan/phase-09-plan.md, decision 14), every
// number the engine's: from the run's chosen option, the weather and the document. Before options every row but the
// project file waits and says the API's title (decision 11). Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, DesignResult, ExportKind } from "../api";
import { HANDOVER_ITEMS, type HandoverItem } from "../routes";
import { projectFileNameOf } from "./file-name";

export type Deliverable = {
  id: HandoverItem;
  name: string;
  /** The format, in the badge of the row: PDF, PNG, BOM, DC, DXF, KMZ, CSV, RTD. */
  badge: string;
  /** The file the API writes for the item; null for an item that is a view (the tables). */
  kind: ExportKind | null;
  /** A file is downloaded from its row; a view is opened. */
  opens: "file" | "view";
  /** The primary action of the item's preview: "Download PDF", "Save a copy"; null for a view. */
  action: string | null;
  /** The line under the name; null while nothing was ever there, where a skeleton stands. */
  facts: string | null;
  /** The item waits: before options it cannot be downloaded, and its row is dim. The project file never waits. */
  waits: boolean;
};

type Asked = {
  /** The name of the design that is open; null while none is. */
  name: string | null;
  design: DesignResult | null;
  /** How many pages the report has, once they are known (pull request 2); null before. */
  pages: number | null;
};

type Shape = { badge: string; kind: ExportKind | null; opens: "file" | "view" };

const SHAPES: Record<HandoverItem, Shape> = {
  report: { badge: "PDF", kind: "pdf", opens: "file" },
  "single-line-diagram": { badge: "PNG", kind: "sld", opens: "file" },
  "bill-of-materials": { badge: "BOM", kind: null, opens: "view" },
  "cable-schedule": { badge: "DC", kind: null, opens: "view" },
  "cad-layout": { badge: "DXF", kind: "dxf", opens: "file" },
  "earth-model": { badge: "KMZ", kind: "kmz", opens: "file" },
  "hourly-data": { badge: "CSV", kind: "csv", opens: "file" },
  "project-file": { badge: "RTD", kind: "rtd", opens: "file" },
};

const PROJECT_FILE: HandoverItem = "project-file";
const SAVE_A_COPY = "Save a copy";

/** The lines of the bill of materials the facts count, by the engine's item names. */
const MODULES = "PV module";
const STRUCTURE = "Mounting structure";
const DC_CABLE = "DC cable";

const count = (value: number) => shown(value, 0);
const plural = (value: number, one: string, many: string) => `${count(value)} ${value === 1 ? one : many}`;

function bomFactsOf(option: DesignOption): string {
  const line = (item: string) => option.bom.find((one) => one.item === item) ?? null;
  const [modules, structure, cable] = [line(MODULES), line(STRUCTURE), line(DC_CABLE)];
  const parts = [
    modules && `${count(modules.qty)} modules`,
    structure && `${count(structure.qty)} ${structure.unit}`,
    cable && `${count(cable.qty)} ${cable.unit} ${DC_CABLE}`,
  ];
  return parts.filter((part) => part !== null).join(" · ");
}

function scheduleFactsOf(option: DesignOption): string {
  const vocCold = Math.max(...option.cable_schedule.map((row) => row.voc_cold_v));
  return `${plural(option.n_strings, "string", "strings")} · Voc cold ${count(vocCold)} V`;
}

/** The facts of each item of the run, once there is a chosen option. */
function factsOf(item: HandoverItem, design: DesignResult, option: DesignOption, pages: number | null): string {
  switch (item) {
    case "report":
      return pages === null ? "A4 landscape" : `A4 landscape · ${plural(pages, "page", "pages")}`;
    case "single-line-diagram":
      return `${plural(option.n_strings, "string", "strings")} of ${count(option.n_series)} × ${count(design.equipment.module.pnom_w)} Wp · ${plural(option.n_inverters, "inverter", "inverters")}, ${count(design.equipment.inverter.n_mppt)} MPPT`;
    case "bill-of-materials":
      return bomFactsOf(option);
    case "cable-schedule":
      return scheduleFactsOf(option);
    case "cad-layout":
      return "Metres · one layer per string";
    case "earth-model":
      return `Roof, obstacles with heights, ${count(option.n_modules)} modules`;
    case "hourly-data":
      return `${count(design.weather.hours)} rows · irradiance, temperature, power`;
    case "project-file":
      return "";
  }
}

const chosenOf = (design: DesignResult | null): DesignOption | null => design?.options.find((option) => option.key === design.chosen_option) ?? null;

/** The eight items, in the order of the list, with their facts from the run and the document. */
export function deliverablesOf({ name, design, pages }: Asked): Deliverable[] {
  const option = chosenOf(design);
  return HANDOVER_ITEMS.map(({ id, name: itemName }): Deliverable => {
    const shape = SHAPES[id];
    if (id === PROJECT_FILE) {
      return { id, name: itemName, ...shape, action: SAVE_A_COPY, facts: name === null ? null : `${projectFileNameOf(name)} · opens offline`, waits: name === null };
    }
    const action = shape.kind === null ? null : `Download ${shape.badge}`;
    if (design === null) return { id, name: itemName, ...shape, action, facts: null, waits: true };
    if (option === null) return { id, name: itemName, ...shape, action, facts: design.no_options?.title ?? null, waits: true };
    return { id, name: itemName, ...shape, action, facts: factsOf(id, design, option, pages), waits: false };
  });
}
