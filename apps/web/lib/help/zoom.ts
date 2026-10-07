// A how-to's picture opened large on touch (D81): its scale and where it stands in its frame, pinched and moved with the
// fingers. Pure. At scale 1 the picture is the frame's width; it is never smaller, nor larger than MOST_ZOOM times (past
// it, a picture taken at twice the pixels only blurs); along an edge where it is larger than the frame it leaves no gap,
// and where it is not, it stays in the middle.

export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
/** The scale, and where the picture's top left stands in the frame, in pixels. */
export type View = { scale: number; x: number; y: number };

export const MOST_ZOOM = 3;

const clamp = (value: number, least: number, most: number) => Math.min(most, Math.max(least, value));

/** Where the picture stands along one edge: in the middle while it is the shorter, else with no gap at either end. */
const along = (at: number, shown: number, frame: number) => (shown <= frame ? (frame - shown) / 2 : clamp(at, frame - shown, 0));

function held(view: View, frame: Size, picture: Size): View {
  const width = frame.width * view.scale;
  const height = (frame.width * picture.height * view.scale) / picture.width;
  // + 0: a place of -0 is 0.
  return { scale: view.scale, x: along(view.x, width, frame.width) + 0, y: along(view.y, height, frame.height) + 0 };
}

/** As it opens: the frame's width, in the middle of its height. */
export function fitted(frame: Size, picture: Size): View {
  return held({ scale: 1, x: 0, y: 0 }, frame, picture);
}

const middle = ([a, b]: readonly [Point, Point]): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const apart = ([a, b]: readonly [Point, Point]) => Math.hypot(a.x - b.x, a.y - b.y);

/** Two fingers moved from *from* to *to*: scaled by how far apart they went, the point between them kept under them. */
export function pinched(view: View, from: readonly [Point, Point], to: readonly [Point, Point], frame: Size, picture: Size): View {
  const scale = clamp(view.scale * (apart(to) / Math.max(apart(from), 1)), 1, MOST_ZOOM);
  const before = middle(from);
  const after = middle(to);
  const under = { x: (before.x - view.x) / view.scale, y: (before.y - view.y) / view.scale };
  return held({ scale, x: after.x - under.x * scale, y: after.y - under.y * scale }, frame, picture);
}

/** One finger moved *by*. */
export function panned(view: View, by: Point, frame: Size, picture: Size): View {
  return held({ scale: view.scale, x: view.x + by.x, y: view.y + by.y }, frame, picture);
}
