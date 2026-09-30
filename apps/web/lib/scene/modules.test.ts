import { describe, expect, test } from "bun:test";
import { Matrix4, Vector3 } from "three";
import type { PlacedModule } from "../api";
import { moduleMatrixOf, placementOf, type Placement } from "./modules";

// Every position of /layout as a tilted quad (plan/phase-05-plan.md, step 7, decision 2): from its plan
// footprint, its tilt, its azimuth and its heights. The numbers are the engine's for the demo roof.

const flat = () => 0;
const FLUSH = 0.1;

/** The first position of the demo (tilted rows): 1.133 across, 2.277 along the slope, tilted 15° to the south. */
const TILTED: PlacedModule = {
  idx: 0,
  outline: [
    [2.363, 1],
    [2.363, 3.199],
    [1.23, 3.199],
    [1.23, 1],
  ],
  row: 0,
  col: 0,
  line: 0,
  tilt: 15,
  azimuth: 180,
  z_low: 0.5,
  z_high: 1.0893,
};

/** The first two of an east-west roof: the west side faces 270, the east side 90, both at 10°. */
const WEST: PlacedModule = { ...TILTED, outline: [[2.346, 1], [2.346, 3.277], [1.23, 3.277], [1.23, 1]], tilt: 10, azimuth: 270, z_low: 0.5, z_high: 0.6967 };
const EAST: PlacedModule = { ...WEST, idx: 1, line: 1, outline: [[3.762, 1], [3.762, 3.277], [2.646, 3.277], [2.646, 1]], azimuth: 90 };

/** The first of a sloped roof: flush on a pitch of 10°, 0.1 m above it. */
const FLUSH_ONE: PlacedModule = { ...TILTED, outline: [[2.133, 1], [2.133, 3.242], [1, 3.242], [1, 1]], tilt: 10, z_low: 0.1, z_high: 0.4954 };

const axis = (matrix: Matrix4, direction: [number, number, number]) => new Vector3(...direction).transformDirection(matrix);

describe("where a position stands", () => {
  test("a tilted module: its centre is the middle of its footprint, halfway up; its sides are the module's", () => {
    const placement = placementOf(TILTED, "flat_tilted", flat, FLUSH);

    expect(placement.centre[0]).toBeCloseTo(1.7965, 3);
    expect(placement.centre[1]).toBeCloseTo(2.0995, 3);
    expect(placement.centre[2]).toBeCloseTo(0.79465, 4);
    expect(placement.width).toBeCloseTo(1.133, 3);
    expect(placement.length).toBeCloseTo(2.277, 2);
    expect(placement.tiltDeg).toBe(15);
    expect(placement.azimuthDeg).toBe(180);
  });

  test("a module on a sloped roof lies on the pitch at the flush clearance, not at the engine's flat heights", () => {
    const heightAt = ([, y]: readonly [number, number]) => Math.tan((10 * Math.PI) / 180) * (y - 20);
    const placement = placementOf(FLUSH_ONE, "sloped_flush", heightAt, FLUSH);

    expect(placement.centre[2]).toBeCloseTo(heightAt([0, 2.121]) + FLUSH, 3);
    expect(placement.tiltDeg).toBe(10);
  });
});

describe("the matrix of a position", () => {
  const THIN = { thickness: 0.035, lift: 0 };

  test("puts a unit box at the centre, as wide as the module, as long as its slope, as thick as said", () => {
    const matrix = moduleMatrixOf(placementOf(TILTED, "flat_tilted", flat, FLUSH), THIN);
    const at = new Vector3().setFromMatrixPosition(matrix);
    const scale = new Vector3().setFromMatrixScale(matrix);

    expect(at.x).toBeCloseTo(1.7965, 3);
    expect(at.y).toBeCloseTo(0.79465, 3);
    expect(at.z).toBeCloseTo(-2.0995, 3);
    expect(scale.x).toBeCloseTo(1.133, 3);
    expect(scale.y).toBeCloseTo(0.035, 6);
    expect(scale.z).toBeCloseTo(2.277, 2);
  });

  test("the slope of a module facing south goes down toward the south", () => {
    const matrix = moduleMatrixOf(placementOf(TILTED, "flat_tilted", flat, FLUSH), THIN);
    const downTheSlope = axis(matrix, [0, 0, 1]);

    expect(downTheSlope.x).toBeCloseTo(0, 6);
    expect(downTheSlope.z).toBeCloseTo(Math.cos((15 * Math.PI) / 180), 6);
    expect(downTheSlope.y).toBeCloseTo(-Math.sin((15 * Math.PI) / 180), 6);
  });

  test("the two sides of an east-west unit face away from each other", () => {
    const west = axis(moduleMatrixOf(placementOf(WEST, "flat_ew", flat, FLUSH), THIN), [0, 0, 1]);
    const east = axis(moduleMatrixOf(placementOf(EAST, "flat_ew", flat, FLUSH), THIN), [0, 0, 1]);

    expect(west.x).toBeLessThan(-0.9);
    expect(east.x).toBeGreaterThan(0.9);
    expect(west.y).toBeCloseTo(east.y, 6);
    expect(west.y).toBeLessThan(0);
  });

  test("the normal of a flat module points up, of a tilted one up and toward where it faces", () => {
    const normal = axis(moduleMatrixOf(placementOf(TILTED, "flat_tilted", flat, FLUSH), THIN), [0, 1, 0]);

    expect(normal.y).toBeCloseTo(Math.cos((15 * Math.PI) / 180), 6);
    expect(normal.z).toBeCloseTo(Math.sin((15 * Math.PI) / 180), 6);
  });

  test("a lift moves the box along its normal, for the glass over the frame", () => {
    const placement: Placement = placementOf(TILTED, "flat_tilted", flat, FLUSH);
    const frame = new Vector3().setFromMatrixPosition(moduleMatrixOf(placement, THIN));
    const glass = new Vector3().setFromMatrixPosition(moduleMatrixOf(placement, { thickness: 0.01, lift: 0.03, inset: 0.04 }));
    const scale = new Vector3().setFromMatrixScale(moduleMatrixOf(placement, { thickness: 0.01, lift: 0.03, inset: 0.04 }));

    expect(glass.sub(frame).length()).toBeCloseTo(0.03, 6);
    expect(scale.x).toBeCloseTo(1.133 - 0.04, 3);
    expect(scale.y).toBeCloseTo(0.01, 6);
  });
});
