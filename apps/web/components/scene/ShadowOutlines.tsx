"use client";

import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { useResults, useView } from "@/components/shell/stores";
import { toScene, type XY } from "@/lib/geometry/adapter";
import { ringsOf } from "@/lib/scene/shadow-outlines";
import { PALETTE } from "@/lib/geometry/scene-palette";
import { shadowOutlinesOf } from "@/lib/stores/results-store";
import { isSunViewOf, onTheRoofOf } from "@/lib/stores/view-store";

type Props = { heightAt: (point: XY) => number };

/**
 * The engine's shadows of the parapet and the obstacles on the roof surface, dashed in the line of the
 * kept-clear areas and without a fill, on the roof under the modules and over the rendered shadows
 * (plan/phase-06-plan.md, decision 9): where the two agree, the view is true. In the Sun view, while their
 * switch is on and they are of the time shown. It reads them itself, so that they redraw it and not the scene.
 */
export function ShadowOutlines({ heightAt }: Props) {
  const outlines = useResults(shadowOutlinesOf);
  const isOn = useView(onTheRoofOf).shadowOutlines;
  const isSunLens = useView(isSunViewOf);
  const rings = useMemo(
    () =>
      (outlines ? ringsOf(outlines.polygons, heightAt) : []).map((ring) =>
        new BufferGeometry().setAttribute("position", new Float32BufferAttribute(ring.flatMap((point) => toScene(point)), 3)),
      ),
    [outlines, heightAt],
  );
  if (!isOn || !isSunLens) return null;

  return (
    <group>
      {rings.map((geometry, index) => (
        <lineLoop key={index} geometry={geometry} onUpdate={(line) => line.computeLineDistances()}>
          <lineDashedMaterial color={PALETTE.keepOutLine} dashSize={0.5} gapSize={0.3} toneMapped={false} />
        </lineLoop>
      ))}
    </group>
  );
}
