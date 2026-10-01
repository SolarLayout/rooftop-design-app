// The words of the module card of the Array lens (plan/phase-05-plan.md, step 14, decision 14): the
// file's names as they are, the facts of the module, the coefficient line with where the numbers come from.
import { shown } from "../../components/ui/number-entry";
import type { Coefficients, Module } from "../api";

export type ModuleCard = { title: string; maker: string; size: string; facts: string; coefficients: string; file: string };

export function moduleCardOf(module: Module, coefficients: Coefficients): ModuleCard {
  const size = `${shown(module.length_m, 3)} × ${shown(module.width_m, 3)} m`;
  const facts = [`Voc ${shown(module.voc, 2)} V`, `Isc ${shown(module.isc, 2)} A`, `${module.n_diodes} diodes`, ...(module.half_cell ? ["twin half-cell"] : [])];
  return {
    title: module.model,
    maker: `${module.manufacturer} · ${shown(module.pnom_w, 0)} Wp`,
    size: module.is_bifacial ? `${size} · bifacial ${shown(module.bifaciality, 2)}` : size,
    facts: facts.join(" · "),
    coefficients: `Coefficients (${coefficients.source}): Voc ${shown(coefficients.mu_voc_pct, 3)}, Vmp ${shown(coefficients.mu_vmp_pct, 3)}, Pmpp ${shown(coefficients.mu_pmpp_pct, 3)} %/°C`,
    file: module.source,
  };
}
