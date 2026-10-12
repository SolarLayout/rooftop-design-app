"use client";

import { useProject, useResults, useStores } from "@/components/shell/stores";
import { displayNameOf, nameOfCountry } from "@/lib/country/country";
import { noStringsFitOf, type NoStringsFit } from "@/lib/studio/no-strings-fit";
import { stringsViewOf } from "@/lib/studio/strings-view";
import { voltageWordsOf } from "@/lib/studio/voltage-words";
import { projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, designOf } from "@/lib/stores/results-store";

/**
 * The problem of a design where no string length fits, and the voltage that fits (V2 · 5, D101): the Strings step shows
 * it at its head and the work column offers the voltage as its primary. One reading for both, so that they agree.
 */
export function useNoStringsFit(): NoStringsFit | null {
  const { country } = useStores();
  const project = useProject(projectOf);
  const design = useResults(designOf);
  const option = useResults(chosenOptionOf);
  if (!project) return null;
  const view = stringsViewOf({ voltage: project.system_voltage ?? null, design, option });
  if (view.kind !== "sized") return null;
  const ratings = design ? { inverter: design.equipment.inverter.vabs_max, module: design.equipment.module.v_max_iec, moduleTaken: !design.equipment.module.v_max_from_file } : null;
  const words = voltageWordsOf({
    voltage: view.voltage,
    by: project.system_voltage_by ?? null,
    country: country.current(),
    nameOf: (code) => nameOfCountry(code, displayNameOf),
    ratings,
    range: design?.series_range ?? null,
  });
  return noStringsFitOf(view, words.offer);
}
