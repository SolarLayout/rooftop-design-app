import { describe, expect, test } from "bun:test";
import { bestPlacesOf, LABEL_STEP, labelPlacesOf, obstacleLabelsOf, overlaps, sharingOf, type Asked, type ObstacleAsk, type Rect } from "./label-places";

// Where the labels of the obstacles stand on Find's map (issue 238, item 29): under the shape, as before, unless that
// covers an edge's length or a label placed before it; then above it, right of it, left of it. A label that has no clear
// place is not shown, except the selected obstacle's, which is placed first and always shown. In pixels of the screen.

const SIZE = { width: 150, height: 24 };

/** A square shape of `side` pixels with its top left at `left`, `top`. */
function square(left: number, top: number, side: number): Asked["points"] {
  return [
    { x: left, y: top },
    { x: left + side, y: top },
    { x: left + side, y: top + side },
    { x: left, y: top + side },
  ];
}

const rectOf = (at: { left: number; top: number }): Rect => ({ left: at.left, top: at.top, right: at.left + SIZE.width, bottom: at.top + SIZE.height });

describe("the labels of the obstacles", () => {
  test("a label clear of everything hangs under its shape, from its lowest point", () => {
    const [place] = labelPlacesOf({ taken: [], labels: [{ points: square(100, 100, 40), size: SIZE, selected: false }] });
    expect(place).toEqual({ left: 94, top: 150 });
  });

  test("over an edge's length it goes above its shape", () => {
    const edge: Rect = { left: 120, top: 145, right: 180, bottom: 170 };
    const [place] = labelPlacesOf({ taken: [edge], labels: [{ points: square(100, 100, 40), size: SIZE, selected: false }] });
    expect(place).toEqual({ left: 94, top: 100 - 10 - SIZE.height });
  });

  test("a label that meets an edge's length within a pixel, as the screen's rounding gives, is clear of it", () => {
    const edge: Rect = { left: 120, top: 173.6, right: 180, bottom: 200 };
    const [place] = labelPlacesOf({ taken: [edge], labels: [{ points: square(100, 100, 40), size: SIZE, selected: false }] });
    expect(place).toEqual({ left: 94, top: 150 });
  });

  test("hemmed in above and below, it stands right of its shape, then left of it", () => {
    const below: Rect = { left: 0, top: 145, right: 400, bottom: 175 };
    const above: Rect = { left: 0, top: 60, right: 400, bottom: 95 };
    const [right] = labelPlacesOf({ taken: [below, above], labels: [{ points: square(100, 100, 40), size: SIZE, selected: false }] });
    expect(right).toEqual({ left: 150, top: 108 });
    const beside: Rect = { left: 145, top: 100, right: 400, bottom: 140 };
    const [left] = labelPlacesOf({ taken: [below, above, beside], labels: [{ points: square(300, 100, 40), size: SIZE, selected: false }] });
    expect(left).toBeNull();
    const [leftOf] = labelPlacesOf({ taken: [below, above, { ...beside, left: 345 }], labels: [{ points: square(300, 100, 40), size: SIZE, selected: false }] });
    expect(leftOf).toEqual({ left: 300 - 10 - SIZE.width, top: 108 });
  });

  test("labels of shapes side by side do not stack: each that is shown stands clear of the others", () => {
    // The demo's four AC units: small boxes in a row, closer together than their labels are wide.
    const units = [0, 1, 2, 3].map((n) => ({ points: square(400 + n * 14, 300, 8), size: SIZE, selected: false }));
    const places = labelPlacesOf({ taken: [], labels: units });
    const shown = places.filter((place) => place !== null).map((place) => rectOf(place!));
    expect(shown.length).toBeGreaterThanOrEqual(3);
    shown.forEach((a, i) => shown.forEach((b, j) => i !== j && expect(overlaps(a, b)).toBe(false)));
  });

  test("the selected obstacle's label is placed first and always shown", () => {
    const everywhere: Rect = { left: -1000, top: -1000, right: 1000, bottom: 1000 };
    const [hidden, selected] = labelPlacesOf({
      taken: [everywhere],
      labels: [
        { points: square(100, 100, 40), size: SIZE, selected: false },
        { points: square(100, 100, 40), size: SIZE, selected: true },
      ],
    });
    expect(hidden).toBeNull();
    expect(selected).toEqual({ left: 94, top: 150 });
  });

  test("a turned map: the label hangs from the lowest point on the screen", () => {
    const diamond = [
      { x: 100, y: 80 },
      { x: 130, y: 110 },
      { x: 100, y: 140 },
      { x: 70, y: 110 },
    ];
    const [place] = labelPlacesOf({ taken: [], labels: [{ points: diamond, size: SIZE, selected: false }] });
    expect(place).toEqual({ left: 94, top: 150 });
  });
});

// Issue 238, item 32: at the demo's zoom most of the four AC units' labels found no clear place and were hidden. Obstacles
// whose labels find none, that stand close together, of one name but its number and of one height, share one label,
// "AC unit 1–4 · 1.2 m high", placed by the same rule round them all. The selected obstacle keeps its own.
describe("one label for obstacles that stand close together", () => {
  /** Eight pixels a character, 24 high: the size of a label for its words. */
  const sizeOf = (words: string) => ({ width: words.length * 8, height: 24 });
  /** The south edge's length, under the units: no label goes under them, nor beside the middle two. */
  const EDGE: Rect = { left: 400, top: 305, right: 460, bottom: 340 };
  const unit = (n: number, extra: Partial<ObstacleAsk> = {}): ObstacleAsk => {
    const name = `AC unit ${n}`;
    const words = `${name} · 1.2 m high`;
    return { points: square(400 + (n - 1) * 14, 300, 8), size: sizeOf(words), selected: false, name, height: 1.2, words, ...extra };
  };
  const UNITS = [1, 2, 3, 4].map((n) => unit(n));

  test("alone, most of the four units' labels have no clear place", () => {
    expect(labelPlacesOf({ taken: [EDGE], labels: UNITS }).filter((place) => place === null).length).toBeGreaterThanOrEqual(2);
  });

  test("the four units share one label, above them all, on the first; the others show none", () => {
    const shown = obstacleLabelsOf({ taken: [EDGE], labels: UNITS, sizeOf });
    expect(shown[0]).toEqual({ words: "AC unit 1–4 · 1.2 m high", left: 394, top: 300 - 10 - 24 });
    expect(shown.slice(1)).toEqual([null, null, null]);
  });

  test("labels that each find a place stay their own", () => {
    const shown = obstacleLabelsOf({ taken: [], labels: UNITS.slice(0, 2), sizeOf });
    expect(shown.map((label) => label?.words)).toEqual(["AC unit 1 · 1.2 m high", "AC unit 2 · 1.2 m high"]);
  });

  /** None of them placed alone. */
  const NONE = [null, null, null, null];

  test("who shares: close together, of one name but its number and of one height, one of them at least without a place", () => {
    expect(sharingOf(UNITS, NONE)).toEqual([[0, 1, 2, 3]]);
    expect(sharingOf(UNITS, [{ left: 0, top: 0 }, { left: 0, top: 0 }, { left: 0, top: 0 }, { left: 0, top: 0 }])).toEqual([]);
  });

  test("of another height, or another name, or without a number, it shares with none", () => {
    expect(sharingOf([unit(1), unit(2, { height: 2 }), unit(3), unit(4)], NONE)).toEqual([[0, 2, 3]]);
    expect(sharingOf([unit(1, { name: "Box 1" }), unit(2), unit(3, { name: "Chiller 3" }), unit(4, { name: "Plant room" })], NONE)).toEqual([]);
  });

  test("far apart, they share with none; a chain of close ones is one group", () => {
    expect(sharingOf(UNITS.map((asked, n) => ({ ...asked, points: square(100 + n * 220, 300, 8) })), NONE)).toEqual([]);
    expect(sharingOf(UNITS.map((asked, n) => ({ ...asked, points: square(100 + n * 30, 300, 8) })), NONE)).toEqual([[0, 1, 2, 3]]);
  });

  test("the selected unit keeps its own label; the others share one", () => {
    const shown = obstacleLabelsOf({ taken: [EDGE], labels: [unit(1), unit(2, { selected: true }), unit(3), unit(4)], sizeOf });
    expect(shown[1]?.words).toBe("AC unit 2 · 1.2 m high");
    expect(shown.filter((label) => label !== null).map((label) => label!.words)).toContain("AC unit 1, 3 and 4 · 1.2 m high");
  });

  test("where none of its four places is clear, the shared label stands a step further out: under the roof's corner, past it", () => {
    // The demo's units by the roof's south-east corner: its dot under them and at their right, the east edge's length
    // above them, the stair room's label at their left.
    const corner: Rect = { left: 450, top: 302, right: 470, bottom: 322 };
    const east: Rect = { left: 440, top: 250, right: 510, bottom: 274 };
    const stair: Rect = { left: 200, top: 288, right: 398, bottom: 312 };
    const shown = obstacleLabelsOf({ taken: [corner, east, stair], labels: UNITS, sizeOf });
    expect(shown[0]).toEqual({ words: "AC unit 1–4 · 1.2 m high", left: 394, top: 308 + 10 + LABEL_STEP });
    expect(labelPlacesOf({ taken: [corner, east, stair], labels: [{ ...UNITS[0], points: UNITS.flatMap(({ points }) => points), size: sizeOf("AC unit 1–4 · 1.2 m high") }] })).toEqual([null]);
  });

  test("a label of its own is placed a step further out too, where it has no place near and shares with none", () => {
    const stair: ObstacleAsk = { points: square(100, 100, 40), size: SIZE, selected: false, name: "Stair room", height: 3, words: "Stair room · 3.0 m high" };
    const around: Rect[] = [
      { left: 80, top: 145, right: 300, bottom: 170 },
      { left: 80, top: 70, right: 300, bottom: 95 },
      { left: 145, top: 95, right: 300, bottom: 145 },
      { left: -100, top: 95, right: 95, bottom: 145 },
    ];
    expect(labelPlacesOf({ taken: around, labels: [stair] })).toEqual([null]);
    expect(obstacleLabelsOf({ taken: around, labels: [stair], sizeOf })[0]).toEqual({ words: "Stair room · 3.0 m high", left: 94, top: 150 + LABEL_STEP * 2 });
  });

  // On a phone the demo roof fills the map from side to side: a label past the map's edge is not readable.
  test("a label stays on the map: under its shape it slides back inside; beside it, past the edge, it is not clear", () => {
    const tank: ObstacleAsk = { points: square(300, 100, 10), size: SIZE, selected: false, name: "Tank 1", height: 2, words: "Tank 1 · 2.0 m high" };
    const map: Rect = { left: 0, top: 0, right: 390, bottom: 338 };
    expect(labelPlacesOf({ taken: [], labels: [tank] })).toEqual([{ left: 294, top: 120 }]);
    expect(obstacleLabelsOf({ taken: [], labels: [tank], sizeOf, bounds: map })[0]).toEqual({ words: "Tank 1 · 2.0 m high", left: 390 - SIZE.width, top: 120 });
    // Under and over it taken: right of it is past the edge, so it stands at its left.
    const band: Rect[] = [{ left: 0, top: 118, right: 390, bottom: 160 }, { left: 0, top: 40, right: 390, bottom: 92 }];
    expect(obstacleLabelsOf({ taken: band, labels: [tank], sizeOf, bounds: map })[0]).toEqual({ words: "Tank 1 · 2.0 m high", left: 300 - 10 - SIZE.width, top: 93 });
  });

  test("where a label's first clear place hides another's, it takes its next: every label is shown", () => {
    // A's first place, under it, is C's one place; its second, over it, B's one place; its third, at its right, neither.
    const small = { width: 30, height: 24 };
    const at = (left: number, top: number, side: number): Asked => ({ points: square(left, top, side), size: small, selected: false });
    const walls: Rect[] = [
      { left: 0, top: 95, right: 92, bottom: 125 },
      { left: 0, top: -50, right: 400, bottom: 22 },
      { left: 115, top: 22, right: 400, bottom: 50 },
      { left: 0, top: 22, right: 95, bottom: 50 },
      { left: 0, top: 198, right: 400, bottom: 300 },
      { left: 115, top: 170, right: 400, bottom: 198 },
      { left: 0, top: 170, right: 95, bottom: 198 },
    ];
    const labels = [at(100, 100, 20), at(100, 30, 10), at(100, 180, 10)];
    expect(labelPlacesOf({ taken: walls, labels })).toEqual([{ left: 94, top: 130 }, { left: 94, top: 50 }, null]);
    expect(bestPlacesOf({ taken: walls, labels })).toEqual([
      { left: 130, top: 98 },
      { left: 94, top: 50 },
      { left: 94, top: 146 },
    ]);
  });

  test("hemmed in on its four sides, a label slides a step along one of them before it stands further out", () => {
    const stair: ObstacleAsk = { points: square(100, 100, 40), size: SIZE, selected: false, name: "Stair room", height: 3, words: "Stair room · 3.0 m high" };
    // Under it, the edge's length reaches its left; a step to the right is clear.
    const under: Rect = { left: 60, top: 145, right: 105, bottom: 170 };
    const around: Rect[] = [under, { left: 0, top: 0, right: 400, bottom: 95 }, { left: 145, top: 95, right: 400, bottom: 145 }, { left: 0, top: 95, right: 95, bottom: 145 }];
    expect(obstacleLabelsOf({ taken: around, labels: [stair], sizeOf })[0]).toEqual({ words: "Stair room · 3.0 m high", left: 94 + LABEL_STEP, top: 150 });
  });

  test("labels hidden by the order they were placed in are placed first, where that shows more of them", () => {
    // The first takes, under it, the one place the second has, above itself; placed second, the first stands at its right.
    const small = { width: 30, height: 24 };
    const first: ObstacleAsk = { points: square(100, 100, 20), size: small, selected: false, name: "Stair room", height: 3, words: "Stair room" };
    const second: ObstacleAsk = { points: square(100, 170, 20), size: small, selected: false, name: "Plant room", height: 2, words: "Plant room" };
    const walls: Rect[] = [
      { left: 0, top: 0, right: 400, bottom: 95 },
      { left: 0, top: 95, right: 92, bottom: 125 },
      { left: 0, top: 195, right: 400, bottom: 400 },
      { left: 125, top: 160, right: 400, bottom: 195 },
      { left: 0, top: 160, right: 95, bottom: 195 },
    ];
    expect(labelPlacesOf({ taken: walls, labels: [first, second] })).toEqual([{ left: 94, top: 130 }, null]);
    expect(obstacleLabelsOf({ taken: walls, labels: [first, second], sizeOf: () => small })).toEqual([
      { words: "Stair room", left: 130, top: 98 },
      { words: "Plant room", left: 94, top: 136 },
    ]);
  });

  test("the shared label stands clear of what is taken and of the other labels", () => {
    const stair: ObstacleAsk = { points: square(380, 200, 30), size: sizeOf("Stair room · 3.0 m high"), selected: false, name: "Stair room", height: 3, words: "Stair room · 3.0 m high" };
    const shown = obstacleLabelsOf({ taken: [EDGE], labels: [stair, ...UNITS], sizeOf });
    const rects = shown.flatMap((label) => (label ? [{ left: label.left, top: label.top, right: label.left + sizeOf(label.words).width, bottom: label.top + 24 }] : []));
    expect(rects).toHaveLength(2);
    rects.forEach((a, i) => {
      expect(overlaps(a, EDGE)).toBe(false);
      rects.forEach((b, j) => i !== j && expect(overlaps(a, b)).toBe(false));
    });
  });
});
