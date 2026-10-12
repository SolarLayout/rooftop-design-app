// The losses the app gives a design the user has not set (V2 · 8): the API's defaults, as its schema states them. A value
// equal to its default is the app's; any other is the user's. assumption-rows.test.ts holds them equal to the schema.
import type { Losses } from "../api";

type DefaultId = "soiling_pct" | "mismatch_pct" | "availability_pct" | "degradation_pct" | "weather_sigma_pct" | "model_sigma_pct" | "co2_t_per_mwh" | "p_levels";

export const LOSS_DEFAULTS: Readonly<{ [Id in DefaultId]: Losses[Id] }> = {
  soiling_pct: 2,
  mismatch_pct: 1,
  availability_pct: 99.5,
  degradation_pct: 0.5,
  weather_sigma_pct: 3,
  model_sigma_pct: 3,
  co2_t_per_mwh: 0.716,
  p_levels: [50, 75, 90],
};
