"use client";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useView } from "@/components/shell/stores";
import { distanceLimitsOf, nearAndFarOf, presetPositionOf, type Sun } from "@/lib/scene/camera";
import { cameraOf, cameraRequestOf } from "@/lib/stores/view-store";

type Props = {
  /** The roof's radius about the origin of the scene. */
  radius: number;
  sun: Sun | null;
};

/** The pole is clamped this much above the roof plane, in radians: the camera never goes below it. */
const ABOVE_THE_ROOF = 0.03;

/**
 * The camera: an orbit with damping, never below the roof plane, its distances and planes from the roof's
 * radius; the presets of the view store, framed only when one is asked for (r3f-notes, fix 13), so that an
 * edit of the design leaves the view where the user put it.
 */
export function CameraRig({ radius, sun }: Props) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);
  const preset = useView(cameraOf);
  const request = useView(cameraRequestOf);
  const { near, far } = nearAndFarOf(radius);
  const limits = distanceLimitsOf(radius);

  // The presets alone move the camera: the radius and the sun of the moment are read, never followed.
  useEffect(() => {
    const [x, y, z] = presetPositionOf(preset, radius, sun);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, camera, invalidate]);

  return (
    <>
      <PerspectiveCamera makeDefault fov={45} near={near} far={far} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2 - ABOVE_THE_ROOF}
        minDistance={limits.min}
        maxDistance={limits.max}
        target={[0, 0, 0]}
      />
    </>
  );
}
