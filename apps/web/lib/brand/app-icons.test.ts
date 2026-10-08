import { describe, expect, test } from "bun:test";
import { APP_ICONS, appIconNamed } from "./app-icons";
import { MARK } from "./brand";

// The icons of the installed app (issue 147): the manifest's, 192 and 512 with their corners, and 512 to the edges for a
// launcher that cuts its own shape (maskable). The Apple touch icon is 180 to the edges: iOS rounds it.

describe("the icons of the installed app", () => {
  test("the manifest's: 192 and 512 with corners, 512 to the edges as maskable", () => {
    expect(APP_ICONS.map(({ file, size, purpose, rounded }) => ({ file, size, purpose, rounded }))).toEqual([
      { file: "192.png", size: 192, purpose: "any", rounded: true },
      { file: "512.png", size: 512, purpose: "any", rounded: true },
      { file: "maskable-512.png", size: 512, purpose: "maskable", rounded: false },
    ]);
  });

  test("each is found by its file, and nothing else is", () => {
    expect(appIconNamed("maskable-512.png")?.size).toBe(512);
    expect(appIconNamed("1024.png")).toBeNull();
  });

  test("the mark stays inside the circle a maskable icon keeps, four fifths of the side", () => {
    // The ends of the mark are the farthest from the middle; the stroke's half is round about them.
    const middle = MARK.box / 2;
    const reach = Math.max(...MARK.points.map(([x, y]) => Math.hypot(x - middle, y - middle))) + MARK.stroke / 2;
    expect(reach).toBeLessThan((MARK.box * 0.8) / 2);
  });
});
