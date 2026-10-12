import { describe, expect, test } from "bun:test";
import openapi from "@rooftop/api-types/openapi.json";
import type { DesignResult, Project } from "../api";
import { assumptionRowsOf, weatherFactsOf } from "./assumption-rows";
import { LOSS_DEFAULTS } from "./loss-defaults";
import { DEMO, DOCUMENT, LOSSES, NASA } from "./test-fixtures";

type Schema = { properties: Record<string, { default?: unknown }> };
const losses = (openapi.components.schemas as unknown as Record<string, Schema>).Losses!;

const rowOf = (document: Project, id: string, design: DesignResult | null = DEMO) => assumptionRowsOf(document, design).find((row) => row.id === id)!;

describe("the assumptions (V2 · 8, D104): one line each, with who set it", () => {
  test("five, in the board's order and words", () => {
    expect(assumptionRowsOf(DOCUMENT, DEMO).map((row) => [row.title, row.facts, row.setBy])).toEqual([
      ["Weather", "Typical year · PVGIS · 1,822.9 kWh/m² on the ground", "Default"],
      ["Roof albedo", "0.20 · how much light the roof reflects", "Default"],
      ["Ageing", "0.5 % less each year", "Default"],
      ["Uncertainty", "4.24 % · sets Likely and Conservative", "Default"],
      ["Grid CO₂ per MWh", "0.716 t · India's grid", "Set for India"],
    ]);
  });

  test("another weather is the user's, named in the select's words", () => {
    const nasa = { ...DOCUMENT, weather_source: "nasa" } as Project;
    expect(rowOf(nasa, "weather", { ...DEMO, weather: NASA } as DesignResult)).toMatchObject({ facts: "2023, measured · NASA POWER · 1,815.7 kWh/m² on the ground", setBy: "Yours" });
    const csv = { ...DOCUMENT, weather_source: "csv", weather_csv: "pune.csv" } as Project;
    expect(rowOf(csv, "weather", { ...DEMO, weather: { ...NASA, source: "csv", label: "pune.csv" } } as DesignResult)).toMatchObject({ facts: "Your file · pune.csv · 1,815.7 kWh/m² on the ground", setBy: "Yours" });
  });

  test("before a run the weather is named alone", () => {
    expect(rowOf({ ...DOCUMENT, weather_source: "pvgis" } as Project, "weather", null).facts).toBe("Typical year · PVGIS");
  });

  test("a value the user changed is theirs", () => {
    const changed = { ...DOCUMENT, roof: { ...DOCUMENT.roof, albedo: 0.3 }, losses: { ...LOSSES, degradation_pct: 0.7, model_sigma_pct: 4, co2_t_per_mwh: 0.82 } } as Project;
    expect(assumptionRowsOf(changed, DEMO).map((row) => [row.facts, row.setBy])).toEqual([
      ["Typical year · PVGIS · 1,822.9 kWh/m² on the ground", "Default"],
      ["0.30 · how much light the roof reflects", "Yours"],
      ["0.7 % less each year", "Yours"],
      ["5.00 % · sets Likely and Conservative", "Yours"],
      ["0.820 t", "Yours"],
    ]);
  });

  test("other exceedance levels are the user's uncertainty", () => {
    expect(rowOf({ ...DOCUMENT, losses: { ...LOSSES, p_levels: [50, 90, 99] } } as Project, "uncertainty").setBy).toBe("Yours");
  });

  test("the defaults are the API's", () => {
    for (const [id, value] of Object.entries(LOSS_DEFAULTS)) expect([id, losses.properties[id]?.default]).toEqual([id, value]);
  });
});

describe("the weather's facts, when the row is open", () => {
  test("its hours, temperatures and horizon", () => {
    expect(weatherFactsOf(DEMO.weather)).toBe("8,760 hours · 11.9 to 39.3 °C · horizon up to 2.7°");
    expect(weatherFactsOf(NASA)).toBe("8,760 hours · 8.9 to 40.3 °C · no horizon");
  });
});
