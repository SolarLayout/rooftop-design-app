// The CAD layout's preview (plan/phase-09-plan.md, step 19, decision 8; the board "Handover, previews"): the DXF's layers as
// the engine writes them (rooftop_core/export/files.py, export_dxf_bytes: the seven fixed, then STRING_S01 to STRING_Snn, one
// per string) with what is on each in the board's words, every number the engine's; the line under them; the engine's plan,
// the page of the report titled Layout, already drawn. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, DesignResult, Project } from "../api";
import { unusedPositionsOf, type FactRow } from "./earth-view";
import type { PageThumb, ReportView } from "./report-view";

export type CadView = {
  /** The layers in the file's order, the strings as one row ("STRING_S01 to STRING_S22"). */
  layers: FactRow[];
  /** Under the layers: the format, the unit, the axes. */
  about: string;
};

type Asked = {
  document: Project;
  design: DesignResult;
  /** The option the file is of. */
  option: DesignOption;
};

/** The engine's title of the page that draws the plan: the preview shows that page in the paper frame (decision 8). */
export const PLAN_PAGE_TITLE = "Layout";
const ABOUT = "AutoCAD 2010 (R2010) · metres · x east, y north";

const count = (value: number) => shown(value, 0);
const plural = (value: number, one: string, many: string) => `${count(value)} ${value === 1 ? one : many}`;
/** The engine's name of a string's layer: STRING_S01. */
const stringLayerOf = (index: number) => `STRING_S${String(index).padStart(2, "0")}`;

export function cadViewOf({ document, design, option }: Asked): CadView {
  const { system } = option;
  const oneString = system.n_strings === 1;
  const strings = oneString ? stringLayerOf(1) : `${stringLayerOf(1)} to ${stringLayerOf(system.n_strings)}`;
  const modules = plural(system.n_series, "module", "modules");
  return {
    layers: [
      { name: "ROOF", words: "the outline" },
      { name: "SETBACK", words: "the edge margin" },
      { name: "OBSTACLES", words: plural(document.roof.obstacles.length, "outline", "outlines") },
      { name: "KEEPOUT", words: "the areas kept clear" },
      { name: "MODULES_UNUSED", words: plural(unusedPositionsOf(design, option), "position", "positions") },
      { name: "INVERTERS", words: count(system.n_inverters) },
      { name: "TEXT", words: `the names and heights, ${system.inverters.map((inverter) => inverter.label).join(", ")}` },
      { name: strings, words: oneString ? modules : `${modules} each` },
    ],
    about: ABOUT,
  };
}

/** The engine's plan among the report's pages, by its title; null while the pages are not there. */
export const planOf = (report: ReportView): PageThumb | null => report.pages.find((page) => page.title === PLAN_PAGE_TITLE) ?? null;
