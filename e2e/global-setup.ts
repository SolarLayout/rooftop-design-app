import { spawnSync } from "node:child_process";
import { readTestStack, ROOT, WEB_URL_VARIABLE, type TestStack } from "./stack";

async function answers(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    return response.status === 200;
  } catch {
    return false;
  }
}

const isUp = async (stack: TestStack | null) =>
  stack !== null && (await answers(stack.web)) && (await answers(stack.apiHealth));

// Always the test profile, so a developer's `bun dev` is neither used nor disturbed.
export default async function globalSetup(): Promise<void | (() => Promise<void>)> {
  const before = readTestStack();
  if (before && (await isUp(before))) {
    process.env[WEB_URL_VARIABLE] = before.web;
    console.log(`e2e: the test stack is already running on ${before.web}; using it and leaving it running.`);
    return;
  }

  const started = spawnSync("bun", ["run", "dev:bg", "--profile", "test"], { cwd: ROOT, stdio: "inherit" });
  const after = readTestStack();
  if (started.status !== 0 || !after) {
    throw new Error("e2e: the test stack did not start. See the message above, or run `bun status`.");
  }
  process.env[WEB_URL_VARIABLE] = after.web;

  // Somebody else started it in the moment between our look and our start: theirs to stop.
  if (after.createdAt === before?.createdAt) return;

  // Returned function is the teardown: we started the stack, so we stop it.
  return async () => {
    spawnSync("bun", ["run", "stop", "--profile", "test"], { cwd: ROOT, stdio: "inherit" });
  };
}
