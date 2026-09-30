import { describe, expect, test } from "bun:test";
import { buildRequestOf, cornersOnMap } from "./build-request";
import { frameAt, toMetres } from "./frame";
import type { XY } from "./measure";
import { outlineAfter, START, type OutlineEvent, type OutlineState } from "./outline-state";

const PUNE = { lon: 73.86, lat: 18.52 };
const RECTANGLE: XY[] = [
  { x: -45, y: -20 },
  { x: 45, y: -20 },
  { x: 45, y: 20 },
  { x: -45, y: 20 },
];

function drawn(closed = true): OutlineState {
  const events: OutlineEvent[] = [
    { type: "began", at: PUNE },
    ...RECTANGLE.map((at): OutlineEvent => ({ type: "placed", at, metresPerPx: 0.283, touch: false })),
  ];
  const state = events.reduce(outlineAfter, START);
  return closed ? outlineAfter(state, { type: "close" }) : state;
}

describe("the corners on the map", () => {
  test("the corners of the frame, back in WGS84 as (lon, lat)", () => {
    const corners = cornersOnMap(drawn())!;

    expect(corners).toHaveLength(4);
    corners.forEach(([lon, lat], n) => {
      const back = toMetres(frameAt(PUNE), { lon, lat });
      expect(back.x).toBeCloseTo(RECTANGLE[n].x, 6);
      expect(back.y).toBeCloseTo(RECTANGLE[n].y, 6);
    });
  });

  test("nothing before the outline is closed", () => {
    expect(cornersOnMap(drawn(false))).toBeNull();
    expect(cornersOnMap(START)).toBeNull();
  });
});

describe("the request of Build", () => {
  test("the corners, the roof type, the name of the place found by words", () => {
    const request = buildRequestOf(drawn(), "flat_ew", { label: "Hinjewadi Phase 2, Pune, Maharashtra", byWords: true })!;

    expect(request.roof_type).toBe("flat_ew");
    expect(request.name).toBe("Hinjewadi Phase 2, Pune, Maharashtra");
    expect(request.outline).toHaveLength(4);
    expect(request.obstacles).toEqual([]);
  });

  test("the obstacles drawn go with the roof, as shapes in WGS84 with their heights", () => {
    const state = [
      { type: "shapeDragged", kind: "cylinder", from: { x: 30, y: 10 }, to: { x: 31.25, y: 10 } } as OutlineEvent,
      { type: "shapeDropped" } as OutlineEvent,
      { type: "heightGiven", height: 2, name: "" } as OutlineEvent,
    ].reduce(outlineAfter, drawn());

    const request = buildRequestOf(state, "flat_tilted", null)!;

    expect(request.obstacles).toHaveLength(1);
    expect(request.obstacles?.[0]).toMatchObject({ kind: "cylinder", name: "Tank 1", diameter: 2.5, height: 2 });
    const back = toMetres(frameAt(PUNE), { lon: request.obstacles![0].points[0][0], lat: request.obstacles![0].points[0][1] });
    expect(back.x).toBeCloseTo(30, 3);
    expect(back.y).toBeCloseTo(10, 3);
  });

  test("a place typed as coordinates gives no name: the API's default stands", () => {
    expect(buildRequestOf(drawn(), "flat_tilted", { label: "18.52000° N, 73.86000° E", byWords: false })!.name).toBeUndefined();
    expect(buildRequestOf(drawn(), "flat_tilted", null)!.name).toBeUndefined();
  });

  test("nothing before the outline is closed", () => {
    expect(buildRequestOf(drawn(false), "flat_tilted", null)).toBeNull();
  });
});
