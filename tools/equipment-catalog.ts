// bun equipment:catalog
// Writes apps/web/public/equipment/catalog.json from the PAN and OND files beside it, read by the engine's own readers
// (rooftop_core.catalog, D75). A file the readers refuse is named with the reason and left out, and the command fails.
// How to add files: docs/equipment-library.md.

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { API_DIR, WEB_DIR } from "./lib/paths.ts";

const library = resolve(WEB_DIR, "public/equipment");
const result = spawnSync("uv", ["run", "--locked", "python", "-m", "rooftop_core.catalog", library], { cwd: API_DIR, stdio: "inherit" });
if (result.status !== 0) {
  console.error("equipment:catalog: some files were left out (above). Remove or fix them, and run it again.");
  process.exit(result.status ?? 1);
}
