import { describe, expect, test } from "bun:test";
import { discLook, TARGET } from "./help-disc-look";

// The ? beside a section's name (D94, D80 kept): quiet in the line colour, 20 drawn, a target of 24 on desktop and 44 on
// touch; the accent only while its sheet is open.

const classesOf = (look: string) => look.split(" ");

describe("the help disc", () => {
  test("at rest it is quiet: a ring in the line colour, the ? in text-3, nothing in the accent, nothing raised", () => {
    const classes = classesOf(discLook(false));
    expect(classes).toEqual(expect.arrayContaining(["size-5", "border", "border-line-strong", "text-text-3", "bg-transparent"]));
    expect(classes.filter((name) => !name.startsWith("group-") && /accent|shadow-primary/.test(name))).toEqual([]);
  });

  test("while its sheet is open it rings in the accent", () => {
    expect(classesOf(discLook(true))).toEqual(expect.arrayContaining(["border-accent", "text-accent", "shadow-help-held"]));
  });

  test("its target is 44 on touch and 24 on desktop", () => {
    expect(classesOf(TARGET)).toEqual(expect.arrayContaining(["size-touch", "desktop:size-6"]));
  });
});
