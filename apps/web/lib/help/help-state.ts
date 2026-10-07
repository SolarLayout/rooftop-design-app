// The help open on the screen (D80): the topic shown, the topics behind it for Back, and where it was opened from with the
// value of that section, so that the sheet marks the user's own option. Pure; the provider holds it.

export type HelpState = {
  /** The topic shown; null while the help is closed. */
  key: string | null;
  /** The topics behind it, the last the one Back returns to. */
  behind: readonly string[];
  /** The topic a disc opened and the value of its section then. */
  from: { key: string; value?: string } | null;
};

export type HelpEvent =
  | { type: "opened"; key: string; value?: string }
  | { type: "followed"; key: string }
  | { type: "back" }
  | { type: "closed" };

export const CLOSED: HelpState = { key: null, behind: [], from: null };

export function helpAfter(state: HelpState, event: HelpEvent): HelpState {
  switch (event.type) {
    case "opened":
      return { key: event.key, behind: [], from: { key: event.key, ...(event.value === undefined ? {} : { value: event.value }) } };
    case "followed":
      if (state.key === null) return { key: event.key, behind: [], from: null };
      if (state.key === event.key) return state;
      return { ...state, key: event.key, behind: [...state.behind, state.key] };
    case "back": {
      const before = state.behind.at(-1);
      return before === undefined ? state : { ...state, key: before, behind: state.behind.slice(0, -1) };
    }
    case "closed":
      return CLOSED;
  }
}

/** The value of the section of the topic shown, when it is the topic a disc opened. */
export const valueShownOf = (state: HelpState): string | undefined => (state.from && state.from.key === state.key ? state.from.value : undefined);
