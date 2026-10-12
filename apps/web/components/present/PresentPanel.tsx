"use client";

import { useMemo } from "react";
import { useStore } from "zustand";
import { useSun } from "@/components/scene/use-sun";
import { useProject, useResults, useView } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { measures } from "@/components/ui/measures";
import { Stat, Stats } from "@/components/ui/Stat";
import type { BarLook, Mark } from "@/lib/format/cascade";
import { grownMarksOf } from "@/lib/present/counting";
import type { Tour } from "@/lib/present/create-tour";
import { figuresOf, type FiguresView } from "@/lib/present/figures";
import { sceneFactsOf, scenePanelOf, type PanelFigure } from "@/lib/present/scene-panel";
import { projectOf } from "@/lib/stores/project-store";
import { chosenOptionOf, layoutOf, sunDayOf } from "@/lib/stores/results-store";
import { presentationOf, sunTimeOf, type Reveal } from "@/lib/stores/view-store";

type Props = { tour: Tour };

const WHOLE: Reveal = { building: 1, obstacles: 1, modules: 1 };

// The panel (the boards "UI fixes · Present, the figures of each scene", D72): over the stage at its top left, the
// stage seen through it, blurred; 304 wide on tablet, 340 on desktop, the energy's 580 there with its chain beside.
const PANEL = classNames(
  "pointer-events-none absolute top-safe-6 left-6 z-stage-overlay flex w-76 flex-col gap-3.5 rounded-card border border-line-glass",
  "bg-dim-panel px-5.5 pt-4.5 pb-5 shadow-float backdrop-blur-panel appearing desktop:top-safe-10 desktop:left-10 desktop:w-85",
);

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

/** The chain's cascade from the array's nominal energy to the grid, grown as far as the energy has counted. */
function Chain({ figures, share }: { figures: FiguresView; share: number }) {
  const marks = grownMarksOf(figures.chain, share);
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <span className="type-body-touch desktop:type-body whitespace-nowrap text-text-2">
        {figures.first.label} <span className="font-mono text-text">{figures.first.figure}</span>
      </span>
      <div data-testid="present-chain" className="flex flex-col">
        {marks.map((mark, index) => (
          <span key={index} className={classNames(TRACK, mark.kind === "marker" ? "h-5" : "h-3")}>
            <TrackMark mark={mark} />
          </span>
        ))}
      </div>
      <span className="type-body-touch desktop:type-body whitespace-nowrap text-text-2">
        {figures.last.label} <span className="font-mono text-text">{figures.last.figure}</span>
      </span>
    </div>
  );
}

function Figure({ figure, look }: { figure: PanelFigure; look: "scene" | "scene-small" }) {
  return <Stat look={look} label={figure.label} value={figure.number} holds={figure.holds} unit={figure.unit === "" ? undefined : figure.unit} />;
}

/**
 * The figures of the scene under way, in one panel at the stage's top left: its title, the lead figure counting as the
 * scene plays in the place of its final value, the others standing; the energy's with the chain's cascade. It fades in
 * with its scene. From the stores alone; nothing is asked.
 */
export function PresentPanel({ tour }: Props) {
  const scene = useStore(tour.view, (state) => state.scene);
  const share = useStore(tour.view, (state) => state.share);
  const counted = useStore(tour.view, (state) => state.figures);
  const reveal = useView(presentationOf)?.reveal ?? WHOLE;
  const { hour } = useView(sunTimeOf);
  const sun = useSun();
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const sunDay = useResults(sunDayOf);
  const option = useResults(chosenOptionOf);
  const figures = useMemo(() => (option ? figuresOf(option) : null), [option]);
  if (scene === null || project === null) return null;
  const facts = sceneFactsOf({ project, layout, sunDay, hour, sun, option });
  const panel = scenePanelOf(scene, { share, figures: counted, reveal }, facts);
  if (panel === null) return null;
  const isEnergy = scene === "energy" && figures !== null;

  return (
    <section key={scene} data-testid="present-panel" data-scene={scene} aria-label={panel.title} className={classNames(PANEL, isEnergy && "desktop:w-145")}>
      <h2 className="type-section text-text-3">{panel.title}</h2>
      <div className={classNames("flex flex-col gap-3.5", isEnergy && "desktop:flex-row desktop:items-center desktop:gap-8")}>
        <Stats className="flex min-w-0 grow flex-col gap-3.5">
          <Figure figure={panel.lead} look="scene" />
          <div className="grid grid-cols-2 gap-3">
            {panel.others.map((figure) => (
              <Figure key={figure.label} figure={figure} look="scene-small" />
            ))}
          </div>
        </Stats>
        {isEnergy ? (
          <div className="border-t border-line-glass pt-1 desktop:border-t-0 desktop:pt-0">
            <Chain figures={figures} share={counted} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
