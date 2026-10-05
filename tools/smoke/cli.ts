// The smoke's command line: its arguments and its summary (tools/smoke.ts runs it).

import type { Check } from "./smoke";

export const USAGE = "usage: bun tools/smoke.ts <https base URL, or this machine's> [--commit <sha>]";

const LOCAL = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/;

export function argumentsOf(argv: string[]): { base: string; commit: string | undefined } {
  const [base, flag, commit, ...rest] = argv;
  const named = flag === undefined || (flag === "--commit" && commit !== undefined);
  const reachable = base !== undefined && (base.startsWith("https://") || LOCAL.test(base));
  if (!reachable || !named || rest.length > 0) throw new Error(USAGE);
  return { base, commit };
}

export function summaryOf(base: string, checks: Check[]): string {
  const width = Math.max(...checks.map((check) => check.name.length));
  const lines = checks.map(
    (check) => `  ${check.ok ? "✓" : "!"}  ${check.name.padEnd(width)}  ${(check.ms / 1000).toFixed(1).padStart(5)} s  ${check.detail}`,
  );
  const failed = checks.filter((check) => !check.ok).length;
  const last = failed === 0 ? `All ${checks.length} steps passed.` : `${failed} of ${checks.length} steps failed.`;
  return [`smoke of ${base}`, ...lines, last].join("\n");
}
