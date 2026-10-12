"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
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
import { SunCardBody } from "@/components/studio/SunInspector";
import { Stage } from "@/components/studio/Stage";
import { StringsInspector } from "@/components/studio/StringsInspector";
import { useHistoryKeys } from "@/components/shell/use-history-keys";
import { ResultChip } from "@/components/shell/ResultChip";
import { capacityOf, resultChipOf, summaryOf } from "@/components/shell/result-view";
import { useNotesOfTheShell, useProgressionOfTheShell } from "@/components/shell/Shell";
import { useSunKeys } from "@/components/studio/use-sun-keys";
import { useSize } from "@/components/shell/use-screen-size";
import { useProject, useStores, useView, useVitals } from "@/components/shell/stores";
import { projectOf } from "@/lib/stores/project-store";
import { firstOpenLinesOf, showsFirstOpenOf } from "./first-open";
import { StepHead } from "./StepHead";
import { stepHeadOf } from "./step-heads";
import { usePanel } from "./use-panel";
import { usePhoneSheet } from "@/components/shell/use-phone-sheet";
import { measures } from "@/components/ui/measures";
import { useNoStringsFit } from "./use-no-strings-fit";
import { withVoltageChosen } from "@/lib/studio/voltage-choice";

type Props = { lens: Lens };

/**
 * The step's one primary, named for the next step (D95), and under it "Next:" with the next step's line until that step
 * has been opened once (D96).
 */
function Primary({ lens, isFloating = false, withLine = true }: { lens: Lens; isFloating?: boolean; withLine?: boolean }) {
  const { seen } = useProgressionOfTheShell();
  const { project } = useStores();
  const noStringsFit = useNoStringsFit();
  const next = nextStepOf(lens);
  if (next === null) return null;
  const name = STEPS.find((step) => step.id === next)?.name ?? "";
  // Where no string length fits, the likeliest remedy is the step's primary (V2 · 5): the voltage that fits, the user's choice.
  const voltage = lens === "strings" ? (noStringsFit?.primary ?? null) : null;
  const layout = classNames("flex flex-col gap-2 tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6 desktop:flex-col desktop:items-stretch desktop:gap-2", isFloating && "w-96 rounded-card border border-line bg-surface-1 p-3 shadow-float");
  if (voltage !== null) {
    return (
      <div className={layout}>
        <Button kind="primary" size="xl" className="w-full tablet:order-last tablet:ml-auto tablet:w-auto desktop:order-none desktop:w-full" data-testid="step-primary" onClick={() => project.getState().commit((document) => withVoltageChosen(document, voltage.volts))}>
          {voltage.label}
        </Button>
        <p className="type-body-touch text-text-2 desktop:type-body">{voltage.line}</p>
      </div>
    );
  }
  return (
    <div className={layout}>
      {seen.includes(next) || !withLine ? null : <p className="type-body-touch text-text-2 desktop:type-body">{nextLineOf(name as "Array")}</p>}
      {/* On tablet the primary stands at the right of its line; on phone and desktop the column's width. */}
      <ButtonLink kind="primary" size="xl" icon="arrow-right" href={pathOfStep(next)} className="w-full flex-row-reverse tablet:ml-auto tablet:w-auto desktop:w-full" data-testid="step-primary">
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
  const { current, states, seen } = useProgressionOfTheShell();
  const { notes, open, tryAgain } = useNotesOfTheShell();
  const vitals = useVitals(notes);
  const size = useSize();
  const isSunView = useView(isSunViewOf);
  const isPanelHidden = useView(isPanelHiddenOf) && size === "desktop";
  const [stop, setStop] = useState<Stop>("half");
  const room = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLElement>(null);
  // On phone the sheet holds the step at every stop (V2 · 10): the stage takes what the sheet leaves of the room.
  const shares = usePhoneSheet(room, size === "phone");
  const project = useProject(projectOf);
  const head = project ? stepHeadOf(lens, project.roof.source) : null;
  const chip = resultChipOf(vitals);
  const capacity = capacityOf(vitals);
  const status = showsFirstOpenOf({ current, seen }) ? firstOpenLinesOf(vitals) : [];
  const name = LENSES.find((one) => one.id === lens)?.name ?? "";
  const sections = size === null ? null : lens === "array" ? <ArrayInspector /> : lens === "roof" ? <RoofInspector size={size} /> : <StringsInspector />;
  // The work column's three weights (V2 · 3): the step (its head, its primary at the foot), the facts, the details.
  const inspector =
    size === null ? null : isSunView && size !== "desktop" ? (
      // On touch the card's content is the work column's while the Sun view is on (V2 · 7); on desktop it is the card on the stage.
      <SunCardBody size={size} />
    ) : (
      // On tablet the column is two halves in the step's order (V2 · 10, D106): the step's head at the left, its sections at
      // the right; on desktop and phone one under the other.
      <div className="flex flex-col tablet:grid tablet:grid-cols-2 tablet:items-start tablet:gap-x-10 desktop:flex desktop:items-stretch">
        <div className="min-w-0">{head ? <StepHead title={head.title} line={head.line} status={status} problem={chip.kind === "stale" ? chip.problem : null} onAction={tryAgain} /> : null}</div>
        <div className="min-w-0">{sections}</div>
      </div>
    );

  // The Studio comes back to the step that was opened last.
  useEffect(() => view.getState().showLens(lens), [view, lens]);
  usePanel({ isFirstOpen: seen.length <= 1, needsYou: states[lens] === "needs-you" });
  // Cmd or Ctrl with Z undoes the last committed edit, on every step.
  useHistoryKeys();
  // , and . move the time an hour, [ and ] a day (plan/phase-06-plan.md, decision 17).
  useSunKeys();

  return (
    <div ref={room} className="relative flex min-h-0 grow flex-col desktop:flex-row">
      <main
        ref={stage}
        className={classNames("relative flex shrink-0 flex-col desktop:min-w-0 desktop:shrink desktop:grow", shares && "h-span sheet-motion")}
        style={measures(shares ? { span: 1 - shares[stop] } : {})}
      >
        <Stage lens={lens} name={isSunView ? `${name} · Sun` : name} className={classNames("shrink-0 tablet:h-110 desktop:h-auto desktop:grow", shares ? "h-full" : "h-stage-phone")} />
        {/* On tablet the result is a row under the stage, the modules and their power at its right; on desktop and phone it is in the top bar (D95). */}
        <div className="hidden min-h-14 items-center justify-between gap-4 border-b border-line-subtle px-5 py-2 tablet:flex desktop:hidden">
          <ResultChip chip={chip} summary={summaryOf(vitals)} onOpenNotes={open} onTryAgain={tryAgain} />
          {capacity ? <span className="type-body text-text-2">{capacity}</span> : null}
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
        <div className="sticky bottom-0 -mx-5 border-t border-line-subtle bg-chrome px-5 pt-3 pb-safe-3 desktop:static desktop:mx-0 desktop:px-panel desktop:pb-safe-panel">
          <Primary lens={lens} />
        </div>
      </aside>

      <div className="tablet:hidden">
        {/* The step's primary is pinned at the sheet's foot, at every stop (V2 · 10). */}
        {/* On phone the foot holds the button alone, as the board draws it: the step's instruction stays in sight at peek. */}
        <Sheet label="Work column" stop={stop} onStop={setStop} shares={shares} foot={<Primary lens={lens} withLine={false} />}>
          <div className="flex flex-col gap-6 px-4 pt-2 pb-6">{size === "phone" ? inspector : null}</div>
        </Sheet>
      </div>
    </div>
  );
}
