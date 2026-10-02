import { describe, expect, test } from "bun:test";
import type { Project, Weather } from "../api";
import { DOCUMENT } from "./test-fixtures";
import { stepOfLoading, weatherRequestOf, withWeatherLoaded } from "./weather-source";

const PVGIS_DOCUMENT = { ...DOCUMENT, weather_source: "pvgis", weather_csv: "", weather_csv_text: "", weather_json: null } as Project;
const CSV_DOCUMENT = { ...PVGIS_DOCUMENT, weather_source: "csv", weather_csv: "pune-ghi.csv", weather_csv_text: "time,ghi\n2019-01-01T00:00,0" } as Project;
const HOURS = { source: "pvgis", label: "PVGIS TMY", time: ["2019-01-01T00:00:00+00:00"] } as unknown as Weather;

describe("the weather a design without any is given (plan/phase-08-plan.md, decision 11)", () => {
  test("the request asks the document's source for the roof's place", () => {
    expect(weatherRequestOf(PVGIS_DOCUMENT)).toEqual({ source: "pvgis", lat: 18.52, lon: 73.86, csv_name: "", csv_text: "" });
    expect(weatherRequestOf({ ...PVGIS_DOCUMENT, weather_source: "nasa" } as Project).source).toBe("nasa");
  });

  test("a CSV document sends its file's name and text", () => {
    expect(weatherRequestOf(CSV_DOCUMENT)).toEqual({ source: "csv", lat: 18.52, lon: 73.86, csv_name: "pune-ghi.csv", csv_text: "time,ghi\n2019-01-01T00:00,0" });
  });

  test("the step says which weather is loaded, by the name of its source", () => {
    expect(stepOfLoading(PVGIS_DOCUMENT)).toBe("Loading PVGIS TMY weather");
    expect(stepOfLoading({ ...PVGIS_DOCUMENT, weather_source: "nasa" } as Project)).toBe("Loading NASA POWER 2023 weather");
    expect(stepOfLoading(CSV_DOCUMENT)).toBe("Reading pune-ghi.csv");
  });

  test("the hours that come go into the document as its weather, and nothing else changes", () => {
    const amended = withWeatherLoaded(HOURS)(PVGIS_DOCUMENT);

    expect(amended.weather_json).toBe(HOURS);
    expect({ ...amended, weather_json: null }).toEqual<Project>(PVGIS_DOCUMENT);
    expect(PVGIS_DOCUMENT.weather_json).toBeNull();
  });
});
