"use client";

import { useMemo } from "react";
import { useStore } from "zustand";
import { useResults } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { Stat, Stats } from "@/components/ui/Stat";
import type { BarLook, Mark } from "@/lib/format/cascade";
import { energy } from "@/lib/format/vitals";
import { countedAt, grownMarksOf } from "@/lib/present/counting";
import type { Tour } from "@/lib/present/create-tour";
import { figuresOf } from "@/lib/present/figures";
import { chosenOptionOf } from "@/lib/stores/results-store";

type Props = { tour: Tour };

// The track of the small cascade (the board "Present", frame 6): 150 wide, a step's row 12 high, a total's 20; the
// bars as the loss chain draws them (components/performance/LossRow.tsx), the markers 2 wide in the text's colour.
const TRACK = "relative block w-37.5";
const BAR = "absolute top-1/2 h-3 -translate-y-1/2 left-at";
const LOOK: Record<BarLook, string> = { gain: "bg-data-gain", loss: "bg-data-loss", zero: "bg-data-zero" };

/** A step's bar from the running total before it to the one after, as far as it has grown; a step of nothing a tick; a total a marker. */
function TrackMark({ mark }: { mark: Mark }) {
  if (mark.kind === "marker") return <span data-look="marker" className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 left-at bg-text" style={measures({ at: mark.at })} />;
  if (mark.look === "zero") return <span data-look="zero" className={classNames(BAR, "w-px", LOOK.zero)} style={measures({ at: mark.to })} />;
  return <span data-look={mark.look} className={classNames(BAR, "w-span rounded-swatch", LOOK[mark.look])} style={measures({ at: Math.min(mark.from, mark.to), span: Math.abs(mark.to - mark.from) })} />;
}

/**
 * The figures of the last scene (plan/phase-10-plan.md, step 19, decision 9): the stage dimmed, the energy of year 1
 * counting from 0 to the chosen option's MWh over the scene's share, the chain's bars from the array's nominal energy
 * to the grid cascading with the same share, the first and the last total named. From the stores alone; in the energy
 * scene alone.
 */
export function PresentFigures({ tour }: Props) {
  const scene = useStore(tour.view, (state) => state.scene);
  const share = useStore(tour.view, (state) => state.figures);
  const option = useResults(chosenOptionOf);
  const figures = useMemo(() => (option ? figuresOf(option) : null), [option]);
  if (scene !== "energy" || !figures) return null;
  const counted = energy(countedAt(figures.mwh, share));
  const marks = grownMarksOf(figures.chain, share);

  return (
    <div data-testid="present-energy" data-state={share >= 1 ? "counted" : "counting"} className="pointer-events-none absolute inset-0 z-stage-overlay flex items-center justify-center gap-16 bg-dim px-10 tablet:gap-24">
      <Stats className="flex flex-col">
        <Stat look="hero" label={figures.label} value={counted.number} unit={counted.unit} />
      </Stats>
      <div className="flex flex-col gap-1.5">
        <span className="type-caption whitespace-nowrap text-text-2">
          {figures.first.label} <span className="font-mono text-text">{figures.first.figure}</span>
        </span>
        <div data-testid="present-chain" className="flex flex-col">
          {marks.map((mark, index) => (
            <span key={index} className={classNames(TRACK, mark.kind === "marker" ? "h-5" : "h-3")}>
              <TrackMark mark={mark} />
            </span>
          ))}
        </div>
        <span className="type-caption whitespace-nowrap text-text-2">
          {figures.last.label} <span className="font-mono text-text">{figures.last.figure}</span>
        </span>
      </div>
    </div>
  );
}
