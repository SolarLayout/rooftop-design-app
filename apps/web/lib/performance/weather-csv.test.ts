import { describe, expect, test } from "bun:test";
import openapi from "@rooftop/api-types/openapi.json";
import type { WeatherSummary } from "../api";
import { CSV_TOO_LARGE, CSV_WORDS, csvFits, csvSummaryLinesOf, MAX_CSV_BYTES } from "./weather-csv";

/** The API's summary of a CSV of GHI alone (docs/design/mockups/performance_data.json, csv_ghi_only_weather). */
const GHI_ONLY: WeatherSummary = {
  source: "csv",
  label: "pune-ghi.csv",
  hours: 8760,
  first_hour: "2019-01-01T00:00:00+00:00",
  last_hour: "2019-12-31T23:00:00+00:00",
  ghi_kwh_m2: 1822.91505,
  dni_kwh_m2: 1435.4321,
  dhi_kwh_m2: 822.6543,
  t_min_c: 25,
  t_max_c: 25,
  horizon_highest_deg: null,
};

describe("the CSV dialog (plan/phase-08-plan.md, step 19; the board \"Weather and assumptions\")", () => {
  test("the summary of the file read, in three lines: the hours and the GHI, beam and diffuse, the temperatures", () => {
    expect(csvSummaryLinesOf(GHI_ONLY)).toEqual(["8,760 hours · GHI 1,822.9 kWh/m²", "beam 1,435.4 · diffuse 822.7 kWh/m²", "25.0 to 25.0 °C"]);
  });

  test("the words of the dialog: what a file holds, and that times are read as UTC (decision 19)", () => {
    expect(CSV_WORDS.title).toBe("Load weather from a CSV");
    expect(CSV_WORDS.sentence).toBe("Hourly values of a year: a time column, global irradiance, and, if you have them, beam, diffuse, air temperature and wind. Times are read as UTC.");
    expect(CSV_WORDS.use).toBe("Use this weather");
  });

  test("a file over 3 MB, more than a year of weather takes, is refused before it is sent, in the dialog's words (#162)", () => {
    expect(csvFits({ size: MAX_CSV_BYTES })).toBe(true);
    expect(csvFits({ size: MAX_CSV_BYTES + 1 })).toBe(false);
    expect(CSV_TOO_LARGE).toBe("This file is over 3 MB, more than a year of weather takes. Choose a file of hourly values.");
    expect(CSV_WORDS.detail).toBe("A CSV of hourly values, 3 MB at most");
  });

  test("the limit is the API's: the text of the CSV it takes, in characters, one byte each", () => {
    expect(MAX_CSV_BYTES).toBe(openapi.components.schemas.WeatherRequest.properties.csv_text.maxLength);
  });
});
