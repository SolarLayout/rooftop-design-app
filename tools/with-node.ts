// Runs a tool from node_modules/.bin with the real Node first on PATH.
//   bun tools/with-node.ts <tool> [arguments]
// Needed because `node` may not be on PATH, and bun would then run the tool on its own runtime.

import { spawnSync } from "node:child_process";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";
import { binFile } from "./lib/paths.ts";

const [tool, ...args] = process.argv.slice(2);
if (!tool) {
  console.error("Usage: bun tools/with-node.ts <tool> [arguments]");
  process.exit(2);
}

const node = resolveNode();
if (!node) {
  console.error(nodeMissingMessage());
  process.exit(1);
}

const bin = binFile(tool, process.cwd());
if (!bin) {
  console.error(`${tool} was not found in node_modules/.bin. Run \`bun install\` first.`);
  process.exit(1);
}

const result = spawnSync(bin, args, { stdio: "inherit", env: envWithNode(node) });
process.exit(result.status ?? 1);
