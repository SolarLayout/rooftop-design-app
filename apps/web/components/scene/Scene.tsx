"use client";

import { useMemo } from "react";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { frameOf } from "@/lib/scene/building";
import { toScene } from "@/lib/scene/adapter";
import { anchorOf } from "@/lib/scene/keepout";
import { labelPlacesOf } from "@/lib/scene/projection";
import type { StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf, sunOf } from "@/lib/stores/results-store";
import { selectionOf } from "@/lib/stores/view-store";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { Building, BUILDING_DEPTH } from "./Building";
import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { KeepOut } from "./KeepOut";
import { Modules } from "./Modules";
import { Obstacles } from "./Obstacles";
import { Projector, type Anchor } from "./Projector";
import { SceneCanvas } from "./SceneCanvas";
import { SunLight } from "./SunLight";

type Props = {
  onContextLost: () => void;
  /** Where the scene writes what the DOM over the stage shows: the labels' places, the camera's bearing. */
  stage: StageStore;
};

/** The imagery the ground drapes: the same tiles as the map's (decision 8); none without a key. */
const IMAGERY = esriProvider(KEY_OF_THE_APP)?.imagery ?? null;

/**
 * The 3D scene of the Studio: the design that is open, drawn from the stores, about the roof's centroid
 * (plan/phase-05-plan.md, decisions 1 and 2). It is loaded in the browser alone.
 */
export function Scene({ onContextLost, stage }: Props) {
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const sun = useResults(sunOf);
  const selection = useView(selectionOf);
  const { view } = useStores();
  const roof = project?.roof ?? null;
  const flushClearance = project?.array.flush_clearance_m ?? 0.1;
  const frame = useMemo(() => (roof ? frameOf(roof) : null), [roof]);
  // The labels of the roof's edges and the callout of the selected kept-clear area, anchored about the
  // origin of the scene as the building is.
  const anchors = useMemo<Anchor[]>(() => {
    if (!roof || !frame) return [];
    const [cx, cy] = frame.centroid;
    const about = ([x, y, z]: readonly [number, number, number]) => toScene([x - cx, y - cy, z]);
    const labels = labelPlacesOf(roof.outline, frame.heightAt).map(({ words, at }) => ({ words, at: about(at) }));
    const part = selection?.kind === "keepout" ? layout?.layout.keepout[selection.index] : undefined;
    const hung = part ? anchorOf(part) : null;
    return hung ? [...labels, { words: "", at: about([hung[0], hung[1], frame.heightAt(hung)]), kind: "callout" as const }] : labels;
  }, [roof, frame, layout, selection]);

  if (!roof || !frame) return null;
  const [ox, oy, oz] = toScene([-frame.centroid[0], -frame.centroid[1], 0]);
  const sunAt = sun ? { elevationDeg: sun.elevationDeg, azimuthDeg: sun.azimuthDeg } : null;

  return (
    <SceneCanvas onContextLost={onContextLost}>
      <CameraRig radius={frame.radius} sun={sunAt} />
      <Projector anchors={anchors} stage={stage} />
      <SunLight sun={sunAt} radius={frame.radius} />
      <group position={[ox, oy, oz]}>
        <Building roof={roof} />
        <Obstacles obstacles={roof.obstacles} heightAt={frame.heightAt} />
        {layout ? <Modules layout={layout.layout} heightAt={frame.heightAt} flushClearance={flushClearance} /> : null}
        {layout ? (
          <KeepOut
            parts={layout.layout.keepout}
            heightAt={frame.heightAt}
            selected={selection?.kind === "keepout" ? selection.index : null}
            onSelect={(index) => view.getState().select({ kind: "keepout", index })}
          />
        ) : null}
      </group>
      <Ground imagery={IMAGERY} lat={roof.lat} lon={roof.lon} radius={frame.radius} depth={BUILDING_DEPTH} />
    </SceneCanvas>
  );
}
