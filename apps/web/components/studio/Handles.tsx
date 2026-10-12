"use client";

import { useRef, type PointerEvent, type ReactNode, type WheelEvent as ReactWheelEvent } from "react";
import { useStore } from "zustand";
import { useProject, useStores, useView } from "@/components/shell/stores";
import { classNames } from "@/components/ui/class-names";
import { STEM_HEIGHT, STEM_HEIGHT_TOUCH, STEM_TURN } from "@/components/ui/design-numbers";
import { Icon } from "@/components/ui/Icon";
import { measures } from "@/components/ui/measures";
import type { Obstacle } from "@/lib/api";
import { frameOf } from "@/lib/scene/building";
import { liveWordsOf, type DragBy, type Dragging } from "@/lib/stores/drag";
import { obstacleByHandle, type HandleId } from "@/lib/scene/handles";
import { rayAt, stemEndOf, type StageLabel } from "@/lib/scene/projection";
import { cameraOf, canvasOf, labelsOf, type StageStore } from "@/lib/scene/stage-store";
import { wheelInitOf } from "@/lib/scene/wheel-forward";
import { projectOf } from "@/lib/stores/project-store";
import { draggingOf, selectionOf } from "@/lib/stores/view-store";
import { withObstacleReplaced } from "@/lib/geometry/obstacle-fields";
import { useSize } from "./use-size";

type Props = { stage: StageStore };

type Pixel = readonly [number, number];

// The handles of the map's outline are the look to match (components/find/OutlineLayer.tsx): 18 (22 on
// touch), white with an accent line, inside a round target of 44 that takes the press; the turn handle
// 32 round (44 on touch) with the turn icon, on its stem. The stems are lines in the accent.
const TARGET = "placed pointer-events-auto flex size-touch -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-full select-none";
const CORNER = "block size-5.5 rounded-full border-corner-touch border-accent bg-handle-fill shadow-handle desktop:size-4.5 desktop:border-corner";
const TURN = "flex size-touch items-center justify-center rounded-full border border-accent bg-surface-1 text-accent shadow-float desktop:size-8";
// The live label stands beside the pointer, in the look of the labels of the stage (Labels.tsx): to the right
// of its point, or to the left where the point is in the right half of the canvas, so that it stays on the stage.
const LIVE = "placed block -translate-y-1/2 rounded-control bg-ground px-2.25 py-0.75 type-mono-touch desktop:type-mono font-medium whitespace-nowrap text-text shadow-tooltip select-none";
const LIVE_RIGHT = "translate-x-5";
const LIVE_LEFT = "-translate-x-full -ml-5";

const BY_OF_HANDLE: Record<HandleId, DragBy> = { "corner-0": "corner", "corner-1": "corner", "corner-2": "corner", "corner-3": "corner", turn: "turn", height: "height", edge: "edge" };

/** The handle the live label of a drag stands beside; a move's label stands at the callout's anchor. */
const labelHandleOf = (dragging: Dragging) => (dragging.by === "move" ? "callout" : (dragging.handle ?? dragging.by));

/** Where the handles stand on the canvas, from the points the Projector placed; a handle on a stem at the stem's end. */
function placesOf(labels: readonly StageLabel[], stemHeight: number): Partial<Record<HandleId | "turn-foot" | "height-foot" | "callout", Pixel>> {
  const at = (id: string) => {
    const label = labels.find((one) => (one.kind === "handle" && one.id === id) || (id === "callout" && one.kind === "callout"));
    return label && label.visible ? ([label.x, label.y] as const) : null;
  };
  const places: Partial<Record<HandleId | "turn-foot" | "height-foot" | "callout", Pixel>> = {};
  for (const id of ["corner-0", "corner-1", "corner-2", "corner-3", "edge", "callout"] as const) {
    const pixel = at(id);
    if (pixel) places[id] = pixel;
  }
  const [turnFoot, turnNorth, heightFoot, heightUp] = [at("turn-foot"), at("turn-north"), at("height-foot"), at("height-up")];
  const turn = turnFoot && turnNorth ? stemEndOf(turnFoot, turnNorth, STEM_TURN) : null;
  const height = heightFoot && heightUp ? stemEndOf(heightFoot, heightUp, stemHeight) : null;
  if (turnFoot && turn) Object.assign(places, { "turn-foot": turnFoot, turn });
  if (heightFoot && height) Object.assign(places, { "height-foot": heightFoot, height });
  return places;
}

/** A stem: the line from a handle's foot to the handle. */
function Stem({ from, to }: { from: Pixel; to: Pixel }) {
  return <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} className="stroke-accent stroke-outline" />;
}

type HandleProps = {
  id: HandleId;
  at: Pixel;
  isHeld: boolean;
  onBegin: (event: PointerEvent, id: HandleId) => void;
  onMove: (event: PointerEvent) => void;
  onEnd: (event: PointerEvent, isDropped: boolean) => void;
  children: ReactNode;
};

/** One handle: its target of 44 where its point falls, taking the press and the drag; what it looks like inside. */
function Handle({ id, at, isHeld, onBegin, onMove, onEnd, children }: HandleProps) {
  return (
    <div
      data-testid="stage-handle"
      data-handle={id}
      aria-hidden="true"
      className={classNames(TARGET, isHeld && "cursor-grabbing")}
      style={measures({ x: at[0], y: at[1] })}
      onPointerDown={(event) => onBegin(event, id)}
      onPointerMove={onMove}
      onPointerUp={(event) => onEnd(event, true)}
      onPointerCancel={(event) => onEnd(event, false)}
      onLostPointerCapture={(event) => onEnd(event, false)}
    >
      {children}
    </div>
  );
}

/**
 * The handles of the selected obstacle (plan/phase-05-plan.md, step 19, decision 12; the board "Obstacle
 * edited on the roof"): a handle at each corner of a box's top for its size, the turn handle on a stem due
 * north off its north edge, the height handle on a stem up from the middle of its top; one handle at the
 * edge of a tank or a tree's crown for its diameter; none for a wall or a building. DOM over the stage,
 * placed where the Projector says their points fall (decision 6); a drag of one turns the pointer into a
 * ray through the camera, the maths of lib/scene/handles.ts give the obstacle, the scene draws it as it
 * goes, and the drop commits it as one edit. The handles are away while the obstacle itself is dragged;
 * the live label beside the pointer says what changes. They are for the pointer: the fields of the list do
 * the same by number, which is their way for the keyboard. A wheel over a handle is sent on to the canvas, so
 * that the view zooms under the pointer there as it does beside it (plan/phase-11-plan.md, step 33).
 */
export function Handles({ stage }: Props) {
  const { project: store, view } = useStores();
  const project = useProject(projectOf);
  const selection = useView(selectionOf);
  const dragging = useView(draggingOf);
  const labels = useStore(stage, labelsOf);
  const camera = useStore(stage, cameraOf);
  const canvas = useStore(stage, canvasOf);
  const size = useSize();
  const layer = useRef<HTMLDivElement>(null);
  const held = useRef<HandleId | null>(null);

  const roof = project?.roof;
  const index = selection?.kind === "obstacle" ? selection.index : null;
  const obstacle = roof && index !== null ? roof.obstacles[index] : undefined;
  const places = placesOf(labels, size === "desktop" ? STEM_HEIGHT : STEM_HEIGHT_TOUCH);
  const isMoving = dragging?.by === "move";

  /** The ray of a pointer event through the camera, from where the event is on the canvas. */
  function rayOf(event: PointerEvent): ReturnType<typeof rayAt> | null {
    const box = layer.current?.getBoundingClientRect();
    if (!box || !camera) return null;
    return rayAt(camera.camera, [event.clientX - box.left, event.clientY - box.top], camera.width, camera.height);
  }

  function begin(event: PointerEvent, handle: HandleId) {
    if (!obstacle || index === null || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    held.current = handle;
  }

  function move(event: PointerEvent) {
    const handle = held.current;
    if (!handle || !obstacle || !roof || index === null) return;
    const ray = rayOf(event);
    if (!ray) return;
    const { centroid, heightAt } = frameOf(roof);
    const next = obstacleByHandle(obstacle, handle, ray, { centroid, heightAt });
    view.getState().setDragging({ index, by: BY_OF_HANDLE[handle], obstacle: next, handle });
  }

  function end(event: PointerEvent, isDropped: boolean) {
    if (!held.current) return;
    held.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const dropped = view.getState().dragging;
    if (isDropped && dropped && index !== null) store.getState().commit((design) => withObstacleReplaced(design, index, dropped.obstacle));
    view.getState().setDragging(null);
  }

  /** A wheel a handle took goes on to the canvas as a wheel of its own, which the camera's controls take as the browser's. */
  function sendOn(event: ReactWheelEvent) {
    canvas?.dispatchEvent(new WheelEvent("wheel", wheelInitOf(event.nativeEvent)));
  }

  const live = dragging ? places[labelHandleOf(dragging) as keyof typeof places] : undefined;
  const shown: Obstacle | undefined = obstacle && !isMoving ? obstacle : undefined;

  // The layer takes no pointer itself: a wheel that reaches it came up from a handle.
  return (
    <div ref={layer} onWheel={sendOn} className="pointer-events-none absolute inset-0 z-stage-overlay overflow-hidden contain-layout">
      {shown ? (
        <>
          <svg aria-hidden="true" className="absolute inset-0 size-full overflow-visible">
            {places["turn-foot"] && places.turn ? <Stem from={places["turn-foot"]} to={places.turn} /> : null}
            {places["height-foot"] && places.height ? <Stem from={places["height-foot"]} to={places.height} /> : null}
          </svg>
          {(["corner-0", "corner-1", "corner-2", "corner-3", "edge", "height"] as const).map((id) => {
            const at = places[id];
            return at ? (
              <Handle key={id} id={id} at={at} isHeld={dragging?.handle === id} onBegin={begin} onMove={move} onEnd={end}>
                <span className={CORNER} />
              </Handle>
            ) : null;
          })}
          {places.turn ? (
            <Handle id="turn" at={places.turn} isHeld={dragging?.handle === "turn"} onBegin={begin} onMove={move} onEnd={end}>
              <span className={TURN}>
                <Icon name="turn" size={size === "desktop" ? 16 : 18} />
              </span>
            </Handle>
          ) : null}
        </>
      ) : null}
      {dragging && live ? (
        <code data-testid="stage-live" className={classNames(LIVE, camera && live[0] > camera.width / 2 ? LIVE_LEFT : LIVE_RIGHT)} style={measures({ x: live[0], y: live[1] })}>
          {liveWordsOf(dragging)}
        </code>
      ) : null}
    </div>
  );
}
