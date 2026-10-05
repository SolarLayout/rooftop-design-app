// The smoke of a deployed site: bun tools/smoke.ts <https base URL> [--commit <sha>]. Exits 1 when a step fails.
// What it asks and why: tools/smoke/smoke.ts.

import { argumentsOf, summaryOf } from "./smoke/cli";
import { smoke } from "./smoke/smoke";

let parsed: ReturnType<typeof argumentsOf>;
try {
  parsed = argumentsOf(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
const { base, commit } = parsed;
const checks = await smoke(base, { commit });
console.log(summaryOf(base, checks));
process.exit(checks.every((check) => check.ok) ? 0 : 1);
