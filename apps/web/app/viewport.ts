import type { Viewport } from "next";

/**
 * The page's viewport. It covers the whole screen, under the clock, the notch and the home bar of an installed app,
 * so that what touches an edge keeps clear of them by the safe areas (`--safe-*`, issue 147).
 */
export const VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
