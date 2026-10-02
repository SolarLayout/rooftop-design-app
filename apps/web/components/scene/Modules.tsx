"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BackSide, BoxGeometry, Color, EdgesGeometry, InstancedMesh, MeshStandardMaterial } from "three";
import type { Layout } from "@/lib/api";
import type { XY } from "@/lib/scene/adapter";
import { moduleMatrixOf, placementOf, type Placement, type Thickness } from "@/lib/scene/modules";
import { glassColoursOf } from "@/lib/scene/shade-colours";
import { PALETTE } from "@/lib/scene-palette";
import { onPress } from "./pointer";

type Props = {
  layout: Layout;
  heightAt: (point: XY) => number;
  flushClearance: number;
  /** The index of the selected position; null for none. */
  selected: number | null;
  /** A press on a position: the instance of the instanced mesh is the position's index (plan step 17). */
  onPressModule?: (instanceId: number | undefined, event: ThreeEvent<MouseEvent>) => void;
  /** The pointer came over the modules, or left them. Not per module: there are too many. */
  onOverModules?: (isOver: boolean) => void;
  /** Told each time the matrices are written: the counter of development (plan/phase-06-plan.md, decision 6). */
  onWrite?: () => void;
  /** The step of every position in the shade map while it is shown; null for the modules' blue (decision 12). */
  shadeSteps?: readonly number[] | null;
};

/** The frame is the module's body; the glass a thinner sheet stacked over it, inset so that the frame shows around it (r3f-notes, fix 10). */
const FRAME: Thickness = { thickness: 0.035, lift: 0 };
const GLASS: Thickness = { thickness: 0.01, lift: 0.035 / 2 + 0.01 / 2 + 0.008, inset: 0.05 };

const UNIT_BOX = new BoxGeometry(1, 1, 1);

/** The edges of a unit box: placed by the matrix of the selected module, they are its outline. */
const UNIT_EDGES = new EdgesGeometry(UNIT_BOX);

type Press = Pick<Props, "onPressModule" | "onOverModules" | "onWrite">;

type SetProps = Press & {
  placements: Placement[];
  thickness: Thickness;
  material: MeshStandardMaterial;
  castShadow: boolean;
  receiveShadow: boolean;
  /** A colour per instance, over the material's white: the glass's blue or its step of the shade map. */
  colours?: readonly string[];
};

/** One instanced mesh for all the positions: the matrices written when the placements change, never per frame (fixes 11 and 12). */
function InstancedSet({ placements, thickness, material, castShadow, receiveShadow, colours, onPressModule, onOverModules, onWrite }: SetProps) {
  const mesh = useRef<InstancedMesh>(null);
  const capacity = Math.max(1, placements.length);
  const invalidate = useThree((state) => state.invalidate);
  const colour = useMemo(() => new Color(), []);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    placements.forEach((placement, index) => instanced.setMatrixAt(index, moduleMatrixOf(placement, thickness)));
    instanced.count = placements.length;
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
    onWrite?.();
    // The counter is told, never followed: a new one must not write the matrices again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements, thickness, material]);

  // The colours apart from the matrices: the shade map switched on or off writes them alone.
  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced || !colours) return;
    colours.forEach((value, index) => instanced.setColorAt(index, colour.set(value)));
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
    invalidate();
  }, [colours, colour, capacity, invalidate]);

  return (
    <instancedMesh
      ref={mesh}
      key={capacity}
      args={[UNIT_BOX, material, capacity]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      onClick={(event) => onPress(event, () => onPressModule?.(event.instanceId, event))}
      onPointerOver={() => onOverModules?.(true)}
      onPointerOut={() => onOverModules?.(false)}
    />
  );
}

/** The outline of the selected position: the edges of its frame in the accent, drawn over whatever is in front (guidelines.md, "3D scene"). */
function SelectedOutline({ placement }: { placement: Placement }) {
  const matrix = useMemo(() => moduleMatrixOf(placement, FRAME), [placement]);
  return (
    <lineSegments geometry={UNIT_EDGES} matrix={matrix} matrixAutoUpdate={false} renderOrder={1}>
      <lineBasicMaterial color={PALETTE.selection} depthTest={false} toneMapped={false} />
    </lineSegments>
  );
}

/**
 * The modules of the layout, instanced (plan step 7): every position as a tilted quad from what /layout
 * answered, the frame casting the shadow and the glass taking it. A press on one selects its position;
 * the selected one is outlined (plan step 17).
 */
export function Modules({ layout, heightAt, flushClearance, selected, onPressModule, onOverModules, onWrite, shadeSteps = null }: Props) {
  const placements = useMemo(
    () => layout.modules.map((module) => placementOf(module, layout.kind, heightAt, flushClearance)),
    [layout, heightAt, flushClearance],
  );
  const frame = useMemo(() => new MeshStandardMaterial({ color: PALETTE.moduleFrame, roughness: 0.5, metalness: 0.6, shadowSide: BackSide }), []);
  // White: each instance takes its colour, the modules' blue or its step of the shade map.
  const glass = useMemo(() => new MeshStandardMaterial({ roughness: 0.25, metalness: 0.1 }), []);
  const colours = useMemo(() => glassColoursOf(placements.length, shadeSteps), [placements.length, shadeSteps]);
  const chosen = selected === null ? undefined : placements[selected];

  return (
    <group>
      <InstancedSet placements={placements} thickness={FRAME} material={frame} castShadow receiveShadow={false} onPressModule={onPressModule} onOverModules={onOverModules} onWrite={onWrite} />
      <InstancedSet placements={placements} thickness={GLASS} material={glass} castShadow={false} receiveShadow colours={colours} onPressModule={onPressModule} onOverModules={onOverModules} onWrite={onWrite} />
      {chosen ? <SelectedOutline placement={chosen} /> : null}
    </group>
  );
}
