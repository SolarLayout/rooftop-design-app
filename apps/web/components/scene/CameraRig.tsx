"use client";

import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ComponentRef } from "react";
import { OrthographicCamera as Orthographic, TOUCH, Vector3 } from "three";
import { useView } from "@/components/shell/stores";
import type { SceneXYZ } from "@/lib/geometry/adapter";
import { distanceLimitsOf, framedRadiusOf, nearAndFarOf, planZoomOf, presetPositionOf, zoomLimitsOf } from "@/lib/scene/camera";
import { ABOVE_THE_ROOF, easeInOut, isSettled, offTheZenith, pathAt, settleShareOf } from "@/lib/scene/camera-move";
import { cameraFromOf, cameraMoveOf, cameraOf, cameraRequestOf, northRequestOf, framesTheDomeOf } from "@/lib/stores/view-store";
import { useSun } from "./use-sun";

type Props = {
  /** The roof's radius about the origin of the scene. */
  radius: number;
  /** The view is dragged by the pointer (turned, panned or zoomed), or let go: the stage's cursor closes its hand (D79). */
  onDrag?: (isDragged: boolean) => void;
};

/** A move between two stands under way (plan/phase-10-plan.md, decision 10): its ends, its length and how far it has gone, in seconds. */
type Move = { from: SceneXYZ; to: SceneXYZ; over: number; elapsed: number };

/** In 3D one finger orbits, two pan and pinch; in the plan, which does not turn, one finger pans. */
const TOUCH_IN_3D = { ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN };
const TOUCH_IN_PLAN = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN };

/** The plan looks straight down with north at the top of the canvas: its up is north, which is minus z. */
const NORTH_UP: [number, number, number] = [0, 0, -1];

/** The plan's camera sized to the roof: its zoom is pixels per metre. */
function fitPlan(camera: Orthographic, zoom: number): void {
  camera.zoom = zoom;
  camera.updateProjectionMatrix();
}

/**
 * The camera: an orbit with damping, never below the roof plane, its distances and planes from the roof's
 * radius; the presets of the view store, framed only when one is asked for (r3f-notes, fix 13), so that an
 * edit of the design leaves the view where the user put it. Plan is an orthographic camera straight down,
 * north up, that pans and zooms but does not turn (decision 17). The north control turns the orbit so
 * that the camera stands south of what it looks at, keeping its distance and its height. A preset asked for
 * with a time to take (Present's tour, plan/phase-10-plan.md, decision 10) is reached along a path from the
 * preset before, eased, the camera chasing it in the frame loop with a time constant; the Studio's presets
 * stay cuts. What the presets frame is the roof; in the Sun lens with the sun path on it is the path's dome,
 * so that the sun's marker stays on the canvas through the day (plan/phase-11-plan.md, step 33), and the
 * camera frames again, as a cut, when the path comes or goes.
 */
export function CameraRig({ radius, onDrag }: Props) {
  const sun = useSun();
  const framed = framedRadiusOf(radius, useView(framesTheDomeOf));
  const camera = useThree((state) => state.camera);
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);
  const preset = useView(cameraOf);
  const request = useView(cameraRequestOf);
  const fromPreset = useView(cameraFromOf);
  const over = useView(cameraMoveOf);
  const northRequest = useView(northRequestOf);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const move = useRef<Move | null>(null);
  // The path's point of the frame, one vector for the rig's life: nothing is allocated per frame.
  const target = useMemo(() => new Vector3(), []);
  const isPlan = preset === "plan";
  const { near, far } = nearAndFarOf(radius);
  const limits = distanceLimitsOf(radius);
  const zoom = zoomLimitsOf(planZoomOf(framed, size.width, size.height));

  // The presets alone move the camera, and what is framed: the sun and the size of the moment are read, never followed.
  useEffect(() => {
    const aspect = size.height > 0 ? size.width / size.height : 1;
    const to = presetPositionOf(preset, framed, sun, aspect);
    // A move begins at the preset before, a stand straight above nudged off the zenith so that north is up; the plan's camera cannot move, it cuts.
    if (over > 0 && !(camera instanceof Orthographic)) {
      const from = offTheZenith(presetPositionOf(fromPreset, framed, sun, aspect));
      camera.position.set(from[0], from[1], from[2]);
      move.current = { from, to, over: over / 1000, elapsed: 0 };
    } else {
      move.current = null;
      camera.position.set(to[0], to[1], to[2]);
    }
    camera.lookAt(0, 0, 0);
    if (camera instanceof Orthographic) {
      const { width, height } = get().size;
      fitPlan(camera, planZoomOf(framed, width, height));
    }
    controls.current?.target.set(0, 0, 0);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, framed, camera, get, invalidate]);

  // The move, frame by frame: the camera chases the eased point of the path, and asks for the next frame until it stands there.
  useFrame((state, delta) => {
    const going = move.current;
    if (!going) return;
    going.elapsed += delta;
    const [x, y, z] = pathAt(going.from, going.to, easeInOut(going.elapsed / going.over));
    target.set(x, y, z);
    state.camera.position.lerp(target, settleShareOf(delta));
    if (going.elapsed >= going.over && isSettled(state.camera.position.distanceTo(target), radius)) {
      state.camera.position.copy(target);
      move.current = null;
    }
    state.camera.lookAt(0, 0, 0);
    invalidate();
  });

  // North up, on each request after the first mount: the azimuth alone changes, damped as a drag is.
  const turned = useRef(northRequest);
  useEffect(() => {
    if (northRequest === turned.current) return;
    turned.current = northRequest;
    controls.current?.setAzimuthalAngle(0);
    invalidate();
  }, [northRequest, invalidate]);

  return (
    <>
      {isPlan ? (
        <OrthographicCamera makeDefault up={NORTH_UP} near={near} far={far} />
      ) : (
        <PerspectiveCamera makeDefault fov={45} near={near} far={far} />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableRotate={!isPlan}
        touches={isPlan ? TOUCH_IN_PLAN : TOUCH_IN_3D}
        maxPolarAngle={isPlan ? Math.PI : Math.PI / 2 - ABOVE_THE_ROOF}
        minDistance={limits.min}
        maxDistance={limits.max}
        minZoom={zoom.min}
        maxZoom={zoom.max}
        target={[0, 0, 0]}
        onStart={() => onDrag?.(true)}
        onEnd={() => onDrag?.(false)}
      />
    </>
  );
}
