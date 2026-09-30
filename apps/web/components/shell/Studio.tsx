"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { Stop } from "@/components/ui/sheet-stops";
import { LENSES, type Lens } from "@/lib/routes";
import { LensNav } from "./LensNav";
import { RoofInspector } from "@/components/studio/RoofInspector";
import { NotBuiltYet } from "./NotBuiltYet";
import { useNotesOfTheShell } from "./Shell";
import { useStores, useVitals } from "./stores";
import { Vitals } from "./Vitals";

type Props = { lens: Lens };

/**
 * The frame of the Studio: the lenses, the stage, the vitals and the inspector, laid out for each size.
 * The stage and the inspector are built with their lenses; until then they say so.
 */
export function Studio({ lens }: Props) {
  const { view } = useStores();
  const { notes, open } = useNotesOfTheShell();
  const vitals = useVitals(notes);
  const [stop, setStop] = useState<Stop>("half");
  const name = LENSES.find((one) => one.id === lens)?.name ?? "";
  // The inspector stands once for each size; each shows the same, the lens's own once it is built.
  const inspector = lens === "roof" ? <RoofInspector /> : <NotBuiltYet />;

  // The Studio comes back to the lens that was opened last.
  useEffect(() => view.getState().showLens(lens), [view, lens]);

  return (
    <div className="relative flex min-h-0 grow flex-col desktop:flex-row">
      <LensNav current={lens} look="rail" className="hidden desktop:flex" />

      <main className="relative flex shrink-0 flex-col desktop:min-w-0 desktop:shrink desktop:grow">
        <div className="relative flex h-63 shrink-0 flex-col gap-1 px-4 pt-4 tablet:h-127 tablet:px-5 tablet:pt-4 desktop:h-auto desktop:grow desktop:px-6 desktop:pt-5">
          <LensNav current={lens} look="row" className="hidden self-start tablet:flex desktop:hidden" />
          <h1 className="type-lens-touch tablet:mt-4 tablet:type-lens desktop:mt-0">{name}</h1>
          <NotBuiltYet />
        </div>
        <Vitals view={vitals} onOpenNotes={open} className="desktop:absolute desktop:inset-x-panel desktop:bottom-panel" />
      </main>

      <aside
        aria-label={`${name} inspector`}
        className="hidden flex-col px-5 pt-6 pb-5 tablet:flex desktop:w-inspector desktop:shrink-0 desktop:overflow-y-auto desktop:border-l desktop:border-line-subtle desktop:bg-chrome desktop:p-panel"
      >
        {inspector}
      </aside>

      <div className="tablet:hidden">
        <Sheet label="Inspector" stop={stop} onStop={setStop}>
          <LensNav current={lens} look="switch" className="mx-4 mt-1 grid" />
          <div className="px-4 pt-4 pb-6">{inspector}</div>
        </Sheet>
      </div>
    </div>
  );
}
