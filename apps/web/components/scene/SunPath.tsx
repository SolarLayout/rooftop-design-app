"use client";

import { Line } from "@react-three/drei";
import { memo, useEffect, useMemo } from "react";
import { useProject, useResults, useView } from "@/components/shell/stores";
import { useSize } from "@/components/studio/use-size";
import { toScene, type XY, type XYZ } from "@/lib/scene/adapter";
import { hourMarksOf, marksShownOf, type HourMark } from "@/lib/scene/sun-marks";
import { arcOf, markerOf } from "@/lib/scene/sun-path";
import type { StageStore } from "@/lib/scene/stage-store";
import { PALETTE } from "@/lib/scene-palette";
import { projectOf } from "@/lib/stores/project-store";
import { sunDayOf, type SunDay } from "@/lib/stores/results-store";
import { draftOf, onTheRoofOf, selectionOf, sunTimeOf } from "@/lib/stores/view-store";
import { useProjection, type Anchor } from "./Projector";

type Props = {
  /** The roof's centroid, in the engine's metres: the dome stands about it, and the scene about it too. */
  centre: XY;
  /** The roof's radius about the centroid: the dome is 1.3 times it. */
  radius: number;
  stage: StageStore;
};

// The widths of the lines in pixels, as the board draws them: the day's arc, and the shade-free window's
// part thicker; thinner on phone.
const DAY_WIDTH = { phone: 1.5, wider: 2 };
const WINDOW_WIDTH = { phone: 4, wider: 5 };

type Window = { from: number; to: number };

/**
 * The sun path over the roof (plan/phase-06-plan.md, decision 10): the day's arc in the palette's `sun`, the
 * shade-free window's part thicker while its switch is on, never lit nor shadowed; the marker at the view's
 * hour and the hour marks as DOM over the stage, placed by projection. The arc is of the day alone: the
 * hour re-renders the marker's anchors and nothing else.
 */
export function SunPath({ centre, radius, stage }: Props) {
  const day = useResults(sunDayOf);
  const project = useProject(projectOf);
  const { window: isWindowThick } = useView(onTheRoofOf);
  const size = useSize();
  const from = project?.array.window_start_h ?? null;
  const to = project?.array.window_end_h ?? null;
  const window = useMemo<Window | null>(() => (from === null || to === null ? null : { from, to }), [from, to]);
  if (!day || !window) return null;
  const widths = size === "phone" ? "phone" : "wider";

  return (
    <>
      <Arc day={day} window={window} centre={centre} radius={radius} dayWidth={DAY_WIDTH[widths]} windowWidth={isWindowThick ? WINDOW_WIDTH[widths] : null} />
      <SunAnchors day={day} window={window} centre={centre} radius={radius} stage={stage} />
    </>
  );
}

type ArcProps = { day: SunDay; window: Window; centre: XY; radius: number; dayWidth: number; windowWidth: number | null };

/** The points of the engine as three's, about the roof's centroid as the rest of the scene. */
function aboutTheCentre(points: readonly XYZ[], [cx, cy]: XY) {
  return points.map(([x, y, z]) => toScene([x - cx, y - cy, z]));
}

/** The arc and the window's part: memoised on the day, so that the time never rebuilds them (fix 12). */
const Arc = memo(function Arc({ day, window, centre, radius, dayWidth, windowWidth }: ArcProps) {
  const points = useMemo(() => {
    const arc = arcOf(day, window, centre, radius);
    return { day: aboutTheCentre(arc.day, centre), window: aboutTheCentre(arc.window, centre) };
  }, [day, window, centre, radius]);

  return (
    <>
      {points.day.length > 1 ? <Line points={points.day} color={PALETTE.sun} lineWidth={dayWidth} toneMapped={false} castShadow={false} receiveShadow={false} /> : null}
      {windowWidth !== null && points.window.length > 1 ? (
        <Line points={points.window} color={PALETTE.sun} lineWidth={windowWidth} toneMapped={false} castShadow={false} receiveShadow={false} />
      ) : null}
    </>
  );
});

type AnchorsProps = { day: SunDay; window: Window; centre: XY; radius: number; stage: StageStore };

/**
 * Where the marker and the hour marks stand, projected for the DOM over the stage. It alone reads the hour.
 * The mark at the marker's hour gives way to the marker's callout, which stands while nothing is selected.
 */
function SunAnchors({ day, window, centre, radius, stage }: AnchorsProps) {
  const { hour } = useView(sunTimeOf);
  const selection = useView(selectionOf);
  const draft = useView(draftOf);
  const marks = useMemo(() => hourMarksOf(day, window, centre, radius), [day, window, centre, radius]);
  const marker = useMemo(() => markerOf(day, hour, centre, radius), [day, hour, centre, radius]);
  const isCalloutShown = marker !== null && selection === null && draft === null;

  const anchors = useMemo<Anchor[]>(() => {
    const [cx, cy] = centre;
    const about = ([x, y, z]: XYZ) => toScene([x - cx, y - cy, z]);
    const hours = marksShownOf(marks, hour, isCalloutShown).map(({ role, words, at }: HourMark): Anchor => ({ kind: "hour", id: role, words, at: about(at) }));
    return marker ? [{ kind: "sun", words: "", at: about(marker) }, ...hours] : hours;
  }, [marks, marker, hour, isCalloutShown, centre]);

  useProjection(anchors, stage.getState().setSunLabels);
  // The path taken away takes its marks with it.
  useEffect(() => () => stage.getState().setSunLabels([]), [stage]);

  return null;
}
