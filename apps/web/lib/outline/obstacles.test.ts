import { describe, expect, test } from "bun:test";
import { frameAt, toMetres } from "./frame";
import type { XY } from "./measure";
import {
  boxOf,
  boxWithCorner,
  factsOf,
  labelOf,
  mapShapesOf,
  nameOf,
  obstaclesOfMap,
  tankOf,
  type Obstacle,
} from "./obstacles";

// The obstacles drawn on the map (plan/phase-04-plan.md, step 14; the board "Obstacles on the map and
// their heights"): the shapes as pure functions of points in the frame of the outline, their words, and
// what they are in WGS84 for the API.

const PUNE = { lon: 73.86, lat: 18.52 };

const box = (points: XY[], height = 3): Obstacle => ({ id: 1, kind: "box", name: "Box 1", points, diameter: null, height });

describe("a box", () => {
  test("dragged across the thing: four corners counter-clockwise from the lowest left, as the roof's rectangle is", () => {
    expect(boxOf({ x: 5, y: 4 }, { x: 0, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 0, y: 4 },
    ]);
    expect(boxOf({ x: 0, y: 0 }, { x: 0, y: 4 })).toBeNull();
  });

  test("a corner dragged resizes it and it stays a rectangle: the opposite corner stays, the neighbours follow", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];

    const wider = boxWithCorner(square, 2, { x: 6, y: 5 });

    expect(wider).toEqual([
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 5 },
      { x: 0, y: 5 },
    ]);
  });

  test("a turned box resizes along its own sides", () => {
    // A 4 by 2 box turned 90°: its first side runs north.
    const turned = [
      { x: 0, y: 0 },
      { x: 0, y: 4 },
      { x: -2, y: 4 },
      { x: -2, y: 0 },
    ];

    const resized = boxWithCorner(turned, 1, { x: 0.5, y: 6 });

    // The corner goes where it is dragged; the corner before it follows along the first side, the one
    // after it along the second, and the opposite one stays.
    expect(resized[0].x).toBeCloseTo(0.5, 9);
    expect(resized[0].y).toBeCloseTo(0, 9);
    expect(resized[1].x).toBeCloseTo(0.5, 9);
    expect(resized[1].y).toBeCloseTo(6, 9);
    expect(resized[2].x).toBeCloseTo(-2, 9);
    expect(resized[2].y).toBeCloseTo(6, 9);
    expect(resized[3]).toEqual({ x: -2, y: 0 });
  });

  test("a corner dragged over its opposite gives nothing: the box cannot vanish", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];

    expect(boxWithCorner(square, 2, { x: 0, y: 0 })).toBe(square);
  });
});

describe("a tank", () => {
  test("dragged from its middle to its edge: the centre and the diameter", () => {
    expect(tankOf({ x: 10, y: 10 }, { x: 11.25, y: 10 })).toEqual({ kind: "cylinder", points: [{ x: 10, y: 10 }], diameter: 2.5 });
    expect(tankOf({ x: 10, y: 10 }, { x: 10, y: 10 })).toBeNull();
  });
});

describe("the words", () => {
  test("a name from the kind and the count of that kind, as the API names them", () => {
    expect(nameOf("box", [])).toBe("Box 1");
    expect(nameOf("cylinder", [box([]), { ...box([]), id: 2, kind: "cylinder" }])).toBe("Tank 2");
    expect(nameOf("wall", [])).toBe("Wall 1");
    expect(nameOf("building", [])).toBe("Building 1");
  });

  test("the facts of the list: a box by its sides, a tank by its diameter, a wall by its length, a building by its area; the height after", () => {
    const sides = box([
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 4 },
      { x: 0, y: 4 },
    ]);
    expect(factsOf(sides)).toBe("5.0 × 4.0 · h 3.0 m");
    expect(factsOf({ ...sides, kind: "cylinder", points: [{ x: 1, y: 1 }], diameter: 2.5, height: 2 })).toBe("⌀ 2.5 · h 2.0 m");
    expect(
      factsOf({
        ...sides,
        kind: "wall",
        points: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 8 },
        ],
        height: 0.8,
      }),
    ).toBe("18.0 m · h 0.8 m");
    expect(
      factsOf({
        ...sides,
        kind: "building",
        points: [
          { x: 0, y: 0 },
          { x: 8, y: 0 },
          { x: 8, y: 8 },
          { x: 0, y: 8 },
        ],
        height: 8,
      }),
    ).toBe("64 m² · h 8.0 m");
  });

  test("the label on the map: the name and the height", () => {
    expect(labelOf(box([], 3))).toBe("Box 1 · h 3.0 m");
  });
});

describe("to the API and back", () => {
  const frame = frameAt(PUNE);
  const drawn: Obstacle[] = [
    box([
      { x: 10, y: 5 },
      { x: 15, y: 5 },
      { x: 15, y: 9 },
      { x: 10, y: 9 },
    ]),
    { id: 2, kind: "cylinder", name: "Tank 1", points: [{ x: 30, y: 10 }], diameter: 2.5, height: 2 },
    {
      id: 3,
      kind: "wall",
      name: "Wall 1",
      points: [
        { x: -40, y: -15 },
        { x: -40, y: 15 },
      ],
      diameter: null,
      height: 0.8,
    },
  ];

  test("the shapes of the request: the points in WGS84, the diameter, the height, the name", () => {
    const shapes = mapShapesOf(drawn, frame);

    expect(shapes.map((shape) => [shape.kind, shape.name, shape.height, shape.diameter ?? null])).toEqual([
      ["box", "Box 1", 3, null],
      ["cylinder", "Tank 1", 2, 2.5],
      ["wall", "Wall 1", 0.8, null],
    ]);
    expect(shapes[0].points).toHaveLength(4);
    const back = toMetres(frame, { lon: shapes[1].points[0][0], lat: shapes[1].points[0][1] });
    expect(back.x).toBeCloseTo(30, 3);
    expect(back.y).toBeCloseTo(10, 3);
  });

  test("the shapes of a roof shown on the map again become obstacles in the frame, numbered on", () => {
    const shapes = mapShapesOf(drawn, frame);

    const loaded = obstaclesOfMap(shapes, frame);

    expect(loaded.map((obstacle) => [obstacle.id, obstacle.kind, obstacle.name, obstacle.height, obstacle.diameter])).toEqual([
      [1, "box", "Box 1", 3, null],
      [2, "cylinder", "Tank 1", 2, 2.5],
      [3, "wall", "Wall 1", 0.8, null],
    ]);
    expect(loaded[0].points[2].x).toBeCloseTo(15, 3);
    expect(loaded[0].points[2].y).toBeCloseTo(9, 3);
  });
});
