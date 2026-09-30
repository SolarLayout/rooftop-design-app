// What a pytest run did, read from its last line, and said in the words of the check's summary.

export type PytestCounts = { passed: number; failed: number; skipped: number; errors: number; deselected: number };

const COUNTED = ["passed", "failed", "skipped", "error", "deselected"] as const;

export function parsePytestCounts(output: string): PytestCounts {
  const lines = output.trimEnd().split("\n");
  const last = lines.findLast((line) => /\b(passed|failed|skipped|errors?|deselected|no tests ran)\b.* in [\d.]+s/.test(line));
  if (!last) throw new Error("pytest's summary line was not found in its output.");
  const counts: PytestCounts = { passed: 0, failed: 0, skipped: 0, errors: 0, deselected: 0 };
  for (const kind of COUNTED) {
    const match = new RegExp(`(\\d+) ${kind}s?\\b`).exec(last);
    if (match) counts[kind === "error" ? "errors" : kind] = Number(match[1]);
  }
  return counts;
}

export type PytestRun = {
  counts: PytestCounts;
  /** Tests testmon's data knew before the run; 0 when the data was rebuilt. */
  known: number;
  /** Why the data was rebuilt and everything ran; null when testmon selected. */
  rebuilt: string | null;
  /** Testmon's own line about what changed, when it printed one. */
  changed: string | null;
};

export function describePytestRun(run: PytestRun): string {
  const { counts } = run;
  const ran = counts.passed + counts.failed + counts.skipped + counts.errors;
  const troubles = [
    counts.failed > 0 ? `${counts.failed} failed` : "",
    counts.errors > 0 ? `${counts.errors} error${counts.errors === 1 ? "" : "s"}` : "",
    counts.skipped > 0 ? `${counts.skipped} skipped` : "",
  ].filter(Boolean);
  const trouble = troubles.length > 0 ? ` (${troubles.join(", ")})` : "";
  if (run.rebuilt) return `ran all ${ran} tests${trouble}: ${run.rebuilt}`;
  const notRun = Math.max(run.known - ran, 0);
  const why = run.changed ? ` (pytest-testmon: ${run.changed})` : " (pytest-testmon)";
  return `ran ${ran} of ${run.known} tests${trouble}, the sentinel among them; ${notRun} not run, unaffected by the change${why}`;
}
