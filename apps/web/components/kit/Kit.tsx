"use client";

import { useState } from "react";
import { Buttons } from "./Buttons";

/** The page of /kit: every component of components/ui in every state. */
export function Kit() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  return (
    <main className="flex flex-col gap-7 px-page-x-phone py-page-y tablet:px-page-x-tablet desktop:px-page-x-desktop">
      <header className="flex flex-col gap-2">
        <h1 className="type-page">Controls, depth and motion</h1>
        <p className="max-w-130 text-text-2">
          Light comes from above. What you press is raised. What you type into is recessed.
        </p>
        <p data-testid="kit-last-pressed" role="status" className="type-small text-text-2">
          Last pressed: {lastPressed ?? "nothing yet"}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-grid">
        <Buttons onPress={setLastPressed} />
      </div>
    </main>
  );
}
