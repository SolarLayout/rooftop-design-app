// The states of the shell that the kit shows, made the way the shell makes them: of answers of the
// API, by `notesOf` and `vitalsOf`. The answers are those of the demo; what the shell does not read
// is left out.
import { notesOf, type Note } from "@/components/shell/notes-view";
import type { DeviceRow } from "@/components/shell/switcher-view";
import { vitalsOf, type VitalsView } from "@/components/shell/vitals-view";
import type { DesignOption, DesignResult } from "@/lib/api";

const VOC_NOTE =
  "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.";

const OPTION_A = {
  key: "29x22x1",
  letter: "A",
  ok: true,
  note: "",
  dc_kwp: 357.28,
  dcac: 1.2992,
  n_modules: 638,
  energy: { energy_mwh: 617.8405, ac_kw: 275, pr: 0.8655, specific_yield: 1729.29 },
  verdict: { ok: true, title: "", detail: "" },
} as unknown as DesignOption;

const OPTION_D = {
  ...OPTION_A,
  key: "26x27x2",
  letter: "D",
  ok: false,
  note: "below target",
  dc_kwp: 393.12,
  dcac: 0.7148,
  n_modules: 702,
  energy: { energy_mwh: 700.9, ac_kw: 550, pr: 0.892, specific_yield: 1783 },
  verdict: { ok: false, title: "", detail: "27 strings on 2 inverters, DC/AC 0.71 (below target)." },
} as unknown as DesignOption;

function design(parts: { chosen: DesignOption | null; moduleNotes: string[] }): DesignResult {
  return {
    chosen_option: parts.chosen?.key ?? null,
    options: parts.chosen ? [OPTION_A, OPTION_D] : [],
    no_options: parts.chosen
      ? null
      : {
          code: "system_voltage_missing",
          title: "Choose a system voltage to size the strings",
          message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
        },
    readouts: { positions: 790, roof_area_m2: 3600 },
    equipment: { module: { pnom_w: 560 }, module_notes: parts.moduleNotes },
    layout: { notes: [] },
    weather_notes: [],
  } as unknown as DesignResult;
}

const DEMO = design({ chosen: OPTION_A, moduleNotes: [VOC_NOTE] });
const WITHOUT_NOTES = design({ chosen: OPTION_A, moduleNotes: [] });
const BELOW_TARGET = design({ chosen: OPTION_D, moduleNotes: [] });
const WITHOUT_A_VOLTAGE = design({ chosen: null, moduleNotes: [] });

const UNREACHABLE = { code: "api_unreachable", message: "The server cannot be reached. Check the connection and try again." };
const NO_FAILURE = { layoutNotes: null, designFailure: null, layoutFailure: null, savingFailure: null };

const FITTING = { type: "progress", step: "Fitting modules on the roof", fraction: 0.08 } as const;
const SHADING = { type: "progress", step: "Computing hourly shading for every module", fraction: 0.62 } as const;

const NAME = "Pune demo roof";

function shown(result: DesignResult | null, status: "idle" | "running" | "failed", progress: typeof SHADING | typeof FITTING | null): VitalsView {
  const notes = notesOf({ design: result, ...NO_FAILURE, designFailure: status === "failed" ? UNREACHABLE : null });
  return vitalsOf({ name: NAME, design: result, readouts: result?.readouts ?? null, designStatus: status, progress, notes, failure: status === "failed" ? UNREACHABLE : null });
}

export const DESIGN = { name: NAME };

export const VITALS: Record<"design" | "updating" | "loading" | "failed" | "notComputed" | "waiting" | "nothingToReview" | "outsideTarget", VitalsView> = {
  design: shown(DEMO, "idle", null),
  updating: shown(DEMO, "running", SHADING),
  loading: shown(null, "running", FITTING),
  failed: shown(DEMO, "failed", null),
  notComputed: shown(null, "failed", null),
  waiting: shown(WITHOUT_A_VOLTAGE, "idle", null),
  nothingToReview: shown(WITHOUT_NOTES, "idle", null),
  outsideTarget: shown(BELOW_TARGET, "idle", null),
};

export const NOTES: Note[] = notesOf({ design: DEMO, ...NO_FAILURE, designFailure: UNREACHABLE });
export const NO_NOTES: Note[] = [];

/**
 * Three designs on this device, as the board "Home, designs on this device" has them (docs/design/mockups/home_data.json): the
 * demo with the capacity of its run, two built here before a run with a chosen option, said by their roofs.
 */
export const ON_THIS_DEVICE: DeviceRow[] = [
  { id: "hinjewadi", name: "Hinjewadi Phase 2, Pune, Maharashtra", fact: "62.0 × 28.0 m flat roof, tilted rows" },
  { id: "warehouse", name: "Warehouse 7, Block B", fact: "120.0 × 45.0 m flat roof, east-west" },
];
