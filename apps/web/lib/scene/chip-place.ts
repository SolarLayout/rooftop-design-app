// The chips of the inverters over the stage kept off the labels of the roof's edges (plan/phase-07-plan.md, decision
// 13; plan/phase-11-plan.md, step 33): on phone the projection can put "INV-1" over the demo's "90.0 m". Pure maths
// in pixels of the canvas, from its top left; the boxes are what the DOM measured of the chips and the labels.

/** A box on the canvas, in pixels from its top left. */
export type Box = { left: number; top: number; right: number; bottom: number };

/** How wide and how high a chip or a label is, as the DOM measured it. */
export type Size = { width: number; height: number };

/** The box of a chip centred on its point, its foot `foot` pixels over it. */
export function chipBoxOf([x, y]: readonly [number, number], { width, height }: Size, foot: number): Box {
  const bottom = y - foot;
  return { left: x - width / 2, top: bottom - height, right: x + width / 2, bottom };
}

/** The box of a label centred on its point. */
export function centredBoxOf([x, y]: readonly [number, number], { width, height }: Size): Box {
  return { left: x - width / 2, top: y - height / 2, right: x + width / 2, bottom: y + height / 2 };
}

/** Whether two boxes share an area. Boxes that touch do not. */
export function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

const shifted = ({ left, top, right, bottom }: Box, dx: number, dy: number): Box => ({ left: left + dx, top: top + dy, right: right + dx, bottom: bottom + dy });

/**
 * The four shifts that would take the chip off one label it overlaps, in the order that wins a tie: up, since the
 * chip stands over its box and the roof is under it; then sideways; down last.
 */
function waysOff(chip: Box, label: Box): Array<[dx: number, dy: number]> {
  return [
    [0, label.top - chip.bottom],
    [label.left - chip.right, 0],
    [label.right - chip.left, 0],
    [0, label.bottom - chip.top],
  ];
}

const length = ([dx, dy]: readonly [number, number]) => Math.abs(dx) + Math.abs(dy);

type Shift = [dx: number, dy: number];

/**
 * The smallest shift that takes the chip off every label, trying each way off each label it is over and what that
 * way needs after it, up to `depth` moves; null when no shift of so many moves clears it.
 */
function smallestClear(chip: Box, labels: readonly Box[], depth: number): Shift | null {
  const under = labels.filter((label) => overlaps(chip, label));
  if (under.length === 0) return [0, 0];
  if (depth === 0) return null;
  let best: Shift | null = null;
  for (const way of under.flatMap((label) => waysOff(chip, label))) {
    const rest = smallestClear(shifted(chip, way[0], way[1]), labels, depth - 1);
    if (rest === null) continue;
    const whole: Shift = [way[0] + rest[0], way[1] + rest[1]];
    if (best === null || length(whole) < length(best)) best = whole;
  }
  return best;
}

/**
 * The smallest shift of a chip that takes it off every label it overlaps: [dx, dy] in pixels, [0, 0] when it is clear.
 * A shift that clears one label can land the chip on another, so up to one move per label is tried; what no such
 * shift clears is left where it is.
 */
export function clearOf(chip: Box, labels: readonly Box[]): Shift {
  return smallestClear(chip, labels, labels.length) ?? [0, 0];
}
