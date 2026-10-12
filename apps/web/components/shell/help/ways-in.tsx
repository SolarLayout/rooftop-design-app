"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { HelpKey } from "@/lib/help/manifest.gen";
import { useHelp } from "./HelpProvider";

// The ways between a how-to and the screen (D81): a tip's Show me how opens the how-to of its move; a how-to of Find ends
// with Show the tips on the map again, which closes the sheet and brings the tips back (on phone, the toolbar's ? is gone:
// the ? beside the panel's title took its place).

const LINK = "cursor-pointer self-start type-body-touch desktop:type-body font-medium text-accent underline decoration-accent/40 underline-offset-2 focus-ring";

/** A tip's way into the how-to of its move. */
export function ShowMeHow({ topic }: { topic: HelpKey }) {
  const help = useHelp();
  if (!help) return null;
  return (
    <button type="button" onClick={() => help.open(topic)} className={LINK}>
      Show me how
    </button>
  );
}

const TipsAgain = createContext<(() => void) | null>(null);

/** What brings the screen's tips back, for the how-tos opened on it. Outside the help's provider: the sheet is in it. */
export function TipsAgainProvider({ showTips, children }: { showTips: () => void; children: ReactNode }) {
  return <TipsAgain.Provider value={showTips}>{children}</TipsAgain.Provider>;
}

/** The end of a how-to of Find: the tips on the map again. Nothing where the screen has no tips. */
export function ShowTheTips() {
  const help = useHelp();
  const showTips = useContext(TipsAgain);
  if (!help || !showTips) return null;
  return (
    <button
      type="button"
      onClick={() => {
        help.close();
        showTips();
      }}
      className={LINK}
    >
      Show the tips on the map again
    </button>
  );
}
