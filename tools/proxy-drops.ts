// Asks the web origin for the report's pages of the demo, many times and several at a time, through the /api
// rewrite, and counts the answers that were not 200: the drops of the proxy in front of the API
// (plan/phase-11-plan.md, step 2; plan/STATE.md, the open item). The API itself answers every one with 200.
//
//   bun tools/proxy-drops.ts                               the test stack (.dev/test/pids.json), 200 asks, 4 at a time
//   bun tools/proxy-drops.ts --web http://localhost:4700   another stack
//   bun tools/proxy-drops.ts --times 50 --at-once 8

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { tally } from "./lib/drops.ts";
import { DEV_DIR } from "./lib/paths.ts";

const DAY = "2026-10-04";
const AN_ASK = 60_000;

function flag(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : (process.argv[index + 1] ?? fallback);
}

function testStackWeb(): string {
  const file = JSON.parse(readFileSync(resolve(DEV_DIR, "test", "pids.json"), "utf8")) as { ports: { web: number } };
  return `http://localhost:${file.ports.web}`;
}

async function main(): Promise<number> {
  const web = flag("--web", testStackWeb());
  const times = Number(flag("--times", "200"));
  const atOnce = Number(flag("--at-once", "4"));
  const demo = (await (await fetch(`${web}/api/demo`)).json()) as Record<string, unknown>;
  const project = JSON.stringify({ ...demo, name: "Pune demo", chosen_option: "29x22x1" });
  console.log(`proxy-drops: ${times} asks of the report's pages through ${web}, ${atOnce} at a time.`);

  const statuses: (number | null)[] = [];
  let next = 0;
  const began = Date.now();
  async function worker(): Promise<void> {
    while (next < times) {
      next += 1;
      try {
        const response = await fetch(`${web}/api/export/report-pages?day=${DAY}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: project,
          signal: AbortSignal.timeout(AN_ASK),
        });
        await response.arrayBuffer();
        statuses.push(response.status);
      } catch {
        statuses.push(null);
      }
    }
  }
  await Promise.all(Array.from({ length: atOnce }, worker));
  const counted = tally(statuses);
  console.log(`${counted.line}, in ${((Date.now() - began) / 1000).toFixed(1)} s.`);
  return counted.dropped === 0 ? 0 : 1;
}

process.exit(await main());
