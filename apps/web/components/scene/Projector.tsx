"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Vector3 } from "three";
import type { SceneXYZ } from "@/lib/scene/adapter";
import { bearingOf, pixelOf, type LabelKind, type StageLabel } from "@/lib/scene/projection";
import type { StageStore } from "@/lib/scene/stage-store";

/**
 * A label's anchor as the scene holds it: a point in three's metres about the origin of the scene. A
 * handle's point carries a name instead of words, by which the handles over the stage find it.
 */
export type Anchor = { words: string; at: SceneXYZ; kind?: LabelKind; id?: string };

type Props = { anchors: readonly Anchor[]; stage: StageStore };

/**
 * Where each anchor falls on the canvas, in pixels, written by `write` on each drawn frame (the loop is on
 * demand: a frame is drawn when the camera moves or the scene changes). New anchors ask for a frame, so
 * that what they stand for is placed though nothing of the scene changed with them.
 */
export function useProjection(anchors: readonly Anchor[], write: (labels: StageLabel[]) => void): void {
  const point = useMemo(() => new Vector3(), []);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => invalidate(), [anchors, invalidate]);

  useFrame(({ camera, size }) => {
    write(
      anchors.map(({ words, at, kind = "label", id }) => {
        // In front of the camera: nearer than its plane, in its own frame.
        const inFront = point.set(at[0], at[1], at[2]).applyMatrix4(camera.matrixWorldInverse).z < 0;
        point.set(at[0], at[1], at[2]).project(camera);
        const [x, y] = pixelOf([point.x, point.y], size.width, size.height);
        return id === undefined ? { kind, words, x, y, visible: inFront } : { kind, id, words, x, y, visible: inFront };
      }),
    );
  });
}

/**
 * What the camera tells the DOM over the stage, on each drawn frame: where each anchor falls on the
 * canvas, the bearing the camera looks along, and the camera itself with the canvas's size, so that a
 * pointer on the DOM can be turned back into a ray. Written into the stage store, which takes only a change.
 */
export function Projector({ anchors, stage }: Props) {
  const direction = useMemo(() => new Vector3(), []);
  useProjection(anchors, stage.getState().setLabels);

  useFrame(({ camera, size }) => {
    camera.getWorldDirection(direction);
    const from = camera.position;
    const bearingDeg = bearingOf([from.x, from.y, from.z], [from.x + direction.x, from.y + direction.y, from.z + direction.z]);

    const { setBearing, setCamera } = stage.getState();
    setBearing(bearingDeg);
    setCamera(camera, size.width, size.height);
  });

  return null;
}
