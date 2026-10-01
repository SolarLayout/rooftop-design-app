"use client";

import { useMemo, useState } from "react";
import { BoxGeometry, BufferGeometry, CylinderGeometry, EdgesGeometry, ExtrudeGeometry, Float32BufferAttribute, MeshStandardMaterial, Shape, Vector2 } from "three";
import type { Obstacle } from "@/lib/api";
import { FLAT, toScene, toScenePoint, type XY } from "@/lib/scene/adapter";
import { footprintOf, ROUND_SEGMENTS, solidsOf, type HeightAt, type Look, type Solid } from "@/lib/scene/obstacles";
import type { DraftObstacle } from "@/lib/studio/obstacle-fields";
import { PALETTE, type PaletteName } from "@/lib/scene-palette";
import { canHover, onPress } from "./pointer";

type Props = {
  /** The roof's obstacles, in their order in the document: an index into them names one. */
  obstacles: readonly Obstacle[];
  /** The height of the roof surface at a point of the plan, from the frame of the scene. */
  heightAt: HeightAt;
  /** The index of the selected obstacle; null for none. */
  selected: number | null;
  /** The names of the obstacles whose height is still to be reviewed: drawn with a dashed outline. */
  toReview: readonly string[];
  onSelect: (index: number) => void;
  /** The pointer came over an obstacle, or left it, by its index. */
  onOver?: (index: number, isOver: boolean) => void;
};

const ROUGHNESS = 0.9;

/** An outline stands this much off the faces it follows, so that they never cut it. */
const OUTLINE_OFF = 0.02;

/** Faces of a cylinder that meet at less than this many degrees share no edge of the outline: its side stays smooth. */
const SMOOTH_WITHIN = 20;

/** How the dashes of an outline that is not yet real are drawn. */
const DASH = { dashSize: 0.4, gapSize: 0.25 };

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

type Placed = { position: [number, number, number]; rotation: [number, number, number] };

/** Where a solid stands and how it is turned, in the metres of the scene. */
function placeOf(solid: Solid): Placed {
  if (solid.kind === "box") {
    const { x, y, height, rotationDeg, zBottom = 0 } = solid.box;
    return { position: toScene([x, y, zBottom + height / 2]), rotation: [0, (rotationDeg * Math.PI) / 180, 0] };
  }
  if (solid.kind === "cylinder") return { position: toScene([solid.x, solid.y, solid.zBottom + solid.height / 2]), rotation: [0, 0, 0] };
  return { position: toScene([0, 0, solid.zBottom]), rotation: [FLAT.x, FLAT.y, FLAT.z] };
}

/** The edges of a solid, a hair outside it, in the metres of the scene. */
function edgesOf(solid: Solid): EdgesGeometry {
  if (solid.kind === "box") {
    const { length, height, width } = solid.box;
    return new EdgesGeometry(new BoxGeometry(length + OUTLINE_OFF, height + OUTLINE_OFF, width + OUTLINE_OFF));
  }
  if (solid.kind === "cylinder") {
    const radius = solid.radius + OUTLINE_OFF / 2;
    return new EdgesGeometry(new CylinderGeometry(radius, radius, solid.height + OUTLINE_OFF, ROUND_SEGMENTS), SMOOTH_WITHIN);
  }
  const shape = new Shape(solid.points.map(([x, y]) => new Vector2(x, y)));
  return new EdgesGeometry(new ExtrudeGeometry(shape, { depth: solid.height + OUTLINE_OFF, bevelEnabled: false }));
}

/** What a solid's outline says: the accent of a selection, the lighter accent under the pointer, dashed where the height is not yet real. */
type OutlineLook = "selected" | "hover" | "to-review";

/** The outline of one solid: its edges in the accent, where the solid itself stands. */
function Outline({ solid, look }: { solid: Solid; look: OutlineLook }) {
  const geometry = useMemo(() => edgesOf(solid), [solid]);
  const colour = look === "hover" ? PALETTE.hover : PALETTE.selection;
  const { position, rotation } = placeOf(solid);
  // A prism's outline is a hair deeper than the prism, so that it stands off the top and the bottom alike.
  const lifted: [number, number, number] = solid.kind === "prism" ? [position[0], position[1] - OUTLINE_OFF / 2, position[2]] : position;
  return (
    <lineSegments geometry={geometry} position={lifted} rotation={rotation} onUpdate={(line) => line.computeLineDistances()}>
      {look === "to-review" ? <lineDashedMaterial color={colour} {...DASH} toneMapped={false} /> : <lineBasicMaterial color={colour} toneMapped={false} />}
    </lineSegments>
  );
}

type SolidProps = { solid: Solid; unitBox: BoxGeometry; materials: Materials };

/** One solid of an obstacle: a unit box placed by its size, turn and place; a cylinder; a prism laid flat and lifted. */
function SolidMesh({ solid, unitBox, materials }: SolidProps) {
  const geometry = useMemo(() => {
    if (solid.kind === "box") return unitBox;
    if (solid.kind === "cylinder") return new CylinderGeometry(solid.radius, solid.radius, solid.height, ROUND_SEGMENTS);
    const shape = new Shape(solid.points.map(([x, y]) => new Vector2(x, y)));
    return new ExtrudeGeometry(shape, { depth: solid.height, bevelEnabled: false });
  }, [solid, unitBox]);
  const { position, rotation } = placeOf(solid);

  if (solid.kind === "box") {
    const { length, width, height } = solid.box;
    return <mesh geometry={geometry} material={boxMaterialsOf(materials)} position={position} rotation={rotation} scale={[length, height, width]} castShadow receiveShadow />;
  }
  if (solid.kind === "cylinder") {
    return <mesh geometry={geometry} material={cylinderMaterialsOf(solid.look, materials)} position={position} castShadow receiveShadow />;
  }
  return <mesh geometry={geometry} material={[materials.top, materials.lit]} rotation={rotation} position={position} castShadow receiveShadow />;
}

type OneProps = { solids: Solid[]; index: number; isSelected: boolean; isToReview: boolean; onSelect: Props["onSelect"]; onOver: Props["onOver"]; unitBox: BoxGeometry; materials: Materials };

/** One obstacle: its solids, its outline when it is selected, under the pointer, or not yet real; a press selects it. */
function One({ solids, index, isSelected, isToReview, onSelect, onOver, unitBox, materials }: OneProps) {
  const [isHovered, setHovered] = useState(false);
  const look: OutlineLook | null = isSelected ? "selected" : isToReview ? "to-review" : isHovered ? "hover" : null;

  return (
    <group
      userData={{ obstacle: index }}
      onClick={(event) => onPress(event, () => onSelect(index))}
      onPointerOver={(event) => {
        event.stopPropagation();
        onOver?.(index, true);
        if (canHover()) setHovered(true);
      }}
      onPointerOut={() => {
        onOver?.(index, false);
        setHovered(false);
      }}
    >
      {solids.map((solid, n) => (
        <SolidMesh key={n} solid={solid} unitBox={unitBox} materials={materials} />
      ))}
      {look ? solids.map((solid, n) => <Outline key={`outline-${n}`} solid={solid} look={look} />) : null}
    </group>
  );
}

/**
 * The obstacles on the roof (plan/phase-05-plan.md, steps 3 and 12): every solid of each one, in the colours
 * of the palette, casting and taking shadows. The selected one has an accent outline, the one under the
 * pointer a lighter one, one whose height is to be reviewed a dashed one; a press on one selects it
 * (decision 10). What the engine added itself is not drawn: the building draws the parapet.
 */
export function Obstacles({ obstacles, heightAt, selected, toReview, onSelect, onOver }: Props) {
  const solids = useMemo(() => obstacles.map((obstacle) => solidsOf(obstacle, heightAt)), [obstacles, heightAt]);
  const unitBox = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const materials = useMemo(() => materialsOf(), []);

  return (
    <group>
      {solids.map((ofObstacle, index) =>
        ofObstacle.length === 0 ? null : (
          <One
            key={index}
            solids={ofObstacle}
            index={index}
            isSelected={selected === index}
            isToReview={toReview.includes(obstacles[index].name)}
            onSelect={onSelect}
            onOver={onOver}
            unitBox={unitBox}
            materials={materials}
          />
        ),
      )}
    </group>
  );
}

/** The footprint stands this much off the roof, as the kept-clear overlays do. */
const FOOTPRINT_LIFT = 0.03;

/** The segments of a polyline, each from a point to the next, around the end when it is closed. */
function segmentsOf(points: readonly XY[], closed: boolean, heightAt: HeightAt): BufferGeometry {
  const last = closed ? points.length : points.length - 1;
  const at = (point: XY) => toScenePoint(point, heightAt(point) + FOOTPRINT_LIFT);
  const vertices = Array.from({ length: Math.max(0, last) }, (_, n) => [...at(points[n]), ...at(points[(n + 1) % points.length])]).flat();
  return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(vertices, 3));
}

/**
 * A new obstacle before it has a height (decision 15): its footprint on the roof, dashed, in the accent. The
 * draft is of the view, not of the document, so the scene draws it from the view store.
 */
export function Draft({ draft, heightAt }: { draft: DraftObstacle; heightAt: HeightAt }) {
  const geometry = useMemo(() => {
    const { points, closed } = footprintOf(draft);
    return segmentsOf(points, closed, heightAt);
  }, [draft, heightAt]);
  return (
    <lineSegments geometry={geometry} onUpdate={(line) => line.computeLineDistances()}>
      <lineDashedMaterial color={PALETTE.selection} {...DASH} toneMapped={false} />
    </lineSegments>
  );
}
