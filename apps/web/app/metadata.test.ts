import { expect, test } from "bun:test";
import { BRAND } from "@/lib/brand/brand";
import { METADATA } from "./metadata";

test("opened from an iPhone's Home Screen it is an app, its name under the icon, the page under the clock", () => {
  expect(METADATA).toEqual({
    title: BRAND.name,
    description: "Rooftop PV design.",
    appleWebApp: { capable: true, title: BRAND.shortName, statusBarStyle: "black-translucent" },
  });
});
