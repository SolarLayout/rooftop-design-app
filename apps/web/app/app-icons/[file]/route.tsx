import { ImageResponse } from "next/og";
import { APP_ICONS, appIconNamed } from "@/lib/brand/app-icons";
import { AppIconImage } from "@/lib/brand/AppIconImage";

// The manifest's icons (issue 147), drawn once at the build, each from the mark.
export const dynamicParams = false;

export function generateStaticParams() {
  return APP_ICONS.map(({ file }) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const icon = appIconNamed((await params).file);
  if (icon === null) return new Response("There is no such icon of the app.", { status: 404 });
  return new ImageResponse(<AppIconImage size={icon.size} rounded={icon.rounded} />, { width: icon.size, height: icon.size });
}
