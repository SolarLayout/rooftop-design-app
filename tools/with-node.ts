// Runs a tool from node_modules/.bin with the real Node first on PATH.
//   bun tools/with-node.ts <tool> [arguments]
// Needed because `node` may not be on PATH, and bun would then run the tool on its own runtime.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";

function findBin(tool: string, from: string): string | null {
  for (let directory = from; ; directory = dirname(directory)) {
    const candidate = join(directory, "node_modules", ".bin", tool);
    if (existsSync(candidate)) return candidate;
    if (dirname(directory) === directory) return null;
  }
}

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

const bin = findBin(tool, process.cwd());
if (!bin) {
  console.error(`${tool} was not found in node_modules/.bin. Run \`bun install\` first.`);
  process.exit(1);
}

const result = spawnSync(bin, args, { stdio: "inherit", env: envWithNode(node) });
process.exit(result.status ?? 1);
