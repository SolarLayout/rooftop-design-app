// bun tools/vendor-maplibre.ts
// Copies the worker of MapLibre GL JS and the module it shares into apps/web/public/maplibre-gl, so that
// the app serves them itself: under Next's bundler the worker cannot find its own file. The copies are
// of the pinned version (decision D4); apps/web/lib/map/worker-files.test.ts holds them equal to the
// package. Run it again after the version changes.
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { WEB_DIR } from "./lib/paths.ts";

export const WORKER_FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs", "LICENSE.txt"] as const;
export const PACKAGE_DIST = resolve(WEB_DIR, "node_modules/maplibre-gl/dist");
export const PACKAGE_ROOT = resolve(WEB_DIR, "node_modules/maplibre-gl");
export const SERVED_FROM = resolve(WEB_DIR, "public/maplibre-gl");

export function sourceOf(file: string): string {
  return file === "LICENSE.txt" ? resolve(PACKAGE_ROOT, file) : resolve(PACKAGE_DIST, file);
}

if (import.meta.main) {
  mkdirSync(SERVED_FROM, { recursive: true });
  for (const file of WORKER_FILES) copyFileSync(sourceOf(file), resolve(SERVED_FROM, file));
  console.log(`Copied ${WORKER_FILES.join(", ")} to ${SERVED_FROM}.`);
}
