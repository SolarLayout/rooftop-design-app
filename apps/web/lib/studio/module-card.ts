// The words of the module card of the Array lens (plan/phase-05-plan.md, step 14): the model as the file names it, the
// maker as people know it (D75), the facts of the module, the coefficient line with where the numbers come from.
import { shown } from "../../components/ui/number-entry";
import type { Coefficients, Module } from "../api";
import { makerOf } from "../equipment/makers";

export type ModuleCard = { title: string; maker: string; details: { name: string; value: string }[] };

/**
 * The module as a buyer reads it (V2 · 7): the model, the maker as people know it with the power and the size, and behind
 * Details the electrical figures in plain names. The file's name, the diodes and the other coefficients are not on the card.
 */
export function moduleCardOf(module: Module, coefficients: Coefficients): ModuleCard {
  return {
    title: module.model,
    maker: `${makerOf(module.manufacturer)} · ${shown(module.pnom_w, 0)} Wp · ${shown(module.length_m, 2)} × ${shown(module.width_m, 2)} m`,
    details: [
      { name: "Open-circuit voltage (Voc)", value: `${shown(module.voc, 2)} V` },
      { name: "Short-circuit current (Isc)", value: `${shown(module.isc, 2)} A` },
      ...(module.is_bifacial ? [{ name: "Bifacial, rear gain", value: shown(module.bifaciality, 2) }] : []),
      { name: "Voc coefficient", value: `${shown(coefficients.mu_voc_pct, 3)} %/°C` },
    ],
  };
}

/** The module on one line, as the Array step's summary row says it (V2 · 3): its model and its power. */
export const moduleFactsOf = (module: Pick<Module, "model" | "pnom_w">): string => `${module.model} · ${shown(module.pnom_w, 0)} Wp`;
