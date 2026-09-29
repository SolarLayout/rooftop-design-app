// bun gen:api
// Writes packages/api-types/openapi.json from the FastAPI app (imported, no server started), then
// generates from it with openapi-typescript:
//   packages/api-types/src/index.ts      the shapes as the API hands them out: every field is there
//   packages/api-types/src/requests.ts   the shapes as the API takes them: a field with a default may be left out

import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";
import { envWithNode, nodeMissingMessage, resolveNode } from "./lib/node.ts";
import { API_DIR, API_TYPES_DIR, packageFile, REPO_ROOT } from "./lib/paths.ts";

const document = resolve(API_TYPES_DIR, "openapi.json");
const types = resolve(API_TYPES_DIR, "src/index.ts");
const requestTypes = resolve(API_TYPES_DIR, "src/requests.ts");

function run(label: string, command: string, args: string[], cwd: string, env = process.env): void {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.status !== 0) {
    console.error(`gen:api failed at: ${label}`);
    process.exit(result.status ?? 1);
  }
}

const node = resolveNode();
if (!node) {
  console.error(nodeMissingMessage());
  process.exit(1);
}

const cli = packageFile("openapi-typescript", "bin/cli.js", API_TYPES_DIR);
if (!cli) {
  console.error("openapi-typescript is not installed. Run `bun install` first.");
  process.exit(1);
}

run("export the OpenAPI document", "uv", ["run", "--locked", "python", "-m", "rooftop_api.export_openapi", document], API_DIR);
run(
  "generate the TypeScript types of the answers",
  node.path,
  [cli, document, "--output", types],
  API_TYPES_DIR,
  envWithNode(node),
);
run(
  "generate the TypeScript types of the requests",
  node.path,
  [cli, document, "--output", requestTypes, "--default-non-nullable=false"],
  API_TYPES_DIR,
  envWithNode(node),
);

const written = [document, types, requestTypes].map((file) => relative(REPO_ROOT, file));
console.log(`Wrote ${written.join(", ")}.`);
