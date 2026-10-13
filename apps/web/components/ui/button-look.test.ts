import { describe, expect, test } from "bun:test";
import { buttonLook, iconButtonLook } from "./button-look";

// The look of an icon button (docs/design/components.md, "Buttons"): raised at rest, answering to the pointer;
// open, while the panel it opens is open, it looks pressed and stays so, as the trigger of a Select does (the
// Layers button of the stage, the board "Stage, Layers").

const classesOf = (look: string) => look.split(" ");

describe("the look of an icon button", () => {
  test("closed, a secondary one is raised, with the line, and answers to the pointer", () => {
    const classes = classesOf(iconButtonLook("secondary", "s", "square"));

    expect(classes).toContain("bg-control");
    expect(classes).toContain("shadow-raised");
    expect(classes).toContain("border-line");
    expect(classes).toContain("hovered:raised-by-hover");
    expect(classes).not.toContain("bg-control-pressed");
  });

  test("open, it looks pressed and stays so: the pressed surface and shadow, the strong line, no answer to the pointer", () => {
    const classes = classesOf(iconButtonLook("secondary", "s", "square", true));

    expect(classes).toContain("bg-control-pressed");
    expect(classes).toContain("shadow-pressed");
    expect(classes).toContain("border-line-strong");
    expect(classes).not.toContain("shadow-raised");
    expect(classes.some((name) => name.startsWith("hovered:"))).toBe(false);
  });

  test("open or closed, the size and the corners are the same: 44 on touch, 40 on desktop, the control's radius", () => {
    for (const isOpen of [false, true]) {
      const classes = classesOf(iconButtonLook("secondary", "s", "square", isOpen));
      expect(classes).toContain("size-touch");
      expect(classes).toContain("desktop:size-10");
      expect(classes).toContain("rounded-control");
      expect(classes.filter((name) => name.includes("rounded-row"))).toEqual([]);
    }
  });
});

// V2's heights (D94): 32 compact, 40 standard, 48 primary on desktop; 44, 44 and 48 on touch; the control's radius, 8.
describe("the heights of a button", () => {
  const heightsOf = (look: string) => classesOf(look).filter((name) => /(^|:)(h|size)-/.test(name));

  test("compact: 32 on desktop, 44 on touch", () => {
    for (const size of ["xs", "s"] as const) expect(heightsOf(buttonLook("secondary", size))).toEqual(["h-touch", "desktop:h-8"]);
    expect(heightsOf(iconButtonLook("quiet", "xs", "square"))).toEqual(["size-touch", "desktop:size-8"]);
  });

  test("standard: 40 on desktop, 44 on touch", () => {
    for (const size of ["m", "l"] as const) expect(heightsOf(buttonLook("secondary", size))).toEqual(["h-touch", "desktop:h-10"]);
    expect(heightsOf(buttonLook("quiet", "sheet"))).toEqual(["h-touch", "desktop:h-10"]);
  });

  test("primary: 48 at every size", () => {
    expect(heightsOf(buttonLook("primary", "xl"))).toEqual(["h-12"]);
    expect(heightsOf(buttonLook("primary", "sheet"))).toEqual(["h-12", "tablet:h-touch", "desktop:h-10"]);
  });

  const cornersOf = (look: string) => classesOf(look).filter((name) => name.includes("rounded"));

  test("the large orange primary, 48 high, has the radius of Find the roof, 14 (the owner, 2026-10-13)", () => {
    expect(cornersOf(buttonLook("primary", "xl"))).toEqual(["rounded-cta"]);
  });

  test("every other button has the control's radius, 8, at every size", () => {
    for (const kind of ["primary", "secondary", "quiet"] as const) {
      for (const size of ["xs", "s", "m", "l", "xl", "sheet"] as const) {
        if (kind === "primary" && size === "xl") continue;
        expect(cornersOf(buttonLook(kind, size))).toEqual(["rounded-control"]);
      }
    }
  });
});

describe("every target is 44 × 44 on touch (V2 · 10, D106; audit V2-116)", () => {
  const touchOf = (look: string) => classesOf(look).filter((name) => /^(h|size)-/.test(name));
  const isTouch = (name: string) => name === "h-touch" || name === "size-touch" || name === "h-12";

  test("each size of button is at least 44 high on touch", () => {
    for (const size of ["xs", "s", "m", "l", "xl", "sheet"] as const) {
      for (const kind of ["primary", "secondary", "quiet"] as const) expect([size, kind, touchOf(buttonLook(kind, size)).some(isTouch)]).toEqual([size, kind, true]);
    }
  });

  test("each size of icon button is 44 square on touch", () => {
    for (const size of ["xs", "s", "m", "l"] as const) expect([size, touchOf(iconButtonLook("quiet", size, "square"))]).toEqual([size, ["size-touch"]]);
  });
});
