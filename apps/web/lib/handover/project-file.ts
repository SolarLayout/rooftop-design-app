// The project file's preview (the board "Handover, previews", last part; plan/phase-09-plan.md, decision 9): the file's
// name as the API will write it, following the name as it is typed; its size; its format; what the .rtd embeds, from the
// document and the run. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignResult, Project } from "../api";
import { projectFileNameOf } from "../flow/deliverables/file-name";
import { weatherShownOf } from "../flow/weather-source";

export type ContentRow = {
  label: string;
  /** Null while it is not known yet: before a run. */
  value: string | null;
  /** A file's name stands in mono. */
  isFileName: boolean;
};

export type ProjectFileView = {
  /** `<stem>.rtd`, as the API names the file. */
  fileName: string;
  /** "680 KB", of 1,024; null while the file has not come. */
  size: string | null;
  format: string;
  contents: ContentRow[];
};

type Asked = {
  document: Project;
  design: DesignResult | null;
  /** The size of the file the API wrote; null while it has not come. */
  bytes: number | null;
  /** The name as it is being typed; null while it is not. */
  draft: string | null;
};

const BYTES_IN_A_KB = 1024;
/** What the module or the inverter is read from when the document names no file. */
const BUNDLED_SAMPLE = "The app's sample";
export const FORMAT = "Format version 2";
const NO_OPTION_YET = "None yet";

const fileRow = (label: string, path: string): ContentRow => (path === "" ? { label, value: BUNDLED_SAMPLE, isFileName: false } : { label, value: path, isFileName: true });

function voltageOf(document: Project, design: DesignResult | null): string | null {
  if (document.system_voltage !== null && document.system_voltage !== undefined) return `${document.system_voltage} V`;
  return design?.no_options?.title ?? null;
}

function optionOf(design: DesignResult | null): string | null {
  if (design === null) return null;
  const option = design.options.find((one) => one.key === design.chosen_option);
  if (!option) return NO_OPTION_YET;
  return `${option.letter} · ${shown(option.n_series, 0)} × ${shown(option.n_strings, 0)} on ${shown(option.n_inverters, 0)} ${option.n_inverters === 1 ? "inverter" : "inverters"}`;
}

export function projectFileViewOf({ document, design, bytes, draft }: Asked): ProjectFileView {
  const name = draft === null || draft.trim() === "" ? document.name : draft;
  return {
    fileName: projectFileNameOf(name),
    size: bytes === null ? null : `${shown(Math.round(bytes / BYTES_IN_A_KB), 0)} KB`,
    format: FORMAT,
    contents: [
      fileRow("Module file", document.pan_path),
      fileRow("Inverter file", document.ond_path),
      { label: "Weather", value: design ? `${weatherShownOf(document)} · ${shown(design.weather.hours, 0)} hours` : null, isFileName: false },
      { label: "System voltage", value: voltageOf(document, design), isFileName: false },
      { label: "Chosen option", value: optionOf(design), isFileName: false },
    ],
  };
}
