"use client";

import { useMemo } from "react";
import { BoxGeometry, MeshStandardMaterial } from "three";
import { toScene } from "@/lib/geometry/adapter";
import { INVERTER_BOX, type InverterMarker } from "@/lib/scene/inverter-markers";
import { PALETTE } from "@/lib/geometry/scene-palette";

/** The box of every marker: three's x is east, its y up and its z south. */
const BOX = new BoxGeometry(INVERTER_BOX.east, INVERTER_BOX.height, INVERTER_BOX.north);

/**
 * The inverters of the chosen option on the roof (plan/phase-07-plan.md, decision 13): a small box in the
 * palette's inverterMarker at each place the engine gives, lit and casting as the obstacles; the chip over it is
 * DOM, placed by the Projector.
 */
export function InverterMarkers({ markers }: { markers: readonly InverterMarker[] }) {
  const material = useMemo(() => new MeshStandardMaterial({ color: PALETTE.inverterMarker, roughness: 0.6, metalness: 0.1 }), []);
  return (
    <group>
      {markers.map(({ label, middle }) => (
        <mesh key={label} geometry={BOX} material={material} position={toScene(middle)} castShadow receiveShadow />
      ))}
    </group>
  );
}
