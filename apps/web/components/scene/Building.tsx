"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { BackSide, BufferGeometry, DoubleSide, Float32BufferAttribute, Shape, ShapeGeometry } from "three";
import { FLAT, toScene, toScenePoint, type XY } from "@/lib/geometry/adapter";
import { frameOf, parapetWallsOf, wallOf, type RoofOfTheScene } from "@/lib/scene/building";
import { liftOf, risenScaleOf } from "@/lib/scene/reveal";
import { PALETTE } from "@/lib/geometry/scene-palette";
import { onPress } from "./pointer";

/** How far the building goes down under the roof: the design does not say, so every building is this deep. */
export const BUILDING_DEPTH = 6;

/** The roof's edge line stands this much above the surface, so that it is not cut by it. */
const LINE_LIFT = 0.01;

type Props = {
  roof: RoofOfTheScene;
  /** A press on the roof surface, with where it hit (plan step 17). */
  onPressRoof?: (event: ThreeEvent<MouseEvent>) => void;
  /** How far the building has risen from the ground, 0 to 1 (Present's tour, plan/phase-10-plan.md, step 17); whole unless said. */
  reveal?: number;
};

/** The roof surface as a shape in the engine's (x, y), each corner lifted to the roof's height there. */
function roofGeometryOf(roof: RoofOfTheScene): ShapeGeometry {
  const { heightAt } = frameOf(roof);
  const shape = new Shape(roof.outline.map(([x, y]) => ({ x, y }) as never));
  const geometry = new ShapeGeometry(shape);
  const positions = geometry.getAttribute("position");
  for (let index = 0; index < positions.count; index += 1) {
    positions.setZ(index, heightAt([positions.getX(index), positions.getY(index)]));
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** The walls of the building: one quad under each edge, from the ground to the roof's edge. */
function wallsGeometryOf(roof: RoofOfTheScene): BufferGeometry {
  const vertices: number[] = [];
  roof.outline.forEach((_, index) => {
    const [a, b, c, d] = wallOf(roof, index, BUILDING_DEPTH).map(toScene);
    vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** The line along the roof's edge, corner by corner, lifted off the surface. */
function edgeOf(roof: RoofOfTheScene): BufferGeometry {
  const { heightAt } = frameOf(roof);
  const points = roof.outline.flatMap((corner: XY) => toScenePoint(corner, heightAt(corner) + LINE_LIFT));
  return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(points, 3));
}

/**
 * The building: its roof surface, its walls down to the ground, its parapet (plan decision 3 for a pitch).
 * A press on the surface selects the roof; the walls and the parapet take no press (components.md,
 * "Obstacles on the roof"). While Present reveals it, its height is scaled from the ground up to its own,
 * the roof plane rising with it: a transform of the group, never new geometry.
 */
export function Building({ roof, onPressRoof, reveal = 1 }: Props) {
  const surface = useMemo(() => roofGeometryOf(roof), [roof]);
  const walls = useMemo(() => wallsGeometryOf(roof), [roof]);
  const edge = useMemo(() => edgeOf(roof), [roof]);
  const parapet = useMemo(() => parapetWallsOf(roof), [roof]);

  return (
    <group position={[0, liftOf(reveal, BUILDING_DEPTH), 0]} scale={[1, risenScaleOf(reveal), 1]}>
      <mesh
        geometry={surface}
        rotation={FLAT}
        receiveShadow
        onClick={(event) => onPress(event, () => onPressRoof?.(event))}
      >
        <meshStandardMaterial color={PALETTE.roof} roughness={0.95} side={DoubleSide} />
      </mesh>
      <mesh geometry={walls} castShadow>
        <meshStandardMaterial color={PALETTE.wallLit} roughness={0.9} side={DoubleSide} shadowSide={BackSide} />
      </mesh>
      <lineLoop geometry={edge}>
        <lineBasicMaterial color={PALETTE.roofEdge} toneMapped={false} />
      </lineLoop>
      {parapet.map((wall, index) => (
        <mesh
          key={index}
          position={toScene([wall.x, wall.y, (wall.zBottom ?? 0) + wall.height / 2])}
          rotation={[0, (wall.rotationDeg * Math.PI) / 180, 0]}
          scale={[wall.length, wall.height, wall.width]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={PALETTE.parapetLit} roughness={0.9} shadowSide={BackSide} />
        </mesh>
      ))}
    </group>
  );
}
