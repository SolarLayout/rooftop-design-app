import { describe, expect, test } from "bun:test";
import { apiCommand, webBuildCommand, webCommand } from "./commands.ts";

const NEXT = "/repo/node_modules/next/dist/bin/next";
const NODE = "/opt/homebrew/bin/node";
const pair = { web: 4700, api: 4701 };

describe("the web app's commands", () => {
  test("in dev mode: next dev on the pair's web port", () => {
    expect(webCommand(NODE, NEXT, pair, false)).toEqual([NODE, [NEXT, "dev", "-p", "4700"]]);
  });

  test("built: next start on the pair's web port, after next build", () => {
    expect(webBuildCommand(NODE, NEXT)).toEqual([NODE, [NEXT, "build"]]);
    expect(webCommand(NODE, NEXT, pair, true)).toEqual([NODE, [NEXT, "start", "-p", "4700"]]);
  });
});

describe("the API's command", () => {
  test("in dev mode uvicorn reloads on a change under src, with the long keep-alive", () => {
    const [command, args] = apiCommand(pair, false);
    expect(command).toBe("uv");
    expect(args.slice(0, 5)).toEqual(["run", "uvicorn", "rooftop_api.main:app", "--host", "127.0.0.1"]);
    expect(args).toContain("--reload");
    expect(args).toContain("--reload-dir");
    expect(args.slice(args.indexOf("--port"), args.indexOf("--port") + 2)).toEqual(["--port", "4701"]);
    expect(args.slice(args.indexOf("--timeout-keep-alive"), args.indexOf("--timeout-keep-alive") + 2)).toEqual(["--timeout-keep-alive", "75"]);
  });

  test("built: the same without the reload", () => {
    const [, args] = apiCommand({ web: 4710, api: 4711 }, true);
    expect(args).not.toContain("--reload");
    expect(args).not.toContain("--reload-dir");
    expect(args.slice(args.indexOf("--port"), args.indexOf("--port") + 2)).toEqual(["--port", "4711"]);
  });
});
