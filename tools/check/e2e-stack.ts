// The test stack for the browser step of `bun check`: started once before the groups that run, stopped
// after them, and left alone when it was running already. The global setup of every group (e2e/global-setup.ts)
// then finds it running and leaves it. Knowledge of the stack is e2e/stack.ts's and tools/dev.ts's: the
// pid file and the health of both halves; `bun run dev:bg --profile test` and `bun run stop --profile test`.

import { spawnSync } from "node:child_process";
import { isUp, readTestStack } from "../../e2e/stack.ts";
import { REPO_ROOT } from "../lib/paths.ts";

export type TestStackLease = { ok: true; note: string; stop: () => void } | { ok: false; message: string };

const leave = () => {};

function dev(args: string[]): number {
  const result = spawnSync(process.execPath, ["run", ...args], { cwd: REPO_ROOT, stdio: "inherit" });
  return result.status ?? 1;
}

/** The test stack, running: ours to stop afterwards when we started it, left as it was otherwise. */
export async function ensureTestStack(): Promise<TestStackLease> {
  const before = readTestStack();
  if (await isUp(before)) {
    return { ok: true, note: `the test stack is already running on ${before?.web}; using it and leaving it running`, stop: leave };
  }
  if (dev(["dev:bg", "--profile", "test"]) !== 0) {
    return { ok: false, message: "the test stack did not start. See the message above, or run `bun status`." };
  }
  const after = readTestStack();
  if (!after) return { ok: false, message: "the test stack started but left no pid file (.dev/test/pids.json). Run `bun status`." };
  // Somebody else started it in the moment between our look and our start: theirs to stop.
  if (after.createdAt === before?.createdAt) return { ok: true, note: `the test stack came up on ${after.web} meanwhile; leaving it`, stop: leave };
  return {
    ok: true,
    note: `started the test stack on ${after.web} for the browser tests; it is stopped after them`,
    stop: () => {
      dev(["stop", "--profile", "test"]);
    },
  };
}
