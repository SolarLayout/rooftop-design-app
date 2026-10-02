// The answer of the API for the demo at 1500 V, as the engine gave it for the boards of Phase 8
// (docs/design/mockups/performance_data.json); what Performance does not read is left out. For the tests
// of lib/performance alone.
import type { DesignOption, DesignResult, LayoutReadouts, WeatherSummary } from "../api";

export const READOUTS = { positions: 790, roof_area_m2: 3600 } as LayoutReadouts;

export const PVGIS: WeatherSummary = {
  source: "pvgis",
  label: "PVGIS TMY",
  hours: 8760,
  first_hour: "2019-01-01T00:00:00+00:00",
  last_hour: "2019-12-31T23:00:00+00:00",
  ghi_kwh_m2: 1822.91505,
  dni_kwh_m2: 1999.61911,
  dhi_kwh_m2: 549.92729,
  t_min_c: 11.93,
  t_max_c: 39.26,
  horizon_highest_deg: 2.7,
};

export const NASA: WeatherSummary = {
  ...PVGIS,
  source: "nasa",
  label: "NASA POWER 2023",
  ghi_kwh_m2: 1815.6859,
  dni_kwh_m2: 1263.83886,
  dhi_kwh_m2: 799.03707,
  t_min_c: 8.87,
  t_max_c: 40.32,
  horizon_highest_deg: null,
};

const SIGMA = 4.242640687119285;

type Figures = {
  key: string;
  letter: string;
  caption: string;
  ok: boolean;
  note: string;
  n_series: number;
  n_strings: number;
  n_inverters: number;
  dc_kwp: number;
  dcac: number;
  mwh: [number, number, number];
};

const option = ({ mwh, ...figures }: Figures): DesignOption =>
  ({
    ...figures,
    custom: false,
    verdict: { ok: figures.ok },
    energy: {
      energy_mwh: mwh[0],
      ac_kw: 275,
      dc_kwp: figures.dc_kwp,
      pr: 0.8655168203633348,
      specific_yield: 1729.2894575466607,
      cuf_ac_pct: 25.647178804162348,
      cuf_dc_pct: 19.740747232267815,
      poa_kwh_m2: 1997.9848072978216,
      ghi_kwh_m2: 1822.91505,
      sigma_pct: SIGMA,
      co2_t: 442.37382477286593,
      total_25_years_mwh: 14553.821678088736,
      p_values: [
        { level: 50, mwh: mwh[0] },
        { level: 75, mwh: mwh[1] },
        { level: 90, mwh: mwh[2] },
      ],
    },
    summary: SUMMARY,
  }) as unknown as DesignOption;

/** The 14 rows of the engine's summary for option A, word for word. */
export const SUMMARY = [
  { label: "Site", value: "18.52000° N, 73.86000° E" },
  { label: "Roof", value: "Flat · tilted rows · 3,600 m² · usable 3,184 m²" },
  { label: "Structure", value: "Fixed tilt 15°, 2P, lower edge 0.5 m" },
  { label: "Module", value: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560 · 560 Wp" },
  { label: "Inverter", value: "WattPower Systems Pvt.Ltd WP-330KTL-H1 · 275 kW · 6 MPPT" },
  { label: "Stringing", value: "29 in series × 22 strings on 1 inverter(s)" },
  { label: "DC capacity", value: "357.28 kWp (638 modules)" },
  { label: "AC capacity", value: "275 kW · DC/AC 1.30" },
  { label: "Weather", value: "PVGIS TMY · GHI 1,822.9 kWh/m² · in-plane 1,998.0 kWh/m²" },
  { label: "Losses", value: "Clipping 3.4 % · LID 0.20 % · uncertainty σ 4.24 %" },
  { label: "Energy, year 1", value: "P50 617.8 MWh · P75 600.2 MWh · P90 584.2 MWh" },
  { label: "Specific yield", value: "1,729 kWh/kWp · PR 86.6 % · CUF 25.6 % AC" },
  { label: "Module area", value: "1,646 m² · 45.7 % of the roof" },
  { label: "CO₂ avoided", value: "442.4 t/yr at 0.716 t/MWh" },
];

export const A = option({ key: "29x22x1", letter: "A", caption: "Recommended", ok: true, note: "", n_series: 29, n_strings: 22, n_inverters: 1, dc_kwp: 357.28, dcac: 1.2992, mwh: [617.8405373922709, 600.1603034807486, 584.2475414395242] });
export const B = option({ key: "26x24x1", letter: "B", caption: "Fills the inverter", ok: true, note: "", n_series: 26, n_strings: 24, n_inverters: 1, dc_kwp: 349.44, dcac: 1.270690909090909, mwh: [607.7468423326311, 590.3554513812021, 574.7026570142883] });
export const C = option({ key: "28x22x1", letter: "C", caption: "Lower clipping", ok: true, note: "", n_series: 28, n_strings: 22, n_inverters: 1, dc_kwp: 344.96, dcac: 1.2544, mwh: [602.8964516539205, 585.643860338598, 570.1159899739245] });
export const D = option({ key: "26x27x2", letter: "D", caption: "Below target, 2 inverters", ok: false, note: "below target", n_series: 26, n_strings: 27, n_inverters: 2, dc_kwp: 393.12, dcac: 0.7147636363636364, mwh: [700.9249949800169, 680.8672015597525, 662.8145617945797] });
export const E = option({ key: "28x25x2", letter: "E", caption: "Below target, 2 inverters", ok: false, note: "below target", n_series: 28, n_strings: 25, n_inverters: 2, dc_kwp: 392.0, dcac: 0.7127272727272728, mwh: [700.4622362253473, 680.4176851913169, 662.3769639868403] });

/** Your own, simulated: 26 × 24 × 1 as the engine names it. */
export const YOUR_OWN = { ...B, key: "custom", letter: "F", caption: "Your own", custom: true } as DesignOption;

/** The demo at 1500 V with option A chosen. */
export const DEMO = {
  chosen_option: "29x22x1",
  options: [A, B, C, D, E],
  custom_refused: null,
  no_options: null,
  readouts: READOUTS,
  weather: PVGIS,
  weather_notes: [],
} as unknown as DesignResult;

/** The demo before a system voltage: the API's words, no options, the layout's positions. */
export const BEFORE_A_VOLTAGE = {
  ...DEMO,
  chosen_option: null,
  options: [],
  no_options: {
    code: "system_voltage_missing",
    title: "Choose a system voltage to size the strings",
    message: "600, 1000 or 1500 V. Nothing is sized until you choose.",
  },
} as DesignResult;

/** A's energy with the levels P50, P90 and P99 asked for. */
export const LEVELS_50_90_99 = {
  ...A,
  energy: {
    ...A.energy,
    energy_mwh: 615.742969105515,
    p_values: [
      { level: 50, mwh: 615.742969105515 },
      { level: 90, mwh: 582.2640213556671 },
      { level: 99, mwh: 554.9700115305413 },
    ],
  },
} as DesignOption;
