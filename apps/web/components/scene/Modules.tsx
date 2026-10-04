"use client";

import { Line } from "@react-three/drei";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { BackSide, BoxGeometry, Color, EdgesGeometry, InstancedMesh, MeshStandardMaterial } from "three";
import type { Layout } from "@/lib/api";
import type { XY } from "@/lib/geometry/adapter";
import { toScene } from "@/lib/geometry/adapter";
import { moduleMatrixOf, placementOf, traceLineOf, type Placement, type Thickness } from "@/lib/scene/modules";
import { revealedCountOf } from "@/lib/scene/reveal";
import { glassColoursOf } from "@/lib/scene/shade-colours";
import { PALETTE } from "@/lib/geometry/scene-palette";
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
  /**
   * The colour of every position's glass while the stage colours it: the shade map's steps, or the strings
   * (plan/phase-07-plan.md, step 13); null for the modules' blue.
   */
  glassColours?: readonly string[] | null;
  /**
   * The pointer moved over the modules: the instance of the position nearest under it, null where none is (plan/
   * phase-07-plan.md, decision 13). Only where a string can be traced: a pointer device, the Strings lens.
   */
  onTraceModule?: (instanceId: number | null) => void;
  /** The positions of each string traced or selected, by idx in wired order: a white line through each. */
  traces?: readonly (readonly number[])[];
  /** How far the modules have filled the roof, 0 to 1 (Present's tour, plan/phase-10-plan.md, step 17): the first share of the positions, row by row; all unless said. */
  reveal?: number;
};

/** The frame is the module's body; the glass a thinner sheet stacked over it, inset so that the frame shows around it (r3f-notes, fix 10). */
const FRAME: Thickness = { thickness: 0.035, lift: 0 };
const GLASS: Thickness = { thickness: 0.01, lift: 0.035 / 2 + 0.01 / 2 + 0.008, inset: 0.05 };

const UNIT_BOX = new BoxGeometry(1, 1, 1);

const NO_TRACES: readonly (readonly number[])[] = [];

/** The edges of a unit box: placed by the matrix of the selected module, they are its outline. */
const UNIT_EDGES = new EdgesGeometry(UNIT_BOX);

type Press = Pick<Props, "onPressModule" | "onOverModules" | "onWrite" | "onTraceModule">;

/** The names of the two instanced meshes: the pointer is over a position when the nearest thing it meets is one of them. */
const FRAME_MESH = "modules-frame";
const GLASS_MESH = "modules-glass";
const MODULE_MESHES = new Set([FRAME_MESH, GLASS_MESH]);

// The line through a string traced or selected (the board "Strings on the roof"): 2 px of white on a casing of 4 px
// in the stage's colour at 60 %, so that it reads over the white glass; over everything, as the selection's outline.
const TRACE_WIDTH = 2;
const CASING_WIDTH = 4;
const CASING_OPACITY = 0.6;

type SetProps = Press & {
  placements: Placement[];
  /** How many of the placements are drawn, from the first: the instance count, never the matrices (fix 12). */
  shown: number;
  thickness: Thickness;
  material: MeshStandardMaterial;
  name: string;
  castShadow: boolean;
  receiveShadow: boolean;
  /** A colour per instance, over the material's white: the glass's blue, its step of the shade map or its string's colour. */
  colours?: readonly string[];
};

/** One instanced mesh for all the positions: the matrices written when the placements change, never per frame (fixes 11 and 12). */
function InstancedSet({ placements, shown, thickness, material, name, castShadow, receiveShadow, colours, onPressModule, onOverModules, onWrite, onTraceModule }: SetProps) {
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

  // The count apart from the matrices too: the reveal of Present draws the first so many, and writes nothing.
  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced || instanced.count === shown) return;
    instanced.count = shown;
    invalidate();
  }, [shown, placements, invalidate]);

  // The colours apart from the matrices: the shade map or the strings' colours switched writes them alone.
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
      name={name}
      args={[UNIT_BOX, material, capacity]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      frustumCulled={false}
      onClick={(event) => onPress(event, () => onPressModule?.(event.instanceId, event))}
      onPointerOver={() => onOverModules?.(true)}
      onPointerOut={() => {
        onOverModules?.(false);
        onTraceModule?.(null);
      }}
      // Both meshes hear the move; each tells the position nearest under the pointer, or none when something else is nearer.
      onPointerMove={
        onTraceModule
          ? (event) => {
              const nearest = event.intersections[0];
              onTraceModule(nearest && MODULE_MESHES.has(nearest.object.name) ? (nearest.instanceId ?? null) : null);
            }
          : undefined
      }
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

/** The line through a string traced or selected, in wired order, drawn over what is in front. */
function TraceLine({ points }: { points: ReturnType<typeof traceLineOf> }) {
  const scene = useMemo(() => points.map(toScene), [points]);
  if (scene.length < 2) return null;
  return (
    <>
      <Line points={scene} color={PALETTE.stage} lineWidth={CASING_WIDTH} transparent opacity={CASING_OPACITY} depthTest={false} renderOrder={2} toneMapped={false} />
      <Line points={scene} color={PALETTE.stringSelected} lineWidth={TRACE_WIDTH} depthTest={false} renderOrder={3} toneMapped={false} />
    </>
  );
}

/**
 * The modules of the layout, instanced (plan step 7): every position as a tilted quad from what /layout
 * answered, the frame casting the shadow and the glass taking it. A press on one selects its position;
 * the selected one is outlined (plan step 17).
 */
export function Modules({ layout, heightAt, flushClearance, selected, onPressModule, onOverModules, onWrite, glassColours = null, onTraceModule, traces = NO_TRACES, reveal = 1 }: Props) {
  const placements = useMemo(
    () => layout.modules.map((module) => placementOf(module, layout.kind, heightAt, flushClearance)),
    [layout, heightAt, flushClearance],
  );
  const shown = revealedCountOf(placements.length, reveal);
  const frame = useMemo(() => new MeshStandardMaterial({ color: PALETTE.moduleFrame, roughness: 0.5, metalness: 0.6, shadowSide: BackSide }), []);
  // White: each instance takes its colour, the modules' blue, its step of the shade map or its string's.
  const glass = useMemo(() => new MeshStandardMaterial({ roughness: 0.25, metalness: 0.1 }), []);
  const colours = useMemo(() => glassColoursOf(placements.length, glassColours), [placements.length, glassColours]);
  const chosen = selected === null ? undefined : placements[selected];
  const lines = useMemo(() => {
    const idxs = layout.modules.map((module) => module.idx);
    return traces.map((wired) => traceLineOf(placements, idxs, wired));
  }, [layout, placements, traces]);

  return (
    <group>
      <InstancedSet placements={placements} shown={shown} thickness={FRAME} material={frame} name={FRAME_MESH} castShadow receiveShadow={false} onPressModule={onPressModule} onOverModules={onOverModules} onWrite={onWrite} onTraceModule={onTraceModule} />
      <InstancedSet placements={placements} shown={shown} thickness={GLASS} material={glass} name={GLASS_MESH} castShadow={false} receiveShadow colours={colours} onPressModule={onPressModule} onOverModules={onOverModules} onWrite={onWrite} onTraceModule={onTraceModule} />
      {chosen ? <SelectedOutline placement={chosen} /> : null}
      {lines.map((points, index) => (
        <TraceLine key={index} points={points} />
      ))}
    </group>
  );
}
