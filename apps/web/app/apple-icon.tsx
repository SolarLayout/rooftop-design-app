import { ImageResponse } from "next/og";
import { APPLE_ICON } from "@/lib/brand/app-icons";
import { AppIconImage } from "@/lib/brand/AppIconImage";

// The icon an iPhone or an iPad puts on its Home Screen (issue 147).
export const size = { width: APPLE_ICON.size, height: APPLE_ICON.size };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconImage size={APPLE_ICON.size} rounded={APPLE_ICON.rounded} />, size);
}
