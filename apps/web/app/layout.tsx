import type { Metadata, Viewport } from "next";
import { StoresProvider } from "@/components/shell/stores";
import { fontVariables } from "./fonts";
import "./globals.css";
import { VIEWPORT } from "./viewport";

export const metadata: Metadata = {
  title: "SolarLayout Rooftop",
  description: "Rooftop PV design.",
};

export const viewport: Viewport = VIEWPORT;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dusk" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full">
        {/* One design for the whole app: what is outlined on the map is what the workspaces show. */}
        <StoresProvider>{children}</StoresProvider>
      </body>
    </html>
  );
}
