import { describe, expect, test } from "bun:test";
import type { DesignOption, LayoutResponse, Project } from "../api";
import { sceneFactsOf, scenePanelOf, type SceneFacts } from "./scene-panel";

// The panel of each scene (the boards "UI fixes · Present, the figures of each scene", D72): its title, the lead
// figure counting as the scene plays in the place of its final value, the others standing. The demo's facts.

const DEMO: SceneFacts = {
  roof: { areaM2: 3600, lat: 18.52, lon: 73.86, obstacles: 6, parapetM: 0.9, size: { length: 90, width: 40 }, corners: 4 },
  layout: { positions: 790, rows: 6 },
  array: { tiltDeg: 15, orientation: "portrait" },
  sun: { dayOfYear: 355, hour: 10.37, elevationDeg: 41.7, azimuthDeg: 149.4 },
  option: { dcKwp: 357.28, strings: 22, series: 29, inverters: 1, acKw: 275, energyMwh: 617.84, yieldKwhKwp: 1729.4, pr: 0.8655 },
};
const NONE_REVEALED = { building: 0, obstacles: 0, modules: 0 };
const ALL_REVEALED = { building: 1, obstacles: 1, modules: 1 };

describe("the panel of each scene", () => {
  test("1 · the place: the roof's area counts to its whole, the place stands", () => {
    expect(scenePanelOf("satellite", { share: 1, figures: 0, reveal: NONE_REVEALED }, DEMO)).toEqual({
      title: "1 · The place",
      lead: { label: "Roof area", number: "3,600", unit: "m²", holds: "3,600" },
      others: [
        { label: "Latitude", number: "18.52°", unit: "N" },
        { label: "Longitude", number: "73.86°", unit: "E" },
      ],
    });
    expect(scenePanelOf("satellite", { share: 0, figures: 0, reveal: NONE_REVEALED }, DEMO)?.lead.number).toBe("0");
  });

  test("2 · the roof: the obstacles count as they rise; the roof's size by hand, else its corners; the parapet", () => {
    const halfway = scenePanelOf("rising", { share: 0.75, figures: 0, reveal: { building: 1, obstacles: 0.5, modules: 0 } }, DEMO);
    expect(halfway).toEqual({
      title: "2 · The roof",
      lead: { label: "Obstacles", number: "3", unit: "of 6", holds: "6" },
      others: [
        { label: "Roof", number: "90.0 × 40.0", unit: "m" },
        { label: "Parapet", number: "0.9", unit: "m" },
      ],
    });
    const drawn = scenePanelOf("rising", { share: 1, figures: 0, reveal: ALL_REVEALED }, { ...DEMO, roof: { ...DEMO.roof, size: null, corners: 6 } });
    expect(drawn?.others[0]).toEqual({ label: "Corners", number: "6", unit: "" });
  });

  test("3 · the array: the positions count with the rows as they fill; the rows and the tilt stand", () => {
    expect(scenePanelOf("filling", { share: 0.6, figures: 0, reveal: { building: 1, obstacles: 1, modules: 0.6 } }, DEMO)).toEqual({
      title: "3 · The array",
      lead: { label: "Positions", number: "474", unit: "of 790", holds: "790" },
      others: [
        { label: "Rows", number: "6", unit: "" },
        { label: "Tilt", number: "15°", unit: "portrait" },
      ],
    });
  });

  test("4 · the sun: its day in the title, the solar time, the sun's height and bearing", () => {
    expect(scenePanelOf("day", { share: 0.35, figures: 0, reveal: ALL_REVEALED }, DEMO)).toEqual({
      title: "4 · The sun, 21 December",
      lead: { label: "Solar time", number: "10:22", unit: "", holds: "00:00" },
      others: [
        { label: "Sun height", number: "41.7°", unit: "" },
        { label: "Bearing", number: "149°", unit: "SE" },
      ],
    });
  });

  test("5 · the strings: the DC capacity counts; the strings and the inverters stand", () => {
    expect(scenePanelOf("strings", { share: 1, figures: 0, reveal: ALL_REVEALED }, DEMO)).toEqual({
      title: "5 · The strings",
      lead: { label: "DC capacity", number: "357.28", unit: "kWp", holds: "357.28" },
      others: [
        { label: "Strings", number: "22 × 29", unit: "modules" },
        { label: "Inverter", number: "1 × 275", unit: "kW" },
      ],
    });
  });

  test("6 · the energy: it counts with the figures' share; the yield and the PR stand", () => {
    expect(scenePanelOf("energy", { share: 0.2, figures: 1, reveal: ALL_REVEALED }, DEMO)).toEqual({
      title: "6 · The energy",
      lead: { label: "Energy to grid, year 1", number: "617.8", unit: "MWh", holds: "617.8" },
      others: [
        { label: "Yield", number: "1,729", unit: "kWh/kWp" },
        { label: "PR", number: "86.6", unit: "%" },
      ],
    });
    expect(scenePanelOf("energy", { share: 0.2, figures: 0, reveal: ALL_REVEALED }, DEMO)?.lead.number).toBe("0.0");
  });

  test("a scene whose facts are not there yet has no panel: the array before its layout, the sun, the strings and the energy before a run", () => {
    const bare: SceneFacts = { ...DEMO, layout: null, sun: null, option: null };
    expect(scenePanelOf("filling", { share: 1, figures: 0, reveal: ALL_REVEALED }, bare)).toBeNull();
    expect(scenePanelOf("day", { share: 1, figures: 0, reveal: ALL_REVEALED }, bare)).toBeNull();
    expect(scenePanelOf("strings", { share: 1, figures: 0, reveal: ALL_REVEALED }, bare)).toBeNull();
    expect(scenePanelOf("energy", { share: 1, figures: 1, reveal: ALL_REVEALED }, bare)).toBeNull();
  });

  test("a counting figure never has more characters than the one it holds", () => {
    for (const scene of ["satellite", "rising", "filling", "strings", "energy"] as const) {
      for (let step = 0; step <= 100; step += 1) {
        const share = step / 100;
        const panel = scenePanelOf(scene, { share, figures: share, reveal: { building: 1, obstacles: share, modules: share } }, DEMO);
        expect(panel?.lead.number.length ?? 0).toBeLessThanOrEqual(panel?.lead.holds?.length ?? 0);
      }
    }
  });
});

describe("the facts of the panels, from the stores", () => {
  const roof = {
    lat: 18.52,
    lon: 73.86,
    outline: [[-45, -20], [45, -20], [45, 20], [-45, 20]],
    obstacles: [{}, {}, {}, {}, {}, {}],
    parapet_h: 0.9,
    roof_type: "flat_tilted",
    slope_deg: 0,
  };
  const project = {
    roof,
    roof_input: { mode: "rect", length: 90, width: 40 },
    array: { tilt_deg: 15, ew_tilt_deg: 10, orientation: "portrait" },
  } as unknown as Project;
  const layout = { readouts: { positions: 790, rows: 6 } } as unknown as LayoutResponse;
  // Option A of the demo, with what the panels read of it alone (a fixture of its own: Present's tests stay in its group).
  const option = {
    dc_kwp: 357.28,
    n_strings: 22,
    n_series: 29,
    n_inverters: 1,
    energy: { ac_kw: 275, energy_mwh: 617.84, specific_yield: 1729.4, pr: 0.8655 },
  } as unknown as DesignOption;

  test("the demo's facts: the roof from its outline and its input, the layout's readouts, the sun at the hour, the chosen option", () => {
    expect(sceneFactsOf({ project, layout, sunDay: { dayOfYear: 355 }, hour: 10.37, sun: { elevationDeg: 41.7, azimuthDeg: 149.4 }, option })).toEqual(DEMO);
  });

  test("a roof by its corners has no size; the tilt is the roof type's: east-west's own, a sloped roof's slope", () => {
    const drawn = { ...project, roof_input: { ...project.roof_input, mode: "corners" } } as Project;
    expect(sceneFactsOf({ project: drawn, layout: null, sunDay: null, hour: 12, sun: null, option: null }).roof.size).toBeNull();
    const eastWest = { ...project, roof: { ...project.roof, roof_type: "flat_ew" } } as Project;
    expect(sceneFactsOf({ project: eastWest, layout: null, sunDay: null, hour: 12, sun: null, option: null }).array.tiltDeg).toBe(10);
    const sloped = { ...project, roof: { ...project.roof, roof_type: "sloped_flush", slope_deg: 20 } } as Project;
    expect(sceneFactsOf({ project: sloped, layout: null, sunDay: null, hour: 12, sun: null, option: null }).array.tiltDeg).toBe(20);
  });

  test("before the layout, the day or a run: no layout, no sun, no option; the sun below the horizon has no height or bearing", () => {
    const bare = sceneFactsOf({ project, layout: null, sunDay: null, hour: 12, sun: null, option: null });
    expect([bare.layout, bare.sun, bare.option]).toEqual([null, null, null]);
    const night = sceneFactsOf({ project, layout, sunDay: { dayOfYear: 355 }, hour: 3, sun: { elevationDeg: -40, azimuthDeg: 20 }, option });
    expect(night.sun).toEqual({ dayOfYear: 355, hour: 3, elevationDeg: null, azimuthDeg: null });
  });
});
