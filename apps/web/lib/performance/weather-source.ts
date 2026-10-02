// The weather source of a design (plan/phase-08-plan.md, decisions 11 and 12): the three sources by their names, the
// request that loads one for the roof's place, and the step said while it loads. Pure.
import type { Edit } from "../stores/project-store";
import type { Project, Weather, WeatherRequest } from "../api";

export type WeatherSource = Project["weather_source"];

/** The sources as the select names them; the API's labels for PVGIS and NASA (decision 19: NASA stays the year 2023). */
export const WEATHER_LABELS: Record<WeatherSource, string> = { pvgis: "PVGIS TMY", nasa: "NASA POWER 2023", csv: "CSV file" };

/** What /weather is asked for the document's source at the roof's place; a CSV document sends its file's name and text. */
export function weatherRequestOf(document: Project): WeatherRequest {
  return { source: document.weather_source, lat: document.roof.lat, lon: document.roof.lon, csv_name: document.weather_csv, csv_text: document.weather_csv_text };
}

/** The step under the title while the weather of a design without any is loaded (decision 11). */
export function stepOfLoading(document: Project): string {
  if (document.weather_source === "csv") return `Reading ${document.weather_csv}`;
  return `Loading ${WEATHER_LABELS[document.weather_source]} weather`;
}

/** The hours that came, put into the document as its weather: the amendment of the edit the run was refused for. */
export const withWeatherLoaded =
  (weather: Weather): Edit =>
  (document) => ({ ...document, weather_json: weather });
