// The help open on the screen (D80): the topic shown, the topics behind it for Back, and where it was opened from with the
// value of that section and the words of its mark, so that the sheet marks the section's own option: "Your choice", or who
// set it where the section says (the system voltage, set by the app from the user's country, D87). Pure; the provider holds it.

/** The mark of the section's own option when the section says nothing else. */
export const YOUR_CHOICE = "Your choice";

export type HelpState = {
  /** The topic shown; null while the help is closed. */
  key: string | null;
  /** The topics behind it, the last the one Back returns to. */
  behind: readonly string[];
  /** The topic a disc opened and the value of its section then. */
  from: { key: string; value?: string; mark?: string } | null;
};

export type HelpEvent =
  | { type: "opened"; key: string; value?: string; mark?: string }
  | { type: "followed"; key: string }
  | { type: "back" }
  | { type: "closed" };

export const CLOSED: HelpState = { key: null, behind: [], from: null };

export function helpAfter(state: HelpState, event: HelpEvent): HelpState {
  switch (event.type) {
    case "opened":
      return {
        key: event.key,
        behind: [],
        from: { key: event.key, ...(event.value === undefined ? {} : { value: event.value }), ...(event.mark === undefined ? {} : { mark: event.mark }) },
      };
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

/** The words of the mark of the section's own option, when its topic is shown: its own, else "Your choice". */
export const markShownOf = (state: HelpState): string | undefined => (state.from && state.from.key === state.key ? (state.from.mark ?? YOUR_CHOICE) : undefined);
