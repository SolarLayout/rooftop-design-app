"use client";

import { useState } from "react";
import { KitPage } from "./Pages";
import { Sheets } from "./Sheets";
import { TooltipsAndToasts } from "./TooltipsAndToasts";
import { Waiting } from "./Waiting";

/** The second page of the kit: what opens, what waits and what answers. */
export function KitPartTwo() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  return (
    <KitPage path="/kit/part-2" lastPressed={lastPressed}>
      <div className="grid grid-cols-1 gap-grid desktop:grid-cols-2">
        <div className="flex flex-col gap-grid">
          <Sheets />
        </div>
        <div className="flex flex-col gap-grid">
          <Waiting />
          <TooltipsAndToasts onPress={setLastPressed} />
        </div>
      </div>
    </KitPage>
  );
}
