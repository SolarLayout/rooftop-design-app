"use client";

import { useLayoutEffect, useRef } from "react";
import { DirectionalLight } from "three";
import { sunDirectionOf, type Sun } from "@/lib/scene/camera";
import { fadeOf, intensitiesOf, shadowBiasOf } from "@/lib/scene/sun-light";
import { PALETTE } from "@/lib/scene-palette";
import { useSun } from "./use-sun";

type Props = {
  /** The roof's radius about the origin: what the shadow camera is fitted to, once (fix 6). */
  radius: number;
};

/** The shadow map's side: 2048 draws well on a mid laptop and in software WebGL (plan decision 19). */
const SHADOW_MAP = 2048;

/** Until the sun comes: a light from the south-east, high, without shadows. */
const BEFORE_THE_SUN: Sun = { elevationDeg: 55, azimuthDeg: 135 };

/**
 * The sun light of the scene (plan step 6): along the sun's direction from the API, its shadow camera
 * fitted to the roof's sphere, the bias scaled with the sun's height, faded out at the horizon.
 */
export function SunLight({ radius }: Props) {
  // Where the sun stands at the view's hour; null while its day has not come, and the roof is lit without shadows.
  const sun = useSun();
  const light = useRef<DirectionalLight>(null);
  const at = sun ?? BEFORE_THE_SUN;
  const distance = radius * 2.2;
  const [dx, dy, dz] = sunDirectionOf(at);
  const { sun: sunIntensity, ambient } = intensitiesOf(at.elevationDeg);
  const castsShadow = sun !== null && fadeOf(at.elevationDeg) > 0;

  useLayoutEffect(() => {
    const directional = light.current;
    if (!directional) return;
    const half = radius * 1.1;
    const camera = directional.shadow.camera;
    camera.left = -half;
    camera.right = half;
    camera.top = half;
    camera.bottom = -half;
    camera.near = Math.max(0.1, distance - radius * 1.2);
    camera.far = distance + radius * 1.2;
    camera.updateProjectionMatrix();
    directional.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP);
    const { bias, normalBias } = shadowBiasOf(at.elevationDeg, radius, SHADOW_MAP);
    directional.shadow.bias = bias;
    directional.shadow.normalBias = normalBias;
    directional.shadow.needsUpdate = true;
  }, [radius, distance, at.elevationDeg]);

  return (
    <>
      <hemisphereLight args={[PALETTE.lightSky, PALETTE.lightGround, ambient]} />
      <directionalLight ref={light} position={[dx * distance, Math.max(0.001, dy) * distance, dz * distance]} intensity={sunIntensity} color={PALETTE.lightSun} castShadow={castsShadow} />
    </>
  );
}
