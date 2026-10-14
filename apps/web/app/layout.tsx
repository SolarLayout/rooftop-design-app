import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { StoresProvider } from "@/components/shell/stores";
import { analyticsOn } from "@/lib/analytics/analytics";
import { fontVariables } from "./fonts";
import "./globals.css";
import { METADATA } from "./metadata";
import { VIEWPORT } from "./viewport";

export const metadata: Metadata = METADATA;

export const viewport: Viewport = VIEWPORT;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dusk" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        {/* One design for the whole app: what is outlined on the map is what the workspaces show. */}
        <StoresProvider>{children}</StoresProvider>
        {analyticsOn(process.env) && <Analytics />}
      </body>
    </html>
  );
}
