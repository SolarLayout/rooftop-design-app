"use client";

import { useState } from "react";
import { KitPage } from "./Pages";
import { NotesToReview, ProjectAndSaving, TopBars, VitalsStates } from "./ShellParts";

/** The third page of the kit: the parts of the shell, each in every state. */
export function KitShell() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  return (
    <KitPage path="/kit/shell" lastPressed={lastPressed}>
      <div className="flex flex-col gap-grid">
        <TopBars onPress={setLastPressed} />
        <VitalsStates onPress={setLastPressed} />
        <NotesToReview onPress={setLastPressed} />
        <ProjectAndSaving onPress={setLastPressed} />
      </div>
    </KitPage>
  );
}
