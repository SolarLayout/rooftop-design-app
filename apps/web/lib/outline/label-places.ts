// Where the labels of the obstacles stand on Find's map (issue 238, item 29), in pixels of the screen: under the shape,
// hung from its lowest point as before, unless that covers what is taken (the edges' lengths) or a label placed before
// it; then above the shape, right of it, left of it. A label with no clear place is not shown: the column lists every
// obstacle. The selected obstacle's label is placed first and always shown. Pure; the outline's layer measures and moves.

export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; right: number; bottom: number };
export type Size = { width: number; height: number };

/** A label to place: the shape's points on the screen, the label's size, and whether its obstacle is selected. */
export type Asked = { points: readonly Point[]; size: Size; selected: boolean };

export type Placed = { left: number; top: number } | null;

/** A label hangs this far left of the lowest point and this far below it; it stands this far from the shape otherwise. */
const HANG = { x: -6, y: 10 };
const ASIDE = 10;
/** Rects that meet within this many pixels do not overlap: the screen rounds where each stands. */
const SLACK = 1;

export const overlaps = (a: Rect, b: Rect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const shrunk = ({ left, top, right, bottom }: Rect): Rect => ({ left: left + SLACK, top: top + SLACK, right: right - SLACK, bottom: bottom - SLACK });

const rectAt = (left: number, top: number, { width, height }: Size): Rect => ({ left, top, right: left + width, bottom: top + height });

/** The places a label may take, in the order it tries them: under the shape, above it, right of it, left of it. */
function candidatesOf({ points, size }: Asked): Rect[] {
  const lowest = [...points].sort((a, b) => b.y - a.y || a.x - b.x)[0];
  const highest = [...points].sort((a, b) => a.y - b.y || a.x - b.x)[0];
  if (!lowest || !highest) return [];
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const middle = (Math.min(...ys) + Math.max(...ys)) / 2 - size.height / 2;
  return [
    rectAt(lowest.x + HANG.x, lowest.y + HANG.y, size),
    rectAt(highest.x + HANG.x, highest.y - HANG.y - size.height, size),
    rectAt(Math.max(...xs) + ASIDE, middle, size),
    rectAt(Math.min(...xs) - ASIDE - size.width, middle, size),
  ];
}

/** Each label's place, in the order asked; null for one that is not shown. */
export function labelPlacesOf({ taken, labels }: { taken: readonly Rect[]; labels: readonly Asked[] }): Placed[] {
  const placed: Rect[] = [...taken];
  const places: Placed[] = labels.map(() => null);
  const order = labels.map((_, index) => index).sort((a, b) => Number(labels[b].selected) - Number(labels[a].selected));
  for (const index of order) {
    const candidates = candidatesOf(labels[index]);
    const clear = candidates.find((candidate) => !placed.some((other) => overlaps(shrunk(candidate), other)));
    const chosen = clear ?? (labels[index].selected ? candidates[0] : undefined);
    if (!chosen) continue;
    placed.push(chosen);
    places[index] = { left: chosen.left, top: chosen.top };
  }
  return places;
}
