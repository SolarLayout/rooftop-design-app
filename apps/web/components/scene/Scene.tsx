"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { frameOf } from "@/lib/scene/building";
import { toScene, type XY, type XYZ } from "@/lib/scene/adapter";
import { onTheRoofPlane } from "@/lib/scene/drag";
import { handlePointsOf, type About } from "@/lib/scene/handles";
import { anchorOf } from "@/lib/scene/keepout";
import { anchorOfObstacle, canBeDragged } from "@/lib/scene/obstacles";
import { anchorOfModule, anchorOfRoof, selectionOfPick, type Picked } from "@/lib/scene/pick";
import { labelPlacesOf } from "@/lib/scene/projection";
import type { Cursor, StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf } from "@/lib/stores/results-store";
import { draftOf, draggingOf, selectionOf, toReviewOf } from "@/lib/stores/view-store";
import { withDraftAt, withObstacleReplaced } from "@/lib/studio/obstacle-fields";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { Building, BUILDING_DEPTH } from "./Building";
import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { KeepOut } from "./KeepOut";
import { Modules } from "./Modules";
import { Footprint, Obstacles } from "./Obstacles";
import { Projector, type Anchor } from "./Projector";
import { SceneCanvas } from "./SceneCanvas";
import { ShadowOutlines } from "./ShadowOutlines";
import { SunLight } from "./SunLight";

type Props = {
  onContextLost: () => void;
  /** Where the scene writes what the DOM over the stage shows: the labels' places, the camera's bearing. */
  stage: StageStore;
};

/** The imagery the ground drapes: the same tiles as the map's (decision 8); none without a key. */
const IMAGERY = esriProvider(KEY_OF_THE_APP)?.imagery ?? null;

/** Development counts the writes of the modules' matrices (plan/phase-06-plan.md, decision 6); production does not. */
const COUNTS_MODULE_WRITES = process.env.NODE_ENV !== "production";

/** What a press on the roof places the draft on: the roof itself and what lies on it. */
const ON_THE_ROOF = new Set<Picked["what"]>(["roof", "module", "keepout"]);

/**
 * The 3D scene of the Studio: the design that is open, drawn from the stores, about the roof's centroid
 * (plan/phase-05-plan.md, decisions 1 and 2). It is loaded in the browser alone. A press selects what it
 * hit (decision 10); with a draft standing, a press on the roof places the draft there (decision 15); the
 * selected obstacle is dragged on the roof plane and drawn where the pointer has it (decision 12). The
 * scene reads nothing of the time: the light and the camera do, so that the time redraws them alone
 * (plan/reference/r3f-notes.md, fix 12).
 */
export function Scene({ onContextLost, stage }: Props) {
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const dragging = useView(draggingOf);
  const { view, project: store } = useStores();
  const roof = project?.roof ?? null;
  const flushClearance = project?.array.flush_clearance_m ?? 0.1;
  const frame = useMemo(() => (roof ? frameOf(roof) : null), [roof]);
  const about = useMemo<About | null>(() => (frame ? { centroid: frame.centroid, heightAt: frame.heightAt } : null), [frame]);
  // The labels of the roof's edges and the callout of what is selected (a kept-clear area, an obstacle, a
  // draft obstacle, a module, the roof), anchored about the origin of the scene as the building is; the
  // points the handles of the selected obstacle are placed by, of the obstacle as the pointer has it.
  const anchors = useMemo<Anchor[]>(() => {
    if (!roof || !frame) return [];
    const [cx, cy] = frame.centroid;
    const about = ([x, y, z]: XYZ) => toScene([x - cx, y - cy, z]);
    const labels = labelPlacesOf(roof.outline, frame.heightAt).map(({ words, at }) => ({ words, at: about(at) }));
    const callout = (at: XYZ): Anchor => ({ words: "", at: about(at), kind: "callout" });
    if (draft) return [...labels, callout(anchorOfObstacle(draft, frame.heightAt))];
    if (selection?.kind === "roof") return [...labels, callout(anchorOfRoof(roof.outline, frame.heightAt))];
    if (selection?.kind === "obstacle" && roof.obstacles[selection.index]) {
      const obstacle = dragging?.index === selection.index ? dragging.obstacle : roof.obstacles[selection.index];
      const handles = dragging?.by === "move" ? [] : handlePointsOf(obstacle, frame.heightAt).map(({ id, at }): Anchor => ({ words: "", at: about(at), kind: "handle", id }));
      return [...labels, callout(anchorOfObstacle(obstacle, frame.heightAt)), ...handles];
    }
    const position = selection?.kind === "module" ? layout?.layout.modules[selection.index] : undefined;
    if (position) return [...labels, callout(anchorOfModule(position, frame.heightAt))];
    const part = selection?.kind === "keepout" ? layout?.layout.keepout[selection.index] : undefined;
    const hung = part ? anchorOf(part) : null;
    return hung ? [...labels, callout([hung[0], hung[1], frame.heightAt(hung)])] : labels;
  }, [roof, frame, layout, selection, draft, dragging]);

  if (!roof || !frame || !about) return null;
  const [cx, cy] = frame.centroid;
  const [ox, oy, oz] = toScene([-cx, -cy, 0]);

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
      <CameraRig radius={frame.radius} />
      <Projector anchors={anchors} stage={stage} />
      <SunLight radius={frame.radius} />
      <group position={[ox, oy, oz]}>
        <Building roof={roof} onPressRoof={(event) => pressed({ what: "roof" }, event)} onOverRoof={over("roof", "pointer")} />
        <Obstacles
          obstacles={roof.obstacles}
          selected={selection?.kind === "obstacle" ? selection.index : null}
          toReview={toReview}
          onSelect={(index) => pressed({ what: "obstacle", index })}
          onOver={(index, isOver) => over(`obstacle-${index}`, selection?.kind === "obstacle" && selection.index === index && canBeDragged(roof.obstacles[index]) ? "grab" : "pointer")(isOver)}
          about={about}
          roofOutline={roof.outline}
          dragging={dragging}
          onDrag={(next) => {
            view.getState().setDragging(next);
            stage.getState().setOver("drag", next ? "grabbing" : null);
          }}
          onDrop={(index, obstacle) => store.getState().commit((design) => withObstacleReplaced(design, index, obstacle))}
        />
        {draft ? <Footprint obstacle={draft} heightAt={frame.heightAt} /> : null}
        {layout ? (
          <Modules
            layout={layout.layout}
            heightAt={frame.heightAt}
            flushClearance={flushClearance}
            selected={selection?.kind === "module" ? selection.index : null}
            onPressModule={(instanceId, event) => pressed({ what: "module", instanceId }, event)}
            onOverModules={over("modules", "pointer")}
            onWrite={COUNTS_MODULE_WRITES ? stage.getState().countModuleWrite : undefined}
          />
        ) : null}
        <ShadowOutlines heightAt={frame.heightAt} />
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
