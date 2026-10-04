"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { BufferGeometry, CanvasTexture, Float32BufferAttribute, SRGBColorSpace } from "three";
import { FLAT, toScenePoint } from "@/lib/scene/adapter";
import { gridLinesOf, IMAGERY_RADIUS, tilesAround, type Extent } from "@/lib/scene/ground";
import type { StageStore } from "@/lib/scene/stage-store";
import { stitchTiles } from "@/lib/scene/stitch";
import type { Imagery } from "@/lib/places/provider";
import { PALETTE } from "@/lib/scene-palette";
import { onPress } from "./pointer";

type Props = {
  /** The imagery of the map; null without a key, and the ground is the plain colour with the grid. */
  imagery: Imagery | null;
  /** The place of the roof's centroid: the origin of the scene. */
  lat: number;
  lon: number;
  /** The roof's radius about its centroid: what the plain ground is sized by. */
  radius: number;
  /** How far the ground lies under the roof plane; at it unless said. */
  depth?: number;
  /** Where the scene says what ground it drew, for the text equivalent of the stage. */
  stage: StageStore;
  /** A press on the ground: it clears what is selected (plan step 17). */
  onPressGround?: () => void;
};

/** The plain ground is at least this wide, and six times the roof's radius. */
const PLAIN_AT_LEAST = 60;
const PLAIN_TIMES_RADIUS = 6;
/** A grid line every this many metres. */
const GRID_STEP = 10;
/** The plain ground lies this much under the roof plane; the imagery and the grid half as much, over it. */
const PLAIN_BELOW = 0.02;
const IMAGERY_BELOW = 0.01;

const fetchTile = (address: string) => fetch(address, { cache: "force-cache" });

/** The grid as line segments laid on the roof plane, in the engine's metres. */
function gridGeometryOf(size: number, height: number): BufferGeometry {
  const points = gridLinesOf(size, GRID_STEP).flatMap(([a, b]) => [...toScenePoint(a, height), ...toScenePoint(b, height)]);
  return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(points, 3));
}

type PlaneProps = { texture: CanvasTexture; extent: Extent; height: number; onPressGround?: () => void };

/** The ground of the imagery: the whole stitched picture on one plane, laid by its corners in metres. */
function ImageryPlane({ texture, extent, height, onPressGround }: PlaneProps) {
  const centre = toScenePoint([(extent.left + extent.right) / 2, (extent.bottom + extent.top) / 2], height);
  return (
    <mesh position={centre} rotation={FLAT} receiveShadow onClick={(event) => onPress(event, () => onPressGround?.())}>
      <planeGeometry args={[extent.right - extent.left, extent.top - extent.bottom]} />
      <meshStandardMaterial map={texture} roughness={1} />
    </mesh>
  );
}

/**
 * The ground under the roof (plan/phase-05-plan.md, decision 8): the imagery's tiles about the roof's
 * centroid, stitched into one picture tagged sRGB (r3f-notes, fix 15), laid by their corners in the
 * roof's metres. Until they come, and where there is no imagery, the plain ground with its grid; a tile
 * that does not come leaves its square plain. Mounted at the origin of the scene, not in the group that
 * shifts the roof: the tiles are about the centroid already.
 */
export function Ground({ imagery, lat, lon, radius, depth = 0, stage, onPressGround }: Props) {
  const invalidate = useThree((state) => state.invalidate);
  const anisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const [picture, setPicture] = useState<{ texture: CanvasTexture; extent: Extent } | null>(null);
  const plainSize = Math.max(PLAIN_AT_LEAST, radius * PLAIN_TIMES_RADIUS);
  const grid = useMemo(() => gridGeometryOf(plainSize, -depth - IMAGERY_BELOW), [plainSize, depth]);

  useEffect(() => {
    if (!imagery || typeof document === "undefined" || typeof createImageBitmap === "undefined") return;
    let isWanted = true;
    const set = tilesAround(imagery, lat, lon, IMAGERY_RADIUS);
    const canvas = document.createElement("canvas");
    stitchTiles(set, fetchTile, canvas).then(({ drawn, failed }) => {
      if (!isWanted) return;
      if (failed.length > 0) console.warn(`The ground: ${failed.length} of ${set.tiles.length} tiles of the imagery did not come; their squares are plain.`);
      if (drawn === 0) return;
      const texture = new CanvasTexture(canvas);
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = anisotropy;
      setPicture({ texture, extent: set.extent });
    });
    // Another place, or none: the picture goes, and the plain ground stays until the next one comes.
    return () => {
      isWanted = false;
      setPicture(null);
    };
  }, [imagery, lat, lon, anisotropy]);

  // The texture of the moment is let go when another takes its place, and on unmount.
  useEffect(() => {
    stage.getState().setGround(picture ? "imagery" : "plain");
    if (!picture) return;
    invalidate();
    return () => picture.texture.dispose();
  }, [picture, invalidate, stage]);

  useEffect(() => () => grid.dispose(), [grid]);

  return (
    <group>
      <mesh position={[0, -depth - PLAIN_BELOW, 0]} rotation={FLAT} receiveShadow onClick={(event) => onPress(event, () => onPressGround?.())}>
        <planeGeometry args={[plainSize, plainSize]} />
        <meshStandardMaterial color={PALETTE.groundPlain} roughness={1} />
      </mesh>
      {picture ? (
        <ImageryPlane texture={picture.texture} extent={picture.extent} height={-depth - IMAGERY_BELOW} onPressGround={onPressGround} />
      ) : (
        <lineSegments geometry={grid}>
          <lineBasicMaterial color={PALETTE.gridLine} toneMapped={false} />
        </lineSegments>
      )}
    </group>
  );
}
