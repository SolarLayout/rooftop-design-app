"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { helpOfAddress, withHelp } from "@/lib/help/address";
import { CLOSED, helpAfter, markShownOf, valueShownOf } from "@/lib/help/help-state";
import { ALIASES, MANIFEST, type HelpKey } from "@/lib/help/manifest.gen";
import type { HelpEntry } from "@/lib/help/types";
import { resolvedKey } from "@/lib/help/where";
import { HelpSheet } from "./HelpSheet";

export type Help = {
  /** The topic shown and its entry; null while the help is closed. */
  shown: { key: HelpKey; entry: HelpEntry } | null;
  /** The value of the section the topic was opened from, while that topic is shown: its option is marked. */
  value: string | undefined;
  /** The words of that option's mark: the section's own (who set it), else "Your choice". */
  mark: string | undefined;
  canGoBack: boolean;
  /** A disc pressed: its topic, afresh, with its section's value and the words of its mark. */
  open: (key: HelpKey, value?: string, mark?: string) => void;
  /** A link or a related topic followed, in the sheet. */
  follow: (key: string) => void;
  back: () => void;
  close: () => void;
};

const HelpContext = createContext<Help | null>(null);

/** The help of the screen, or null where there is none (a page without the provider). */
export const useHelp = (): Help | null => useContext(HelpContext);

const REGISTRY = { entries: MANIFEST, aliases: ALIASES };

/**
 * The in-app help of a screen (D80): the topic shown and the ones behind it, its sheet, and the topic in the address
 * (?help=<key>), read when the screen opens so that a shared link opens it, and written beside whatever else is there.
 */
export function HelpProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(helpAfter, CLOSED);

  // The address is read once, when the screen opens: a key unknown is dropped, an alias opens its topic.
  useEffect(() => {
    const raw = helpOfAddress(window.location.search);
    if (raw === null) return;
    const key = resolvedKey(raw, REGISTRY);
    if (key) dispatch({ type: "opened", key });
    else window.history.replaceState(window.history.state, "", withHelp(window.location.href, null));
  }, []);

  // The topic shown goes into the address; the first commit, nothing open, writes nothing.
  const written = useRef<string | null>(null);
  useEffect(() => {
    if (state.key === written.current) return;
    written.current = state.key;
    window.history.replaceState(window.history.state, "", withHelp(window.location.href, state.key));
  }, [state.key]);

  const help = useMemo<Help>(() => {
    const key = state.key as HelpKey | null;
    return {
      shown: key && Object.hasOwn(MANIFEST, key) ? { key, entry: MANIFEST[key] } : null,
      value: valueShownOf(state),
      mark: markShownOf(state),
      canGoBack: state.behind.length > 0,
      open: (opened, value, mark) => dispatch({ type: "opened", key: opened, ...(value === undefined ? {} : { value }), ...(mark === undefined ? {} : { mark }) }),
      follow: (raw) => {
        const followed = resolvedKey(raw, REGISTRY);
        if (followed) dispatch({ type: "followed", key: followed });
      },
      back: () => dispatch({ type: "back" }),
      close: () => dispatch({ type: "closed" }),
    };
  }, [state]);

  return (
    <HelpContext.Provider value={help}>
      {children}
      <HelpSheet />
    </HelpContext.Provider>
  );
}
