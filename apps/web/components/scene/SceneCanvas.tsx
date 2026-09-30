"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { ACESFilmicToneMapping, PCFShadowMap } from "three";
import { PALETTE } from "@/lib/scene-palette";

type Props = {
  /** Said once when the browser takes the WebGL context away; the stage then shows the plan instead. */
  onContextLost: () => void;
  children: ReactNode;
};

/**
 * The canvas of the 3D scene (plan/phase-05-plan.md, decisions 7 and 19, and plan/reference/r3f-notes.md):
 * drawn on demand, at most twice the pixels of the screen, tone-mapped, with PCF shadows. It is loaded in
 * the browser alone (next/dynamic, ssr false).
 */
export function SceneCanvas({ onContextLost, children }: Props) {
  const lost = useRef(onContextLost);
  useEffect(() => {
    lost.current = onContextLost;
  });

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      shadows={{ type: PCFShadowMap }}
      gl={{ antialias: true, toneMapping: ACESFilmicToneMapping, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          lost.current();
        });
      }}
    >
      <color attach="background" args={[PALETTE.stage]} />
      {children}
    </Canvas>
  );
}
