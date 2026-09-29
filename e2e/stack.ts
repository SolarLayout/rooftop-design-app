// The stack the Playwright tests run against: always the test profile of tools/dev.ts (web 4710 and
// api 4711 by preference, the next free pair otherwise), never the developer's dev stack.

import { readFileSync } from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(__dirname, "..");
export const TEST_PID_FILE = path.join(ROOT, ".dev", "test", "pids.json");
export const PREFERRED_WEB_URL = "http://localhost:4710";

/** Set by the global setup once the stack answers; the test workers inherit it. */
export const WEB_URL_VARIABLE = "ROOFTOP_E2E_WEB_URL";

export type TestStack = { createdAt: string; web: string; apiHealth: string };

/** What tools/dev.ts wrote down about the running test stack; null when there is no pid file. */
export function readTestStack(): TestStack | null {
  try {
    const file = JSON.parse(readFileSync(TEST_PID_FILE, "utf8")) as {
      createdAt?: unknown;
      ports?: { web?: unknown; api?: unknown };
    };
    const web = file.ports?.web;
    const api = file.ports?.api;
    if (typeof file.createdAt !== "string" || !Number.isInteger(web) || !Number.isInteger(api)) return null;
    return {
      createdAt: file.createdAt,
      web: `http://localhost:${web}`,
      apiHealth: `http://127.0.0.1:${api}/health`,
    };
  } catch {
    return null;
  }
}

/** The address of the web app under test, with the real port. */
export function webUrl(): string {
  return process.env[WEB_URL_VARIABLE] ?? readTestStack()?.web ?? PREFERRED_WEB_URL;
}
