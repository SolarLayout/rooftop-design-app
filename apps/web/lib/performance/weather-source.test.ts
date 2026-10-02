import { describe, expect, test } from "bun:test";
import type { Project, Weather } from "../api";
import { DOCUMENT } from "./test-fixtures";
import { loadingWordsOf, stepOfLoading, WEATHER_ITEMS, weatherRequestOf, weatherShownOf, withWeather, withWeatherLoaded } from "./weather-source";

const PVGIS_DOCUMENT = { ...DOCUMENT, weather_source: "pvgis", weather_csv: "", weather_csv_text: "", weather_json: null } as Project;
const CSV_DOCUMENT = { ...PVGIS_DOCUMENT, weather_source: "csv", weather_csv: "pune-ghi.csv", weather_csv_text: "time,ghi\n2019-01-01T00:00,0" } as Project;
const HOURS = { source: "pvgis", label: "PVGIS TMY", time: ["2019-01-01T00:00:00+00:00"] } as unknown as Weather;
const NASA_HOURS = { source: "nasa", label: "NASA POWER 2023", time: ["2023-01-01T00:00:00+00:00"] } as unknown as Weather;
const PVGIS_WITH_HOURS = { ...PVGIS_DOCUMENT, weather_json: HOURS } as Project;

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

describe("the weather source (decision 12)", () => {
  test("the select's choices, each with its fact: the year it is and whether it brings a horizon", () => {
    expect(WEATHER_ITEMS).toEqual([
      { value: "pvgis", label: "PVGIS TMY", fact: "Typical year · PVGIS horizon" },
      { value: "nasa", label: "NASA POWER 2023", fact: "The year 2023 · no horizon" },
    ]);
  });

  test("the words of the trigger are the document's source by its name; a CSV document names its file", () => {
    expect(weatherShownOf(PVGIS_DOCUMENT)).toBe("PVGIS TMY");
    expect(weatherShownOf({ ...PVGIS_DOCUMENT, weather_source: "nasa" } as Project)).toBe("NASA POWER 2023");
    expect(weatherShownOf(CSV_DOCUMENT)).toBe("pune-ghi.csv");
  });

  test("the words of a load on its way", () => {
    expect(loadingWordsOf("nasa")).toBe("Loading NASA POWER 2023 weather");
  });

  test("NASA chosen: one edit sets the source and its hours, and clears what was a CSV's", () => {
    const edited = withWeather({ ...CSV_DOCUMENT, weather_json: HOURS } as Project, { source: "nasa", weather: NASA_HOURS });

    expect(edited.weather_source).toBe("nasa");
    expect(edited.weather_json).toBe(NASA_HOURS);
    expect(edited.weather_csv).toBe("");
    expect(edited.weather_csv_text).toBe("");
    expect(CSV_DOCUMENT.weather_source).toBe("csv");
  });

  test("a CSV chosen: the source, the file's name and text, and its hours", () => {
    const edited = withWeather(PVGIS_WITH_HOURS, { source: "csv", weather: HOURS, csv: { name: "pune-ghi.csv", text: "time,ghi" } });

    expect(edited.weather_source).toBe("csv");
    expect(edited.weather_csv).toBe("pune-ghi.csv");
    expect(edited.weather_csv_text).toBe("time,ghi");
    expect(edited.weather_json).toBe(HOURS);
  });

  test("nothing else of the document changes", () => {
    const edited = withWeather(PVGIS_WITH_HOURS, { source: "nasa", weather: NASA_HOURS });

    expect({ ...edited, weather_source: "pvgis", weather_json: HOURS }).toEqual<Project>(PVGIS_WITH_HOURS);
  });
});
