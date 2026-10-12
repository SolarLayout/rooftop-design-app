"use client";

import { useState } from "react";
import { Buttons } from "./Buttons";
import { Choices } from "./Choices";
import { Fields } from "./Fields";
import { KitPage } from "./Pages";
import { Principles } from "./Principles";
import { Sliders } from "./Sliders";
import { Cards, StatExamples, StatusMarks } from "./StatusCardStat";
import { TabRows } from "./TabRows";

/** The first page of the kit: what is pressed, chosen and typed into, and what shows a value. */
export function Kit() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  return (
    <KitPage path="/kit" lastPressed={lastPressed}>
      <Principles />
      <div className="grid grid-cols-1 gap-grid desktop:grid-cols-2">
        <div className="flex flex-col gap-grid">
          <Buttons onPress={setLastPressed} />
          <Choices onPress={setLastPressed} />
          <Sliders onPress={setLastPressed} />
        </div>
        <div className="flex flex-col gap-grid">
          <Fields onPress={setLastPressed} />
          <StatusMarks />
          <Cards />
          <StatExamples />
          <TabRows onPress={setLastPressed} />
        </div>
      </div>
    </KitPage>
  );
}
