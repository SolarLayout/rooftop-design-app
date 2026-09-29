import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const WEB = "http://localhost:4700";
const API = "http://127.0.0.1:4701/health";

async function answers(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    return response.status === 200;
  } catch {
    return false;
  }
}

export default async function globalSetup(): Promise<void | (() => Promise<void>)> {
  if ((await answers(WEB)) && (await answers(API))) {
    console.log("e2e: the dev stack is already running; using it and leaving it running.");
    return;
  }

  const started = spawnSync("bun", ["run", "dev:bg"], { cwd: ROOT, stdio: "inherit" });
  if (started.status !== 0) {
    throw new Error("e2e: the dev stack did not start. See the message above, or run `bun status`.");
  }

  // Returned function is the teardown: we started the stack, so we stop it.
  return async () => {
    spawnSync("bun", ["run", "stop"], { cwd: ROOT, stdio: "inherit" });
  };
}
