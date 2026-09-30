// Whether the map can be shown, and what to say when it cannot (docs/design/guidelines.md, "States every
// screen must handle"; the board "Find and outline, states and tools", "No map").

export type MapFacts = {
  /** The app has a key for the imagery. */
  hasKey: boolean;
  /** The browser can draw with WebGL. */
  hasWebGL: boolean;
  /** The tiles do not come. */
  tilesFailed: boolean;
};

export type MapState = { kind: "ready" } | { kind: "no-key" | "no-webgl" | "offline"; title: string; reason: string };

export const NO_MAP: Record<Exclude<MapState["kind"], "ready">, { title: string; reason: string }> = {
  "no-key": {
    title: "The map is not available",
    reason: "This app has no key for the imagery. The roof can still be entered by its measurements.",
  },
  "no-webgl": {
    title: "This browser cannot draw the map",
    reason: "It has no WebGL. Try another browser, or enter the roof by its measurements.",
  },
  offline: {
    title: "The imagery does not load",
    reason: "Check the connection and try again, or enter the roof by its measurements.",
  },
};

/** The state of the map from its facts: the first that stands in the way is the one said. */
export function mapStateOf({ hasKey, hasWebGL, tilesFailed }: MapFacts): MapState {
  if (!hasKey) return { kind: "no-key", ...NO_MAP["no-key"] };
  if (!hasWebGL) return { kind: "no-webgl", ...NO_MAP["no-webgl"] };
  if (tilesFailed) return { kind: "offline", ...NO_MAP.offline };
  return { kind: "ready" };
}

/** Whether this browser can draw with WebGL, asked of a canvas of its own. */
export function hasWebGL(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}
