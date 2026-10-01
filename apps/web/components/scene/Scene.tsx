"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { frameOf } from "@/lib/scene/building";
import { toScene, type XY, type XYZ } from "@/lib/scene/adapter";
import { onTheRoofPlane } from "@/lib/scene/drag";
import { anchorOf } from "@/lib/scene/keepout";
import { anchorOfObstacle } from "@/lib/scene/obstacles";
import { anchorOfModule, anchorOfRoof, selectionOfPick, type Picked } from "@/lib/scene/pick";
import { labelPlacesOf } from "@/lib/scene/projection";
import type { Cursor, StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf, sunOf } from "@/lib/stores/results-store";
import { draftOf, selectionOf, toReviewOf } from "@/lib/stores/view-store";
import { withDraftAt } from "@/lib/studio/obstacle-fields";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { Building, BUILDING_DEPTH } from "./Building";
import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { KeepOut } from "./KeepOut";
import { Modules } from "./Modules";
import { Draft, Obstacles } from "./Obstacles";
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

/** What a press on the roof places the draft on: the roof itself and what lies on it. */
const ON_THE_ROOF = new Set<Picked["what"]>(["roof", "module", "keepout"]);

/**
 * The 3D scene of the Studio: the design that is open, drawn from the stores, about the roof's centroid
 * (plan/phase-05-plan.md, decisions 1 and 2). It is loaded in the browser alone. A press selects what it
 * hit (decision 10); with a draft standing, a press on the roof places the draft there (decision 15).
 */
export function Scene({ onContextLost, stage }: Props) {
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const sun = useResults(sunOf);
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const { view } = useStores();
  const roof = project?.roof ?? null;
  const flushClearance = project?.array.flush_clearance_m ?? 0.1;
  const frame = useMemo(() => (roof ? frameOf(roof) : null), [roof]);
  // The labels of the roof's edges and the callout of what is selected (a kept-clear area, an obstacle, a
  // draft obstacle, a module, the roof), anchored about the origin of the scene as the building is.
  const anchors = useMemo<Anchor[]>(() => {
    if (!roof || !frame) return [];
    const [cx, cy] = frame.centroid;
    const about = ([x, y, z]: XYZ) => toScene([x - cx, y - cy, z]);
    const labels = labelPlacesOf(roof.outline, frame.heightAt).map(({ words, at }) => ({ words, at: about(at) }));
    const callout = (at: XYZ): Anchor => ({ words: "", at: about(at), kind: "callout" });
    if (draft) return [...labels, callout(anchorOfObstacle(draft, frame.heightAt))];
    if (selection?.kind === "roof") return [...labels, callout(anchorOfRoof(roof.outline, frame.heightAt))];
    if (selection?.kind === "obstacle" && roof.obstacles[selection.index]) return [...labels, callout(anchorOfObstacle(roof.obstacles[selection.index], frame.heightAt))];
    const position = selection?.kind === "module" ? layout?.layout.modules[selection.index] : undefined;
    if (position) return [...labels, callout(anchorOfModule(position, frame.heightAt))];
    const part = selection?.kind === "keepout" ? layout?.layout.keepout[selection.index] : undefined;
    const hung = part ? anchorOf(part) : null;
    return hung ? [...labels, callout([hung[0], hung[1], frame.heightAt(hung)])] : labels;
  }, [roof, frame, layout, selection, draft]);

  if (!roof || !frame) return null;
  const [cx, cy] = frame.centroid;
  const [ox, oy, oz] = toScene([-cx, -cy, 0]);
  const sunAt = sun ? { elevationDeg: sun.elevationDeg, azimuthDeg: sun.azimuthDeg } : null;

  /** Where a ray of the pointer meets the roof plane, in the document's metres; null when it never does. */
  function onTheRoof(event: ThreeEvent<MouseEvent>): XY | null {
    const near: XY = [event.point.x + cx, -event.point.z + cy];
    const hit = onTheRoofPlane(event.ray, frame!.heightAt(near));
    return hit ? [hit[0] + cx, hit[1] + cy] : null;
  }

  /** A press on something of the scene: it places the draft, or it selects what was pressed. */
  function pressed(picked: Picked, event?: ThreeEvent<MouseEvent>) {
    const at = draft && event && ON_THE_ROOF.has(picked.what) ? onTheRoof(event) : null;
    if (draft && at) return view.getState().setDraft(withDraftAt(draft, at));
    view.getState().select(selectionOfPick(picked));
  }

  /** What is under the pointer says so, with the cursor it wants (plan step 17). */
  const over = (name: string, cursor: Cursor) => (isOver: boolean) => stage.getState().setOver(name, isOver ? cursor : null);

  return (
    <SceneCanvas onContextLost={onContextLost} onPressNothing={() => pressed({ what: "ground" })}>
      <CameraRig radius={frame.radius} sun={sunAt} />
      <Projector anchors={anchors} stage={stage} />
      <SunLight sun={sunAt} radius={frame.radius} />
      <group position={[ox, oy, oz]}>
        <Building roof={roof} onPressRoof={(event) => pressed({ what: "roof" }, event)} onOverRoof={over("roof", "pointer")} />
        <Obstacles
          obstacles={roof.obstacles}
          heightAt={frame.heightAt}
          selected={selection?.kind === "obstacle" ? selection.index : null}
          toReview={toReview}
          onSelect={(index) => pressed({ what: "obstacle", index })}
          onOver={(index, isOver) => over(`obstacle-${index}`, "pointer")(isOver)}
        />
        {draft ? <Draft draft={draft} heightAt={frame.heightAt} /> : null}
        {layout ? (
          <Modules
            layout={layout.layout}
            heightAt={frame.heightAt}
            flushClearance={flushClearance}
            selected={selection?.kind === "module" ? selection.index : null}
            onPressModule={(instanceId, event) => pressed({ what: "module", instanceId }, event)}
            onOverModules={over("modules", "pointer")}
          />
        ) : null}
        {layout ? (
          <KeepOut
            parts={layout.layout.keepout}
            heightAt={frame.heightAt}
            selected={selection?.kind === "keepout" ? selection.index : null}
            onSelect={(index, event) => pressed({ what: "keepout", index }, event)}
            onOver={(index, isOver) => over(`keepout-${index}`, "pointer")(isOver)}
          />
        ) : null}
      </group>
      <Ground imagery={IMAGERY} lat={roof.lat} lon={roof.lon} radius={frame.radius} depth={BUILDING_DEPTH} stage={stage} onPressGround={() => pressed({ what: "ground" })} />
    </SceneCanvas>
  );
}
