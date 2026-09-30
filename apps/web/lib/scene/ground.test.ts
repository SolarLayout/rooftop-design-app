import { describe, expect, test } from "bun:test";
import { esriProvider } from "../map/esri";
import type { Imagery } from "../map/provider";
import { gridLinesOf, IMAGERY_RADIUS, tilesAround, type Tile } from "./ground";

// The ground under the roof: the tiles of the imagery at the native zoom that cover a square about the
// roof's centroid, each with its corners in the roof's metres (plan/phase-05-plan.md, decision 8).

const PUNE = { lat: 18.52, lon: 73.86 };
const KEY = "a-key-of-the-test";
const IMAGERY: Imagery = esriProvider(KEY)!.imagery;

/** The circumference of the earth over the pixels of the world at zoom 19, at a latitude: the map's rule. */
const metresPerPixel = (lat: number) => (40_075_016.686 * Math.cos((lat * Math.PI) / 180)) / (256 * 2 ** 19);

const byPlace = (a: Tile, b: Tile) => a.y - b.y || a.x - b.x;

describe("the tiles around a place", () => {
  const set = tilesAround(IMAGERY, PUNE.lat, PUNE.lon);

  test("150 m each way at Pune is 5 by 5 tiles of 72 m, or one more where the square straddles a tile", () => {
    expect(IMAGERY_RADIUS).toBe(150);
    expect(set.columns).toBeGreaterThanOrEqual(5);
    expect(set.columns).toBeLessThanOrEqual(6);
    expect(set.rows).toBeGreaterThanOrEqual(5);
    expect(set.rows).toBeLessThanOrEqual(6);
    expect(set.tiles).toHaveLength(set.columns * set.rows);
    expect(set.tiles.every((tile) => tile.z === 19)).toBe(true);
  });

  test("the extent holds the square and reaches at most one tile past it", () => {
    const tile = 256 * metresPerPixel(PUNE.lat);
    expect(set.extent.left).toBeLessThanOrEqual(-150);
    expect(set.extent.left).toBeGreaterThan(-150 - tile);
    expect(set.extent.right).toBeGreaterThanOrEqual(150);
    expect(set.extent.right).toBeLessThan(150 + tile);
    expect(set.extent.bottom).toBeLessThanOrEqual(-150);
    expect(set.extent.bottom).toBeGreaterThan(-150 - tile);
    expect(set.extent.top).toBeGreaterThanOrEqual(150);
    expect(set.extent.top).toBeLessThan(150 + tile);
  });

  test("a tile at Pune is about 72 m wide, and the stitched picture is 256 px a tile", () => {
    const [first] = set.tiles;
    expect(first.extent.right - first.extent.left).toBeCloseTo(256 * metresPerPixel(PUNE.lat), 0);
    expect(first.extent.top - first.extent.bottom).toBeCloseTo(256 * metresPerPixel(PUNE.lat), 0);
    expect(set.tileSize).toBe(256);
    expect(set.widthPx).toBe(set.columns * 256);
    expect(set.heightPx).toBe(set.rows * 256);
  });

  test("the extent is that of the tiles: the whole picture is the plane", () => {
    expect(set.extent.left).toBeCloseTo(Math.min(...set.tiles.map((tile) => tile.extent.left)), 9);
    expect(set.extent.right).toBeCloseTo(Math.max(...set.tiles.map((tile) => tile.extent.right)), 9);
    expect(set.extent.bottom).toBeCloseTo(Math.min(...set.tiles.map((tile) => tile.extent.bottom)), 9);
    expect(set.extent.top).toBeCloseTo(Math.max(...set.tiles.map((tile) => tile.extent.top)), 9);
  });

  test("a tile's corners are its neighbours': east of it, and south of it", () => {
    const sorted = [...set.tiles].sort(byPlace);
    const [first] = sorted;
    const east = sorted.find((tile) => tile.x === first.x + 1 && tile.y === first.y)!;
    const south = sorted.find((tile) => tile.x === first.x && tile.y === first.y + 1)!;
    expect(east.extent.left).toBeCloseTo(first.extent.right, 9);
    expect(east.extent.top).toBeCloseTo(first.extent.top, 9);
    expect(south.extent.top).toBeCloseTo(first.extent.bottom, 9);
    expect(south.extent.left).toBeCloseTo(first.extent.left, 9);
  });

  test("the tiles are laid in the picture as on the ground: north at the top, east to the right", () => {
    const sorted = [...set.tiles].sort(byPlace);
    const [first] = sorted;
    expect(first).toMatchObject({ column: 0, row: 0 });
    expect(sorted.find((tile) => tile.x === first.x + 1 && tile.y === first.y)).toMatchObject({ column: 1, row: 0 });
    expect(sorted.find((tile) => tile.x === first.x && tile.y === first.y + 1)).toMatchObject({ column: 0, row: 1 });
    expect(sorted.at(-1)).toMatchObject({ column: set.columns - 1, row: set.rows - 1 });
  });

  test("the place is inside the tiles, at the origin", () => {
    const holdsOrigin = set.tiles.find(({ extent }) => extent.left <= 0 && 0 < extent.right && extent.bottom <= 0 && 0 < extent.top);
    expect(holdsOrigin).toBeDefined();
  });

  test("the address is the template with the tile's numbers, the key kept", () => {
    const tile = set.tiles.find(({ extent }) => extent.left <= 0 && 0 < extent.right && extent.bottom <= 0 && 0 < extent.top)!;
    expect(tile.address).toBe(
      `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/19/${tile.y}/${tile.x}?token=${KEY}`,
    );
    // Pune at zoom 19, as the web's tile numbering counts it: x from the west, y from the north.
    expect(tile.x).toBe(Math.floor(((PUNE.lon + 180) / 360) * 2 ** 19));
    expect(tile.y).toBe(Math.floor(((1 - Math.asinh(Math.tan((PUNE.lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** 19));
  });

  test("the tiles of one template are spread as the map spreads them: one of several by its place", () => {
    const two = tilesAround({ ...IMAGERY, tiles: ["a/{z}/{x}/{y}", "b/{z}/{x}/{y}"] }, PUNE.lat, PUNE.lon);
    const hosts = new Set(two.tiles.map((tile) => tile.address[0]));
    expect(hosts).toEqual(new Set(["a", "b"]));
  });

  test("another radius covers more", () => {
    const wider = tilesAround(IMAGERY, PUNE.lat, PUNE.lon, 300);
    expect(wider.columns).toBeGreaterThanOrEqual(9);
    expect(wider.extent.left).toBeLessThanOrEqual(-300);
    expect(wider.extent.top).toBeGreaterThanOrEqual(300);
  });
});

describe("the tiles at other latitudes", () => {
  test("at the equator a tile is 76 m: 150 m each way is 4 or 5 tiles", () => {
    const set = tilesAround(IMAGERY, 0, 0);
    expect(set.tiles[0].extent.right - set.tiles[0].extent.left).toBeCloseTo(256 * metresPerPixel(0), 0);
    expect(set.columns).toBeGreaterThanOrEqual(4);
    expect(set.columns).toBeLessThanOrEqual(5);
  });

  test("at 60° N a tile is 38 m on the ground: twice the columns of the equator", () => {
    const set = tilesAround(IMAGERY, 60, 10);
    expect(set.tiles[0].extent.right - set.tiles[0].extent.left).toBeCloseTo(256 * metresPerPixel(60), 0);
    expect(set.columns).toBeGreaterThanOrEqual(8);
    expect(set.columns).toBeLessThanOrEqual(9);
    expect(set.rows).toBeGreaterThanOrEqual(8);
    expect(set.extent.left).toBeLessThanOrEqual(-150);
    expect(set.extent.right).toBeGreaterThanOrEqual(150);
  });

  test("the zoom is the imagery's native zoom", () => {
    const set = tilesAround({ ...IMAGERY, maxNativeZoom: 18 }, PUNE.lat, PUNE.lon);
    expect(set.tiles.every((tile) => tile.z === 18)).toBe(true);
    expect(set.columns).toBeLessThanOrEqual(4);
  });
});

describe("the grid where there is no imagery", () => {
  test("a line every 10 m across the square, the edges included", () => {
    const lines = gridLinesOf(60, 10);
    expect(lines).toHaveLength(14);
    expect(lines).toContainEqual([
      [-30, -30],
      [-30, 30],
    ]);
    expect(lines).toContainEqual([
      [-30, 30],
      [30, 30],
    ]);
    expect(lines).toContainEqual([
      [0, -30],
      [0, 30],
    ]);
  });

  test("a square that is not a whole number of steps ends on its edge", () => {
    const lines = gridLinesOf(25, 10);
    const along = lines.filter(([a, b]) => a[0] === b[0]).map(([a]) => a[0]);
    expect(along).toEqual([-12.5, -2.5, 7.5]);
  });
});
