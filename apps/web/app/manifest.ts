import type { MetadataRoute } from "next";
import { APP_ICONS, APP_ICONS_PATH } from "@/lib/brand/app-icons";
import { BRAND } from "@/lib/brand/brand";

/** The web app manifest (issue 147): installed from the browser, the app opens on its own, with no bar of the browser. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.shortName,
    description: "Rooftop PV design.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND.ground,
    theme_color: BRAND.ground,
    icons: APP_ICONS.map(({ file, size, purpose }) => ({
      src: `${APP_ICONS_PATH}/${file}`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose,
    })),
  };
}
