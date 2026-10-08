import { expect, test } from "bun:test";
import { BRAND } from "@/lib/brand/brand";
import { VIEWPORT } from "./viewport";

test("the page covers the whole screen, under the clock and the home bar, and keeps clear of them by the safe areas", () => {
  expect(VIEWPORT).toMatchObject({ width: "device-width", initialScale: 1, viewportFit: "cover" });
});

test("the browser's own parts around the page are the colour of its ground", () => {
  expect(VIEWPORT.themeColor).toBe(BRAND.ground);
});
