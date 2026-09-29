import { expect, test } from "bun:test";
import { classNames } from "./class-names";

test("joins the names it is given", () => {
  expect(classNames("flex", "gap-2")).toBe("flex gap-2");
});

test("leaves out what is not a name", () => {
  expect(classNames("flex", false, null, undefined, "", "gap-2")).toBe("flex gap-2");
});

test("of nothing, nothing", () => {
  expect(classNames()).toBe("");
});
