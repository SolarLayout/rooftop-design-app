"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { IconButton } from "@/components/ui/IconButton";
import { Sheet } from "@/components/ui/Sheet";
import { Tooltip } from "@/components/ui/Tooltip";
import type { Stop } from "@/components/ui/sheet-stops";
import { LENSES, type Lens } from "@/lib/routes";
import { nextStepOf, pathOfStep, STEPS } from "@/lib/flow/steps";
import { isPanelHiddenOf, isSunViewOf } from "@/lib/stores/view-store";
import { nextLineOf } from "@/lib/words/explain";
import { ArrayInspector } from "@/components/studio/ArrayInspector";
import { RoofInspector } from "@/components/studio/RoofInspector";
import { SunInspector } from "@/components/studio/SunInspector";
import { Stage } from "@/components/studio/Stage";
import { StringsInspector } from "@/components/studio/StringsInspector";
import { useHistoryKeys } from "@/components/shell/use-history-keys";
import { ResultChip } from "@/components/shell/ResultChip";
import { resultChipOf, summaryOf } from "@/components/shell/result-view";
import { useNotesOfTheShell, useProgressionOfTheShell } from "@/components/shell/Shell";
import { useSunKeys } from "@/components/studio/use-sun-keys";
import { useSize } from "@/components/studio/use-size";
import { useStores, useView, useVitals } from "@/components/shell/stores";
import { usePanel } from "./use-panel";

type Props = { lens: Lens };

/**
 * The step's one primary, named for the next step (D95), and under it "Next:" with the next step's line until that step
 * has been opened once (D96).
 */
function Primary({ lens, isFloating = false }: { lens: Lens; isFloating?: boolean }) {
  const { seen } = useProgressionOfTheShell();
  const next = nextStepOf(lens);
  if (next === null) return null;
  const name = STEPS.find((step) => step.id === next)?.name ?? "";
  return (
    <div className={classNames("flex flex-col gap-2", isFloating && "w-96 rounded-card border border-line bg-surface-1 p-3 shadow-float")}>
      {seen.includes(next) ? null : <p className="type-body-touch text-text-2 desktop:type-body">{nextLineOf(name as "Array")}</p>}
      <ButtonLink kind="primary" size="xl" icon="arrow-right" href={pathOfStep(next)} className="w-full flex-row-reverse" data-testid="step-primary">
        Continue to {name}
      </ButtonLink>
    </div>
  );
}

/**
 * The frame of the Studio (D95, D99): the stage and the work column, laid out for each size. The work column holds the
 * step's sections, or the Sun view's while that view is on, and the step's primary at its foot; on desktop it can be
 * hidden, the stage then the whole width with the primary floating at its foot. The inspector is mounted once, in the
 * container of the size (plan/phase-05-plan.md, decision 9): the aside of tablet and desktop, the sheet of phone.
 */
export function Studio({ lens }: Props) {
  const { view } = useStores();
  const { states, seen } = useProgressionOfTheShell();
  const { notes, open } = useNotesOfTheShell();
  const vitals = useVitals(notes);
  const size = useSize();
  const isSunView = useView(isSunViewOf);
  const isPanelHidden = useView(isPanelHiddenOf) && size === "desktop";
  const [stop, setStop] = useState<Stop>("half");
  const room = useRef<HTMLDivElement>(null);
  const name = LENSES.find((one) => one.id === lens)?.name ?? "";
  const inspector =
    size === null ? null : isSunView ? <SunInspector size={size} /> : lens === "array" ? <ArrayInspector /> : lens === "roof" ? <RoofInspector size={size} /> : <StringsInspector />;

  // The Studio comes back to the step that was opened last.
  useEffect(() => view.getState().showLens(lens), [view, lens]);
  usePanel({ isFirstOpen: seen.length <= 1, needsYou: states[lens] === "needs-you" });
  // Cmd or Ctrl with Z undoes the last committed edit, on every step.
  useHistoryKeys();
  // , and . move the time an hour, [ and ] a day (plan/phase-06-plan.md, decision 17).
  useSunKeys();

  return (
    <div ref={room} className="relative flex min-h-0 grow flex-col desktop:flex-row">
      <main className="relative flex shrink-0 flex-col desktop:min-w-0 desktop:shrink desktop:grow">
        <Stage lens={lens} name={isSunView ? `${name} · Sun` : name} className="h-63 shrink-0 tablet:h-110 desktop:h-auto desktop:grow" />
        {/* On tablet the result is a row under the stage; on desktop and phone it is in the top bar (D95). */}
        <div className="hidden border-b border-line-subtle px-5 py-2 tablet:flex desktop:hidden">
          <ResultChip chip={resultChipOf(vitals)} summary={summaryOf(vitals)} onOpenNotes={open} />
        </div>
        {isPanelHidden ? (
          <div className="absolute right-panel bottom-safe-panel z-float">
            <Primary lens={lens} isFloating />
          </div>
        ) : null}
      </main>

      <aside
        aria-label={`${name} work column`}
        className={classNames(
          "hidden flex-col px-5 pt-6 tablet:flex desktop:w-inspector desktop:shrink-0 desktop:border-l desktop:border-line-subtle desktop:bg-chrome desktop:p-0",
          isPanelHidden && "desktop:hidden",
        )}
      >
        <div className="hidden justify-end desktop:flex desktop:px-panel desktop:pt-4">
          <Tooltip words="Hide panel" shortcut="⌘ \">
            <IconButton kind="quiet" size="xs" icon="panel" iconSize={18} label="Hide panel" onClick={() => view.getState().hidePanel(true)} />
          </Tooltip>
        </div>
        {/* The sections scroll on desktop; the primary stays at the column's foot. */}
        <div className="flex grow flex-col pb-6 desktop:min-h-0 desktop:overflow-y-auto desktop:px-panel desktop:pt-2">{size === "phone" ? null : inspector}</div>
        {isSunView ? null : (
          <div className="sticky bottom-0 -mx-5 border-t border-line-subtle bg-chrome px-5 pt-3 pb-safe-3 desktop:static desktop:mx-0 desktop:px-panel desktop:pb-safe-panel">
            <Primary lens={lens} />
          </div>
        )}
      </aside>

      <div className="tablet:hidden">
        <Sheet label="Work column" stop={stop} onStop={setStop}>
          <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
            {size === "phone" ? inspector : null}
            {isSunView ? null : <Primary lens={lens} />}
          </div>
        </Sheet>
      </div>
    </div>
  );
}
