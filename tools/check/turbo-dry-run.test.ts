import { describe, expect, test } from "bun:test";
import { readDryRun } from "./turbo-dry-run.ts";

const dryRun = JSON.stringify({
  id: "3K2lR5vWjDw0XWEBJqgPTHKb3G1",
  tasks: [
    { taskId: "//#e2e:kit", hash: "bb7a949a2b8ffea8", command: "bun tools/e2e-group.ts kit", cache: { local: true, remote: false, status: "HIT", timeSaved: 0 } },
    { taskId: "//#e2e:find", hash: "0f3fe0ab88e3a676", command: "bun tools/e2e-group.ts find", cache: { local: false, remote: false, status: "MISS", timeSaved: 0 } },
    { taskId: "@rooftop/api-types#lint", hash: "1111222233334444", command: "<NONEXISTENT>", cache: { status: "MISS" } },
  ],
});

describe("readDryRun", () => {
  test("gives each task with its hash, its command, and whether the cache has it", () => {
    expect(readDryRun(dryRun)).toEqual([
      { taskId: "//#e2e:kit", hash: "bb7a949a2b8ffea8", command: "bun tools/e2e-group.ts kit", cached: true },
      { taskId: "//#e2e:find", hash: "0f3fe0ab88e3a676", command: "bun tools/e2e-group.ts find", cached: false },
      { taskId: "@rooftop/api-types#lint", hash: "1111222233334444", command: "<NONEXISTENT>", cached: false },
    ]);
  });

  test("refuses what is not a dry run", () => {
    expect(() => readDryRun("{}")).toThrow(/dry run/);
    expect(() => readDryRun("not json")).toThrow(/dry run/);
    expect(() => readDryRun(JSON.stringify({ tasks: [{ taskId: 1 }] }))).toThrow(/dry run/);
  });
});
