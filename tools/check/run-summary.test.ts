import { describe, expect, test } from "bun:test";
import { describeTasks, readRunSummary, type TaskResult } from "./run-summary.ts";

const summary = JSON.stringify({
  id: "3K2lR5vWjDw0XWEBJqgPTHKb3G1",
  execution: { exitCode: 0, cached: 1, attempted: 2 },
  tasks: [
    { taskId: "//#test:tools", hash: "8b9c4f45ed308470", cache: { status: "HIT", source: "LOCAL", sha: "956b01f90f2dac1bdfa17a976bef083307ce685c" }, execution: { exitCode: 0 } },
    { taskId: "@rooftop/api#imports", hash: "0f3fe0ab88e3a676", cache: { status: "MISS" }, execution: { exitCode: 0 } },
  ],
});

describe("readRunSummary", () => {
  test("gives each task with its hash, whether the cache had it, and the commit the entry was made at", () => {
    expect(readRunSummary(summary)).toEqual([
      { taskId: "//#test:tools", hash: "8b9c4f45ed308470", cached: true, madeAt: "956b01f", exitCode: 0 },
      { taskId: "@rooftop/api#imports", hash: "0f3fe0ab88e3a676", cached: false, madeAt: null, exitCode: 0 },
    ]);
  });

  test("refuses a file that is not a run summary", () => {
    expect(() => readRunSummary("{}")).toThrow(/run summary/);
    expect(() => readRunSummary("not json")).toThrow(/run summary/);
  });
});

describe("describeTasks", () => {
  const ran = (taskId: string): TaskResult => ({ taskId, hash: "aaaa1111bbbb2222", cached: false, madeAt: null, exitCode: 0 });
  const hit = (taskId: string): TaskResult => ({ taskId, hash: "cccc3333dddd4444", cached: true, madeAt: "956b01f", exitCode: 0 });

  test("every task from the cache: the step is skipped, with the reason", () => {
    expect(describeTasks([hit("@rooftop/web#lint")])).toEqual({
      state: "skipped",
      detail: "inputs unchanged, cached at 956b01f (turbo hash cccc3333)",
    });
  });

  test("every task ran: the step is ok, and says how many", () => {
    expect(describeTasks([ran("a#x"), ran("b#x")])).toEqual({ state: "ok", detail: "2 tasks ran" });
    expect(describeTasks([ran("a#x")])).toEqual({ state: "ok", detail: "1 task ran" });
  });

  test("some from the cache: the step ran partly, and names what ran", () => {
    expect(describeTasks([hit("@rooftop/api-types#typecheck"), ran("@rooftop/web#typecheck"), ran("//#typecheck:tools")])).toEqual({
      state: "partly",
      detail: "ran @rooftop/web#typecheck, //#typecheck:tools; 1 unchanged, cached at 956b01f",
    });
  });

  test("hits made at several commits name each commit", () => {
    const older = { ...hit("a#x"), madeAt: "4278bbe" };
    expect(describeTasks([hit("b#x"), older]).detail).toMatch(/cached at 956b01f, 4278bbe/);
  });
});
