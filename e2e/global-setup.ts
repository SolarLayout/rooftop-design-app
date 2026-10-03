import { spawnSync } from "node:child_process";
import { isUp, readTestStack, ROOT, WEB_URL_VARIABLE, type TestStack } from "./stack";

const A_RUN = 120_000;

/**
 * Runs the design of the demo once, so that the API has kept its results before the tests begin. The
 * tests of the shell open the demo on three sizes at once; a cold server, asked for fourteen runs of
 * 12 s in one burst, answered some of them after the 90 s a test waits (plan/STATE.md, "Open items").
 */
async function runTheDemoOnce(stack: TestStack): Promise<void> {
  const api = stack.apiHealth.replace(/\/health$/, "");
  const demo = await (await fetch(`${api}/demo`, { signal: AbortSignal.timeout(A_RUN) })).json();
  const asJson = { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(demo) };
  const layout = await fetch(`${api}/layout`, { ...asJson, signal: AbortSignal.timeout(A_RUN) });
  if (!layout.ok) throw new Error(`e2e: the layout of the demo failed before the tests began: ${layout.status}.`);
  // The result comes at the end of the event stream: the text is there when the run is over.
  const run = await fetch(`${api}/design`, { ...asJson, headers: { ...asJson.headers, accept: "text/event-stream" }, signal: AbortSignal.timeout(A_RUN) });
  const events = await run.text();
  if (!run.ok || !events.includes('"type": "result"') && !events.includes('"type":"result"')) {
    throw new Error(`e2e: the design run of the demo did not end in a result before the tests began: ${run.status}.`);
  }
}

// Always the test profile, so a developer's `bun dev` is neither used nor disturbed.
export default async function globalSetup(): Promise<void | (() => Promise<void>)> {
  const before = readTestStack();
  if (before && (await isUp(before))) {
    process.env[WEB_URL_VARIABLE] = before.web;
    console.log(`e2e: the test stack is already running on ${before.web}; using it and leaving it running.`);
    await runTheDemoOnce(before);
    return;
  }

  const started = spawnSync("bun", ["run", "dev:bg", "--profile", "test"], { cwd: ROOT, stdio: "inherit" });
  const after = readTestStack();
  if (started.status !== 0 || !after) {
    throw new Error("e2e: the test stack did not start. See the message above, or run `bun status`.");
  }
  process.env[WEB_URL_VARIABLE] = after.web;
  await runTheDemoOnce(after);

  // Somebody else started it in the moment between our look and our start: theirs to stop.
  if (after.createdAt === before?.createdAt) return;

  // Returned function is the teardown: we started the stack, so we stop it.
  return async () => {
    spawnSync("bun", ["run", "stop", "--profile", "test"], { cwd: ROOT, stdio: "inherit" });
  };
}
