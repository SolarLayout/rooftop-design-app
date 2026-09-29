import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const REPO_ROOT = resolve(import.meta.dir, "..", "..");
export const WEB_DIR = resolve(REPO_ROOT, "apps/web");
export const API_DIR = resolve(REPO_ROOT, "apps/api");
export const E2E_DIR = resolve(REPO_ROOT, "e2e");
export const API_TYPES_DIR = resolve(REPO_ROOT, "packages/api-types");
export const DEV_DIR = resolve(REPO_ROOT, ".dev");
export const PID_FILE = resolve(DEV_DIR, "pids.json");

export const WEB_PORT = 4700;
export const API_PORT = 4701;
export const WEB_URL = `http://localhost:${WEB_PORT}`;
export const API_HEALTH_URL = `http://127.0.0.1:${API_PORT}/health`;

/**
 * A file inside an installed package, found the way Node finds packages: node_modules of the directory,
 * then of each parent. Works for files a package does not list in its "exports". Null when not installed.
 */
export function packageFile(packageName: string, file: string, from: string): string | null {
  for (let directory = resolve(from); ; directory = dirname(directory)) {
    const candidate = join(directory, "node_modules", packageName, file);
    if (existsSync(candidate)) return candidate;
    if (dirname(directory) === directory) return null;
  }
}
