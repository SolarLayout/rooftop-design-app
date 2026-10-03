"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { Stop } from "@/components/ui/sheet-stops";
import { LENSES, type Lens } from "@/lib/routes";
import { LensNav } from "./LensNav";
import { ArrayInspector } from "@/components/studio/ArrayInspector";
import { RoofInspector } from "@/components/studio/RoofInspector";
import { SunInspector } from "@/components/studio/SunInspector";
import { Stage } from "@/components/studio/Stage";
import { StringsInspector } from "@/components/studio/StringsInspector";
import { useHistoryKeys } from "@/components/shell/use-history-keys";
import { useSunKeys } from "@/components/studio/use-sun-keys";
import { useSize } from "@/components/studio/use-size";
import { useNotesOfTheShell } from "./Shell";
import { useStores, useVitals } from "./stores";
import { Vitals } from "./Vitals";

type Props = { lens: Lens };

/**
 * The frame of the Studio: the lenses, the stage, the vitals and the inspector, laid out for each size.
 * The inspector is mounted once, in the container of the size (plan/phase-05-plan.md, decision 9): the
 * aside of tablet and desktop, the sheet of phone; before the size is known, nothing. The stage and the
 * inspector are built with their lenses; until then they say so.
 */
export function Studio({ lens }: Props) {
  const { view } = useStores();
  const { notes, open } = useNotesOfTheShell();
  const vitals = useVitals(notes);
  const size = useSize();
  const [stop, setStop] = useState<Stop>("half");
  const name = LENSES.find((one) => one.id === lens)?.name ?? "";
  const inspector =
    size === null ? null : lens === "array" ? <ArrayInspector /> : lens === "roof" ? <RoofInspector size={size} /> : lens === "sun" ? <SunInspector size={size} /> : <StringsInspector />;

  // The Studio comes back to the lens that was opened last.
  useEffect(() => view.getState().showLens(lens), [view, lens]);
  // Cmd or Ctrl with Z undoes the last committed edit, in every lens.
  useHistoryKeys();
  // , and . move the time an hour, [ and ] a day, in every lens (plan/phase-06-plan.md, decision 17).
  useSunKeys();

  return (
    <div className="relative flex min-h-0 grow flex-col desktop:flex-row">
      <LensNav current={lens} look="rail" className="hidden desktop:flex" />

      <main className="relative flex shrink-0 flex-col desktop:min-w-0 desktop:shrink desktop:grow">
        <Stage lens={lens} name={name} className="h-63 shrink-0 tablet:h-127 desktop:h-auto desktop:grow" />
        <LensNav current={lens} look="row" className="absolute top-4 left-5 z-float hidden tablet:flex desktop:hidden" />
        <Vitals view={vitals} onOpenNotes={open} className="desktop:absolute desktop:inset-x-panel desktop:bottom-panel" />
      </main>

      <aside
        aria-label={`${name} inspector`}
        className="hidden flex-col px-5 pt-6 pb-5 tablet:flex desktop:w-inspector desktop:shrink-0 desktop:overflow-y-auto desktop:border-l desktop:border-line-subtle desktop:bg-chrome desktop:p-panel"
      >
        {size === "phone" ? null : inspector}
      </aside>

      <div className="tablet:hidden">
        <Sheet label="Inspector" stop={stop} onStop={setStop}>
          <LensNav current={lens} look="switch" className="mx-4 mt-1 grid" />
          <div className="px-4 pt-4 pb-6">{size === "phone" ? inspector : null}</div>
        </Sheet>
      </div>
    </div>
  );
}
