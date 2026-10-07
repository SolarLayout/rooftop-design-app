"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { useProject, useResults, useStores, useView } from "@/components/shell/stores";
import { frameOf } from "@/lib/scene/building";
import { toScene, type XY, type XYZ } from "@/lib/geometry/adapter";
import { onTheRoofPlane } from "@/lib/stores/drag";
import { handlePointsOf, type About } from "@/lib/scene/handles";
import { inverterMarkersOf } from "@/lib/scene/inverter-markers";
import { anchorOf } from "@/lib/geometry/keepout";
import { anchorOfObstacle, canBeDragged } from "@/lib/geometry/obstacles";
import { anchorOfModule, anchorOfRoof, anchorOfString, selectionOfPick, selectionOfPickedString, stringOfPosition, type Picked } from "@/lib/scene/pick";
import { labelPlacesOf } from "@/lib/scene/projection";
import { whatIsDrawnOf } from "@/lib/scene/what-is-drawn";
import type { Cursor, StageStore } from "@/lib/scene/stage-store";
import { projectOf } from "@/lib/stores/project-store";
import { layoutOf, stringsOnTheRoofOf } from "@/lib/stores/results-store";
import { cameraOf, draftOf, draggingOf, groundDrawnOf, groundOf, lensOf, presentationOf, selectionOf, showsSunPathOf, toReviewOf, type Reveal } from "@/lib/stores/view-store";
import { withDraftAt, withObstacleReplaced } from "@/lib/geometry/obstacle-fields";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/places/esri";
import { Building, BUILDING_DEPTH } from "./Building";
import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { InverterMarkers } from "./InverterMarkers";
import { KeepOut } from "./KeepOut";
import { Modules } from "./Modules";
import { Footprint, Obstacles } from "./Obstacles";
import { Projector, type Anchor } from "./Projector";
import { SceneCanvas } from "./SceneCanvas";
import { ShadowOutlines } from "./ShadowOutlines";
import { SunLight } from "./SunLight";
import { SunPath } from "./SunPath";
import { canHover, oncePerFrame } from "./pointer";
import { useGlassOfTheStage, useStringsShown } from "./use-strings";

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

/** The Studio shows the whole design: the reveal of Present is for its tour alone (plan/phase-10-plan.md, step 17). */
const WHOLE: Reveal = { building: 1, obstacles: 1, modules: 1 };

/**
 * The 3D scene of the Studio: the design that is open, drawn from the stores, about the roof's centroid
 * (plan/phase-05-plan.md, decisions 1 and 2). It is loaded in the browser alone. A press selects what it
 * hit (decision 10); with a draft standing, a press on the roof places the draft there (decision 15); the
 * selected obstacle is dragged on the roof plane and drawn where the pointer has it (decision 12). The
 * scene reads nothing of the time: the light, the camera and the sun path's marker do, so that the time
 * redraws them alone (plan/reference/r3f-notes.md, fix 12). The sun path is drawn in the Sun lens alone. Under
 * Present's tour (plan/phase-10-plan.md, decision 8) the same scene draws the design as far as the tour reveals it,
 * with nothing selected, no draft, no drag and no kept-clear areas.
 */
export function Scene({ onContextLost, stage }: Props) {
  const project = useProject(projectOf);
  const layout = useResults(layoutOf);
  const presentation = useView(presentationOf);
  const reveal = presentation?.reveal ?? WHOLE;
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const toReview = useView(toReviewOf);
  const dragging = useView(draggingOf);
  const showsSunPath = useView(showsSunPathOf);
  // The ground the Layers panel asks for (decision D57): the imagery while there is one to draw, else the plain grid.
  const imagery = groundDrawnOf(useView(groundOf), IMAGERY !== null) === "imagery" ? IMAGERY : null;
  const glass = useGlassOfTheStage();
  const strings = useStringsShown();
  const drawn = whatIsDrawnOf(useView(lensOf), useView(cameraOf));
  const { view, project: store, results } = useStores();
  const roof = project?.roof ?? null;
  const flushClearance = project?.array.flush_clearance_m ?? 0.1;
  const frame = useMemo(() => (roof ? frameOf(roof) : null), [roof]);
  const about = useMemo<About | null>(() => (frame ? { centroid: frame.centroid, heightAt: frame.heightAt } : null), [frame]);
  // The inverters of the chosen option, while its strings are on the roof (plan/phase-07-plan.md, decision 13).
  const inverters = strings?.option.system.inverters ?? null;
  const markers = useMemo(() => (inverters && frame ? inverterMarkersOf(inverters, frame.heightAt) : []), [inverters, frame]);
  const idxs = useMemo(() => layout?.layout.modules.map((module) => module.idx) ?? [], [layout]);
  // The strings traced and selected, by their positions in wired order: a line through each (decision 13).
  const traces = useMemo(
    () => (strings ? strings.lit.flatMap((label) => strings.strings.filter((string) => string.label === label).map((string) => string.modules)) : []),
    [strings],
  );
  // On a device that can hover, the string under the pointer is traced, read once a frame; on touch a tap selects it.
  const hovers = useMemo(() => canHover(), []);
  const trace = useMemo(
    () =>
      oncePerFrame<number | null>((instanceId) => {
        // Read on the frame from the stores: the strings and the layout of that moment.
        const wired = stringsOnTheRoofOf(results.getState());
        const idx = instanceId === null ? undefined : layoutOf(results.getState())?.layout.modules[instanceId]?.idx;
        const string = wired && idx !== undefined ? stringOfPosition(wired, idx) : null;
        view.getState().traceString(string?.label ?? null);
      }),
    [view, results],
  );
  // The labels of the roof's edges, the chips of the inverters, and the callout of what is selected (a kept-clear area, an obstacle, a
  // draft obstacle, a module, the roof), anchored about the origin of the scene as the building is; the
  // points the handles of the selected obstacle are placed by, of the obstacle as the pointer has it.
  const anchors = useMemo<Anchor[]>(() => {
    if (!roof || !frame) return [];
    const [cx, cy] = frame.centroid;
    const about = ([x, y, z]: XYZ) => toScene([x - cx, y - cy, z]);
    const edges = drawn.edgeLabels ? labelPlacesOf(roof.outline, frame.heightAt).map(({ words, at }) => ({ words, at: about(at) })) : [];
    const labels = [...edges, ...markers.map(({ label, top }): Anchor => ({ words: label, at: about(top), kind: "inverter" }))];
    const callout = (at: XYZ): Anchor => ({ words: "", at: about(at), kind: "callout" });
    if (draft) return [...labels, callout(anchorOfObstacle(draft, frame.heightAt))];
    if (selection?.kind === "roof") return [...labels, callout(anchorOfRoof(roof.outline, frame.heightAt))];
    if (selection?.kind === "obstacle" && roof.obstacles[selection.index]) {
      const obstacle = dragging?.index === selection.index ? dragging.obstacle : roof.obstacles[selection.index];
      const handles = dragging?.by === "move" ? [] : handlePointsOf(obstacle, frame.heightAt).map(({ id, at }): Anchor => ({ words: "", at: about(at), kind: "handle", id }));
      return [...labels, callout(anchorOfObstacle(obstacle, frame.heightAt)), ...handles];
    }
    const string = selection?.kind === "string" ? strings?.strings.find((one) => one.label === selection.label) : undefined;
    const middle = string && layout ? anchorOfString(string, layout.layout.modules, frame.heightAt) : null;
    if (middle) return [...labels, callout(middle)];
    const position = selection?.kind === "module" ? layout?.layout.modules[selection.index] : undefined;
    if (position) return [...labels, callout(anchorOfModule(position, frame.heightAt))];
    const part = selection?.kind === "keepout" ? layout?.layout.keepout[selection.index] : undefined;
    const hung = part ? anchorOf(part) : null;
    return hung ? [...labels, callout([hung[0], hung[1], frame.heightAt(hung)])] : labels;
  }, [roof, frame, layout, selection, draft, dragging, drawn.edgeLabels, markers, strings]);

  if (!roof || !frame || !about) return null;
  const [cx, cy] = frame.centroid;
  const [ox, oy, oz] = toScene([-cx, -cy, 0]);
  // What the scene outlines as selected: nothing under Present's tour, which keeps the Studio's selection for its return.
  const shown = presentation ? null : selection;

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
    // In the Strings lens a press on a position a string wires selects the string (decision 13).
    view.getState().select(strings ? selectionOfPickedString(picked, idxs, strings.strings) : selectionOfPick(picked));
  }

  /** What is under the pointer says so, with the cursor it wants (plan step 17). */
  const over = (name: string, cursor: Cursor) => (isOver: boolean) => stage.getState().setOver(name, isOver ? cursor : null);

  return (
    <SceneCanvas onContextLost={onContextLost} onPressNothing={() => pressed({ what: "ground" })}>
      <CameraRig radius={frame.radius} onDrag={(isDragged) => stage.getState().setOver("view", isDragged ? "grabbing" : null)} />
      <Projector anchors={anchors} stage={stage} />
      <SunLight radius={frame.radius} />
      {showsSunPath ? <SunPath centre={frame.centroid} radius={frame.radius} stage={stage} /> : null}
      <group position={[ox, oy, oz]}>
        <Building roof={roof} reveal={reveal.building} onPressRoof={(event) => pressed({ what: "roof" }, event)} />
        <Obstacles
          obstacles={roof.obstacles}
          reveal={reveal.obstacles}
          selected={shown?.kind === "obstacle" ? shown.index : null}
          toReview={toReview}
          onSelect={(index) => pressed({ what: "obstacle", index })}
          onOver={(index, isOver) => over(`obstacle-${index}`, shown?.kind === "obstacle" && shown.index === index && canBeDragged(roof.obstacles[index]) ? "grab" : "pointer")(isOver)}
          about={about}
          roofOutline={roof.outline}
          dragging={presentation ? null : dragging}
          onDrag={(next) => {
            view.getState().setDragging(next);
            stage.getState().setOver("drag", next ? "grabbing" : null);
          }}
          onDrop={(index, obstacle) => store.getState().commit((design) => withObstacleReplaced(design, index, obstacle))}
        />
        {draft && !presentation ? <Footprint obstacle={draft} heightAt={frame.heightAt} /> : null}
        {layout ? (
          <Modules
            layout={layout.layout}
            heightAt={frame.heightAt}
            flushClearance={flushClearance}
            reveal={reveal.modules}
            selected={shown?.kind === "module" ? shown.index : null}
            onPressModule={(instanceId, event) => pressed({ what: "module", instanceId }, event)}
            onWrite={COUNTS_MODULE_WRITES ? stage.getState().countModuleWrite : undefined}
            glassColours={glass}
            onTraceModule={strings && hovers ? trace : undefined}
            traces={traces}
          />
        ) : null}
        {markers.length ? <InverterMarkers markers={markers} /> : null}
        <ShadowOutlines heightAt={frame.heightAt} />
        {layout && drawn.keptClear && !presentation ? (
          <KeepOut
            parts={layout.layout.keepout}
            heightAt={frame.heightAt}
            selected={shown?.kind === "keepout" ? shown.index : null}
            onSelect={(index, event) => pressed({ what: "keepout", index }, event)}
            onOver={(index, isOver) => over(`keepout-${index}`, "pointer")(isOver)}
          />
        ) : null}
      </group>
      <Ground imagery={imagery} lat={roof.lat} lon={roof.lon} radius={frame.radius} depth={BUILDING_DEPTH} stage={stage} onPressGround={() => pressed({ what: "ground" })} />
    </SceneCanvas>
  );
}
