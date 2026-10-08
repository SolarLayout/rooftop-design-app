import { describe, expect, test } from "bun:test";
import { actionLook, dialogLook, panelLook } from "./dialog-look";

// The look of a dialog (docs/design/components.md, "Dialog"): a panel in the middle of the screen from tablet on, a
// bottom sheet on phone; the wide one (the equipment picker, D75) is 680 on tablet, 760 on desktop, and on phone the
// sheet at its full height, 48 under the top of the screen.

const classesOf = (look: string) => look.split(" ");

describe("the look of a dialog", () => {
  test("the panel of the kit is 440 wide from tablet on, as high as what it holds", () => {
    const classes = classesOf(panelLook("narrow"));
    expect(classes).toContain("tablet:w-110");
    expect(classes).not.toContain("h-full");
  });

  test("the wide panel is 680 on tablet and 760 on desktop, and on phone the sheet at its full height", () => {
    const classes = classesOf(panelLook("wide"));
    expect(classes).toContain("tablet:w-170");
    expect(classes).toContain("desktop:w-190");
    expect(classes).toContain("h-full");
    expect(classes).toContain("tablet:h-auto");
    expect(classes).toContain("tablet:max-h-full");
    expect(classes).not.toContain("tablet:w-110");
  });

  test("the wide dialog leaves 48 above its sheet on phone, under the clock of an installed app", () => {
    expect(classesOf(dialogLook("wide"))).toContain("pt-safe-12");
    expect(classesOf(dialogLook("narrow"))).not.toContain("pt-safe-12");
  });

  test("the sheet keeps clear of the home bar; the panel keeps its margin clear of every edge of the screen", () => {
    expect(classesOf(panelLook("narrow"))).toContain("pb-safe-4");
    const dialog = classesOf(dialogLook("narrow"));
    expect(dialog).toEqual(expect.arrayContaining(["tablet:pt-safe-panel", "tablet:pb-safe-panel", "tablet:px-safe-panel"]));
    expect(dialog).not.toContain("tablet:p-panel");
  });

  test("an action can be for the phone's sheet alone, or for the panel alone: its wrapper says where it shows", () => {
    expect(classesOf(actionLook("phone"))).toEqual(["flex", "flex-col", "tablet:hidden"]);
    expect(classesOf(actionLook("panel"))).toEqual(["hidden", "tablet:flex"]);
    expect(classesOf(actionLook("always"))).toEqual(["flex", "flex-col", "tablet:flex-row"]);
  });
});
