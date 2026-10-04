// The count of the answers of a run of asks (tools/proxy-drops.ts): everything that is not a 200 is a drop, an
// answer that never came included. Pure, so that it can be tested without a stack.

export type Tally = {
  total: number;
  good: number;
  dropped: number;
  /** The answers by status; "no answer" for one that never came. */
  byStatus: Record<string, number>;
  line: string;
};

export function tally(statuses: readonly (number | null)[]): Tally {
  const byStatus: Record<string, number> = {};
  for (const status of statuses) {
    const key = status === null ? "no answer" : String(status);
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }
  const good = byStatus["200"] ?? 0;
  const dropped = statuses.length - good;
  const reasons = Object.entries(byStatus)
    .filter(([key]) => key !== "200")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => `${key} ×${count}`)
    .join(", ");
  const line = `${statuses.length} asked, ${good} answered 200, ${dropped} dropped${dropped > 0 ? ` (${reasons})` : ""}`;
  return { total: statuses.length, good, dropped, byStatus, line };
}
