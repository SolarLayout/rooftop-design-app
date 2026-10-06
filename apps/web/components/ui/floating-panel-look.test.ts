import { describe, expect, test } from "bun:test";
import { floatingPanelLook } from "./floating-panel-look";

// The look of a panel that floats (docs/design/components.md, "Select" and "Layers button (the stage)"): on phone
// and tablet a bottom sheet, unless it is asked to stay floating beside its control there too, as the Layers
// panel of the stage does (decision D57: the ground it changes must stay in sight).

const classesOf = (look: string) => look.split(" ");
const ofDesktopAlone = (name: string) => name.startsWith("desktop:");

describe("the look of a panel that floats", () => {
  test("as a sheet on touch: the sheet at the screen's bottom, and beside its control on desktop alone, at its width there", () => {
    const classes = classesOf(floatingPanelLook("card", "sheet"));

    expect(classes).toContain("bottom-0");
    expect(classes).toContain("bg-chrome");
    expect(classes).toContain("desktop:placed");
    expect(classes).toContain("desktop:w-60");
    expect(classes).not.toContain("placed");
    expect(classes).not.toContain("w-60");
  });

  test("floating on touch: beside its control at every size, at its width, with nothing of the sheet", () => {
    const classes = classesOf(floatingPanelLook("card", "floating"));

    expect(classes).toContain("placed");
    expect(classes).toContain("w-60");
    expect(classes).not.toContain("bottom-0");
    expect(classes).not.toContain("bg-chrome");
    expect(classes.some(ofDesktopAlone)).toBe(false);
  });

  test("each width is the board's: 320 for a list, 340 for a menu, 400 for the search, 240 for a card's menu", () => {
    expect(classesOf(floatingPanelLook("list", "floating"))).toContain("w-80");
    expect(classesOf(floatingPanelLook("menu", "floating"))).toContain("w-85");
    expect(classesOf(floatingPanelLook("search", "floating"))).toContain("w-100");
    expect(classesOf(floatingPanelLook("list", "sheet"))).toContain("desktop:w-80");
  });

  test("as wide as its control: the width the control has, which useFloating gives it when it opens", () => {
    expect(classesOf(floatingPanelLook("control", "floating"))).toContain("w-(--width-of-control)");
    expect(classesOf(floatingPanelLook("control", "sheet"))).toContain("desktop:w-(--width-of-control)");
  });
});
