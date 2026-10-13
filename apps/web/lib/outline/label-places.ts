// Where the labels of the obstacles stand on Find's map (issue 238, item 29), in pixels of the screen: under the shape,
// hung from its lowest point as before, unless that covers what is taken (the edges' lengths) or a label placed before
// it; then above the shape, right of it, left of it. A label with no clear place is not shown: the column lists every
// obstacle. The selected obstacle's label is placed first and always shown. So that every name is read at the roof's zoom
// (item 32): labels that find no place, of obstacles close together of one name and one height, share one; a label slides
// along a side and steps further out before it gives up; one gives way to another; none stands past the map's edge.
// Pure; the outline's layer measures and moves.
import { numberedOf, sharedLabelOf } from "./obstacles";

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

/** A step further out from the shape, in pixels, for a label that has no clear place beside it (issue 238, item 32). */
export const LABEL_STEP = 12;
/** The steps further out the last placing tries. */
const STEPS_OUT = 2;

/** A step along a side: to the right under or over the shape, then to the left; down beside it, then up. */
const ALONG = [1, -1];

const within = (value: number, least: number, most: number) => Math.max(least, Math.min(value, most));

/**
 * The places a label may take, in the order it tries them: under the shape, above it, right of it, left of it. With steps
 * asked, the four slid a step along their side too, and so again each step further out. On a map of `bounds`,
 * a place under or over the shape that runs past a side is slid back inside along it; one beside it, up or down.
 */
function candidatesOf({ points, size }: Asked, steps: number, bounds: Rect | undefined): Rect[] {
  const lowest = [...points].sort((a, b) => b.y - a.y || a.x - b.x)[0];
  const highest = [...points].sort((a, b) => a.y - b.y || a.x - b.x)[0];
  if (!lowest || !highest) return [];
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const middle = (Math.min(...ys) + Math.max(...ys)) / 2 - size.height / 2;
  const across = (left: number) => (bounds ? within(left, bounds.left, bounds.right - size.width) : left);
  const down = (top: number) => (bounds ? within(top, bounds.top, bounds.bottom - size.height) : top);
  const [under, over, right, left] = [
    (out: number, along: number) => rectAt(across(lowest.x + HANG.x + along), lowest.y + HANG.y + out, size),
    (out: number, along: number) => rectAt(across(highest.x + HANG.x + along), highest.y - HANG.y - size.height - out, size),
    (out: number, along: number) => rectAt(Math.max(...xs) + ASIDE + out, down(middle + along), size),
    (out: number, along: number) => rectAt(Math.min(...xs) - ASIDE - size.width - out, down(middle + along), size),
  ];
  if (steps === 0) return [under, over, right, left].map((side) => side(0, 0));
  // Each ring out: under, over and right of the shape; under and over it slid, before its left, where a label reads last;
  // then right and left of it slid.
  const slid = (side: typeof under, out: number) => ALONG.map((along) => side(out, along * LABEL_STEP));
  return Array.from({ length: steps + 1 }, (_, step) => step * LABEL_STEP).flatMap((out) => [
    under(out, 0),
    over(out, 0),
    right(out, 0),
    ...slid(under, out),
    ...slid(over, out),
    left(out, 0),
    ...slid(right, out),
    ...slid(left, out),
  ]);
}

const isWithin = (rect: Rect, bounds: Rect | undefined): boolean =>
  !bounds || (rect.left >= bounds.left && rect.top >= bounds.top && rect.right <= bounds.right && rect.bottom <= bounds.bottom);

type Placing = {
  taken: readonly Rect[];
  labels: readonly Asked[];
  /** How many steps further out a label tries (issue 238, item 32); none by default. */
  steps?: number;
  /** The map on the screen: a place past its edge is not clear. */
  bounds?: Rect;
};

const isClear = (candidate: Rect, placed: readonly Rect[], bounds: Rect | undefined) => isWithin(candidate, bounds) && !placed.some((other) => overlaps(shrunk(candidate), other));

/** The selected labels first, then the others, each in the order asked. */
const orderOf = (labels: readonly Asked[]) => labels.map((_, index) => index).sort((a, b) => Number(labels[b].selected) - Number(labels[a].selected));

/** Each label's place, in the order asked; null for one that is not shown. Each takes its first clear place. */
export function labelPlacesOf({ taken, labels, steps = 0, bounds }: Placing): Placed[] {
  const placed: Rect[] = [...taken];
  const places: Placed[] = labels.map(() => null);
  for (const index of orderOf(labels)) {
    const candidates = candidatesOf(labels[index], steps, bounds);
    const clear = candidates.find((candidate) => isClear(candidate, placed, bounds));
    const chosen = clear ?? (labels[index].selected ? candidates[0] : undefined);
    if (!chosen) continue;
    placed.push(chosen);
    places[index] = { left: chosen.left, top: chosen.top };
  }
  return places;
}

/** How many labels' places the search below tries at most, so that a map that moves stays smooth. */
const SEARCH_MOST = 2000;

/**
 * Each label's place as `labelPlacesOf` gives it, where that shows them all; else the places that show the most, a label
 * that took the first clear place it has giving way to its next where that lets another be shown (issue 238, item 32).
 * The search goes in the order of `labelPlacesOf` and gives up after a while, keeping the best it found.
 */
export function bestPlacesOf({ taken, labels, steps = 0, bounds }: Placing): Placed[] {
  const order = orderOf(labels);
  const options = order.map((index) => candidatesOf(labels[index], steps, bounds));
  const placed: Rect[] = [...taken];
  const chosen: (Rect | null)[] = [];
  let best: (Rect | null)[] = [];
  let bestCount = -1;
  let tried = 0;
  function visit(at: number, count: number): void {
    if (count + order.length - at <= bestCount || tried > SEARCH_MOST) return;
    if (at === order.length) {
      best = [...chosen];
      bestCount = count;
      return;
    }
    tried++;
    const label = labels[order[at]];
    const clear = options[at].filter((candidate) => isClear(candidate, placed, bounds));
    // The selected label is always shown: where it has no clear place, at its first.
    const ways: (Rect | null)[] = label.selected && options[at].length > 0 ? (clear.length > 0 ? clear : options[at].slice(0, 1)) : [...clear, null];
    for (const way of ways) {
      if (way) placed.push(way);
      chosen.push(way);
      visit(at + 1, count + (way ? 1 : 0));
      chosen.pop();
      if (way) placed.pop();
      if (bestCount === order.length) return;
    }
  }
  visit(0, 0);
  const places: Placed[] = labels.map(() => null);
  order.forEach((index, at) => {
    const rect = best[at];
    if (rect) places[index] = { left: rect.left, top: rect.top };
  });
  return places;
}

/** An obstacle's label to place: as `Asked`, with its name, its height and its words, so that labels can be shared. */
export type ObstacleAsk = Asked & { name: string; height: number; words: string };

/** What a label shows, and where; null for one not shown (one hidden, or one of a shared label's but its first). */
export type Shown = { words: string; left: number; top: number } | null;

/** Shapes whose boxes stand this many pixels apart or closer stand close together. */
const CLOSE_PX = 24;

const boxOfPoints = (points: readonly Point[]): Rect => {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
};

const isClose = (a: Rect, b: Rect): boolean => overlaps({ left: a.left - CLOSE_PX, top: a.top - CLOSE_PX, right: a.right + CLOSE_PX, bottom: a.bottom + CLOSE_PX }, b);

/**
 * The groups of labels that share one: of obstacles not selected, of one name but its number and of one height, standing
 * close together (each near another of the group), two or more, of which one at least found no place of its own.
 */
export function sharingOf(labels: readonly ObstacleAsk[], alone: readonly Placed[]): number[][] {
  const boxes = labels.map(({ points }) => boxOfPoints(points));
  const keyOf = (asked: ObstacleAsk) => {
    const numbered = numberedOf(asked.name);
    return asked.selected || !numbered ? null : `${numbered.base}\u0000${asked.height}`;
  };
  const group = labels.map((_, index) => index);
  const rootOf = (index: number): number => (group[index] === index ? index : (group[index] = rootOf(group[index])));
  labels.forEach((a, i) =>
    labels.forEach((b, j) => {
      if (j <= i || keyOf(a) === null || keyOf(a) !== keyOf(b) || !isClose(boxes[i], boxes[j])) return;
      group[rootOf(j)] = rootOf(i);
    }),
  );
  const groups = new Map<number, number[]>();
  labels.forEach((asked, index) => {
    if (keyOf(asked) !== null) groups.set(rootOf(index), [...(groups.get(rootOf(index)) ?? []), index]);
  });
  return [...groups.values()].filter((members) => members.length > 1 && members.some((index) => alone[index] === null));
}

/**
 * The labels of the obstacles (issue 238, items 29 and 32): each placed as `labelPlacesOf` places it; then those that
 * found no place, with those close to them of one name and one height, share one label ("AC unit 1–4 · 1.2 m high")
 * placed by the same rule round all their shapes, shown on the first of them; and a label with no clear place beside its
 * shapes tries its four places slid a step along their side, then a step further out, then two; and where a label's first
 * clear place hides another's, it gives way (`bestPlacesOf`). None stands past the map's edge (`bounds`). `sizeOf`
 * measures a label's words.
 */
export function obstacleLabelsOf({ taken, labels, sizeOf, bounds }: { taken: readonly Rect[]; labels: readonly ObstacleAsk[]; sizeOf: (words: string) => Size; bounds?: Rect }): Shown[] {
  const alone = labelPlacesOf({ taken, labels, bounds });
  const sharing = sharingOf(labels, alone);
  const firstOf = new Map(sharing.map((members) => [members[0], members]));
  const inShared = new Set(sharing.flat());
  const asks = labels.flatMap((asked, index): { index: number; asked: Asked; words: string }[] => {
    const members = firstOf.get(index);
    if (members) {
      const numbers = members.map((member) => numberedOf(labels[member].name)?.number ?? 0);
      const words = sharedLabelOf(numberedOf(asked.name)?.base ?? asked.name, numbers, asked.height);
      return [{ index, asked: { points: members.flatMap((member) => labels[member].points), size: sizeOf(words), selected: false }, words }];
    }
    return inShared.has(index) ? [] : [{ index, asked, words: asked.words }];
  });
  const places = bestPlacesOf({ taken, labels: asks.map(({ asked }) => asked), steps: STEPS_OUT, bounds });
  const shown: Shown[] = labels.map(() => null);
  asks.forEach(({ index, words }, n) => {
    const place = places[n];
    if (place) shown[index] = { words, ...place };
  });
  return shown;
}
