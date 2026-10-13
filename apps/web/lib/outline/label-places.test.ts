import { describe, expect, test } from "bun:test";
import { labelPlacesOf, overlaps, type Asked, type Rect } from "./label-places";

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
