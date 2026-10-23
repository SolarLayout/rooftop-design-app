// The weather source of a design (plan/phase-08-plan.md, decisions 11 and 12): the three sources by their names, the
// select's choices with their facts, the request that loads one for the roof's place, the step said while it loads,
// and the edit of the document once the hours came. Pure.
import type { SelectOption } from "../../components/ui/Select";
import type { Edit } from "../stores/project-store";
import { ApiError, type Project, type Weather, type WeatherRequest } from "../api";

export type WeatherSource = Project["weather_source"];

/** The sources as the select names them, in plain words (V2 · 8, audit V2-97; decision 19: NASA stays the year 2023). */
export const WEATHER_LABELS: Record<WeatherSource, string> = { pvgis: "Typical year", nasa: "2023, measured", csv: "Your file" };

/** A source that is downloaded for the roof's place; a CSV is read from its text. */
export type DownloadedSource = Exclude<WeatherSource, "csv">;

/** The choices of the select, each with where it comes from. */
export const WEATHER_ITEMS: ReadonlyArray<SelectOption<WeatherSource>> = [
  { value: "pvgis", label: WEATHER_LABELS.pvgis, fact: "From PVGIS, with the site's horizon" },
  { value: "nasa", label: WEATHER_LABELS.nasa, fact: "From NASA POWER, without a horizon" },
  { value: "csv", label: WEATHER_LABELS.csv, fact: "A CSV of hourly weather" },
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

const LOADING: Record<DownloadedSource, string> = { pvgis: "Loading the typical year from PVGIS", nasa: "Loading 2023's weather from NASA POWER" };

/** The words of a load on its way, under the title and in the vitals' place: "Loading 2023's weather from NASA POWER". */
export const loadingWordsOf = (source: DownloadedSource): string => LOADING[source];

/** The step under the title while the weather of a design without any is loaded (decision 11). */
export function stepOfLoading(document: Project): string {
  if (document.weather_source === "csv") return `Reading ${document.weather_csv}`;
  return loadingWordsOf(document.weather_source);
}

/** The hours that came, put into the document as its weather: the amendment of the edit the run was refused for. */
export const withWeatherLoaded =
  (weather: Weather): Edit =>
  (document) => ({ ...document, weather_json: weather });

/** The API's words for a weather service that failed or could not be reached, as against a refusal about the site. */
const SERVICE_DOWN = new Set(["weather_source_failed", "weather_source_unreachable"]);

/**
 * The source loaded in the place of the document's when that one fails (D122): NASA POWER for PVGIS that failed or could not
 * be reached. A refusal about the site, a fault of the app's own server, NASA itself or a CSV has none.
 */
export function standInFor(source: WeatherSource, error: unknown): DownloadedSource | null {
  return source === "pvgis" && error instanceof ApiError && SERVICE_DOWN.has(error.code) ? "nasa" : null;
}

/** NASA's hours put into the document in the place of PVGIS's, with NASA as its source: the run takes them as the document's. */
export const withStandInLoaded =
  (weather: Weather): Edit =>
  (document) => ({ ...document, weather_source: "nasa", weather_json: weather });

/** The note said once NASA's hours stand in for PVGIS's (D122): what failed, and which weather the design has. */
export const STAND_IN_WORDS = "PVGIS failed. The weather is NASA POWER's 2023, without a horizon.";

/** A source chosen, with the hours /weather answered for it; a CSV with its file's name and text, which the document carries (D7). */
export type WeatherChosen = { source: WeatherSource; weather: Weather; csv?: { name: string; text: string } };

/** The one edit of a source chosen: the source and its hours; a CSV's name and text, cleared for PVGIS and NASA. */
export function withWeather(document: Project, { source, weather, csv }: WeatherChosen): Project {
  return { ...document, weather_source: source, weather_json: weather, weather_csv: csv?.name ?? "", weather_csv_text: csv?.text ?? "" };
}
