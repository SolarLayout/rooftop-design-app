import type { Viewport } from "next";
import { BRAND } from "@/lib/brand/brand";

/**
 * The page's viewport. It covers the whole screen, under the clock, the notch and the home bar of an installed app,
 * so that what touches an edge keeps clear of them by the safe areas (`--safe-*`, issue 147). The browser's own parts
 * around it are the colour of its ground.
 */
export const VIEWPORT: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BRAND.ground,
};
