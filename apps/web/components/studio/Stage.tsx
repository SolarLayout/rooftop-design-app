"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useProject, useResults } from "@/components/shell/stores";
import { useWebGL } from "@/components/find/use-web-gl";
import { classNames } from "@/components/ui/class-names";
import { shown } from "@/components/ui/number-entry";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { wordsOf } from "@/lib/scene/obstacles";
import type { Lens } from "@/lib/routes";
import { projectOf } from "@/lib/stores/project-store";
import { readoutsOf } from "@/lib/stores/results-store";
import { subLineOf } from "./stage-view";

// The scene draws with WebGL in the browser alone: it is loaded there, never on the server.
const Scene = dynamic(() => import("@/components/scene/Scene").then((module) => module.Scene), { ssr: false });

type Props = { lens: Lens; name: string; className?: string };

/** The words the imagery under the roof must carry wherever it is shown (guidelines.md, "3D scene"). */
const ATTRIBUTION = esriProvider(KEY_OF_THE_APP)?.imagery.attribution ?? null;

const NO_WEBGL = "This browser cannot draw the roof in 3D.";
const CONTEXT_LOST = "The browser stopped drawing the roof in 3D.";

/**
 * The stage of the Studio: the 3D scene, the lens's title with its line of read-outs over it, and the
 * text equivalent of what the scene draws (docs/design/guidelines.md, "Accessibility"). Without WebGL,
 * or once the browser takes the context away, it says so.
 */
export function Stage({ lens, name, className }: Props) {
  const project = useProject(projectOf);
  const readouts = useResults(readoutsOf);
  const webGL = useWebGL();
  const [isLost, setLost] = useState(false);
  const subLine = subLineOf(lens, readouts, project?.roof.obstacles.length ?? 0);
  const cannotDraw = webGL === false ? NO_WEBGL : isLost ? CONTEXT_LOST : null;

  return (
    <div data-testid="stage" data-state={cannotDraw ? "plan" : "scene"} className={classNames("relative", className)}>
      <div className="absolute inset-0 z-stage">{cannotDraw ? null : <Scene onContextLost={() => setLost(true)} />}</div>
      <div className="pointer-events-none absolute inset-x-4 top-4 z-stage-overlay flex flex-col gap-0.5 tablet:inset-x-5 desktop:top-5 desktop:left-6">
        <h1 className="sr-only desktop:not-sr-only desktop:type-lens">{name}</h1>
        {subLine ? (
          <p data-testid="stage-subline" className="hidden type-small text-text-2 desktop:block">
            {subLine}
          </p>
        ) : null}
      </div>
      {cannotDraw ? (
        <p role="status" className="absolute inset-x-4 bottom-4 z-stage-overlay type-small text-text-2">
          {cannotDraw}
        </p>
      ) : ATTRIBUTION ? (
        <p data-testid="stage-attribution" className="pointer-events-none absolute bottom-1 left-4 z-stage-overlay max-w-full truncate type-label-s text-text-on-imagery on-imagery tablet:left-5 desktop:bottom-1.5 desktop:left-6">
          {ATTRIBUTION}
        </p>
      ) : null}
      <OnTheRoof />
    </div>
  );
}

/** The text equivalent of the scene: what stands on the roof, for a screen reader and for the tests. */
function OnTheRoof() {
  const project = useProject(projectOf);
  const readouts = useResults(readoutsOf);
  if (!project) return null;
  const { roof } = project;
  return (
    <ul aria-label="On the roof" className="sr-only">
      <li data-testid="on-the-roof-roof">
        Roof, {roof.outline.length} corners{readouts ? `, ${shown(Math.round(readouts.roof_area_m2), 0)} m²` : ""}
        {roof.parapet_h > 0 ? `, parapet ${shown(roof.parapet_h, 1)} m` : ""}
      </li>
      {roof.obstacles.map((obstacle, index) =>
        obstacle.auto ? null : (
          <li key={index} data-testid="on-the-roof-obstacle">
            {wordsOf(obstacle)}
          </li>
        ),
      )}
    </ul>
  );
}
