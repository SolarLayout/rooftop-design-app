import { describe, expect, test } from "bun:test";
import type { Layout, Obstacle, Roof } from "../api";
import { THUMBNAIL, thumbnailOf } from "./thumbnail";

// The thumbnail of a kept design (plan/phase-10-plan.md, step 13, decision 6): the plan of the kept layout's positions as an
// SVG of 320 by 180, drawn as the plan without WebGL draws it (the roof, the setback, the kept-clear areas, the obstacles, the
// modules, north up), kept with the design so that its card shows the roof at once, with no run and no canvas.

const RECTANGLE: [number, number][] = [
  [0, 0],
  [90, 0],
  [90, 40],
  [0, 40],
];
const TANK: Obstacle = { name: "Water tank", kind: "cylinder", x: 62, y: 24, length: 1, width: 1, rotation_deg: 0, diameter: 2.5, height: 2, thickness: 0.2, trunk_height: 2, points: [], auto: false };
const ROOF = { lat: 18.52, lon: 73.86, outline: RECTANGLE, roof_type: "flat_tilted", source: "coordinates", obstacles: [TANK] } as unknown as Roof;

const placed = (idx: number, x: number, y: number) => ({ idx, outline: [[x, y], [x + 2.3, y], [x + 2.3, y + 1.1], [x, y + 1.1]] });
const LAYOUT = {
  inner: [{ exterior: [[1, 1], [89, 1], [89, 39], [1, 39]], holes: [] }],
  keepout: [{ cause: "obstacle", obstacle: "Water tank", polygons: [{ exterior: [[60, 22], [64, 22], [64, 26], [60, 26]], holes: [] }] }],
  modules: [placed(0, 2, 2), placed(1, 5, 2), placed(2, 8, 2)],
} as unknown as Layout;

const viewBoxOf = (svg: string) => /viewBox="([^"]+)"/.exec(svg)![1]!.split(" ").map(Number) as [number, number, number, number];
const count = (svg: string, what: string) => svg.split(what).length - 1;

describe("the thumbnail", () => {
  test("is an SVG of 320 by 180 in its own units, named for a screen reader", () => {
    const svg = thumbnailOf(ROOF, LAYOUT);

    expect(THUMBNAIL).toEqual({ width: 320, height: 180 });
    expect(svg.startsWith("<svg ")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain('width="320" height="180"');
    expect(svg).toContain('role="img"');
    expect(svg).toContain('aria-label="Plan of the layout, north up"');
  });

  test("its view box holds the roof with 3 m of ground about it, north up, and has the shape of the tile", () => {
    const [minX, minY, width, height] = viewBoxOf(thumbnailOf(ROOF, LAYOUT));

    expect(minX).toBeLessThanOrEqual(-3);
    expect(minX + width).toBeGreaterThanOrEqual(93);
    // SVG's y grows downward: the roof's north edge, y 40, is -40 in the box.
    expect(minY).toBeLessThanOrEqual(-43);
    expect(minY + height).toBeGreaterThanOrEqual(3);
    expect(width / height).toBeCloseTo(320 / 180, 3);
  });

  test("the modules of the layout are counted, each a path; the roof, the setback, the kept-clear area and the obstacle are drawn", () => {
    const svg = thumbnailOf(ROOF, LAYOUT);

    expect(count(svg, 'data-module="true"')).toBe(3);
    expect(count(svg, 'data-part="roof"')).toBe(1);
    expect(count(svg, 'data-part="inner"')).toBe(1);
    expect(count(svg, 'data-part="keepout"')).toBe(1);
    expect(count(svg, 'data-part="obstacle"')).toBe(1);
  });

  test("before a layout has come, the roof and its obstacles stand alone", () => {
    const svg = thumbnailOf(ROOF, null);

    expect(count(svg, 'data-module="true"')).toBe(0);
    expect(count(svg, 'data-part="roof"')).toBe(1);
    expect(count(svg, 'data-part="obstacle"')).toBe(1);
  });

  test("its colours are the tokens of the page, by class, never a value", () => {
    const svg = thumbnailOf(ROOF, LAYOUT);

    expect(svg).toContain('class="fill-surface-2 stroke-accent stroke-outline"');
    expect(svg).toContain('class="fill-module-glass"');
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
  });
});
