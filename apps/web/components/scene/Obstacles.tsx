"use client";

import { useMemo } from "react";
import { BoxGeometry, CylinderGeometry, ExtrudeGeometry, MeshStandardMaterial, Shape, Vector2 } from "three";
import type { Obstacle } from "@/lib/api";
import { FLAT, toScene } from "@/lib/scene/adapter";
import { solidsOf, type HeightAt, type Look, type Solid } from "@/lib/scene/obstacles";
import { PALETTE, type PaletteName } from "@/lib/scene-palette";

type Props = {
  /** The roof's obstacles, in their order in the document: an index into them names one. */
  obstacles: readonly Obstacle[];
  /** The height of the roof surface at a point of the plan, from the frame of the scene. */
  heightAt: HeightAt;
};

/** A cylinder's side is this many flat faces, as the engine's discs are. */
const CYLINDER_SEGMENTS = 24;

const ROUGHNESS = 0.9;

type Materials = Record<"top" | "lit" | "trunk" | "crown", MeshStandardMaterial>;

function materialOf(name: PaletteName): MeshStandardMaterial {
  return new MeshStandardMaterial({ color: PALETTE[name], roughness: ROUGHNESS });
}

/**
 * The materials of the obstacles, one per colour: a box's faces in three's order (+x, −x, +y the top, −y,
 * +z, −z); a cylinder's side, top and bottom; a prism's caps and sides; a tree's two parts.
 */
function materialsOf(): Materials {
  return { top: materialOf("obstacleTop"), lit: materialOf("obstacleLit"), trunk: materialOf("treeTrunk"), crown: materialOf("treeCrown") };
}

function boxMaterialsOf({ top, lit }: Materials): MeshStandardMaterial[] {
  return [lit, lit, top, lit, lit, lit];
}

function cylinderMaterialsOf(look: Look, materials: Materials): MeshStandardMaterial[] {
  if (look === "trunk") return [materials.trunk, materials.trunk, materials.trunk];
  if (look === "crown") return [materials.crown, materials.crown, materials.crown];
  return [materials.lit, materials.top, materials.lit];
}

type SolidProps = { solid: Solid; unitBox: BoxGeometry; materials: Materials };

/** One solid of an obstacle: a unit box placed by its size, turn and place; a cylinder; a prism laid flat and lifted. */
function SolidMesh({ solid, unitBox, materials }: SolidProps) {
  const geometry = useMemo(() => {
    if (solid.kind === "box") return unitBox;
    if (solid.kind === "cylinder") return new CylinderGeometry(solid.radius, solid.radius, solid.height, CYLINDER_SEGMENTS);
    const shape = new Shape(solid.points.map(([x, y]) => new Vector2(x, y)));
    return new ExtrudeGeometry(shape, { depth: solid.height, bevelEnabled: false });
  }, [solid, unitBox]);

  if (solid.kind === "box") {
    const { x, y, length, width, height, rotationDeg, zBottom = 0 } = solid.box;
    return (
      <mesh
        geometry={geometry}
        material={boxMaterialsOf(materials)}
        position={toScene([x, y, zBottom + height / 2])}
        rotation={[0, (rotationDeg * Math.PI) / 180, 0]}
        scale={[length, height, width]}
        castShadow
        receiveShadow
      />
    );
  }
  if (solid.kind === "cylinder") {
    return (
      <mesh
        geometry={geometry}
        material={cylinderMaterialsOf(solid.look, materials)}
        position={toScene([solid.x, solid.y, solid.zBottom + solid.height / 2])}
        castShadow
        receiveShadow
      />
    );
  }
  return (
    <mesh geometry={geometry} material={[materials.top, materials.lit]} rotation={FLAT} position={toScene([0, 0, solid.zBottom])} castShadow receiveShadow />
  );
}

/**
 * The obstacles on the roof (plan/phase-05-plan.md, step 3): every solid of each one, in the colours of
 * the palette, casting and taking shadows. Each obstacle's group carries its index in the document, for
 * the selection of a later step. What the engine added itself is not drawn: the building draws the parapet.
 */
export function Obstacles({ obstacles, heightAt }: Props) {
  const solids = useMemo(() => obstacles.map((obstacle) => solidsOf(obstacle, heightAt)), [obstacles, heightAt]);
  const unitBox = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const materials = useMemo(() => materialsOf(), []);

  return (
    <group>
      {solids.map((ofObstacle, index) =>
        ofObstacle.length === 0 ? null : (
          <group key={index} userData={{ obstacle: index }}>
            {ofObstacle.map((solid, n) => (
              <SolidMesh key={n} solid={solid} unitBox={unitBox} materials={materials} />
            ))}
          </group>
        ),
      )}
    </group>
  );
}
