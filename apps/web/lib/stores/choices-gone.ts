// The choices of stringing the flow brought to the option shown (lib/flow/choice-gone.ts), waiting to be told: the shell
// says each in a note, with the way to the options, once it is there to say it.
import { createStore } from "zustand/vanilla";
import type { ChoiceGone } from "../flow/choice-gone";

export type ChoicesGoneState = {
  /** The choice taken away last and not yet told; null when there is nothing to tell. */
  waiting: ChoiceGone | null;
  heard: (gone: ChoiceGone) => void;
  /** The choice waiting, taken to be told: it is told once. */
  take: () => ChoiceGone | null;
};

export function createChoicesGone() {
  return createStore<ChoicesGoneState>()((set, get) => ({
    waiting: null,
    heard: (gone) => set({ waiting: gone }),
    take() {
      const gone = get().waiting;
      if (gone !== null) set({ waiting: null });
      return gone;
    },
  }));
}

export type ChoicesGoneStore = ReturnType<typeof createChoicesGone>;
