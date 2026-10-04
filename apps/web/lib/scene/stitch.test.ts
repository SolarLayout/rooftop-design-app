import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { PALETTE } from "../geometry/scene-palette";
import type { Tile, TileSet } from "./ground";
import { stitchTiles, type CanvasLike, type TileFetcher } from "./stitch";

// The tiles of the imagery fetched and drawn onto one picture. The fetcher and the canvas are fakes:
// nothing here touches the network or a browser.

const EXTENT = { left: 0, right: 1, bottom: 0, top: 1 };

function tileAt(column: number, row: number): Tile {
  return { z: 19, x: 100 + column, y: 200 + row, column, row, address: `tile/${column}/${row}`, extent: EXTENT };
}

function setOf(columns: number, rows: number): TileSet {
  const tiles: Tile[] = [];
  for (let row = 0; row < rows; row += 1) for (let column = 0; column < columns; column += 1) tiles.push(tileAt(column, row));
  return { tiles, columns, rows, tileSize: 256, widthPx: columns * 256, heightPx: rows * 256, extent: EXTENT };
}

type Drawn = { image: unknown; x: number; y: number; width: number; height: number };

function fakeCanvas(): { canvas: CanvasLike; drawn: Drawn[]; filled: Array<{ style: unknown; x: number; y: number; width: number; height: number }> } {
  const drawn: Drawn[] = [];
  const filled: Array<{ style: unknown; x: number; y: number; width: number; height: number }> = [];
  const context = {
    fillStyle: "" as string | CanvasGradient | CanvasPattern,
    fillRect(x: number, y: number, width: number, height: number) {
      filled.push({ style: context.fillStyle, x, y, width, height });
    },
    drawImage(image: ImageBitmap, x: number, y: number, width: number, height: number) {
      drawn.push({ image, x, y, width, height });
    },
  };
  const canvas: CanvasLike = { width: 0, height: 0, getContext: () => context };
  return { canvas, drawn, filled };
}

/** A fetcher that answers a PNG-shaped blob for every address but those named, which fail as told. */
function fetcherThat(fails: Record<string, "network" | "status" | "not-an-image"> = {}): { fetcher: TileFetcher; asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    fetcher: async (address) => {
      asked.push(address);
      const fault = fails[address];
      if (fault === "network") throw new TypeError("Failed to fetch");
      if (fault === "status") return new Response("", { status: 404 });
      return new Response(new Blob([fault === "not-an-image" ? "words" : "png"], { type: "image/png" }));
    },
  };
}

const closed: ImageBitmap[] = [];
const before = globalThis.createImageBitmap;

beforeEach(() => {
  closed.length = 0;
  globalThis.createImageBitmap = (async (blob: Blob) => {
    if ((await blob.text()) !== "png") throw new DOMException("The source image could not be decoded.", "InvalidStateError");
    const bitmap = { width: 256, height: 256, close: () => closed.push(bitmap) } as unknown as ImageBitmap;
    return bitmap;
  }) as typeof createImageBitmap;
});

afterEach(() => {
  globalThis.createImageBitmap = before;
});

describe("stitching the tiles", () => {
  test("sizes the canvas, fills it with the plain ground, and draws every tile at its column and row", async () => {
    const set = setOf(2, 3);
    const { canvas, drawn, filled } = fakeCanvas();
    const { fetcher, asked } = fetcherThat();

    const result = await stitchTiles(set, fetcher, canvas);

    expect(result).toEqual({ drawn: 6, failed: [] });
    expect([canvas.width, canvas.height]).toEqual([512, 768]);
    expect(filled).toEqual([{ style: PALETTE.groundPlain, x: 0, y: 0, width: 512, height: 768 }]);
    expect(asked.sort()).toEqual(set.tiles.map((tile) => tile.address).sort());
    expect(drawn.map(({ x, y, width, height }) => [x, y, width, height]).sort()).toEqual(
      set.tiles.map((tile) => [tile.column * 256, tile.row * 256, 256, 256]).sort(),
    );
  });

  test("every bitmap is closed once it is drawn", async () => {
    const set = setOf(2, 2);
    await stitchTiles(set, fetcherThat().fetcher, fakeCanvas().canvas);
    expect(closed).toHaveLength(4);
  });

  test("a tile that does not come leaves its square plain and is named; the rest are drawn", async () => {
    const set = setOf(3, 1);
    const { canvas, drawn } = fakeCanvas();
    const { fetcher } = fetcherThat({ "tile/0/0": "network", "tile/1/0": "status", "tile/2/0": "not-an-image" });

    const result = await stitchTiles(set, fetcher, canvas);

    expect(result.drawn).toBe(0);
    expect(result.failed.sort()).toEqual(["tile/0/0", "tile/1/0", "tile/2/0"]);
    expect(drawn).toEqual([]);
  });

  test("one failure among many: the others are still drawn", async () => {
    const set = setOf(2, 2);
    const { canvas, drawn } = fakeCanvas();
    const { fetcher } = fetcherThat({ "tile/1/1": "status" });

    const result = await stitchTiles(set, fetcher, canvas);

    expect(result).toEqual({ drawn: 3, failed: ["tile/1/1"] });
    expect(drawn.map(({ x, y }) => [x, y]).sort()).toEqual([
      [0, 0],
      [0, 256],
      [256, 0],
    ]);
  });

  test("a canvas without a drawing context draws nothing and says every tile failed", async () => {
    const set = setOf(1, 1);
    const canvas: CanvasLike = { width: 0, height: 0, getContext: () => null };
    const { fetcher, asked } = fetcherThat();

    const result = await stitchTiles(set, fetcher, canvas);

    expect(result).toEqual({ drawn: 0, failed: ["tile/0/0"] });
    expect(asked).toEqual([]);
  });
});
