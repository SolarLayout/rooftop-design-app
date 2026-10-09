// The answer of the API for the demo at 1500 V, as the engine gave it for the boards of Phase 9
// (docs/design/mockups/handover_data.json); what Handover does not read is left out. For the tests of lib/handover alone.
import type { DesignOption, DesignResult, Project, PVString } from "../api";

export const BOM = [
  { item: "PV module", spec: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560, 560 Wp, bifacial 0.80", qty: 638.0, unit: "pcs" },
  { item: "String inverter", spec: "WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT", qty: 1.0, unit: "pcs" },
  { item: "Mounting structure", spec: "Fixed tilt 15°, 2P, lower edge 0.5 m", qty: 27.0, unit: "tables" },
  { item: "DC cable", spec: "4 mm² Cu, 1500 V DC, red + black", qty: 1681.0, unit: "m" },
  { item: "DC connector pair", spec: "MC4-compatible, matched to the module", qty: 44.0, unit: "pairs" },
  { item: "AC cable", spec: "Inverter to ACDB, sized for 240 A at 800 V AC", qty: 30.0, unit: "m" },
  { item: "AC distribution board", spec: "1 incomer(s), 1 outgoing", qty: 1.0, unit: "pcs" },
];

const row = (string: string, mppt: number, length_m: number) => ({
  string,
  inverter: "INV-1",
  mppt,
  modules: 29,
  voc_cold_v: 1480.0634330438852,
  isc_a: 14.3,
  length_m,
  size: "4 mm² Cu, 1500 V DC",
  cross_section_mm2: 4.0,
  drop_pct: length_m * DROP_PCT_PER_M,
});

/** The voltage drop of the demo's 4 mm² cable, % of its strings' voltage at the maximum power point, per metre. */
const DROP_PCT_PER_M = 0.9121334787426001 / 131.9;

/** The DC cable of each of the 22 strings of option A, in metres, in the engine's order. */
const LENGTHS_M = [131.9, 97.3, 85.2, 119.8, 119.0, 84.4, 72.3, 106.9, 47.9, 82.5, 118.2, 93.2, 41.9, 76.5, 80.3, 45.7, 33.6, 68.2, 67.4, 32.8, 20.7, 55.3];

/** The MPPT of each string of option A: four on MPPT 1 to 4, three on 5 and 6. */
const mpptOf = (index: number) => (index < 16 ? Math.floor(index / 4) + 1 : index < 19 ? 5 : 6);

/** The 22 strings of option A, four on MPPT 1 to 4 and three on 5 and 6; their DC cable sums to 1,681.0 m. */
export const CABLE_SCHEDULE = LENGTHS_M.map((length, index) => row(`S${index + 1}`, mpptOf(index), length));

/** The strings of option A as the system lists them, with what the single-line diagram reads of them. */
export const STRINGS = LENGTHS_M.map((_, index) => ({ label: `S${index + 1}`, inverter: 1, mppt: mpptOf(index), modules: [] as number[] })) as PVString[];

const load = (mppt: number, strings: number) => ({
  inverter: 1,
  mppt,
  label: `INV-1 · MPPT ${mppt}`,
  strings,
  imp_a: strings === 4 ? 54.32 : 40.74,
  imp_limit_a: 65.0,
  isc_a: strings === 4 ? 57.2 : 42.900000000000006,
  isc_limit_a: 65.0,
  kwp: strings === 4 ? 64.96 : 48.72,
  ok: true,
});

export const MPPT_LOADS = [load(1, 4), load(2, 4), load(3, 4), load(4, 4), load(5, 3), load(6, 3)];

export const SYSTEM = {
  n_series: 29,
  n_strings: 22,
  n_inverters: 1,
  n_modules: 638,
  strings: STRINGS,
  inverters: [{ label: "INV-1", position: [31.042985126678104, 39.0] }],
};

export const A = {
  key: "29x22x1",
  letter: "A",
  title: "A · Recommended",
  caption: "Recommended",
  n_series: 29,
  n_strings: 22,
  n_inverters: 1,
  n_modules: 638,
  dc_kwp: 357.28,
  dcac: 1.2992,
  bom: BOM,
  cable_schedule: CABLE_SCHEDULE,
  system: SYSTEM,
  mppt_loads: MPPT_LOADS,
} as unknown as DesignOption;

/** Option D of the demo: two inverters. */
export const D = { ...A, key: "26x27x2", letter: "D", caption: "Below target, 2 inverters", n_series: 26, n_strings: 27, n_inverters: 2, n_modules: 702 } as DesignOption;

export const PVGIS = { source: "pvgis", label: "PVGIS TMY", hours: 8760, t_min_c: 11.93, t_max_c: 39.26, horizon_highest_deg: 2.7 };

export const EQUIPMENT = {
  module: { manufacturer: "INSOLATION GREEN ENERGY PVT. LTD.", model: "INA-144MHC-TF-560", pnom_w: 560.0, source: "insolation-ina-144mhc-tf-560.PAN" },
  inverter: { manufacturer: "WattPower Systems Pvt.Ltd", model: "WP-330KTL-H1", pnom_kw: 275.0, n_mppt: 6, source: "wattpower-wp-330ktl-h1.OND" },
  module_notes: [],
};

export const DEMO = {
  chosen_option: A.key,
  options: [A, D],
  no_options: null,
  equipment: EQUIPMENT,
  weather: PVGIS,
  readouts: { positions: 790, roof_area_m2: 3600 },
} as unknown as DesignResult;

export const NO_VOLTAGE = {
  code: "system_voltage_missing",
  title: "Choose a system voltage to size the strings",
  message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
} as const;

export const BEFORE_A_VOLTAGE = { ...DEMO, chosen_option: null, options: [], no_options: NO_VOLTAGE } as unknown as DesignResult;

/** The demo's six obstacles, as far as Handover reads them: the name, the kind, the height. */
const obstacle = (name: string, kind: string, height: number) => ({ name, kind, height, auto: false });
export const OBSTACLES = [
  obstacle("Stair room", "box", 3.0),
  obstacle("Water tank", "cylinder", 2.0),
  obstacle("AC unit 1", "box", 1.2),
  obstacle("AC unit 2", "box", 1.2),
  obstacle("AC unit 3", "box", 1.2),
  obstacle("AC unit 4", "box", 1.2),
];

export const DOCUMENT = {
  name: "Pune demo roof",
  format: 2,
  pan_path: "insolation-ina-144mhc-tf-560.PAN",
  ond_path: "wattpower-wp-330ktl-h1.OND",
  weather_source: "pvgis",
  weather_csv: "",
  system_voltage: 1500,
  chosen_option: "29x22x1",
  roof: { lat: 18.52, lon: 73.86, obstacles: OBSTACLES },
} as unknown as Project;
