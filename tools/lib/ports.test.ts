import { describe, expect, test } from "bun:test";
import { isOurs, parseLsofCwd, parseLsofFields } from "./ports.ts";

const REPO = "/Users/someone/code/rooftop-design-app";

describe("parseLsofFields", () => {
  test("reads pid and command of one listener", () => {
    expect(parseLsofFields("p4312\ncPython\nf5\nn127.0.0.1:4701\n", 4701)).toEqual([{ pid: 4312, name: "Python" }]);
  });

  test("keeps several processes on the same port apart, in order", () => {
    const output = "p901\ncPython\nf3\nn127.0.0.1:4701\np902\ncPython\nf3\nn127.0.0.1:4701\n";
    expect(parseLsofFields(output, 4701)).toEqual([
      { pid: 901, name: "Python" },
      { pid: 902, name: "Python" },
    ]);
  });

  test("lists a process once when it listens on IPv4 and IPv6", () => {
    const output = "p77\ncnode\nf21\nn*:4700\nf22\nn[::1]:4700\n";
    expect(parseLsofFields(output, 4700)).toEqual([{ pid: 77, name: "node" }]);
  });

  test("keeps spaces and brackets in the command", () => {
    expect(parseLsofFields("p5\ncnext-server (v16.2.11)\nf13\nn*:4700\n", 4700)).toEqual([
      { pid: 5, name: "next-server (v16.2.11)" },
    ]);
  });

  test("a client connected to the port does not hold it", () => {
    const output = "p300\ncGoogle Chrome\nf40\nn127.0.0.1:55687->127.0.0.1:4701\n";
    expect(parseLsofFields(output, 4701)).toEqual([]);
  });

  test("the server side of a connection does hold it", () => {
    const output = "p901\ncPython\nf9\nn127.0.0.1:4701->127.0.0.1:55687\n";
    expect(parseLsofFields(output, 4701)).toEqual([{ pid: 901, name: "Python" }]);
  });

  test("a port that only ends in the same digits is another port", () => {
    expect(parseLsofFields("p8\ncnode\nf3\nn127.0.0.1:14701\n", 4701)).toEqual([]);
  });

  test("a free port gives nothing", () => {
    expect(parseLsofFields("", 4701)).toEqual([]);
  });

  test("ignores lines it does not know and pids that are not numbers", () => {
    const output = "garbage\npabc\ncghost\nn127.0.0.1:4701\np12\ncuv\nf3\nn127.0.0.1:4701\n";
    expect(parseLsofFields(output, 4701)).toEqual([{ pid: 12, name: "uv" }]);
  });
});

describe("parseLsofCwd", () => {
  test("reads the working directory", () => {
    expect(parseLsofCwd("p4312\nfcwd\nn/Users/someone/code\n")).toBe("/Users/someone/code");
  });

  test("gives null when lsof printed nothing", () => {
    expect(parseLsofCwd("")).toBeNull();
  });
});

describe("isOurs", () => {
  test("the Next server of this repo is ours", () => {
    expect(isOurs({ command: "next-server (v16.2.11)", cwd: `${REPO}/apps/web` }, "web", REPO)).toBe(true);
    expect(
      isOurs({ command: `/opt/node/bin/node ${REPO}/node_modules/next/dist/bin/next dev -p 4700`, cwd: `${REPO}/apps/web` }, "web", REPO),
    ).toBe(true);
  });

  test("the Next server of another repo is not ours", () => {
    expect(isOurs({ command: "next-server (v16.2.11)", cwd: "/Users/someone/code/other/apps/web" }, "web", REPO)).toBe(false);
  });

  // Command lines as ps shows them on macOS: the interpreter appears under its framework path.
  const PYTHON = "/Library/Frameworks/Python.framework/Versions/3.12/Resources/Python.app/Contents/MacOS/Python";
  const WORKER = `${PYTHON} -c from multiprocessing.spawn import spawn_main; spawn_main(tracker_fd=5, pipe_handle=7) --multiprocessing-fork`;

  test("uvicorn of this repo is ours", () => {
    const command = `${PYTHON} ${REPO}/apps/api/.venv/bin/uvicorn rooftop_api.main:app --host 127.0.0.1 --port 4701 --reload`;
    expect(isOurs({ command, cwd: `${REPO}/apps/api` }, "api", REPO)).toBe(true);
    expect(isOurs({ command: "uv run uvicorn rooftop_api.main:app --port 4701", cwd: `${REPO}/apps/api` }, "api", REPO)).toBe(true);
  });

  test("the reload worker of uvicorn is ours only inside apps/api of this repo", () => {
    expect(isOurs({ command: WORKER, cwd: `${REPO}/apps/api` }, "api", REPO)).toBe(true);
    expect(isOurs({ command: WORKER, cwd: "/Users/someone/code/other/apps/api" }, "api", REPO)).toBe(false);
    expect(isOurs({ command: WORKER, cwd: REPO }, "api", REPO)).toBe(false);
  });

  test("an unrelated program is never ours, even inside the repo", () => {
    expect(isOurs({ command: "python3 -m http.server 4701", cwd: "/tmp" }, "api", REPO)).toBe(false);
    expect(isOurs({ command: "python3 -m http.server 4701", cwd: `${REPO}/apps/api` }, "api", REPO)).toBe(false);
    expect(isOurs({ command: "python3 -m http.server 4700", cwd: `${REPO}/apps/web` }, "web", REPO)).toBe(false);
  });

  test("a process whose working directory cannot be read is not ours", () => {
    expect(isOurs({ command: "next-server (v16.2.11)", cwd: null }, "web", REPO)).toBe(false);
  });

  test("a repo whose name starts like ours is a different repo", () => {
    expect(isOurs({ command: "next-server (v16.2.11)", cwd: `${REPO}-old/apps/web` }, "web", REPO)).toBe(false);
  });
});
