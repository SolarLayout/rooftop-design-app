"use client";

import { OrbitControls, OrthographicCamera, PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef, type ComponentRef } from "react";
import { OrthographicCamera as Orthographic, TOUCH } from "three";
import { useView } from "@/components/shell/stores";
import { distanceLimitsOf, nearAndFarOf, planZoomOf, presetPositionOf, zoomLimitsOf, type Sun } from "@/lib/scene/camera";
import { cameraOf, cameraRequestOf, northRequestOf } from "@/lib/stores/view-store";

type Props = {
  /** The roof's radius about the origin of the scene. */
  radius: number;
  sun: Sun | null;
};

/** The pole is clamped this much above the roof plane, in radians: the camera never goes below it. */
const ABOVE_THE_ROOF = 0.03;

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
 * that the camera stands south of what it looks at, keeping its distance and its height.
 */
export function CameraRig({ radius, sun }: Props) {
  const camera = useThree((state) => state.camera);
  const get = useThree((state) => state.get);
  const invalidate = useThree((state) => state.invalidate);
  const size = useThree((state) => state.size);
  const preset = useView(cameraOf);
  const request = useView(cameraRequestOf);
  const northRequest = useView(northRequestOf);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const isPlan = preset === "plan";
  const { near, far } = nearAndFarOf(radius);
  const limits = distanceLimitsOf(radius);
  const zoom = zoomLimitsOf(planZoomOf(radius, size.width, size.height));

  // The presets alone move the camera: the radius, the sun and the size of the moment are read, never followed.
  useEffect(() => {
    const [x, y, z] = presetPositionOf(preset, radius, sun);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    if (camera instanceof Orthographic) {
      const { width, height } = get().size;
      fitPlan(camera, planZoomOf(radius, width, height));
    }
    controls.current?.target.set(0, 0, 0);
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, camera, get, invalidate]);

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
      />
    </>
  );
}
