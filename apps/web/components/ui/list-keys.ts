// How the keyboard goes through a list of which one row is marked (Select, the menu of the project
// switcher): the arrows to the neighbour, Home and End to the ends, a letter to the row that begins
// with it. A list has ends: the arrows stop at them.

/** The row a key leads to, or null when it leads nowhere. `unavailable` holds the rows that cannot be taken. */
export function indexAfterKey(count: number, current: number | null, key: string, unavailable: ReadonlySet<number>): number | null {
  const canBeTaken = (index: number) => index >= 0 && index < count && !unavailable.has(index);
  const rows = Array.from({ length: count }, (_, index) => index).filter(canBeTaken);

  const to = (() => {
    switch (key) {
      case "ArrowDown":
        return current === null ? rows[0] : rows.find((index) => index > current);
      case "ArrowUp":
        return current === null ? rows[rows.length - 1] : rows.findLast((index) => index < current);
      case "Home":
        return rows[0];
      case "End":
        return rows[rows.length - 1];
      default:
        return undefined;
    }
  })();
  return to === undefined || to === current ? null : to;
}

/**
 * The row that begins with what was typed, or null. One letter leads to the next row that begins with
 * it, around the end of the list; more letters stay on the marked row while it begins with them.
 */
export function indexOfTyped(
  labels: readonly string[],
  typed: string,
  current: number | null,
  unavailable: ReadonlySet<number>,
): number | null {
  const sought = typed.toLowerCase();
  if (sought === "" || labels.length === 0) return null;

  const from = (current ?? -1) + (sought.length === 1 ? 1 : 0);
  for (let step = 0; step < labels.length; step += 1) {
    const index = (((from + step) % labels.length) + labels.length) % labels.length;
    if (!unavailable.has(index) && labels[index]?.toLowerCase().startsWith(sought)) return index;
  }
  return null;
}
