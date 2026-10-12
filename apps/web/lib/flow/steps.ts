// The order of work (D95; the board "V2 · 2 · The progression"): five steps, each with its place and its state. Find is
// the first part of Roof; Sun is a view of the stage, no step. Pure: the shell gives the facts.
import { HANDOVER, pathOfLens } from "../routes";

export const STEPS = [
  { id: "roof", name: "Roof" },
  { id: "array", name: "Array" },
  { id: "strings", name: "Strings" },
  { id: "performance", name: "Performance" },
  { id: "handover", name: "Handover" },
] as const;

export type Step = (typeof STEPS)[number]["id"];

/**
 * done: gone past and nothing in it waits; needs-you: something in it waits for the user (a note, no option fits);
 * to-do: not gone past yet; closed: no design yet (Find), it cannot be gone to. Where the user is, is told apart
 * (`StepFacts.current`): it shows its own state, pressed.
 */
export type StepState = "done" | "needs-you" | "to-do" | "closed";

export type StepFacts = {
  /** The step the user is on. */
  current: Step;
  /** The steps opened at least once for this design. */
  seen: readonly Step[];
  /** The steps where something waits for the user. */
  waiting: readonly Step[];
  /** Whether a design exists: on Find before Build, none does. */
  hasDesign: boolean;
};

export function pathOfStep(step: Step): string {
  if (step === "performance") return "/performance";
  if (step === "handover") return HANDOVER;
  return pathOfLens(step);
}

/** The step an address is in; null outside the order of work (Home, Present) and on the Sun view's old address. */
export function stepOfPath(path: string): Step | null {
  const [, first, second] = path.split("/");
  if (first === "find") return "roof";
  if (first === "performance" || first === "handover") return first;
  if (first === "studio" && (second === "roof" || second === "array" || second === "strings")) return second;
  return null;
}

export function nextStepOf(step: Step): Step | null {
  const at = STEPS.findIndex((one) => one.id === step);
  return STEPS[at + 1]?.id ?? null;
}

const indexOf = (step: Step) => STEPS.findIndex((one) => one.id === step);

/** The state of every step, from what the shell knows. */
export function stepStatesOf({ current, seen, waiting, hasDesign }: StepFacts): Record<Step, StepState> {
  const furthest = Math.max(indexOf(current), ...seen.map(indexOf));
  const stateOf = (step: Step, at: number): StepState => {
    if (!hasDesign) return step === current ? "to-do" : "closed";
    if (waiting.includes(step)) return "needs-you";
    return at < furthest ? "done" : "to-do";
  };
  return Object.fromEntries(STEPS.map(({ id }, at) => [id, stateOf(id, at)])) as Record<Step, StepState>;
}

/** What the shell knows of a note: where its action leads, when it leads somewhere. */
type NoteLike = { action: { kind: string; path?: string } };

/** The steps where something waits for the user: the step each note leads to, once each, and Strings when no option fits. */
export function waitingStepsOf(notes: readonly NoteLike[], noOptions: boolean): Step[] {
  const steps = new Set<Step>();
  for (const { action } of notes) {
    const step = action.kind === "open" && action.path ? stepOfPath(action.path) : null;
    if (step !== null) steps.add(step);
  }
  if (noOptions) steps.add("strings");
  return STEPS.map((one) => one.id).filter((id) => steps.has(id));
}
