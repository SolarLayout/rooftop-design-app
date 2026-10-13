// V2's principles as the kit shows them (D94; docs/design/design-tokens.md): the type styles, the spacing, the control
// heights and the radii, each with what it is for.

export type TypeStyle = { name: string; sample: string; use: string };

export const TYPE_STYLES: readonly TypeStyle[] = [
  { name: "display", sample: "617.8", use: "The one lead number of a page" },
  { name: "display-touch", sample: "617.8", use: "The same on phone and tablet" },
  { name: "banner", sample: "Rooftop PV design", use: "Home's title over its picture, on desktop (D120)" },
  { name: "banner-line", sample: "Outline a roof on the map.", use: "The line under Home's title, from tablet on" },
  { name: "figure", sample: "1,729", use: "A figure a buyer reads" },
  { name: "figure-touch", sample: "1,729", use: "The same on phone and tablet" },
  { name: "title", sample: "Performance", use: "Page and step titles" },
  { name: "title-touch", sample: "Performance", use: "The same on phone and tablet" },
  { name: "heading", sample: "Check the roof", use: "The step's question, a dialog's title" },
  { name: "section", sample: "Edges and access", use: "A section's name, a card's title" },
  { name: "body", sample: "Parapet height 0.90 m", use: "Labels, values, facts, prose" },
  { name: "body-touch", sample: "Parapet height 0.90 m", use: "The same on phone and tablet" },
  { name: "strong", sample: "Continue to Array", use: "Button labels, a read-out's value" },
  { name: "strong-touch", sample: "Continue to Array", use: "The same on phone and tablet" },
  { name: "mono", sample: "29 × 22 · 357.28", use: "Tables and fields alone" },
  { name: "mono-touch", sample: "29 × 22 · 357.28", use: "The same on phone and tablet" },
  { name: "unit", sample: "kWh/kWp", use: "A unit, a tick, a badge" },
];

export const SPACES = [
  { name: "hair", px: 4, use: "A label to its hint" },
  { name: "inside", px: 8, use: "Inside a group" },
  { name: "control", px: 12, use: "Inside a row" },
  { name: "edge on touch", px: 16, use: "The page's side on phone" },
  { name: "group", px: 24, use: "Between groups" },
  { name: "section", px: 40, use: "Between sections" },
  { name: "page", px: 64, use: "Above a page's title" },
] as const;

export const HEIGHTS = [
  { name: "Compact", desktop: 32, touch: 44 },
  { name: "Standard", desktop: 40, touch: 44 },
  { name: "Primary", desktop: 48, touch: 48 },
] as const;

export const RADII = [
  { name: "control", px: 8 },
  { name: "row", px: 12 },
  { name: "card", px: 16 },
  { name: "panel", px: 24 },
] as const;
