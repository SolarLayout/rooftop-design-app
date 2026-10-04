import { describe, expect, test } from "bun:test";
import { iconButtonLook } from "./button-look";

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

  test("open or closed, the size and the corners are the same: 44 on touch, 38 on desktop, the row's radius then the control's", () => {
    for (const isOpen of [false, true]) {
      const classes = classesOf(iconButtonLook("secondary", "s", "square", isOpen));
      expect(classes).toContain("size-touch");
      expect(classes).toContain("desktop:size-9.5");
      expect(classes).toContain("rounded-row");
      expect(classes).toContain("desktop:rounded-control");
    }
  });
});
