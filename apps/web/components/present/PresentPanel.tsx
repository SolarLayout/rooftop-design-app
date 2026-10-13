"use client";

import { useMemo } from "react";
import { useStore } from "zustand";
import { useSun } from "@/components/scene/use-sun";
import { useProject, useResults, useView } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { HeldValue } from "@/components/ui/Stat";
import type { BarLook, Mark } from "@/lib/format/cascade";
import { presentChainOf, type PresentChain } from "@/lib/present/chain";
import { grownMarksOf } from "@/lib/present/counting";
import type { Tour } from "@/lib/present/create-tour";
import { sceneFactsOf, scenePanelOf } from "@/lib/present/scene-panel";
import { projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, layoutOf, sunDayOf } from "@/lib/stores/results-store";
import { sunTimeOf } from "@/lib/stores/view-store";

type Props = { tour: Tour };

// The panel (V2 · 13, D110; D72's place and look): over the stage at its top left, the stage seen through it, blurred;
// 16 from the edges on phone, 40 on tablet and desktop.
const PANEL =
  "pointer-events-none absolute top-safe-4 left-4 z-stage-overlay flex min-w-50 flex-col gap-1 rounded-card border border-line-glass bg-dim-panel px-5 py-4 shadow-float backdrop-blur-panel appearing tablet:top-safe-10 tablet:left-10 tablet:min-w-60";

// The track of the small cascade (D72; the board "Present", frame 6): 150 wide, a step's row 12 high, a total's 20; the
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

/** The chain's cascade from the modules' rated output to the grid, grown as far as the energy has counted. */
function Chain({ chain, share }: { chain: PresentChain; share: number }) {
  const marks = grownMarksOf(chain.chain, share);
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <span className="type-body-touch desktop:type-body whitespace-nowrap text-text-2">
        {chain.first.label} <span className="font-mono text-text">{chain.first.figure}</span>
      </span>
      <div data-testid="present-chain" className="flex flex-col">
        {marks.map((mark, index) => (
          <span key={index} className={classNames(TRACK, mark.kind === "marker" ? "h-5" : "h-3")}>
            <TrackMark mark={mark} />
          </span>
        ))}
      </div>
      <span className="type-body-touch desktop:type-body whitespace-nowrap text-text-2">
        {chain.last.label} <span className="font-mono text-text">{chain.last.figure}</span>
      </span>
    </div>
  );
}

/**
 * The scene under way in one panel at the stage's top left: its name, its one figure, the figure's label; the energy
 * counting up in the place of its final value, the chain's cascade growing beside it (D72, at the owner's word after V2 · 13
 * had left it out). It fades in with its scene. From the stores alone; nothing is asked.
 */
export function PresentPanel({ tour }: Props) {
  const scene = useStore(tour.view, (state) => state.scene);
  const counted = useStore(tour.view, (state) => state.figures);
  const { hour } = useView(sunTimeOf);
  const sun = useSun();
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const sunDay = useResults(sunDayOf);
  const option = useResults(chosenOptionOf);
  const chain = useMemo(() => (option ? presentChainOf(option) : null), [option]);
  if (scene === null || project === null) return null;
  const panel = scenePanelOf(scene, counted, sceneFactsOf({ project, layout, sunDay, hour, sun, option }));
  if (panel === null) return null;
  const withChain = scene === "energy" && chain !== null;
  const figure = (
    <div className="flex flex-col gap-1">
      <h2 className="type-strong-touch desktop:type-strong text-text-2">{panel.name}</h2>
      <p data-testid="present-figure" className="type-figure-touch desktop:type-figure whitespace-nowrap text-text">
        {panel.holds === undefined ? panel.figure : <HeldValue value={panel.figure} holds={panel.holds} />}
      </p>
      <p className="type-body-touch desktop:type-body text-text-2">{panel.label}</p>
    </div>
  );

  return (
    <section key={scene} data-testid="present-panel" data-scene={scene} aria-label={panel.name} className={PANEL}>
      {withChain ? (
        // Under the figure on phone, beside it from tablet on (D72's energy panel).
        <div className="flex flex-col gap-3.5 tablet:flex-row tablet:items-center tablet:gap-8">
          {figure}
          <div className="border-t border-line-glass pt-3.5 tablet:border-t-0 tablet:border-l tablet:pt-0 tablet:pl-8">
            <Chain chain={chain} share={counted} />
          </div>
        </div>
      ) : (
        figure
      )}
    </section>
  );
}
