// What turbo says about a run (`--summarize` writes .turbo/runs/<id>.json): each task's hash, whether
// the cache had it, and the commit the cache entry was made at. The check's summary is worded from it.

export type TaskResult = {
  taskId: string;
  hash: string;
  cached: boolean;
  /** Short sha of the commit the cache entry was made at; null when the task ran. */
  madeAt: string | null;
  exitCode: number | null;
};

type RawTask = {
  taskId?: unknown;
  hash?: unknown;
  cache?: { status?: unknown; sha?: unknown };
  execution?: { exitCode?: unknown } | null;
};

export function readRunSummary(text: string): TaskResult[] {
  let parsed: { tasks?: unknown };
  try {
    parsed = JSON.parse(text) as { tasks?: unknown };
  } catch (error) {
    throw new Error(`turbo's run summary could not be read: ${(error as Error).message}`);
  }
  if (!Array.isArray(parsed.tasks)) throw new Error("turbo's run summary has no tasks: not a run summary.");
  return (parsed.tasks as RawTask[]).map((task) => {
    if (typeof task.taskId !== "string" || typeof task.hash !== "string") {
      throw new Error("turbo's run summary has a task without an id or a hash: not a run summary.");
    }
    const cached = task.cache?.status === "HIT";
    const sha = task.cache?.sha;
    return {
      taskId: task.taskId,
      hash: task.hash,
      cached,
      madeAt: cached && typeof sha === "string" ? sha.slice(0, 7) : null,
      exitCode: typeof task.execution?.exitCode === "number" ? task.execution.exitCode : null,
    };
  });
}

export type StepState = "ok" | "partly" | "skipped";

/** "cached at 956b01f": the commit that was checked out when the cache entry was made. */
function cachedAt(hits: TaskResult[]): string {
  const commits = [...new Set(hits.map((hit) => hit.madeAt ?? "an earlier run"))];
  return `cached at ${commits.join(", ")}`;
}

/** The state of a step from the tasks it ran through turbo, and the words of the summary line. */
export function describeTasks(tasks: TaskResult[]): { state: StepState; detail: string } {
  const hits = tasks.filter((task) => task.cached);
  const ran = tasks.filter((task) => !task.cached);
  if (ran.length === 0) {
    const hashes = hits.map((hit) => hit.hash.slice(0, 8)).join(", ");
    return { state: "skipped", detail: `inputs unchanged, ${cachedAt(hits)} (turbo hash ${hashes})` };
  }
  if (hits.length === 0) return { state: "ok", detail: `${ran.length} task${ran.length === 1 ? "" : "s"} ran` };
  return {
    state: "partly",
    detail: `ran ${ran.map((task) => task.taskId).join(", ")}; ${hits.length} unchanged, ${cachedAt(hits)}`,
  };
}
