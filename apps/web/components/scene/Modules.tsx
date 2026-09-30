"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { BoxGeometry, InstancedMesh, MeshStandardMaterial } from "three";
import type { Layout } from "@/lib/api";
import type { XY } from "@/lib/scene/adapter";
import { moduleMatrixOf, placementOf, type Placement, type Thickness } from "@/lib/scene/modules";
import { PALETTE } from "@/lib/scene-palette";

type Props = {
  layout: Layout;
  heightAt: (point: XY) => number;
  flushClearance: number;
};

/** The frame is the module's body; the glass a thinner sheet stacked over it, inset so that the frame shows around it (r3f-notes, fix 10). */
const FRAME: Thickness = { thickness: 0.035, lift: 0 };
const GLASS: Thickness = { thickness: 0.01, lift: 0.035 / 2 + 0.01 / 2 + 0.008, inset: 0.05 };

const UNIT_BOX = new BoxGeometry(1, 1, 1);

type SetProps = { placements: Placement[]; thickness: Thickness; material: MeshStandardMaterial; castShadow: boolean; receiveShadow: boolean };

/** One instanced mesh for all the positions: the matrices written when the placements change, never per frame (fixes 11 and 12). */
function InstancedSet({ placements, thickness, material, castShadow, receiveShadow }: SetProps) {
  const mesh = useRef<InstancedMesh>(null);
  const capacity = Math.max(1, placements.length);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    placements.forEach((placement, index) => instanced.setMatrixAt(index, moduleMatrixOf(placement, thickness)));
    instanced.count = placements.length;
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [placements, thickness, material]);

  return <instancedMesh ref={mesh} key={capacity} args={[UNIT_BOX, material, capacity]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
}

/**
 * The modules of the layout, instanced (plan step 7): every position as a tilted quad from what /layout
 * answered, the frame casting the shadow and the glass taking it.
 */
export function Modules({ layout, heightAt, flushClearance }: Props) {
  const placements = useMemo(
    () => layout.modules.map((module) => placementOf(module, layout.kind, heightAt, flushClearance)),
    [layout, heightAt, flushClearance],
  );
  const frame = useMemo(() => new MeshStandardMaterial({ color: PALETTE.moduleFrame, roughness: 0.5, metalness: 0.6 }), []);
  const glass = useMemo(() => new MeshStandardMaterial({ color: PALETTE.moduleGlass, roughness: 0.25, metalness: 0.1 }), []);

  return (
    <group>
      <InstancedSet placements={placements} thickness={FRAME} material={frame} castShadow receiveShadow={false} />
      <InstancedSet placements={placements} thickness={GLASS} material={glass} castShadow={false} receiveShadow />
    </group>
  );
}
