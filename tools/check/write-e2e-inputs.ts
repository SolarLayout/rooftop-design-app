// Writes the inputs of turbo.json's browser tasks (`//#e2e:<group>`) from the groups (tools/check/e2e-groups.ts), after a
// group's folders change; tools/check/e2e-groups.test.ts holds the two equal. Nothing else of turbo.json is touched.
//   bun tools/check/write-e2e-inputs.ts

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "../lib/paths.ts";
import { GROUPS, inputsOf, taskOf } from "./e2e-groups.ts";

const file = join(REPO_ROOT, "turbo.json");
const turbo = JSON.parse(readFileSync(file, "utf8")) as { tasks: Record<string, { inputs?: string[] }> };
for (const group of GROUPS) {
  const task = turbo.tasks[taskOf(group)];
  if (!task) {
    console.error(`turbo.json has no task ${taskOf(group)}: add it before writing its inputs.`);
    process.exit(1);
  }
  task.inputs = inputsOf(group);
}
writeFileSync(file, `${JSON.stringify(turbo, null, 2)}\n`);
console.log(`write-e2e-inputs: the inputs of ${GROUPS.length} browser tasks written to turbo.json.`);
