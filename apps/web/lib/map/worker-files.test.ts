import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

// The worker of MapLibre and the module it shares are served by the app (public/maplibre-gl), because
// under Next's bundler the worker cannot find its own file. tools/vendor-maplibre.ts copies them; this
// test holds the copies equal to the pinned package, so that a new version cannot be half taken.

const WEB = path.resolve(import.meta.dir, "../..");
const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

test.each(FILES)("public/maplibre-gl/%s is the file of the pinned package", (file) => {
  const served = readFileSync(path.join(WEB, "public/maplibre-gl", file));
  const packaged = readFileSync(path.join(WEB, "node_modules/maplibre-gl/dist", file));

  expect(served.equals(packaged)).toBe(true);
});

test("the licence of MapLibre is served beside them", () => {
  expect(readFileSync(path.join(WEB, "public/maplibre-gl/LICENSE.txt"), "utf8")).toContain("BSD");
});
