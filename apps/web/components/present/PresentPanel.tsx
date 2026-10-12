"use client";

import { useStore } from "zustand";
import { useSun } from "@/components/scene/use-sun";
import { useProject, useResults, useView } from "@/components/shell/stores";
import { HeldValue } from "@/components/ui/Stat";
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

/**
 * The scene under way in one panel at the stage's top left: its name, its one figure, the figure's label; the energy
 * counting up in the place of its final value. It fades in with its scene. From the stores alone; nothing is asked.
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
  if (scene === null || project === null) return null;
  const panel = scenePanelOf(scene, counted, sceneFactsOf({ project, layout, sunDay, hour, sun, option }));
  if (panel === null) return null;

  return (
    <section key={scene} data-testid="present-panel" data-scene={scene} aria-label={panel.name} className={PANEL}>
      <h2 className="type-strong-touch desktop:type-strong text-text-2">{panel.name}</h2>
      <p data-testid="present-figure" className="type-figure-touch desktop:type-figure whitespace-nowrap text-text">
        {panel.holds === undefined ? panel.figure : <HeldValue value={panel.figure} holds={panel.holds} />}
      </p>
      <p className="type-body-touch desktop:type-body text-text-2">{panel.label}</p>
    </section>
  );
}
