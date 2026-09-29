import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

// Every font file is in the repo or in a pinned package, so that neither a build nor a test asks
// another machine for one. Licences: SIL Open Font License 1.1, all three
// (bricolage-grotesque-OFL.txt here, LICENSE.txt in the geist package).

// Bricolage Grotesque, Latin, with its weight and optical size axes: a title at 72 px and the name of
// the app at 17 px each get the cut that was drawn for their size.
const bricolageGrotesque = localFont({
  src: "./bricolage-grotesque-latin.woff2",
  variable: "--font-bricolage-grotesque",
  weight: "200 800",
  display: "swap",
});

/** Class names for `<html>`: they define the variables that the font tokens in globals.css use. */
export const fontVariables = [bricolageGrotesque.variable, GeistSans.variable, GeistMono.variable].join(" ");
