import { describe, expect, test } from "bun:test";
import path from "node:path";
import { FileSource, PMTiles, TileType } from "pmtiles";
import { directoryOf, FOOTPRINTS_ZOOM, tileOf, tilesOfBox } from "./footprints";

// The archive of footprints that tools/footprints.ts writes, read back with the reader the app uses
// (the pmtiles package): the fixture of the browser tests must be what the app reads at Overture.

const FIXTURE = path.resolve(import.meta.dir, "../e2e/fixtures/footprints-pune.pmtiles");
const PUNE = tileOf(73.86, 18.52, FOOTPRINTS_ZOOM);

describe("the tiles of a box", () => {
  test("the tile that holds Pune's demo roof at zoom 14", () => {
    expect(PUNE).toEqual({ x: 11553, y: 7334 });
  });

  test("a box inside one tile is that tile; a box across an edge, both", () => {
    expect(tilesOfBox(73.858, 18.515, 73.864, 18.521, FOOTPRINTS_ZOOM)).toEqual([PUNE]);
    expect(tilesOfBox(73.855, 18.516, 73.865, 18.524, FOOTPRINTS_ZOOM).length).toBeGreaterThan(1);
  });
});

describe("a directory", () => {
  test("one entry: its count, its id, one run, its length, its offset and one", () => {
    expect([...directoryOf([{ tileId: 5, offset: 0, length: 3 }])]).toEqual([1, 5, 1, 3, 1]);
  });

  test("entries that follow each other say so with a nought", () => {
    expect([...directoryOf([{ tileId: 7, offset: 10, length: 4 }, { tileId: 5, offset: 0, length: 10 }])]).toEqual([2, 5, 2, 1, 1, 10, 4, 1, 0]);
  });
});

describe("the fixture, read back as the app reads Overture", () => {
  // The reader takes a file of the browser; the file of Bun has the same slice and bytes.
  const archive = new PMTiles(new FileSource(Bun.file(FIXTURE) as unknown as File));

  test("its header: version 3, vector tiles, zoom 14 alone, gzip tiles", async () => {
    const header = await archive.getHeader();

    expect([header.specVersion, header.tileType, header.minZoom, header.maxZoom]).toEqual([3, TileType.Mvt, FOOTPRINTS_ZOOM, FOOTPRINTS_ZOOM]);
    expect(header.numTileEntries).toBeGreaterThanOrEqual(1);
    expect(header.minLon).toBeLessThan(73.86);
    expect(header.maxLon).toBeGreaterThan(73.86);
  });

  test("its metadata is Overture's: a layer of buildings", async () => {
    const metadata = (await archive.getMetadata()) as { vector_layers?: { id: string }[] };

    expect(metadata.vector_layers?.map((layer) => layer.id)).toContain("building");
  });

  test("the tile of the demo roof is there, decompressed by the reader; a tile elsewhere is not", async () => {
    const tile = await archive.getZxy(FOOTPRINTS_ZOOM, PUNE.x, PUNE.y);

    expect(tile?.data.byteLength).toBeGreaterThan(10_000);
    expect(await archive.getZxy(FOOTPRINTS_ZOOM, PUNE.x + 5, PUNE.y + 5)).toBeUndefined();
  });
});
