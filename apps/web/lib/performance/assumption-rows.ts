// The assumptions of Performance as summary rows (V2 · 8, D104; the board "V2 · 8 · Performance", state 3): Weather, Roof
// albedo (its one home, audit V2-61), Ageing, Uncertainty (what sets Likely and Conservative) and Grid CO₂ per MWh, each
// with its facts on one line and who set it. Pure.
import { shown } from "../../components/ui/number-entry";
import type { DesignResult, Project, WeatherSummary } from "../api";
import { WEATHER_LABELS } from "../flow/weather-source";
import { ROOF_DEFAULTS } from "../studio/defaults";
import { setByOfValue, wordOf, DEFAULT, type SetBy } from "../studio/set-by";
import { LOSS_DEFAULTS } from "./loss-defaults";

export type AssumptionRowId = "weather" | "albedo" | "ageing" | "uncertainty" | "co2";

export type AssumptionRow = { id: AssumptionRowId; title: string; facts: string; setBy: string };

/** The provider of each source, after its plain name. */
const PROVIDER: Record<Project["weather_source"], string | null> = { pvgis: "PVGIS", nasa: "NASA POWER", csv: null };

const YOURS: SetBy = { kind: "yours", byDefault: null };

function weatherOf(document: Pick<Project, "weather_source" | "weather_csv">, weather: WeatherSummary | null): string {
  const source = document.weather_source;
  const from = source === "csv" ? document.weather_csv || null : PROVIDER[source];
  const ground = weather ? `${shown(weather.ghi_kwh_m2, 1)} kWh/m² on the ground` : null;
  return [WEATHER_LABELS[source], from, ground].filter((part): part is string => part !== null).join(" · ");
}

/** The two variabilities combined, as the engine combines them: the root of the sum of their squares. */
const sigmaOf = ({ weather_sigma_pct, model_sigma_pct }: Project["losses"]) => Math.hypot(weather_sigma_pct, model_sigma_pct);

const isSame = (levels: readonly number[], others: readonly number[]) => levels.length === others.length && levels.every((level, at) => level === others[at]);

function uncertaintyBy(losses: Project["losses"]): SetBy {
  const same = losses.weather_sigma_pct === LOSS_DEFAULTS.weather_sigma_pct && losses.model_sigma_pct === LOSS_DEFAULTS.model_sigma_pct && isSame(losses.p_levels, LOSS_DEFAULTS.p_levels);
  return same ? DEFAULT : YOURS;
}

/** The five rows from the document and the run (null before one): the run gives the weather's sunlight on the ground. */
export function assumptionRowsOf(document: Pick<Project, "roof" | "losses" | "weather_source" | "weather_csv">, design: Pick<DesignResult, "weather"> | null): AssumptionRow[] {
  const { losses, roof } = document;
  const co2IsDefault = shown(losses.co2_t_per_mwh, 3) === shown(LOSS_DEFAULTS.co2_t_per_mwh, 3);
  return [
    { id: "weather", title: "Weather", facts: weatherOf(document, design?.weather ?? null), setBy: wordOf(document.weather_source === "pvgis" ? DEFAULT : YOURS) },
    { id: "albedo", title: "Roof albedo", facts: `${shown(roof.albedo, 2)} · how much light the roof reflects`, setBy: wordOf(setByOfValue(roof.albedo, ROOF_DEFAULTS.albedo, { decimals: 2 })) },
    { id: "ageing", title: "Ageing", facts: `${shown(losses.degradation_pct, 1)} % less each year`, setBy: wordOf(setByOfValue(losses.degradation_pct, LOSS_DEFAULTS.degradation_pct, { decimals: 2 })) },
    { id: "uncertainty", title: "Uncertainty", facts: `${shown(sigmaOf(losses), 2)} % · sets Likely and Conservative`, setBy: wordOf(uncertaintyBy(losses)) },
    {
      id: "co2",
      title: "Grid CO₂ per MWh",
      facts: co2IsDefault ? `${shown(losses.co2_t_per_mwh, 3)} t · India's grid` : `${shown(losses.co2_t_per_mwh, 3)} t`,
      setBy: wordOf(co2IsDefault ? { kind: "country", country: "India" } : YOURS),
    },
  ];
}

/** The weather's hours, temperatures and horizon, in the Weather row once it is open. */
export function weatherFactsOf(weather: WeatherSummary): string {
  const horizon = weather.horizon_highest_deg === null ? "no horizon" : `horizon up to ${shown(weather.horizon_highest_deg, 1)}°`;
  return `${shown(weather.hours, 0)} hours · ${shown(weather.t_min_c, 1)} to ${shown(weather.t_max_c, 1)} °C · ${horizon}`;
}
