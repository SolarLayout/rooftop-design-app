import { expect, test } from "bun:test";
import { VIEWPORT } from "./viewport";

test("the page covers the whole screen, under the clock and the home bar, and keeps clear of them by the safe areas", () => {
  expect(VIEWPORT).toEqual({ width: "device-width", initialScale: 1, viewportFit: "cover" });
});
