// The states of the search for words: searching, the places found with one marked, nothing found, or
// failed; and what a key does in the list. A pure reducer, so that it is tested without a browser.
import type { Place } from "./provider";

export type SearchState =
  | { kind: "idle" }
  | { kind: "searching"; query: string }
  | { kind: "found"; query: string; places: Place[]; marked: number }
  | { kind: "nothing"; query: string }
  | { kind: "failed"; query: string; message: string };

export type SearchEvent =
  | { type: "asked"; query: string }
  | { type: "found"; query: string; places: Place[] }
  | { type: "failed"; query: string; message: string }
  | { type: "closed" }
  | { type: "taken" }
  | { type: "key"; key: string };

export const IDLE: SearchState = { kind: "idle" };

const isAskedFor = (state: SearchState, query: string) => state.kind === "searching" && state.query === query;

/** The state after an event. An answer to words that are no longer asked for changes nothing. */
export function searchStateAfter(state: SearchState, event: SearchEvent): SearchState {
  switch (event.type) {
    case "asked":
      return { kind: "searching", query: event.query };
    case "found":
      if (!isAskedFor(state, event.query)) return state;
      return event.places.length === 0
        ? { kind: "nothing", query: event.query }
        : { kind: "found", query: event.query, places: event.places, marked: 0 };
    case "failed":
      return isAskedFor(state, event.query) ? { kind: "failed", query: event.query, message: event.message } : state;
    case "closed":
    case "taken":
      return IDLE;
    case "key":
      return afterKey(state, event.key);
  }
}

/** The state after a key in the list: the arrows mark the neighbour, Home and End the ends. */
export function afterKey(state: SearchState, key: string): SearchState {
  if (state.kind !== "found") return state;
  const last = state.places.length - 1;
  const to =
    key === "ArrowDown"
      ? Math.min(last, state.marked + 1)
      : key === "ArrowUp"
        ? Math.max(0, state.marked - 1)
        : key === "Home"
          ? 0
          : key === "End"
            ? last
            : null;
  if (to === null || to === state.marked) return state;
  return { ...state, marked: to };
}
