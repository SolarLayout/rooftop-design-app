"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";
import type { SceneXYZ } from "@/lib/scene/adapter";
import { bearingOf, pixelOf, type LabelKind, type StageLabel } from "@/lib/scene/projection";
import type { StageStore } from "@/lib/scene/stage-store";

/** A label's anchor as the scene holds it: a point in three's metres about the origin of the scene. */
export type Anchor = { words: string; at: SceneXYZ; kind?: LabelKind };

type Props = { anchors: readonly Anchor[]; stage: StageStore };

/**
 * What the camera tells the DOM over the stage, on each drawn frame (the loop is on demand: a frame is
 * drawn when the camera moves or the scene changes): where each anchor falls on the canvas, in pixels,
 * and the bearing the camera looks along. Written into the stage store, which takes only a change.
 */
export function Projector({ anchors, stage }: Props) {
  const point = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);

  useFrame(({ camera, size }) => {
    const labels: StageLabel[] = anchors.map(({ words, at, kind = "label" }) => {
      // In front of the camera: nearer than its plane, in its own frame.
      const inFront = point.set(at[0], at[1], at[2]).applyMatrix4(camera.matrixWorldInverse).z < 0;
      point.set(at[0], at[1], at[2]).project(camera);
      const [x, y] = pixelOf([point.x, point.y], size.width, size.height);
      return { kind, words, x, y, visible: inFront };
    });
    camera.getWorldDirection(direction);
    const from = camera.position;
    const bearingDeg = bearingOf([from.x, from.y, from.z], [from.x + direction.x, from.y + direction.y, from.z + direction.z]);

    const { setLabels, setBearing } = stage.getState();
    setLabels(labels);
    setBearing(bearingDeg);
  });

  return null;
}
