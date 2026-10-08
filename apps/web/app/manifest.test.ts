import { expect, test } from "bun:test";
import { BRAND } from "@/lib/brand/brand";
import manifest from "./manifest";

test("the app installs from the browser and opens on its own, with no bar of the browser, at Home", () => {
  expect(manifest()).toEqual({
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: "Rooftop PV design.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND.ground,
    theme_color: BRAND.ground,
    icons: [
      { src: "/app-icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app-icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  });
});
