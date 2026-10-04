// The ground under the roof (plan/phase-05-plan.md, decision 8): the tiles of the imagery at its native
// zoom that cover a square about the roof's centroid, each with its corners in the roof's metres through
// the flat frame of lib/outline/frame.ts (the centroid is the origin of the scene, and the API's outline
// is about it too: D41); and the grid where there is no imagery. Pure functions in the engine's metres,
// x east, y north; the component lays them with the adapter.
import type { Imagery } from "../places/provider";
import { frameAt, toMetres, type Frame } from "../outline/frame";
import type { XY } from "../geometry/adapter";

/** How far the imagery reaches from the roof's centroid, in metres, each way. */
export const IMAGERY_RADIUS = 150;

/** A rectangle in the engine's metres. */
export type Extent = { left: number; right: number; bottom: number; top: number };

/** One tile of the imagery: its numbers, its address, its corners, and its place in the stitched picture. */
export type Tile = {
  z: number;
  /** From the west, as the web counts tiles. */
  x: number;
  /** From the north. */
  y: number;
  /** The template filled: where the tile is fetched from. */
  address: string;
  /** Its corners in metres about the place. */
  extent: Extent;
  /** Its column and row in the stitched picture, from the top left. */
  column: number;
  row: number;
};

/** The tiles that cover a square about a place, and the picture they are stitched into. */
export type TileSet = {
  tiles: Tile[];
  /** The corners of the whole picture in metres about the place. */
  extent: Extent;
  columns: number;
  rows: number;
  /** A tile's side in pixels: the imagery's. */
  tileSize: number;
  widthPx: number;
  heightPx: number;
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/** The tile column at a longitude, as a fraction: the web's numbering of Web Mercator. */
const columnAt = (lon: number, zoom: number) => ((lon + 180) / 360) * 2 ** zoom;

/** The tile row at a latitude, as a fraction: 0 at the top of the world. */
const rowAt = (lat: number, zoom: number) => ((1 - Math.asinh(Math.tan(toRadians(lat))) / Math.PI) / 2) * 2 ** zoom;

const lonOfColumn = (column: number, zoom: number) => (column / 2 ** zoom) * 360 - 180;

const latOfRow = (row: number, zoom: number) => toDegrees(Math.atan(Math.sinh(Math.PI * (1 - (2 * row) / 2 ** zoom))));

/** The template of a tile filled with its numbers; several templates are spread by the tile's place, as the map does. */
function addressOf(templates: readonly string[], z: number, x: number, y: number): string {
  const template = templates[(x + y) % templates.length];
  return template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y));
}

/** The corners of a tile in metres about the frame's centre. */
function extentOf(frame: Frame, z: number, x: number, y: number): Extent {
  const west = toMetres(frame, { lon: lonOfColumn(x, z), lat: latOfRow(y, z) });
  const east = toMetres(frame, { lon: lonOfColumn(x + 1, z), lat: latOfRow(y + 1, z) });
  return { left: west.x, right: east.x, bottom: east.y, top: west.y };
}

/**
 * The tiles of the imagery, at its native zoom, that cover `radiusMetres` each way of a place: each with
 * its address, its corners in metres about the place, and its place in the picture they make, laid as
 * on the ground (north at the top, east to the right), 256 px a tile.
 */
export function tilesAround(imagery: Imagery, lat: number, lon: number, radiusMetres = IMAGERY_RADIUS): TileSet {
  const z = imagery.maxNativeZoom;
  const frame = frameAt({ lat, lon });
  const dLon = radiusMetres / frame.metresPerDegreeLon;
  const dLat = radiusMetres / frame.metresPerDegreeLat;
  const firstColumn = Math.floor(columnAt(lon - dLon, z));
  const lastColumn = Math.floor(columnAt(lon + dLon, z));
  const firstRow = Math.floor(rowAt(lat + dLat, z));
  const lastRow = Math.floor(rowAt(lat - dLat, z));
  const columns = lastColumn - firstColumn + 1;
  const rows = lastRow - firstRow + 1;

  const tiles: Tile[] = [];
  for (let y = firstRow; y <= lastRow; y += 1) {
    for (let x = firstColumn; x <= lastColumn; x += 1) {
      tiles.push({ z, x, y, address: addressOf(imagery.tiles, z, x, y), extent: extentOf(frame, z, x, y), column: x - firstColumn, row: y - firstRow });
    }
  }
  const extent: Extent = {
    left: extentOf(frame, z, firstColumn, firstRow).left,
    right: extentOf(frame, z, lastColumn, firstRow).right,
    bottom: extentOf(frame, z, firstColumn, lastRow).bottom,
    top: extentOf(frame, z, firstColumn, firstRow).top,
  };
  const { tileSize } = imagery;
  return { tiles, extent, columns, rows, tileSize, widthPx: columns * tileSize, heightPx: rows * tileSize };
}

/**
 * The grid of the plain ground: a line every `step` metres each way across a square of `size` about the
 * origin, its edges included, each line from one edge to the other.
 */
export function gridLinesOf(size: number, step: number): Array<[XY, XY]> {
  const half = size / 2;
  const lines: Array<[XY, XY]> = [];
  for (let at = -half; at <= half; at += step) {
    lines.push([
      [at, -half],
      [at, half],
    ]);
    lines.push([
      [-half, at],
      [half, at],
    ]);
  }
  return lines;
}
