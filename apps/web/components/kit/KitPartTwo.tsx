"use client";

import { useState } from "react";
import { Dialogs } from "./Dialogs";
import { FileDrops } from "./FileDrops";
import { HelpDiscs } from "./HelpDiscs";
import { KitPage } from "./Pages";
import { Selects } from "./Selects";
import { Sheets } from "./Sheets";
import { Tables } from "./Tables";
import { Tips } from "./Tips";
import { TooltipsAndToasts } from "./TooltipsAndToasts";
import { Waiting } from "./Waiting";

/** The second page of the kit: what opens, what waits and what answers. */
export function KitPartTwo() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  return (
    <KitPage path="/kit/part-2" lastPressed={lastPressed}>
      <div className="grid grid-cols-1 gap-grid desktop:grid-cols-2">
        <div className="flex flex-col gap-grid">
          <Selects onPress={setLastPressed} />
          <Dialogs onPress={setLastPressed} />
          <Sheets />
        </div>
        <div className="flex flex-col gap-grid">
          <FileDrops onPress={setLastPressed} />
          <Tables />
          <Waiting />
          <TooltipsAndToasts onPress={setLastPressed} />
          <Tips onPress={setLastPressed} />
          <HelpDiscs />
        </div>
      </div>
    </KitPage>
  );
}
