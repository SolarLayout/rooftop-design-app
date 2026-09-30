"use client";

import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, Path, Shape, ShapeGeometry } from "three";
import type { Keepout } from "@/lib/api";
import { FLAT, toScenePoint, type XY } from "@/lib/scene/adapter";
import { colourOf, PALETTE } from "@/lib/scene-palette";

type Props = {
  parts: readonly Keepout[];
  heightAt: (point: XY) => number;
  /** The index of the selected part in `parts`; null for none. */
  selected: number | null;
  onSelect: (index: number) => void;
};

/** The overlays are lifted off the roof so that they never fight with it, each part a little more (fix 10). */
const LIFT = 0.02;
const LIFT_STEP = 0.002;

const FILL = colourOf("keepOutFill");

/** A polygon of the API as a shape in the engine's (x, y), with its holes. */
function shapeOf(polygon: Keepout["polygons"][number]): Shape {
  const shape = new Shape(polygon.exterior.map(([x, y]) => ({ x, y }) as never));
  shape.holes = polygon.holes.map((hole) => new Path(hole.map(([x, y]) => ({ x, y }) as never)));
  return shape;
}

/** The exterior of a polygon as a ring of points at the roof's height, lifted, with its distances for the dashes. */
function ringOf(ring: readonly [number, number][], heightAt: (point: XY) => number, lift: number): BufferGeometry {
  const points = ring.flatMap((corner) => toScenePoint(corner, heightAt(corner) + lift));
  const geometry = new BufferGeometry().setAttribute("position", new Float32BufferAttribute(points, 3));
  return geometry;
}

function Part({ part, index, heightAt, isSelected, onSelect }: { part: Keepout; index: number; heightAt: Props["heightAt"]; isSelected: boolean; onSelect: Props["onSelect"] }) {
  const lift = LIFT + index * LIFT_STEP;
  const fills = useMemo(
    () =>
      part.polygons.map((polygon) => {
        const geometry = new ShapeGeometry(shapeOf(polygon));
        const positions = geometry.getAttribute("position");
        for (let n = 0; n < positions.count; n += 1) positions.setZ(n, heightAt([positions.getX(n), positions.getY(n)]) + lift);
        return geometry;
      }),
    [part, heightAt, lift],
  );
  const rings = useMemo(() => part.polygons.flatMap((polygon) => [polygon.exterior, ...polygon.holes].map((ring) => ringOf(ring, heightAt, lift + LIFT_STEP / 2))), [part, heightAt, lift]);

  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(index);
  }

  return (
    <group userData={{ keepout: index }}>
      {fills.map((geometry, n) => (
        <mesh key={n} geometry={geometry} rotation={FLAT} onClick={select}>
          <meshBasicMaterial color={FILL.hex} transparent opacity={isSelected ? Math.min(1, FILL.opacity * 2) : FILL.opacity} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {rings.map((geometry, n) => (
        <lineLoop key={n} geometry={geometry} onUpdate={(line) => line.computeLineDistances()}>
          <lineDashedMaterial color={PALETTE.keepOutLine} dashSize={0.4} gapSize={0.25} toneMapped={false} />
        </lineLoop>
      ))}
    </group>
  );
}

/**
 * The kept-clear areas of the layout (plan step 8): the keep-out told apart by what casts it, each part
 * an overlay on the roof in the accent, dashed; a press selects it and the stage says why it is kept clear.
 */
export function KeepOut({ parts, heightAt, selected, onSelect }: Props) {
  return (
    <group>
      {parts.map((part, index) => (
        <Part key={index} part={part} index={index} heightAt={heightAt} isSelected={selected === index} onSelect={onSelect} />
      ))}
    </group>
  );
}
