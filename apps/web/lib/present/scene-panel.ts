// The panel of figures of each scene of Present (the boards "UI fixes · Present, the figures of each scene", D72): a
// title, the lead figure that counts as the scene plays, in the place of its final value (`holds`), and the figures
// that stand. From the design's facts, the scene's share and the reveal of the tour alone: nothing is asked. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, LayoutResponse, Project } from "../api";
import { areaOf } from "../geometry/measure";
import { dateOf } from "../flow/sun-time";
import { hourOf } from "../geometry/keepout";
import { revealedCountOf } from "../scene/reveal";
import type { Reveal } from "../stores/view-store";
import { countedAt, countingEnergy } from "./counting";
import { ENERGY_LABEL } from "./figures";
import type { SceneId } from "./tour";

export type PanelFigure = {
  label: string;
  number: string;
  unit: string;
  /** The final value of a figure that counts, whose place it holds from the start. */
  holds?: string;
};

export type ScenePanel = { title: string; lead: PanelFigure; others: PanelFigure[] };

/** What the panels say of the design: plain numbers, gathered from the stores by who shows them. */
export type SceneFacts = {
  roof: {
    areaM2: number;
    lat: number;
    lon: number;
    obstacles: number;
    parapetM: number;
    /** Length and width as typed for a rectangle; null for a roof drawn by its corners. */
    size: { length: number; width: number } | null;
    corners: number;
  };
  layout: { positions: number; rows: number } | null;
  array: { tiltDeg: number; orientation: "portrait" | "landscape" };
  sun: { dayOfYear: number; hour: number; elevationDeg: number | null; azimuthDeg: number | null } | null;
  option: {
    dcKwp: number;
    strings: number;
    series: number;
    inverters: number;
    acKw: number;
    energyMwh: number;
    yieldKwhKwp: number;
    /** As a fraction: 0.866 is 86.6 %. */
    pr: number;
  } | null;
};

type Stores = {
  project: Project;
  layout: LayoutResponse | null;
  sunDay: { dayOfYear: number } | null;
  /** The view's hour, solar time. */
  hour: number;
  sun: { elevationDeg: number; azimuthDeg: number } | null;
  option: DesignOption | null;
};

/** The tilt the modules stand at: the array's for tilted rows, east-west's own, the roof's slope for flush modules. */
function tiltOf(project: Project): number {
  if (project.roof.roof_type === "flat_ew") return project.array.ew_tilt_deg;
  if (project.roof.roof_type === "sloped_flush") return project.roof.slope_deg;
  return project.array.tilt_deg;
}

/** The facts of the panels from what the stores hold: the roof from its outline and its input, the layout's readouts. */
export function sceneFactsOf({ project, layout, sunDay, hour, sun, option }: Stores): SceneFacts {
  const { roof, roof_input: input } = project;
  const isUp = sun !== null && sun.elevationDeg > 0;
  return {
    roof: {
      areaM2: areaOf(roof.outline.map(([x, y]) => ({ x, y }))),
      lat: roof.lat,
      lon: roof.lon,
      obstacles: roof.obstacles.length,
      parapetM: roof.parapet_h,
      size: input.mode === "rect" ? { length: input.length, width: input.width } : null,
      corners: roof.outline.length,
    },
    layout: layout ? { positions: layout.readouts.positions, rows: layout.readouts.rows } : null,
    array: { tiltDeg: tiltOf(project), orientation: project.array.orientation },
    sun: sunDay ? { dayOfYear: sunDay.dayOfYear, hour, elevationDeg: isUp ? sun.elevationDeg : null, azimuthDeg: isUp ? sun.azimuthDeg : null } : null,
    option: option
      ? {
          dcKwp: option.dc_kwp,
          strings: option.n_strings,
          series: option.n_series,
          inverters: option.n_inverters,
          acKw: option.energy.ac_kw,
          energyMwh: option.energy.energy_mwh,
          yieldKwhKwp: option.energy.specific_yield,
          pr: option.energy.pr,
        }
      : null,
  };
}

/** Where the tour is: the share of the scene, the share of the energy's count, the reveal of the stage. */
export type SceneAt = { share: number; figures: number; reveal: Reveal };

/** A figure counts over the first three quarters of its scene, then stands at its value. */
const COUNTING = 0.75;
const countShare = (share: number) => Math.min(1, Math.max(0, share / COUNTING));

function counting(label: string, value: number, decimals: number, unit: string, share: number): PanelFigure {
  return { label, number: shown(countedAt(value, countShare(share)), decimals), unit, holds: shown(value, decimals) };
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
const compassOf = (azimuthDeg: number) => COMPASS[Math.round((((azimuthDeg % 360) + 360) % 360) / 45) % 8];
const degrees = (value: number, decimals: number) => `${shown(value, decimals)}°`;
const DASH = "–";

/** The panel of a scene; null while its facts are not there yet (a scene waits with its panel away). */
export function scenePanelOf(scene: SceneId, at: SceneAt, facts: SceneFacts): ScenePanel | null {
  const { roof, layout, array, sun, option } = facts;
  switch (scene) {
    case "satellite":
      return {
        title: "1 · The place",
        lead: counting("Roof area", roof.areaM2, 0, "m²", at.share),
        others: [
          { label: "Latitude", number: degrees(Math.abs(roof.lat), 2), unit: roof.lat < 0 ? "S" : "N" },
          { label: "Longitude", number: degrees(Math.abs(roof.lon), 2), unit: roof.lon < 0 ? "W" : "E" },
        ],
      };
    case "rising":
      return {
        title: "2 · The roof",
        lead: { label: "Obstacles", number: shown(revealedCountOf(roof.obstacles, at.reveal.obstacles), 0), unit: `of ${shown(roof.obstacles, 0)}`, holds: shown(roof.obstacles, 0) },
        others: [
          roof.size ? { label: "Roof", number: `${shown(roof.size.length, 1)} × ${shown(roof.size.width, 1)}`, unit: "m" } : { label: "Corners", number: shown(roof.corners, 0), unit: "" },
          { label: "Parapet", number: shown(roof.parapetM, 1), unit: "m" },
        ],
      };
    case "filling":
      if (!layout) return null;
      return {
        title: "3 · The array",
        lead: { label: "Positions", number: shown(revealedCountOf(layout.positions, at.reveal.modules), 0), unit: `of ${shown(layout.positions, 0)}`, holds: shown(layout.positions, 0) },
        others: [
          { label: "Rows", number: shown(layout.rows, 0), unit: "" },
          { label: "Tilt", number: degrees(array.tiltDeg, 0), unit: array.orientation },
        ],
      };
    case "day":
      if (!sun) return null;
      return {
        title: `4 · The sun, ${dateOf(sun.dayOfYear).long}`,
        lead: { label: "Solar time", number: hourOf(sun.hour), unit: "", holds: "00:00" },
        others: [
          { label: "Sun height", number: sun.elevationDeg === null ? DASH : degrees(sun.elevationDeg, 1), unit: "" },
          { label: "Bearing", number: sun.azimuthDeg === null ? DASH : degrees(sun.azimuthDeg, 0), unit: sun.azimuthDeg === null ? "" : compassOf(sun.azimuthDeg) },
        ],
      };
    case "strings":
      if (!option) return null;
      return {
        title: "5 · The strings",
        lead: counting("DC capacity", option.dcKwp, 2, "kWp", at.share),
        others: [
          { label: "Strings", number: `${shown(option.strings, 0)} × ${shown(option.series, 0)}`, unit: "modules" },
          { label: option.inverters === 1 ? "Inverter" : "Inverters", number: `${shown(option.inverters, 0)} × ${shown(option.acKw / option.inverters, 0)}`, unit: "kW" },
        ],
      };
    case "energy": {
      if (!option) return null;
      const { number, unit, holds } = countingEnergy(option.energyMwh, at.figures);
      return {
        title: "6 · The energy",
        lead: { label: ENERGY_LABEL, number, unit: unit ?? "MWh", holds },
        others: [
          { label: "Yield", number: shown(option.yieldKwhKwp, 0), unit: "kWh/kWp" },
          { label: "PR", number: shown(option.pr * 100, 1), unit: "%" },
        ],
      };
    }
  }
}
