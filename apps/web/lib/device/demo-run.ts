// The demo's run on this device (plan/phase-10-plan.md, step 11, decision 5): Home's card shows the demo's capacity and
// energy only once the untouched demo has run here, from that run, so that every number is the engine's and none is typed.
// The demo itself is not kept until it is edited (D32), so its run has no record among the designs: it is one key of
// localStorage, the two numbers alone. A storage that refuses (a private window, a quota) is no fault: nothing is
// remembered, and the card shows the name and the roof alone.
import type { DesignResult } from "../api";
import { numbersOf } from "./kept-design";

export const DEMO_RUN_KEY = "rooftop.demo-run";

/** The capacity and the energy of year 1 of the demo's chosen option. */
export type DemoRun = { dcKwp: number; energyMwh: number };

/** The run as it is remembered; null when the run holds no chosen option, since then there are no numbers. */
export function demoRunOf(design: DesignResult): DemoRun | null {
  const { dcKwp, energyMwh } = numbersOf(design);
  return dcKwp === null || energyMwh === null ? null : { dcKwp, energyMwh };
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

/** What is under the key read back as a run; null when nothing is there, or what is there is no run. */
export function demoRunOfText(text: string | null): DemoRun | null {
  if (text === null) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { dcKwp, energyMwh } = parsed as Record<string, unknown>;
    return isNumber(dcKwp) && isNumber(energyMwh) ? { dcKwp, energyMwh } : null;
  } catch {
    return null;
  }
}

/** The text under the key, as it is; null when the storage has none or refuses. For a store that compares snapshots. */
export function rawDemoRunOf(storage: Pick<Storage, "getItem">): string | null {
  try {
    return storage.getItem(DEMO_RUN_KEY);
  } catch {
    return null;
  }
}

/** The demo's run remembered on this device; null until the demo has run here. */
export const demoRunRememberedOf = (storage: Pick<Storage, "getItem">): DemoRun | null => demoRunOfText(rawDemoRunOf(storage));

/** What remembers the demo's run in *storage*, for the flow. */
export function rememberDemoRunIn(storage: Pick<Storage, "setItem">): (run: DemoRun) => void {
  return (run) => {
    try {
      storage.setItem(DEMO_RUN_KEY, JSON.stringify(run));
    } catch {
      // The storage refuses: the run is not remembered, and the card shows the name and the roof alone.
    }
  };
}
