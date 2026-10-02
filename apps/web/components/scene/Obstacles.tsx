"use client";

import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { BackSide, BoxGeometry, BufferGeometry, CylinderGeometry, EdgesGeometry, ExtrudeGeometry, Float32BufferAttribute, MeshStandardMaterial, Shape, Vector2 } from "three";
import type { Obstacle } from "@/lib/api";
import { FLAT, toScene, toScenePoint, type XY } from "@/lib/scene/adapter";
import { halfSidesOf, movedTo, onTheRoofPlane, type Dragging } from "@/lib/scene/drag";
import type { About } from "@/lib/scene/handles";
import { canBeDragged, footprintOf, ROUND_SEGMENTS, solidsOf, type HeightAt, type Look, type Solid } from "@/lib/scene/obstacles";
import { withObstacleField, type DraftObstacle } from "@/lib/studio/obstacle-fields";
import { PALETTE, type PaletteName } from "@/lib/scene-palette";
import { canHover, onPress } from "./pointer";

type Props = {
  /** The roof's obstacles, in their order in the document: an index into them names one. */
  obstacles: readonly Obstacle[];
  /** The index of the selected obstacle; null for none. */
  selected: number | null;
  /** The names of the obstacles whose height is still to be reviewed: drawn with a dashed outline. */
  toReview: readonly string[];
  onSelect: (index: number) => void;
  /** The pointer came over an obstacle, or left it, by its index. */
  onOver?: (index: number, isOver: boolean) => void;
  /** The frame of the scene and the roof's outline: a drag stays on the roof plane and inside the roof (decision 12). */
  about: About;
  roofOutline: readonly XY[];
  /** The obstacle the pointer drags, as the pointer has it; null while none is. The scene draws it there. */
  dragging: Dragging | null;
  /** The drag as it goes: told on each move, null when it ends. */
  onDrag: (dragging: Dragging | null) => void;
  /** The drop: the obstacle at `index` becomes `obstacle`, one edit. */
  onDrop: (index: number, obstacle: Obstacle) => void;
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
  // The back faces cast (plan/phase-06-plan.md, decision 9): the bias is small, and the lit faces take no acne.
  return new MeshStandardMaterial({ color: PALETTE[name], roughness: ROUGHNESS, shadowSide: BackSide });
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

/** What the controls of the camera are to a drag: on or off. They are the default controls of the scene (CameraRig). */
type Controls = { enabled: boolean } | null;

/** A drag that has begun: where the press met the roof plane, about the origin of the scene, and the plane's height. */
type Press = { from: XY; height: number };

type OneProps = Pick<Props, "onSelect" | "onOver" | "about" | "roofOutline" | "onDrag" | "onDrop"> & {
  obstacle: Obstacle;
  shown: Obstacle;
  index: number;
  isSelected: boolean;
  isToReview: boolean;
  isDragged: boolean;
  unitBox: BoxGeometry;
  materials: Materials;
};

/**
 * One obstacle: its solids, its outline when it is selected, under the pointer, or not yet real; a press
 * selects it. Selected, a press on it begins a drag on the roof plane (decision 12): the pointer is
 * captured, the orbit of the camera is off while the drag lasts, the obstacle follows the pointer snapped
 * and kept inside the roof, and the drop commits it; its old place stays as a dashed ghost meanwhile.
 */
function One({ obstacle, shown, index, isSelected, isToReview, isDragged, onSelect, onOver, about, roofOutline, onDrag, onDrop, unitBox, materials }: OneProps) {
  const [isHovered, setHovered] = useState(false);
  const get = useThree((state) => state.get);
  const press = useRef<Press | null>(null);
  const look: OutlineLook | null = isSelected ? "selected" : isToReview ? "to-review" : isHovered ? "hover" : null;
  const solids = useMemo(() => solidsOf(shown, about.heightAt), [shown, about]);
  const canDrag = isSelected && canBeDragged(obstacle);

  /** The orbit of the camera, off while the drag lasts: the same press must not turn the roof. */
  function orbit(isOn: boolean) {
    const controls = get().controls as Controls;
    if (controls) controls.enabled = isOn;
  }

  function begin(event: ThreeEvent<PointerEvent>) {
    if (!canDrag || event.button !== 0) return;
    const height = about.heightAt([obstacle.x, obstacle.y]);
    const from = onTheRoofPlane(event.ray, height);
    if (!from) return;
    event.stopPropagation();
    (event.target as Element).setPointerCapture(event.pointerId);
    orbit(false);
    press.current = { from, height };
  }

  function move(event: ThreeEvent<PointerEvent>) {
    if (!press.current) return;
    const to = onTheRoofPlane(event.ray, press.current.height);
    if (!to) return;
    const [x, y] = movedTo({ x: obstacle.x, y: obstacle.y, ...halfSidesOf(obstacle) }, { from: press.current.from, to }, roofOutline);
    onDrag({ index, by: "move", obstacle: withObstacleField(withObstacleField(obstacle, "x", x), "y", y) });
  }

  function end(event: ThreeEvent<PointerEvent>, isDropped: boolean) {
    if (!press.current) return;
    press.current = null;
    (event.target as Element).releasePointerCapture(event.pointerId);
    orbit(true);
    if (isDropped && shown !== obstacle) onDrop(index, shown);
    onDrag(null);
  }

  return (
    <group
      userData={{ obstacle: index }}
      onClick={(event) => onPress(event, () => onSelect(index))}
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={(event) => end(event, true)}
      onPointerCancel={(event) => end(event, false)}
      onLostPointerCapture={(event) => end(event, false)}
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
      {isDragged ? <Footprint obstacle={obstacle} heightAt={about.heightAt} /> : null}
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
export function Obstacles({ obstacles, selected, toReview, onSelect, onOver, about, roofOutline, dragging, onDrag, onDrop }: Props) {
  const unitBox = useMemo(() => new BoxGeometry(1, 1, 1), []);
  const materials = useMemo(() => materialsOf(), []);

  return (
    <group>
      {obstacles.map((obstacle, index) =>
        obstacle.auto ? null : (
          <One
            key={index}
            obstacle={obstacle}
            shown={dragging?.index === index ? dragging.obstacle : obstacle}
            index={index}
            isSelected={selected === index}
            isToReview={toReview.includes(obstacle.name)}
            isDragged={dragging?.index === index && dragging.by === "move"}
            onSelect={onSelect}
            onOver={onOver}
            about={about}
            roofOutline={roofOutline}
            onDrag={onDrag}
            onDrop={onDrop}
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
 * The footprint of an obstacle on the roof, dashed, in the accent: a new obstacle before it has a height
 * (decision 15; the draft is of the view, not of the document, so the scene draws it from the view
 * store), and the old place of an obstacle while it is dragged, as its ghost (decision 12).
 */
export function Footprint({ obstacle, heightAt }: { obstacle: Obstacle | DraftObstacle; heightAt: HeightAt }) {
  const geometry = useMemo(() => {
    const { points, closed } = footprintOf(obstacle);
    return segmentsOf(points, closed, heightAt);
  }, [obstacle, heightAt]);
  return (
    <lineSegments geometry={geometry} onUpdate={(line) => line.computeLineDistances()}>
      <lineDashedMaterial color={PALETTE.selection} {...DASH} toneMapped={false} />
    </lineSegments>
  );
}
