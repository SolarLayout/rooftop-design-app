import { expect, test } from "bun:test";
import { analyticsOn } from "./analytics";

test("a production build on Vercel sends the page views to Vercel Analytics", () => {
  expect(analyticsOn({ VERCEL: "1", VERCEL_ENV: "production" })).toBe(true);
});

test("staging, a custom environment that Vercel names preview, sends none", () => {
  expect(analyticsOn({ VERCEL: "1", VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "staging" })).toBe(false);
});

test("off Vercel (the dev and test stacks) there are none, so nothing leaves this machine", () => {
  expect(analyticsOn({})).toBe(false);
  expect(analyticsOn({ VERCEL: "1" })).toBe(false);
});
