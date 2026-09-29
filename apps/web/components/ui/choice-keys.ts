// How the keyboard goes through a group of choices of which one is taken (Segmented): the arrows go to
// the neighbour and around the ends, Home and End to the first and the last.

const STEP: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * The choice that a key leads to, or null when the key changes nothing.
 * A choice in `unavailable` is passed over.
 */
export function choiceAfterKey<T extends string>(
  choices: readonly T[],
  current: T,
  key: string,
  unavailable: ReadonlySet<string> = new Set(),
): T | null {
  const canBeTaken = (choice: T) => !unavailable.has(choice);
  // The choices the arrows go through: those that can be taken, and the one that is.
  const round = choices.filter((choice) => canBeTaken(choice) || choice === current);

  const to = (() => {
    if (key === "Home") return choices.find(canBeTaken);
    if (key === "End") return choices.findLast(canBeTaken);
    const step = STEP[key];
    if (step === undefined) return undefined;
    const at = round.indexOf(current);
    if (at === -1) return choices.find(canBeTaken);
    return round[(at + step + round.length) % round.length];
  })();

  return to === undefined || to === current ? null : to;
}
