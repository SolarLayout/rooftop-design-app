"use client";

import { useId } from "react";
import type { Sized } from "@/lib/studio/strings-view";
import { SECTION } from "./inspector-look";

/**
 * The options of the Strings lens where there are none to offer (the board "Options and your own", "No string
 * length fits"): the engine's words stand under the bar as its verdict; here what can change it.
 */
export function NothingFits({ view }: { view: Sized }) {
  const heading = useId();
  if (!view.noOptions?.change) return null;
  return (
    <section aria-labelledby={heading} className="flex flex-col gap-2">
      <h2 id={heading} className={SECTION}>
        Options
      </h2>
      <p data-testid="nothing-fits" className="rounded-row border border-line bg-surface-1 px-4 py-3 text-center type-small text-text-2">
        {view.noOptions.change}
      </p>
    </section>
  );
}
