// The scale bar of the map: the largest round length that fits in the width it may have.

const EARTH_CIRCUMFERENCE = 40_075_016.686;

/** Round lengths in metres, the smallest first. */
const ROUND_LENGTHS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000, 1_000_000];

export type ScaleBar = { metres: number; widthPx: number; label: string };

/** The world is this many pixels wide at zoom 0: MapLibre counts its zoom on tiles of 512. */
const WORLD_AT_ZOOM_0 = 512;

/** How many metres one CSS pixel of the map is, at MapLibre's `zoom` and at `latitude`. */
export function metresPerPixel(latitude: number, zoom: number): number {
  return (EARTH_CIRCUMFERENCE * Math.cos((latitude * Math.PI) / 180)) / (WORLD_AT_ZOOM_0 * 2 ** zoom);
}

/** The bar: the largest round length that is at most `maxWidthPx` wide; null when even 1 m is too wide. */
export function scaleBarOf(metresPerPx: number, maxWidthPx: number): ScaleBar | null {
  const fits = ROUND_LENGTHS.filter((metres) => metres / metresPerPx <= maxWidthPx);
  const metres = fits.at(-1);
  if (metres === undefined) return null;
  const label = metres >= 1000 ? `${metres / 1000} km` : `${metres} m`;
  return { metres, widthPx: Math.round(metres / metresPerPx), label };
}
