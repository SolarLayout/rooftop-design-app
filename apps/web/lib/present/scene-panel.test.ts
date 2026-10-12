import { describe, expect, test } from "bun:test";
import type { DesignOption, LayoutResponse, Project } from "../api";
import { sceneFactsOf, scenePanelOf, type SceneFacts } from "./scene-panel";

// The panel of each scene (V2 · 13, D110; D72's place and look): the scene's name, its one figure, the figure's label.
// The energy counts up in the place of its final value; nothing else counts (V2-96). The demo's facts.

const DEMO: SceneFacts = {
  roof: { areaM2: 3600, lat: 18.52, lon: 73.86, obstacles: 6 },
  layout: { positions: 790, rows: 6 },
  sun: { dayOfYear: 355, hour: 10.5, elevationDeg: 42.6 },
  option: { dcKwp: 357.28, strings: 22, series: 29, energyMwh: 617.84 },
};

describe("the panel of each scene", () => {
  test("the six, in the board's words and the demo's numbers", () => {
    const panels = (["satellite", "rising", "filling", "day", "strings", "energy"] as const).map((scene) => scenePanelOf(scene, 1, DEMO));

    expect(panels).toEqual([
      { name: "The place", figure: "18.52° N · 73.86° E", label: "Latitude · longitude" },
      { name: "The roof", figure: "3,600 m²", label: "Roof area · 6 obstacles" },
      { name: "The array", figure: "790", label: "Module positions · 6 rows" },
      { name: "The sun · 21 December", figure: "10:30", label: "Solar time · sun 42.6° high" },
      { name: "The strings", figure: "357.28 kWp", label: "22 strings of 29 modules" },
      { name: "The energy", figure: "617.8 MWh", holds: "617.8 MWh", label: "Energy to the grid in year 1" },
    ]);
  });

  test("the energy counts up with the figures' share, in the place of its final value", () => {
    expect(scenePanelOf("energy", 0, DEMO)?.figure).toBe("0.0 MWh");
    expect(scenePanelOf("energy", 0.5, DEMO)?.figure).toBe("540.6 MWh");
    for (let step = 0; step <= 100; step += 1) {
      const panel = scenePanelOf("energy", step / 100, DEMO);
      expect(panel?.figure.length ?? 0).toBeLessThanOrEqual(panel?.holds?.length ?? 0);
    }
  });

  test("no count of the obstacles or the positions as they rise (V2-96): the roof and the array stand at their whole", () => {
    expect(scenePanelOf("rising", 0, DEMO)?.label).toBe("Roof area · 6 obstacles");
    expect(scenePanelOf("filling", 0, DEMO)?.figure).toBe("790");
  });

  test("one obstacle, one row, one string, in the singular; a roof without obstacles says the area alone", () => {
    const one: SceneFacts = { ...DEMO, roof: { ...DEMO.roof, obstacles: 1 }, layout: { positions: 12, rows: 1 }, option: { ...DEMO.option!, strings: 1 } };

    expect(scenePanelOf("rising", 1, one)?.label).toBe("Roof area · 1 obstacle");
    expect(scenePanelOf("filling", 1, one)?.label).toBe("Module positions · 1 row");
    expect(scenePanelOf("strings", 1, one)?.label).toBe("1 string of 29 modules");
    expect(scenePanelOf("rising", 1, { ...DEMO, roof: { ...DEMO.roof, obstacles: 0 } })?.label).toBe("Roof area");
  });

  test("the place south and west; the sun below the horizon says the time alone", () => {
    expect(scenePanelOf("satellite", 1, { ...DEMO, roof: { ...DEMO.roof, lat: -33.87, lon: -70.65 } })?.figure).toBe("33.87° S · 70.65° W");
    expect(scenePanelOf("day", 1, { ...DEMO, sun: { dayOfYear: 355, hour: 5, elevationDeg: null } })?.label).toBe("Solar time");
  });

  test("a scene whose facts are not there yet has no panel: the array before its layout, the sun, the strings and the energy before a run", () => {
    const bare: SceneFacts = { ...DEMO, layout: null, sun: null, option: null };
    expect((["filling", "day", "strings", "energy"] as const).map((scene) => scenePanelOf(scene, 1, bare))).toEqual([null, null, null, null]);
  });
});

describe("the facts of the panels, from the stores", () => {
  const roof = { lat: 18.52, lon: 73.86, outline: [[-45, -20], [45, -20], [45, 20], [-45, 20]], obstacles: [{}, {}, {}, {}, {}, {}] };
  const project = { roof } as unknown as Project;
  const layout = { readouts: { positions: 790, rows: 6 } } as unknown as LayoutResponse;
  // Option A of the demo, with what the panels read of it alone (a fixture of its own: Present's tests stay in its group).
  const option = { dc_kwp: 357.28, n_strings: 22, n_series: 29, energy: { energy_mwh: 617.84 } } as unknown as DesignOption;

  test("the demo's facts: the roof from its outline, the layout's readouts, the sun at the hour, the chosen option", () => {
    expect(sceneFactsOf({ project, layout, sunDay: { dayOfYear: 355 }, hour: 10.5, sun: { elevationDeg: 42.6 }, option })).toEqual(DEMO);
  });

  test("before the layout, the day or a run: no layout, no sun, no option; the sun below the horizon has no height", () => {
    const bare = sceneFactsOf({ project, layout: null, sunDay: null, hour: 12, sun: null, option: null });
    expect([bare.layout, bare.sun, bare.option]).toEqual([null, null, null]);
    const night = sceneFactsOf({ project, layout, sunDay: { dayOfYear: 355 }, hour: 3, sun: { elevationDeg: -40 }, option });
    expect(night.sun).toEqual({ dayOfYear: 355, hour: 3, elevationDeg: null });
  });
});
