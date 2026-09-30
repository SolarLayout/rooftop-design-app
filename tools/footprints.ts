// bun tools/footprints.ts <west> <south> <east> <north> <out.pmtiles>
// Takes the building footprints of a box out of Overture's pinned release into a small PMTiles archive
// of its own: the fixture of the browser tests (e2e/fixtures/footprints-pune.pmtiles), and a mirror of
// the tiles the app needs when it is deployed (plan/phase-04-plan.md, decision 12). Overture's tiles
// end at zoom 14; the archive holds the tiles of that zoom that cover the box, stored as they are, and
// the metadata of the release, so that the app reads it exactly as it reads the release.
//
// The archive is PMTiles version 3 (https://github.com/protomaps/PMTiles/blob/main/spec/v3/spec.md):
// a header of 127 bytes, a root directory, the metadata, the tiles. Directories and metadata are not
// compressed; the tiles keep the release's gzip.
import { writeFileSync } from "node:fs";
import { FetchSource, PMTiles, TileType, zxyToTileId } from "pmtiles";

export const OVERTURE_RELEASE = "2026-09-23.1";
export const OVERTURE_BUILDINGS = `https://tiles.overturemaps.org/${OVERTURE_RELEASE}/buildings.pmtiles`;
export const FOOTPRINTS_ZOOM = 14;

const HEADER_BYTES = 127;

/** The tile of zoom `zoom` that holds a place. */
export function tileOf(lon: number, lat: number, zoom: number): { x: number; y: number } {
  const n = 2 ** zoom;
  const x = Math.floor(((lon + 180) / 360) * n);
  const radians = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2) * n);
  return { x, y };
}

/** Every tile of `zoom` that covers the box. */
export function tilesOfBox(west: number, south: number, east: number, north: number, zoom: number): { x: number; y: number }[] {
  const low = tileOf(west, north, zoom);
  const high = tileOf(east, south, zoom);
  const tiles: { x: number; y: number }[] = [];
  for (let x = low.x; x <= high.x; x += 1) for (let y = low.y; y <= high.y; y += 1) tiles.push({ x, y });
  return tiles;
}

function varint(value: number): number[] {
  const bytes: number[] = [];
  let left = value;
  while (left >= 0x80) {
    bytes.push((left % 0x80) | 0x80);
    left = Math.floor(left / 0x80);
  }
  bytes.push(left);
  return bytes;
}

type Entry = { tileId: number; offset: number; length: number };

/** A directory of entries, each a run of one tile, as the specification encodes it. */
export function directoryOf(entries: Entry[]): Uint8Array {
  const sorted = [...entries].sort((a, b) => a.tileId - b.tileId);
  const bytes: number[] = [...varint(sorted.length)];
  let lastId = 0;
  for (const entry of sorted) {
    bytes.push(...varint(entry.tileId - lastId));
    lastId = entry.tileId;
  }
  for (const _ of sorted) bytes.push(...varint(1));
  for (const entry of sorted) bytes.push(...varint(entry.length));
  sorted.forEach((entry, n) => {
    const previous = sorted[n - 1];
    const follows = previous && entry.offset === previous.offset + previous.length;
    bytes.push(...varint(follows ? 0 : entry.offset + 1));
  });
  return new Uint8Array(bytes);
}

type Bounds = { west: number; south: number; east: number; north: number };

function header(rootLength: number, metadataLength: number, tileDataLength: number, tiles: number, bounds: Bounds): Uint8Array {
  const bytes = new Uint8Array(HEADER_BYTES);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode("PMTiles"), 0);
  bytes[7] = 3;
  const rootOffset = HEADER_BYTES;
  const metadataOffset = rootOffset + rootLength;
  const tileDataOffset = metadataOffset + metadataLength;
  view.setBigUint64(8, BigInt(rootOffset), true);
  view.setBigUint64(16, BigInt(rootLength), true);
  view.setBigUint64(24, BigInt(metadataOffset), true);
  view.setBigUint64(32, BigInt(metadataLength), true);
  view.setBigUint64(40, 0n, true);
  view.setBigUint64(48, 0n, true);
  view.setBigUint64(56, BigInt(tileDataOffset), true);
  view.setBigUint64(64, BigInt(tileDataLength), true);
  view.setBigUint64(72, BigInt(tiles), true);
  view.setBigUint64(80, BigInt(tiles), true);
  view.setBigUint64(88, BigInt(tiles), true);
  bytes[96] = 1; // clustered
  bytes[97] = 1; // internal compression: none
  bytes[98] = 2; // tile compression: gzip, as the release has it
  bytes[99] = TileType.Mvt;
  bytes[100] = FOOTPRINTS_ZOOM;
  bytes[101] = FOOTPRINTS_ZOOM;
  const e7 = (degrees: number) => Math.round(degrees * 1e7);
  view.setInt32(102, e7(bounds.west), true);
  view.setInt32(106, e7(bounds.south), true);
  view.setInt32(110, e7(bounds.east), true);
  view.setInt32(114, e7(bounds.north), true);
  bytes[118] = FOOTPRINTS_ZOOM;
  view.setInt32(119, e7((bounds.west + bounds.east) / 2), true);
  view.setInt32(123, e7((bounds.south + bounds.north) / 2), true);
  return bytes;
}

/** The archive of the tiles of `bounds`, read from the release. */
export async function archiveOf(bounds: Bounds, release = OVERTURE_BUILDINGS): Promise<{ bytes: Uint8Array<ArrayBuffer>; tiles: number }> {
  const source = new PMTiles(new FetchSource(release));
  const metadata = JSON.stringify(await source.getMetadata());
  const tiles = tilesOfBox(bounds.west, bounds.south, bounds.east, bounds.north, FOOTPRINTS_ZOOM);
  const found: { tileId: number; data: Uint8Array }[] = [];
  for (const { x, y } of tiles) {
    const tile = await source.getZxy(FOOTPRINTS_ZOOM, x, y);
    if (tile) found.push({ tileId: zxyToTileId(FOOTPRINTS_ZOOM, x, y), data: gzipSync(new Uint8Array(tile.data.slice(0))) });
  }
  found.sort((a, b) => a.tileId - b.tileId);
  const entries: Entry[] = [];
  let offset = 0;
  for (const tile of found) {
    entries.push({ tileId: tile.tileId, offset, length: tile.data.length });
    offset += tile.data.length;
  }
  const root = directoryOf(entries);
  const meta = new TextEncoder().encode(metadata);
  const head = header(root.length, meta.length, offset, found.length, bounds);
  const bytes = new Uint8Array(head.length + root.length + meta.length + offset);
  bytes.set(head, 0);
  bytes.set(root, head.length);
  bytes.set(meta, head.length + root.length);
  let at = head.length + root.length + meta.length;
  for (const tile of found) {
    bytes.set(tile.data, at);
    at += tile.data.length;
  }
  return { bytes, tiles: found.length };
}

function gzipSync(data: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const zipped = Bun.gzipSync(data);
  const copy = new Uint8Array(new ArrayBuffer(zipped.byteLength));
  copy.set(zipped);
  return copy;
}

if (import.meta.main) {
  const [west, south, east, north, out] = process.argv.slice(2);
  if (!out) {
    console.error("bun tools/footprints.ts <west> <south> <east> <north> <out.pmtiles>");
    process.exit(2);
  }
  const bounds = { west: Number(west), south: Number(south), east: Number(east), north: Number(north) };
  const { bytes, tiles } = await archiveOf(bounds);
  writeFileSync(out, bytes);
  console.log(`Wrote ${out}: ${tiles} tile(s) of zoom ${FOOTPRINTS_ZOOM} from Overture ${OVERTURE_RELEASE}, ${bytes.length} bytes.`);
}
