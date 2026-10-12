// The presenter's controls of Present (V2 · 13, D110; V2-102): the keys and what each does, the track of the six scenes,
// and when the bar is shown: on a move of the pointer or a touch, hidden after 3 s while the tour plays, always while it
// is paused. Made of the app's clock alone, as the tour is: pure but for the time it is given.
import { createStore, type StoreApi } from "zustand/vanilla";
import type { Clock } from "../clock";

/** How long the bar stays after the last move while the tour plays, in milliseconds. */
export const SHOWN_FOR = 3000;

/** The words of the keys, at the foot's right on the first loop while the bar is hidden. */
export const KEYS_LINE = "Space pauses · ← → move between scenes · Esc leaves";

export type PresentKey = "play-or-pause" | "before" | "after" | "leave";

const KEYS: Record<string, PresentKey> = { " ": "play-or-pause", ArrowLeft: "before", ArrowRight: "after", Escape: "leave" };

type Pressed = { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean };

/** What a key does; null for any other key, and for one held with a modifier (the browser's own): a stray key never ends the tour. */
export function keyOf({ key, altKey, ctrlKey, metaKey }: Pressed): PresentKey | null {
  if (altKey || ctrlKey || metaKey) return null;
  return KEYS[key] ?? null;
}

export type Segment = { name: string; short: string; fill: number; isCurrent: boolean };

/** The six scenes as segments: the done ones full, the current filled as far as it has played, the rest empty. */
export function trackOf(scenes: readonly { name: string }[], index: number, share: number): Segment[] {
  return scenes.map(({ name }, at) => ({
    name,
    short: name.replace(/^The /, "").replace(/^./, (first) => first.toUpperCase()),
    fill: at < index ? 1 : at === index ? share : 0,
    isCurrent: at === index,
  }));
}

export const isKeysLineShown = ({ loop, areControlsShown }: { loop: number; areControlsShown: boolean }): boolean => loop === 0 && !areControlsShown;

export type Controls = {
  /** A move of the pointer, a touch, a key of the tour, Tab: shown, for 3 s more while the tour plays. */
  moved: () => void;
  /** Paused, shown for as long; played again, hidden 3 s later. */
  setPaused: (isPaused: boolean) => void;
  /** The focus in the bar holds it shown as a pause does. */
  setFocused: (isFocused: boolean) => void;
  stop: () => void;
  view: StoreApi<{ isShown: boolean }>;
};

export function createControls({ clock }: { clock: Clock }): Controls {
  const view = createStore(() => ({ isShown: false }));
  let isPaused = false;
  let isFocused = false;
  let giveUpTheHide: (() => void) | null = null;

  function giveUp() {
    giveUpTheHide?.();
    giveUpTheHide = null;
  }

  function show() {
    giveUp();
    view.setState({ isShown: true });
    if (isPaused || isFocused) return;
    giveUpTheHide = clock.after(SHOWN_FOR, () => {
      giveUpTheHide = null;
      view.setState({ isShown: false });
    });
  }

  return {
    moved: show,
    setPaused(paused) {
      isPaused = paused;
      show();
    },
    setFocused(focused) {
      isFocused = focused;
      show();
    },
    stop: giveUp,
    view,
  };
}
