// The tiles of the imagery fetched and drawn onto one picture (plan/phase-05-plan.md, decision 8). The
// fetcher and the canvas come from the caller, so that this runs under bun test with fakes; the component
// gives it fetch and a canvas of the document.
import { PALETTE } from "../scene-palette";
import type { Tile, TileSet } from "./ground";

/** Fetches one tile by its address. */
export type TileFetcher = (address: string) => Promise<Response>;

/** What of a 2D drawing context the stitching uses. */
export type DrawingContext = {
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, width: number, height: number): void;
  drawImage(image: ImageBitmap, x: number, y: number, width: number, height: number): void;
};

/** What of a canvas the stitching uses: an HTMLCanvasElement is one. */
export type CanvasLike = {
  width: number;
  height: number;
  getContext(kind: "2d"): DrawingContext | null;
};

export type Stitched = {
  /** How many tiles are in the picture. */
  drawn: number;
  /** The addresses of the tiles that did not come: their squares are the plain ground. */
  failed: string[];
};

/** A tile fetched and decoded; null when it does not come or cannot be read. */
async function bitmapOf(tile: Tile, fetcher: TileFetcher): Promise<ImageBitmap | null> {
  try {
    const response = await fetcher(tile.address);
    if (!response.ok) return null;
    return await createImageBitmap(await response.blob());
  } catch {
    return null;
  }
}

/**
 * Sizes the canvas to the picture, fills it with the plain ground, fetches every tile at once and draws
 * each that comes at its column and row. Never throws: a tile that fails is named in the result and its
 * square stays plain.
 */
export async function stitchTiles(set: TileSet, fetcher: TileFetcher, canvas: CanvasLike): Promise<Stitched> {
  const { tiles, tileSize } = set;
  canvas.width = set.widthPx;
  canvas.height = set.heightPx;
  const context = canvas.getContext("2d");
  if (!context) return { drawn: 0, failed: tiles.map((tile) => tile.address) };
  context.fillStyle = PALETTE.groundPlain;
  context.fillRect(0, 0, set.widthPx, set.heightPx);

  const failed: string[] = [];
  let drawn = 0;
  await Promise.all(
    tiles.map(async (tile) => {
      const bitmap = await bitmapOf(tile, fetcher);
      if (!bitmap) {
        failed.push(tile.address);
        return;
      }
      context.drawImage(bitmap, tile.column * tileSize, tile.row * tileSize, tileSize, tileSize);
      bitmap.close();
      drawn += 1;
    }),
  );
  return { drawn, failed };
}
