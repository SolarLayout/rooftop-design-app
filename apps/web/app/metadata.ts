import type { Metadata } from "next";
import { BRAND } from "@/lib/brand/brand";

/**
 * The page's metadata. Opened from an iPhone's Home Screen it is an app: its short name under the icon, the status bar
 * over the page, which keeps clear of the clock by the safe areas (issue 147).
 */
export const METADATA: Metadata = {
  title: BRAND.name,
  description: "Rooftop PV design.",
  appleWebApp: { capable: true, title: BRAND.shortName, statusBarStyle: "black-translucent" },
};
