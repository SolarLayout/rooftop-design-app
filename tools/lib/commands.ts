// The commands of the two halves of the stack, as pure values: tools/dev.ts spawns them. In dev mode the web app
// is `next dev` and uvicorn reloads on a change under src; built, the web app is `next build` once and then
// `next start`, and uvicorn runs without the reload (plan/phase-11-plan.md, decision 5).

import type { Pair } from "./profiles.ts";

export type Command = [command: string, args: string[]];

export function webBuildCommand(node: string, nextBin: string): Command {
  return [node, [nextBin, "build"]];
}

export function webCommand(node: string, nextBin: string, pair: Pair, built: boolean): Command {
  return [node, [nextBin, built ? "start" : "dev", "-p", String(pair.web)]];
}

export function apiCommand(pair: Pair, built: boolean): Command {
  return [
    "uv",
    [
      "run",
      "uvicorn",
      "rooftop_api.main:app",
      "--host",
      "127.0.0.1",
      "--port",
      String(pair.api),
      // A keep-alive well past the proxy's: uvicorn's 5 s closed idle connections just as the web app's rewrite
      // reused them, and the browser got the proxy's "Internal Server Error" (socket hang up, ECONNRESET) now and
      // then for an answer the API had given with 200. The proxy drops its idle sockets first now.
      "--timeout-keep-alive",
      "75",
      ...(built ? [] : ["--reload", "--reload-dir", "src"]),
    ],
  ];
}
