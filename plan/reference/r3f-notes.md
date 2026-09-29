# 3D notes: fixes already paid for in solar-mms-modeller

Source repo: `../solar-mms-modeller` (single Next.js app, bun). Copy code from it; do not depend on it.

## Known-good versions
next 16.2.11, react and react-dom 19.2.4, three 0.185.1, @react-three/fiber 9.6.1, @react-three/drei 10.7.7,
zustand 5.0.14, tailwindcss 4.3.3, typescript 5.9.3. R3F 9 needs react >= 19 and < 19.3. TypeScript stays on 5.x.
Next runs on Node, never `bun --bun`.

## Files worth lifting
| File in solar-mms-modeller | Use |
|---|---|
| `components/scene/SceneCanvas.tsx` | Canvas setup: shadows, dpr, tone mapping, scaled near/far |
| `components/scene/CameraRig.tsx` | Orbit limits, presets, sun's-eye view |
| `components/scene/SunLight.tsx` | Sun light, shadow camera fit, bias scaling, low-sun fade |
| `components/scene/SunMarker.tsx`, `SunPathArc.tsx` | Sun disc and day arc |
| `components/scene/instancing.ts`, `elements/InstancedElementSet.tsx`, `elements/ModuleSet.tsx` | Instanced modules, frame and glass split |
| `components/scene/NorthGizmo.tsx`, `SceneGrid.tsx`, `Ground.tsx` | North marker, grid, ground |
| `components/calculators/la-mast/scene/KeepOutOverlay.tsx`, `ViolationTints.tsx` | Ground overlays and per-table tints |
| `lib/solar/sunVector.ts`, `sunPath.ts` | Sun vector and arc (positions themselves come from our API) |
| `lib/theme.ts`, `components/scene/materials.ts` | Scene palette per theme, material presets |
| `store/useViewStore.ts`, `useKeyboardShortcuts.ts` | Preset nonce pattern, shortcuts |
| `components/panel/NumberSlider.tsx` | Draft then commit number input |

## Fixes
| # | Problem | Fix |
|---|---|---|
| 1 | Blank canvas in dev: React strict mode remounts and R3F has already lost the context | `reactStrictMode: false` in `next.config.ts` |
| 2 | Canvas cannot render on the server | `next/dynamic(..., { ssr: false })`; guard `document` in texture code |
| 3 | Hydration mismatch from client-only maths | Mount latch with `useSyncExternalStore`; compute after mount |
| 4 | Theme flash and mismatch | Store starts at the default; `next/script beforeInteractive` sets `data-theme`; adopt stored value after mount |
| 5 | Shadow acne at low sun | `normalBias = max(0.1, texel * 3 * min(8, 1 / max(0.12, sin(alt))))`, `bias = -0.00012` |
| 6 | Shadow camera refits as the sun moves | Fit the ortho frustum to the bounding sphere once; only near and far follow |
| 7 | Artefacts near sunset | Fade the light from 8 deg to 0; `castShadow` off at 0; ambient follows sin(alt) |
| 8 | PCFSoftShadowMap deprecated in three 0.185 | `shadows={{ type: THREE.PCFShadowMap }}` on the Canvas; never mutate `gl.shadowMap` |
| 9 | Z-fighting in far top views | `near = radius * 0.05`, `far = radius * 30`; orbit distance limits inside that |
| 10 | Coplanar module faces flicker | Glass stacked above the frame with a gap; frame casts, glass receives; overlays lifted 1 to 40 mm, `depthWrite={false}` |
| 11 | Instanced mesh vanishes on material swap | Material in the effect's dependency list; `key={capacity}`; `frustumCulled={false}` |
| 12 | Time scrub rebuilds geometry | Geometry memo keyed on a whitelist of geometry inputs; sun state separate; animated values written in `useFrame` from `getState()` |
| 13 | Camera resets on every edit | Frame only when the preset nonce changes |
| 14 | New three objects each render | Declarative elements, memoised geometry |
| 15 | Accent colours washed out | `toneMapped={false}` on unlit UI meshes; canvas textures tagged sRGB; scene colours from a JS palette |

## Not solved there; ours to solve
- Per-instance colour (strings, shade heat map): use `instanceColor` and test the update path, or overlay quads.
- Raycast selection, drag handles, TransformControls.
- `frameloop="demand"` with `invalidate()`.
- WebGL context loss: listen for `webglcontextlost`, fall back to the plan view, offer reload.
- Touch tuning for orbit, pan and pinch; phone DPR and resize.
- Playwright with WebGL: launch chromium with `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`
  (or headed on CI with a virtual display), `preserveDrawingBuffer` only in test builds, assert on sampled
  pixels and on scene state exposed at `window.__scene` in test builds.
