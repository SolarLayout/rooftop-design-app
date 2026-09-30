"use client";

import { useMemo } from "react";
import { useProject } from "@/components/shell/stores";
import { frameOf } from "@/lib/scene/building";
import { toScene } from "@/lib/scene/adapter";
import { PALETTE } from "@/lib/scene-palette";
import { projectOf } from "@/lib/stores/project-store";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { Building, BUILDING_DEPTH } from "./Building";
import { CameraRig } from "./CameraRig";
import { Ground } from "./Ground";
import { Obstacles } from "./Obstacles";
import { SceneCanvas } from "./SceneCanvas";

type Props = { onContextLost: () => void };

/** Until the sun comes with the design (plan step 6): a light from the south-east, high, without shadows. */
const KEY_LIGHT = [0.5, 0.8, 0.5] as const;

/** The imagery the ground drapes: the same tiles as the map's (decision 8); none without a key. */
const IMAGERY = esriProvider(KEY_OF_THE_APP)?.imagery ?? null;

/**
 * The 3D scene of the Studio: the design that is open, drawn from the stores, about the roof's centroid
 * (plan/phase-05-plan.md, decisions 1 and 2). It is loaded in the browser alone.
 */
export function Scene({ onContextLost }: Props) {
  const project = useProject(projectOf);
  const roof = project?.roof ?? null;
  const frame = useMemo(() => (roof ? frameOf(roof) : null), [roof]);

  if (!roof || !frame) return null;
  const [ox, oy, oz] = toScene([-frame.centroid[0], -frame.centroid[1], 0]);

  return (
    <SceneCanvas onContextLost={onContextLost}>
      <CameraRig radius={frame.radius} sun={null} />
      <hemisphereLight args={[PALETTE.lightSky, PALETTE.lightGround, 0.9]} />
      <directionalLight position={[KEY_LIGHT[0] * frame.radius, KEY_LIGHT[1] * frame.radius, KEY_LIGHT[2] * frame.radius]} intensity={1.6} color={PALETTE.lightSun} />
      <group position={[ox, oy, oz]}>
        <Building roof={roof} />
        <Obstacles obstacles={roof.obstacles} heightAt={frame.heightAt} />
      </group>
      <Ground imagery={IMAGERY} lat={roof.lat} lon={roof.lon} radius={frame.radius} depth={BUILDING_DEPTH} />
    </SceneCanvas>
  );
}
