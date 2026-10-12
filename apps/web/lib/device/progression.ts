// What the order of work remembers on this device (D95, D96, D99): the steps opened, per design, so that a step gone past
// shows its tick and "Next:" stops once the next step was opened; the app's own words the user has met, so that their line
// under a title is said once; and the work column hidden on desktop. Per-viewer conveniences in localStorage: a storage
// that refuses (a private window, a quota) only means they are said again.
import { STEPS, type Step } from "../flow/steps";
import { EXPLAIN, type ExplainedWord } from "../words/explain";

export const SEEN_KEY = "rooftop.steps-seen";
export const MET_KEY = "rooftop.words-met";
export const PANEL_KEY = "rooftop.panel-hidden";

type Read = Pick<Storage, "getItem">;
type Write = Pick<Storage, "setItem" | "removeItem">;

const STEP_IDS: readonly Step[] = STEPS.map((step) => step.id);
const isStep = (value: unknown): value is Step => STEP_IDS.includes(value as Step);
const isWord = (value: unknown): value is ExplainedWord => typeof value === "string" && value in EXPLAIN;

function read(storage: Read, key: string): unknown {
  try {
    return JSON.parse(storage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(storage: Write, key: string, value: unknown): void {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    // The storage refuses: it is said again next time, and nothing else is the worse for it.
  }
}

const allSeen = (storage: Read): Record<string, unknown> => {
  const all = read(storage, SEEN_KEY);
  return all !== null && typeof all === "object" && !Array.isArray(all) ? (all as Record<string, unknown>) : {};
};

/** The steps of a design opened on this device, in the order of the work. */
export function seenOf(storage: Read, design: string): Step[] {
  const one = allSeen(storage)[design];
  return Array.isArray(one) ? STEP_IDS.filter((step) => one.filter(isStep).includes(step)) : [];
}

/** The steps with one more, in the order of the work; the same step twice is once. */
export const addSeen = (seen: readonly Step[], step: Step): Step[] => STEP_IDS.filter((one) => one === step || seen.includes(one));

export function rememberSeen(storage: Read & Write, design: string, seen: readonly Step[]): void {
  write(storage, SEEN_KEY, { ...allSeen(storage), [design]: [...seen] });
}

/** The app's words the user has met on this device. */
export function wordsMetOf(storage: Read): ReadonlySet<ExplainedWord> {
  const met = read(storage, MET_KEY);
  return new Set(Array.isArray(met) ? met.filter(isWord) : []);
}

export function rememberMet(storage: Write, met: ReadonlySet<ExplainedWord>): void {
  write(storage, MET_KEY, met.size === 0 ? null : [...met]);
}

export const isPanelHiddenOn = (storage: Read): boolean => read(storage, PANEL_KEY) === true;

export function rememberPanelHidden(storage: Write, hidden: boolean): void {
  write(storage, PANEL_KEY, hidden ? true : null);
}
