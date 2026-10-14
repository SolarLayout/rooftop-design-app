import { expect, test } from "bun:test";
import { analyticsOn } from "./analytics";

test("a build on Vercel sends the page views to Vercel Analytics", () => {
  expect(analyticsOn({ VERCEL: "1" })).toBe(true);
});

test("off Vercel (the dev and test stacks) there are none, so nothing leaves this machine", () => {
  expect(analyticsOn({})).toBe(false);
  expect(analyticsOn({ VERCEL: "" })).toBe(false);
});
