// The panel of each scene of Present (V2 · 13, D110; D72's place and look): the scene's name, its one figure and the
// figure's label. The energy counts up in the place of its final value (`holds`); nothing else counts, no obstacle or
// position as it rises (V2-96). From the design's facts and the energy's count alone: nothing is asked. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignOption, LayoutResponse, Project } from "../api";
import { areaOf } from "../geometry/measure";
import { dateOf } from "../flow/sun-time";
import { hourOf } from "../geometry/keepout";
import { countingEnergy } from "./counting";
import type { SceneId } from "./tour";

export type ScenePanel = {
  name: string;
  figure: string;
  /** The final value of a figure that counts, whose place it holds from the start. */
  holds?: string;
  label: string;
};

/** What the panels say of the design: plain numbers, gathered from the stores by who shows them. */
export type SceneFacts = {
  roof: { areaM2: number; lat: number; lon: number; obstacles: number };
  layout: { positions: number; rows: number } | null;
  /** The sun's height is null while it is below the horizon. */
  sun: { dayOfYear: number; hour: number; elevationDeg: number | null } | null;
  option: { dcKwp: number; strings: number; series: number; energyMwh: number } | null;
};

type Stores = {
  project: Project;
  layout: LayoutResponse | null;
  sunDay: { dayOfYear: number } | null;
  /** The view's hour, solar time. */
  hour: number;
  sun: { elevationDeg: number } | null;
  option: DesignOption | null;
};

/** The facts of the panels from what the stores hold: the roof from its outline, the layout's readouts. */
export function sceneFactsOf({ project, layout, sunDay, hour, sun, option }: Stores): SceneFacts {
  const { roof } = project;
  return {
    roof: { areaM2: areaOf(roof.outline.map(([x, y]) => ({ x, y }))), lat: roof.lat, lon: roof.lon, obstacles: roof.obstacles.length },
    layout: layout ? { positions: layout.readouts.positions, rows: layout.readouts.rows } : null,
    sun: sunDay ? { dayOfYear: sunDay.dayOfYear, hour, elevationDeg: sun !== null && sun.elevationDeg > 0 ? sun.elevationDeg : null } : null,
    option: option ? { dcKwp: option.dc_kwp, strings: option.n_strings, series: option.n_series, energyMwh: option.energy.energy_mwh } : null,
  };
}

const counted = (count: number, one: string) => `${shown(count, 0)} ${one}${count === 1 ? "" : "s"}`;
const degrees = (value: number, positive: string, negative: string) => `${shown(Math.abs(value), 2)}° ${value < 0 ? negative : positive}`;

/** The panel of a scene at the energy's count (0 to 1); null while its facts are not there yet (a scene waits with its panel away). */
export function scenePanelOf(scene: SceneId, figures: number, facts: SceneFacts): ScenePanel | null {
  const { roof, layout, sun, option } = facts;
  switch (scene) {
    case "satellite":
      return { name: "The place", figure: `${degrees(roof.lat, "N", "S")} · ${degrees(roof.lon, "E", "W")}`, label: "Latitude · longitude" };
    case "rising":
      return { name: "The roof", figure: `${shown(roof.areaM2, 0)} m²`, label: roof.obstacles === 0 ? "Roof area" : `Roof area · ${counted(roof.obstacles, "obstacle")}` };
    case "filling":
      if (!layout) return null;
      return { name: "The array", figure: shown(layout.positions, 0), label: `Module positions · ${counted(layout.rows, "row")}` };
    case "day":
      if (!sun) return null;
      return {
        name: `The sun · ${dateOf(sun.dayOfYear).long}`,
        figure: hourOf(sun.hour),
        label: sun.elevationDeg === null ? "Solar time" : `Solar time · sun ${shown(sun.elevationDeg, 1)}° high`,
      };
    case "strings":
      if (!option) return null;
      return { name: "The strings", figure: `${shown(option.dcKwp, 2)} kWp`, label: `${counted(option.strings, "string")} of ${shown(option.series, 0)} modules` };
    case "energy": {
      if (!option) return null;
      const { number, unit, holds } = countingEnergy(option.energyMwh, figures);
      return { name: "The energy", figure: `${number} ${unit ?? "MWh"}`, holds: `${holds} MWh`, label: "Energy to the grid in year 1" };
    }
  }
}
