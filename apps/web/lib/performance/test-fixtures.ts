// The answer of the API for the demo at 1500 V, as the engine gave it for the boards of Phase 8
// (docs/design/mockups/performance_data.json); what Performance does not read is left out. For the tests
// of lib/performance alone.
import type { DesignOption, DesignResult, LayoutReadouts, Losses, LossStep, Module, Project, WeatherSummary } from "../api";

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

/** The 21 steps of the chain for option A, in the engine's order and words. */
export const STEPS: LossStep[] = [
  { label: "Global horizontal irradiation", value: 1822.9150500000003, kind: "irr_total", pct: 0.0 },
  { label: "Transposition to plane (15°)", value: 1997.9848072978216, kind: "irr", pct: 9.603835203281763 },
  { label: "Far shading, horizon", value: 1997.767446582441, kind: "irr", pct: -0.010878997407126612 },
  { label: "Near shading, linear", value: 1990.6832980096908, kind: "irr", pct: -0.3546032640019736 },
  { label: "IAM", value: 1946.4634570781802, kind: "irr", pct: -2.221339827169999 },
  { label: "Soiling", value: 1907.5341879366167, kind: "irr", pct: -1.9999999999999907 },
  { label: "Bifacial rear gain", value: 1977.1657310347105, kind: "irr", pct: 3.6503431256146524 },
  { label: "Array nominal energy at STC", value: 706.4017718286254, kind: "energy_total", pct: 0.0 },
  { label: "Irradiance level", value: 703.007957862582, kind: "energy", pct: -0.48043678560687475 },
  { label: "Temperature", value: 674.3260337902863, kind: "energy", pct: -4.07988611672333 },
  { label: "Electrical shading", value: 670.5218638025673, kind: "energy", pct: -0.5641440189304681 },
  { label: "Module quality", value: 670.5218638025673, kind: "energy", pct: 0.0 },
  { label: "LID (PAN)", value: 669.1808200749622, kind: "energy", pct: -0.19999999999998908 },
  { label: "Mismatch", value: 662.4890118742125, kind: "energy", pct: -1.000000000000012 },
  { label: "DC ohmic", value: 656.1776944711788, kind: "energy", pct: -0.9526674842770033 },
  { label: "Inverter efficiency", value: 647.480291618733, kind: "energy", pct: -1.3254645693885125 },
  { label: "Inverter clipping", value: 625.7122415094187, kind: "energy", pct: -3.3619633510223235 },
  { label: "Night consumption", value: 625.6907183094187, kind: "energy", pct: -0.003439792059700686 },
  { label: "AC ohmic", value: 620.945263710825, kind: "energy", pct: -0.7584345523640956 },
  { label: "Availability", value: 617.8405373922709, kind: "energy", pct: -0.49999999999998934 },
  { label: "Energy to grid", value: 617.8405373922709, kind: "result", pct: 0.0 },
];

/** The same with soiling 3 %: the soiling step and everything after it moved. */
export const STEPS_SOILING_3: LossStep[] = [
  ...STEPS.slice(0, 5),
  { label: "Soiling", value: 1888.0695533658347, kind: "irr", pct: -3.0000000000000027 },
  { label: "Bifacial rear gain", value: 1957.7010964639287, kind: "irr", pct: 3.687975528971532 },
  { label: "Array nominal energy at STC", value: 699.4474479856282, kind: "energy_total", pct: 0.0 },
  { label: "Irradiance level", value: 696.0358335091968, kind: "energy", pct: -0.48775851370345125 },
  { label: "Temperature", value: 667.8543011166847, kind: "energy", pct: -4.048862290671085 },
  { label: "Electrical shading", value: 664.0897010816796, kind: "energy", pct: -0.5636858261915179 },
  { label: "Module quality", value: 664.0897010816796, kind: "energy", pct: 0.0 },
  { label: "LID (PAN)", value: 662.7615216795164, kind: "energy", pct: -0.19999999999997797 },
  { label: "Mismatch", value: 656.1339064627211, kind: "energy", pct: -1.000000000000012 },
  { label: "DC ohmic", value: 649.9419314664023, kind: "energy", pct: -0.9437059928361857 },
  { label: "Inverter efficiency", value: 641.3205051488684, kind: "energy", pct: -1.3264917833631928 },
  { label: "Inverter clipping", value: 621.4085391551222, kind: "energy", pct: -3.1048385064694095 },
  { label: "Night consumption", value: 621.3870159551223, kind: "energy", pct: -0.0034636151008182736 },
  { label: "AC ohmic", value: 616.6974170247711, kind: "energy", pct: -0.7546985710898513 },
  { label: "Availability", value: 613.6139299396473, kind: "energy", pct: -0.49999999999998934 },
  { label: "Energy to grid", value: 613.6139299396473, kind: "result", pct: 0.0 },
];

/** The same with the rear gain off: a step of nothing, and the irradiance never above the transposition's end. */
export const STEPS_REAR_OFF: LossStep[] = [
  ...STEPS.slice(0, 6),
  { label: "Bifacial rear gain", value: 1907.5341879366167, kind: "irr", pct: 0.0 },
  { label: "Array nominal energy at STC", value: 681.5238145821248, kind: "energy_total", pct: 0.0 },
  { label: "Irradiance level", value: 678.0625873165195, kind: "energy", pct: -0.5078659309546762 },
  { label: "Temperature", value: 651.0882490096722, kind: "energy", pct: -3.978148744882126 },
  { label: "Electrical shading", value: 647.2859204760983, kind: "energy", pct: -0.583995877572252 },
  { label: "Module quality", value: 647.2859204760983, kind: "energy", pct: 0.0 },
  { label: "LID (PAN)", value: 645.9913486351461, kind: "energy", pct: -0.20000000000001128 },
  { label: "Mismatch", value: 639.5314351487947, kind: "energy", pct: -0.9999999999999898 },
  { label: "DC ohmic", value: 633.6212428615033, kind: "energy", pct: -0.9241441409234663 },
  { label: "Inverter efficiency", value: 625.1825607500652, kind: "energy", pct: -1.3318180547937541 },
  { label: "Inverter clipping", value: 608.8369709029142, kind: "energy", pct: -2.6145306784533973 },
  { label: "Night consumption", value: 608.8153565029143, kind: "energy", pct: -0.0035501129256210184 },
  { label: "AC ohmic", value: 604.2770131676923, kind: "energy", pct: -0.7454383807416698 },
  { label: "Availability", value: 601.2556281018539, kind: "energy", pct: -0.5000000000000004 },
  { label: "Energy to grid", value: 601.2556281018539, kind: "result", pct: 0.0 },
];

/** The demo's module as the run reads it: bifacial 0.80, LID 0.2 % from the PAN. */
export const MODULE = { is_bifacial: true, bifaciality: 0.8, lid_loss_pct: 0.2 } as Module;

/** A module without a rear side and without a LID in its PAN. */
export const MONOFACIAL_MODULE = { ...MODULE, is_bifacial: false, bifaciality: 0, lid_loss_pct: null } as Module;

/** The losses of the document: the API's defaults. */
export const LOSSES: Losses = {
  soiling_pct: 2,
  lid_pct: null,
  quality_pct: 0,
  mismatch_pct: 1,
  dc_ohmic_pct: 1.5,
  ac_ohmic_pct: 1,
  availability_pct: 99.5,
  degradation_pct: 0.5,
  uc: null,
  uv: 0,
  iam_b0: 0.05,
  bifacial: true,
  rear_loss_pct: 10,
  weather_sigma_pct: 3,
  model_sigma_pct: 3,
  p_levels: [50, 75, 90],
  co2_t_per_mwh: 0.716,
};

/** The demo's document, as far as Performance reads it. */
export const DOCUMENT = {
  name: "Pune demo roof",
  roof: { lat: 18.52, lon: 73.86, roof_type: "flat_tilted", albedo: 0.2 },
  system_voltage: 1500,
  chosen_option: "29x22x1",
  weather_source: "pvgis",
  weather_csv: "",
  losses: LOSSES,
} as unknown as Project;
/** The twelve months of option A, as the engine gave them; the other options carry the same, which the tests do not read. */
export const MONTHLY_MWH = [61.97682146826141, 58.79364133154329, 68.3587805746761, 64.06454328710302, 54.884438240387944, 46.89823325447351, 31.498840316903788, 38.46397750953585, 37.485927357567085, 53.41040182150799, 53.45558848406465, 48.54934374624629];

/** The 25 years of option A at the default degradation of 0.5 %/yr. */
export const YEARS_MWH = [617.8405373922709, 614.7513347053095, 611.677578031783, 608.6191901416241, 605.5760941909159, 602.5482137199614, 599.5354726513616, 596.5377952881047, 593.5551063116642, 590.5873307801058, 587.6343941262054, 584.6962221555743, 581.7727410447965, 578.8638773395725, 575.9695579528747, 573.0897101631102, 570.2242616122946, 567.3731403042332, 564.5362746027121, 561.7135932296984, 558.90502526355, 556.1105001372323, 553.3299476365461, 550.5632978983633, 547.8104814088715];

/** The same at 0.70 %/yr: year 1 unchanged, the rest lower. */
export const YEARS_MWH_AT_0_7 = [617.8405373922709, 613.515653630525, 609.2210440551113, 604.9564967467255, 600.7218012694984, 596.5167486606119, 592.3411314199877, 588.1947435000477, 584.0773802955474, 579.9888386334786, 575.9289167630442, 571.8974143457029, 567.894132445283, 563.918873518166, 559.9714414035388, 556.0516413137141, 552.1592798245181, 548.2941648657464, 544.4561057116862, 540.6449129717043, 536.8603985809025, 533.1023757908362, 529.3706591603003, 525.6650645461782, 521.985409094355];

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
      lid_pct: 0.2,
      steps: STEPS,
      co2_t: 442.37382477286593,
      total_25_years_mwh: 14553.821678088736,
      monthly_mwh: MONTHLY_MWH,
      years_mwh: YEARS_MWH,
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
  equipment: { module: MODULE },
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

/** A's energy with a degradation of 0.70 %/yr entered: year 1 the same, year 25 and the total lower. */
export const DEGRADATION_0_7 = {
  ...A,
  energy: { ...A.energy, years_mwh: YEARS_MWH_AT_0_7, total_25_years_mwh: 14215.575165939481 },
} as DesignOption;

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
