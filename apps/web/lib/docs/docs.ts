// The Rooftop docs, as the app links to them (issue 193, D91): their address, which follows the app's, and their pages and
// sections, so that a help topic names a place the docs have. The pages and their sections are those of
// solarlayout_desktop_docs content/rooftop as rewritten for V2 (2026-10-13, #238 item 24); a page or a heading renamed
// there is renamed here.

/** Where a help topic is told more about: a page of the docs, by its address, and one of its sections, by its heading. */
export type DocsPlace = { page: string; section: string };

const PRODUCTION = "https://solarlayout.app/docs/rooftop";
const APP_HOST = /^rooftop\.(.+)$/;

/** The docs of the app at *host*: `rooftop.<x>` has its docs at `<x>/docs/rooftop`; anywhere else, production's. */
export function docsHomeOf(host: string): string {
  const site = APP_HOST.exec(host)?.[1];
  return site === undefined ? PRODUCTION : `https://${site}/docs/rooftop`;
}

/** The anchor the docs give a heading: lower case, its punctuation dropped, each space a hyphen. */
export const anchorOf = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s/g, "-");

/** The address of *place* in the docs at *home*. */
export const docsLinkOf = (home: string, place: DocsPlace): string => `${home}/${place.page}#${anchorOf(place.section)}`;

/** The pages of the docs, by address: each one's title and the headings of its sections. */
export const DOCS_PAGES: Readonly<Record<string, { title: string; sections: readonly string[] }>> = {
  intro: { title: "What SolarLayout Rooftop does", sections: ["From a roof to a design", "What you need"] },
  "getting-started": {
    title: "Getting started",
    sections: ["Open Rooftop", "Add it to the home screen", "Try the demo", "Where your designs are kept", "What the browser needs"],
  },
  "first-design": { title: "Your first rooftop design", sections: [] },
  steps: {
    title: "The five steps",
    sections: [
      "The steps and their marks",
      "The top bar",
      "The result",
      "Notes to review",
      "The work column",
      "On a phone or a tablet",
      "Help in the app",
      "Saving",
    ],
  },
  find: {
    title: "Find the roof",
    sections: [
      "Find the building",
      "Outline the roof",
      "Move or turn the roof",
      "Add the obstacles",
      "The roof type",
      "Build this roof",
      "Enter the roof by hand",
      "Import a drawing",
      "When something goes wrong",
    ],
  },
  roof: {
    title: "Roof",
    sections: ["Check the roof", "Outline", "Roof type", "Edges and access", "Obstacles", "When something goes wrong"],
  },
  array: {
    title: "Array",
    sections: ["Module", "Mounting", "Spacing", "Shade-free hours", "Design day", "How the layout is placed", "When something goes wrong"],
  },
  sun: {
    title: "The Sun view",
    sections: [
      "Turn on the Sun view",
      "The time and the day",
      "The sun at the time",
      "On the roof",
      "Shade map",
      "Shade over the year",
      "How shading is worked out",
    ],
  },
  strings: {
    title: "Strings",
    sections: [
      "Options",
      "Why an option fits",
      "Your own option",
      "Inverter",
      "System voltage",
      "Modules per string",
      "MPPT loading",
      "Strings on the roof",
      "When no string length fits",
    ],
  },
  performance: {
    title: "Performance",
    sections: [
      "How a run starts",
      "The energy of year 1",
      "Option and weather",
      "The three figures",
      "By month",
      "Over 25 years",
      "Where the energy goes",
      "Assumptions",
      "The model",
      "When something goes wrong",
    ],
  },
  handover: {
    title: "Handover",
    sections: [
      "The files",
      "Download all",
      "Design report",
      "Single-line diagram",
      "Bill of materials",
      "Cable schedule",
      "CAD layout",
      "Google Earth model",
      "Hourly data",
      "Project file",
      "When a file is not made",
    ],
  },
  present: {
    title: "Present",
    sections: ["Start the tour", "The six scenes", "The controls", "Leave the tour", "Reduced motion", "When 3D cannot be drawn"],
  },
  projects: {
    title: "Your designs and the project file",
    sections: ["Home", "On this device", "A design's menu", "Open a project file", "When a file will not open"],
  },
  reference: { title: "Reference", sections: ["Equipment files", "Other files Rooftop opens", "Limits", "Glossary"] },
  troubleshooting: {
    title: "Troubleshooting",
    sections: [
      "Anywhere in the app",
      "Saving and opening",
      "Find",
      "Roof and Array",
      "Sun view and Strings",
      "Performance",
      "Handover and Present",
    ],
  },
  support: { title: "Getting help", sections: ["The help in the app", "These pages", "Contacting SolarLayout"] },
};

/** What is wrong with *place*, in words: a page the docs do not have, or a section its page does not have. */
export function problemsOfPlace(place: DocsPlace): string[] {
  const page = DOCS_PAGES[place.page];
  if (!page) return [`"${place.page}" is no page of the docs`];
  return page.sections.includes(place.section) ? [] : [`"${place.section}" is no section of ${page.title}`];
}

/** The row "In the docs" of a topic: its page's title, the section, and their address; none without a place the docs have. */
export function inTheDocsOf(place: DocsPlace | undefined, home: string): { title: string; section: string; href: string } | null {
  const page = place && DOCS_PAGES[place.page];
  return place && page ? { title: page.title, section: place.section, href: docsLinkOf(home, place) } : null;
}
