"use client";

import { useSyncExternalStore } from "react";

/** The three sizes every screen is laid out for (docs/design/guidelines.md, "Responsive rules"). */
export type Size = "phone" | "tablet" | "desktop";

// The breakpoint tokens: --breakpoint-tablet and --breakpoint-desktop of docs/design/design-tokens.md.
const TABLET = "(min-width: 640px)";
const DESKTOP = "(min-width: 1101px)";

/** The size a `matchMedia` says the screen is. */
export function sizeOf(matchMedia: (query: string) => Pick<MediaQueryList, "matches">): Size {
  if (matchMedia(DESKTOP).matches) return "desktop";
  if (matchMedia(TABLET).matches) return "tablet";
  return "phone";
}

function subscribe(onChange: () => void): () => void {
  const lists = [window.matchMedia(TABLET), window.matchMedia(DESKTOP)];
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

const onTheClient = () => sizeOf((query) => window.matchMedia(query));
const onTheServer = () => null;

/**
 * The size of the screen, followed as it changes; null until the page is in a browser, so that the server
 * and the first render agree (r3f-notes, fix 3) and nothing is mounted twice.
 */
export function useSize(): Size | null {
  return useSyncExternalStore(subscribe, onTheClient, onTheServer);
}
