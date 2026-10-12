// The inverter card of the Strings lens (the boards "Studio, Strings lens" and "Inverter and sizing";
// docs/design/components.md, "Cards"): the model, the maker as people know it (D75) with the power and the MPPTs,
// the current per MPPT with the inputs, and the file. Which inverter it shows while a replaced file's run is on its
// way, and the edit of a file read (step 17). Pure; the card draws what it gives.
import { shown } from "../../components/ui/number-entry";
import type { CurrentPerMppt, DesignResult, Inverter, InverterResponse, Project } from "../api";
import { makerOf } from "../equipment/makers";

export type InverterCard = {
  name: string;
  line: string;
  facts: string;
  /** False when no current per MPPT is known: the facts carry a note mark. */
  isCurrentKnown: boolean;
  /** The name of the OND, under the card. */
  file: string;
};

/** The power as the file gives it: whole kilowatts whole, others with their decimals. */
const kilowatts = (kw: number) => `${Number.isInteger(kw) ? shown(kw, 0) : String(kw)} kW`;

/**
 * The card of an inverter, with the current per MPPT of its file and the one the user entered in its place
 * (`imax_mppt_override`), which is the one the strings are sized with.
 */
export function inverterCardOf(inverter: Inverter, ofTheFile: CurrentPerMppt, entered: number | null): InverterCard {
  const current = entered ?? ofTheFile.value_a;
  const perMppt = current === null ? "Current per MPPT not in the inverter file" : `${shown(current, 1)} A per MPPT${entered === null ? "" : ", entered"}`;
  const inputs = `${shown(inverter.n_inputs, 0)} ${inverter.n_inputs === 1 ? "input" : "inputs"}`;
  return {
    name: inverter.model,
    line: `${makerOf(inverter.manufacturer)} · ${kilowatts(inverter.pnom_kw)} · ${shown(inverter.n_mppt, 0)} MPPT`,
    facts: `${perMppt} · ${inputs}`,
    isCurrentKnown: current !== null,
    file: inverter.source,
  };
}

/** An inverter as the card shows it: the inverter and the current per MPPT of its file. */
export type InverterShown = { inverter: Inverter; current: CurrentPerMppt };

/** The inverter read from a replaced file, and the edit that committed the file. */
export type ReplacedInverter = InverterShown & { edit: number };

type Sources = {
  design: DesignResult | null;
  /** The edit the design belongs to. */
  designEdit: number | null;
  replaced: ReplacedInverter | null;
};

/**
 * Which inverter the card shows: the one read from a replaced file until the design of that edit (or a later
 * one) lands, then the design's equipment; nothing before either.
 */
export function inverterShownOf({ design, designEdit, replaced }: Sources): InverterShown | null {
  const isReplacedNewer = replaced !== null && (designEdit === null || designEdit < replaced.edit);
  if (replaced && isReplacedNewer) return { inverter: replaced.inverter, current: replaced.current };
  if (!design) return null;
  return { inverter: design.equipment.inverter, current: design.equipment.max_current_per_mppt };
}

/** The document with the OND read: its text and its name, and no current per MPPT entered (inventory 1.4). */
export function withInverterRead(document: Project, read: InverterResponse): Project {
  return { ...document, ond_text: read.text, ond_path: read.file, imax_mppt_override: null };
}

/** The inverter on one line, as the Strings step's summary row says it (V2 · 3): its model and its power. */
export const inverterFactsOf = (inverter: Pick<Inverter, "model" | "pnom_kw" | "n_mppt">): string => `${inverter.model} · ${kilowatts(inverter.pnom_kw)} · ${inverter.n_mppt} MPPT`;
