// The weather source of a design (plan/phase-08-plan.md, decisions 11 and 12): the three sources by their names, the
// select's choices with their facts, the request that loads one for the roof's place, the step said while it loads,
// and the edit of the document once the hours came. Pure.
import type { SelectOption } from "../../components/ui/Select";
import type { Edit } from "../stores/project-store";
import type { Project, Weather, WeatherRequest } from "../api";

export type WeatherSource = Project["weather_source"];

/** The sources as the select names them; the API's labels for PVGIS and NASA (decision 19: NASA stays the year 2023). */
export const WEATHER_LABELS: Record<WeatherSource, string> = { pvgis: "PVGIS TMY", nasa: "NASA POWER 2023", csv: "CSV file" };

/** A source that is downloaded for the roof's place; a CSV is read from its text. */
export type DownloadedSource = Exclude<WeatherSource, "csv">;

/** The choices of the select, each with its fact: the year it is and whether it brings a horizon (the board "Weather and assumptions"). */
export const WEATHER_ITEMS: ReadonlyArray<SelectOption<WeatherSource>> = [
  { value: "pvgis", label: WEATHER_LABELS.pvgis, fact: "Typical year · PVGIS horizon" },
  { value: "nasa", label: WEATHER_LABELS.nasa, fact: "The year 2023 · no horizon" },
  { value: "csv", label: WEATHER_LABELS.csv, fact: "Hourly · times read as UTC" },
];

/** The words of the trigger: the document's source by its name; a CSV document names its file. */
export function weatherShownOf(document: Pick<Project, "weather_source" | "weather_csv">): string {
  if (document.weather_source === "csv") return document.weather_csv || WEATHER_LABELS.csv;
  return WEATHER_LABELS[document.weather_source];
}

/** What /weather is asked for the document's source at the roof's place; a CSV document sends its file's name and text. */
export function weatherRequestOf(document: Project): WeatherRequest {
  return { source: document.weather_source, lat: document.roof.lat, lon: document.roof.lon, csv_name: document.weather_csv, csv_text: document.weather_csv_text };
}

/** The words of a load on its way, under the title and in the vitals' place: "Loading NASA POWER 2023 weather". */
export const loadingWordsOf = (source: WeatherSource): string => `Loading ${WEATHER_LABELS[source]} weather`;

/** The step under the title while the weather of a design without any is loaded (decision 11). */
export function stepOfLoading(document: Project): string {
  if (document.weather_source === "csv") return `Reading ${document.weather_csv}`;
  return loadingWordsOf(document.weather_source);
}

/** The hours that came, put into the document as its weather: the amendment of the edit the run was refused for. */
export const withWeatherLoaded =
  (weather: Weather): Edit =>
  (document) => ({ ...document, weather_json: weather });

/** A source chosen, with the hours /weather answered for it; a CSV with its file's name and text, which the document carries (D7). */
export type WeatherChosen = { source: WeatherSource; weather: Weather; csv?: { name: string; text: string } };

/** The one edit of a source chosen: the source and its hours; a CSV's name and text, cleared for PVGIS and NASA. */
export function withWeather(document: Project, { source, weather, csv }: WeatherChosen): Project {
  return { ...document, weather_source: source, weather_json: weather, weather_csv: csv?.name ?? "", weather_csv_text: csv?.text ?? "" };
}
