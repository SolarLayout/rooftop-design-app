/**
 * The installed app's name, colours and mark (issue 147). The browser paints the splash, the status bar and the icon
 * before it reads the stylesheet, so the colours are the tokens' (`--color-ground`, `--color-text`) written once more;
 * `brand.test.ts` holds them equal, and holds `app/icon.svg` drawn from the same mark.
 */
export const BRAND = {
  name: "SolarLayout Rooftop",
  shortName: "Rooftop",
  ground: "#0B0E13",
  mark: "#F2F4F7",
} as const;

const POINTS: ReadonlyArray<readonly [number, number]> = [
  [6, 21],
  [16, 10],
  [26, 21],
];

/** The mark, a roof's ridge, in a square box of 32: its corner, the stroke and the line through its points. */
export const MARK = {
  box: 32,
  corner: 7,
  stroke: 2.5,
  points: POINTS,
  path: `M${POINTS.map(([x, y]) => `${x} ${y}`).join(" ")}`,
} as const;
