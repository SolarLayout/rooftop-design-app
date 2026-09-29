// The dev stack: web (Next.js on Node, port 4700) and API (uvicorn, port 4701).
//
//   bun dev       start both in this terminal; Ctrl+C stops both
//   bun dev:bg    start both in the background, wait until healthy, print the URLs, return
//   bun stop      stop both, including leftovers of a crashed run
//   bun status    show what is running on the two ports
//
// Only processes of this repo's stack are ever stopped. Another program holding a port is named and
// left alone.

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { envWithNode, nodeMissingMessage, resolveNode, type ResolvedNode } from "./lib/node.ts";
import {
  API_DIR,
  API_HEALTH_URL,
  API_PORT,
  DEV_DIR,
  packageFile,
  PID_FILE,
  REPO_ROOT,
  WEB_DIR,
  WEB_PORT,
  WEB_URL,
} from "./lib/paths.ts";
import {
  commandOf,
  cwdOf,
  groupOf,
  isAlive,
  isOurs,
  LsofMissingError,
  parentOf,
  portHolders,
  startedAtOf,
  type PortHolder,
  type Service,
} from "./lib/ports.ts";

type ServiceInfo = { service: Service; port: number; url: string; healthUrl: string; log: string; colour: string };

const SERVICES: Record<Service, ServiceInfo> = {
  web: { service: "web", port: WEB_PORT, url: WEB_URL, healthUrl: WEB_URL, log: resolve(DEV_DIR, "web.log"), colour: "\x1b[36m" },
  api: { service: "api", port: API_PORT, url: API_HEALTH_URL, healthUrl: API_HEALTH_URL, log: resolve(DEV_DIR, "api.log"), colour: "\x1b[35m" },
};
const ORDER: Service[] = ["web", "api"];

const useColour = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const RESET = useColour ? "\x1b[0m" : "";
const DIM = useColour ? "\x1b[2m" : "";
const tag = (service: Service) => (useColour ? `${SERVICES[service].colour}[${service}]${RESET}` : `[${service}]`);

const HEALTH_TIMEOUT_MS = 120_000;
const STOP_GRACE_MS = 6_000;

type PidEntry = { service: Service; pid: number; startedAt: string | null; port: number; command: string; log: string };
type PidFile = {
  version: 1;
  mode: "foreground" | "detached";
  createdAt: string;
  /** The `bun dev` process that owns the children; null in detached mode. */
  supervisor: { pid: number; startedAt: string | null } | null;
  services: PidEntry[];
};

const say = (text = "") => process.stdout.write(text + "\n");
const complain = (text = "") => process.stderr.write(text + "\n");
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));

// ---------------------------------------------------------------------------------------------
// Ports

type PortState = { info: ServiceInfo; ours: PortHolder[]; foreign: PortHolder[] };

function inspect(): PortState[] {
  return ORDER.map((service) => {
    const info = SERVICES[service];
    const holders = portHolders(info.port);
    return {
      info,
      ours: holders.filter((holder) => isOurs(holder, service, REPO_ROOT)),
      foreign: holders.filter((holder) => !isOurs(holder, service, REPO_ROOT)),
    };
  });
}

const holderLine = (holder: PortHolder) => `pid ${holder.pid}  ${holder.command}`;

async function isHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000), redirect: "manual" });
    return response.status === 200;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------------------------
// Pid file

function readPidFile(): PidFile | null {
  try {
    const parsed = JSON.parse(readFileSync(PID_FILE, "utf8")) as PidFile;
    return parsed && Array.isArray(parsed.services) ? parsed : null;
  } catch {
    return null;
  }
}

function writePidFile(file: PidFile): void {
  mkdirSync(DEV_DIR, { recursive: true });
  writeFileSync(PID_FILE, JSON.stringify(file, null, 2) + "\n");
}

function removePidFile(): void {
  rmSync(PID_FILE, { force: true });
}

/** The pid still names the process we started: alive, and started at the recorded moment. */
function stillThatProcess(pid: number, startedAt: string | null): boolean {
  return isAlive(pid) && startedAt !== null && startedAtOf(pid) === startedAt;
}

// ---------------------------------------------------------------------------------------------
// Stopping

function signal(target: number, name: NodeJS.Signals): void {
  try {
    process.kill(target, name);
  } catch {
    // Already gone, which is what we want.
  }
}

function groupIsAlive(group: number): boolean {
  try {
    process.kill(-group, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** Stops a child we started ourselves. It leads its own process group, so the whole group goes. */
async function stopGroup(pid: number): Promise<void> {
  const leadsGroup = groupOf(pid) === pid;
  const target = leadsGroup ? -pid : pid;
  const alive = () => (leadsGroup ? groupIsAlive(pid) : isAlive(pid));

  signal(target, "SIGTERM");
  const deadline = Date.now() + STOP_GRACE_MS;
  while (alive() && Date.now() < deadline) await sleep(100);
  if (alive()) {
    signal(target, "SIGKILL");
    const hardDeadline = Date.now() + 2_000;
    while (alive() && Date.now() < hardDeadline) await sleep(50);
  }
}

/** Stops single processes (leftovers found on a port), politely first. */
async function stopProcesses(pids: number[]): Promise<void> {
  for (const pid of pids) signal(pid, "SIGTERM");
  const deadline = Date.now() + STOP_GRACE_MS;
  while (pids.some(isAlive) && Date.now() < deadline) await sleep(100);
  for (const pid of pids.filter(isAlive)) signal(pid, "SIGKILL");
  const hardDeadline = Date.now() + 2_000;
  while (pids.some(isAlive) && Date.now() < hardDeadline) await sleep(50);
}

/** A leftover on a port, plus the parents that belong to the same service (`next dev`, `uv run`). */
function withOurParents(holder: PortHolder, service: Service): number[] {
  const pids = [holder.pid];
  let parent = parentOf(holder.pid);
  for (let depth = 0; parent !== null && parent > 1 && depth < 6; depth++) {
    const command = commandOf(parent);
    if (!command || !isOurs({ command, cwd: cwdOf(parent) }, service, REPO_ROOT)) break;
    pids.push(parent);
    parent = parentOf(parent);
  }
  return pids;
}

async function stop(): Promise<number> {
  const stopped: string[] = [];
  const file = readPidFile();

  if (file) {
    const supervisor = file.supervisor;
    if (supervisor && supervisor.pid !== process.pid && stillThatProcess(supervisor.pid, supervisor.startedAt)) {
      // A `bun dev` in some terminal: ask it to shut down, it stops its own children.
      signal(supervisor.pid, "SIGTERM");
      const deadline = Date.now() + STOP_GRACE_MS + 3_000;
      while (isAlive(supervisor.pid) && Date.now() < deadline) await sleep(100);
      if (!isAlive(supervisor.pid)) stopped.push(`web and api of the \`bun dev\` in the foreground (pid ${supervisor.pid})`);
    }
    for (const entry of file.services) {
      if (stillThatProcess(entry.pid, entry.startedAt)) {
        await stopGroup(entry.pid);
        stopped.push(`${entry.service} (pid ${entry.pid})`);
      } else if (groupIsAlive(entry.pid) && groupMembersAreOurs(entry.pid, entry.service)) {
        // The leader died, the rest of its group did not.
        await stopGroup(entry.pid);
        stopped.push(`${entry.service} (leftovers of pid ${entry.pid})`);
      }
    }
  }

  // Leftovers of a crashed run: whatever of ours still holds a port.
  const leftAlone: string[] = [];
  for (const state of inspect()) {
    for (const holder of state.ours) {
      if (!isAlive(holder.pid)) continue;
      const pids = withOurParents(holder, state.info.service);
      await stopProcesses(pids);
      stopped.push(`${state.info.service} leftover (pid ${pids.join(", ")})`);
    }
    for (const holder of state.foreign) {
      leftAlone.push(
        `Port ${state.info.port} (${state.info.service}) is held by another program, which was left alone:\n  ${holderLine(holder)}`,
      );
    }
  }

  removePidFile();

  if (stopped.length === 0) say("Nothing of the dev stack was running.");
  else say(`Stopped: ${stopped.join("; ")}.`);

  const after = inspect();
  const stillOurs = after.flatMap((state) => state.ours.map((holder) => `port ${state.info.port}: ${holderLine(holder)}`));
  if (stillOurs.length > 0) {
    complain(`Could not stop:\n  ${stillOurs.join("\n  ")}`);
    return 1;
  }
  if (leftAlone.length > 0) {
    complain(leftAlone.join("\n"));
    return 1;
  }
  say(`Ports ${WEB_PORT} and ${API_PORT} are free.`);
  return 0;
}

function groupMembersAreOurs(group: number, service: Service): boolean {
  const result = spawnSync("ps", ["-ax", "-o", "pid=,pgid="], { encoding: "utf8" });
  if (result.status !== 0) return false;
  const members = result.stdout
    .split("\n")
    .map((line) => line.trim().split(/\s+/).map(Number))
    .filter(([, pgid]) => pgid === group)
    .map(([pid]) => pid as number);
  return (
    members.length > 0 &&
    members.every((pid) => {
      const command = commandOf(pid);
      return command !== null && isOurs({ command, cwd: cwdOf(pid) }, service, REPO_ROOT);
    })
  );
}

// ---------------------------------------------------------------------------------------------
// Status

async function status(): Promise<number> {
  say("SolarLayout Rooftop dev stack");
  for (const state of inspect()) {
    const { info } = state;
    const head = `  ${info.service}  port ${info.port}  `;
    if (state.ours.length === 0 && state.foreign.length === 0) {
      say(`${head}not running`);
      continue;
    }
    if (state.ours.length > 0) {
      const healthy = await isHealthy(info.healthUrl);
      say(`${head}running, ${healthy ? "healthy" : "not answering yet"}  ${info.url}`);
      for (const holder of state.ours) say(`       ${holderLine(holder)}`);
    }
    for (const holder of state.foreign) {
      say(`${head}held by another program (not part of this stack)`);
      say(`       ${holderLine(holder)}`);
    }
  }
  const file = readPidFile();
  if (file) {
    const live = file.services.filter((entry) => stillThatProcess(entry.pid, entry.startedAt));
    say(
      `  pid file: ${relative(REPO_ROOT, PID_FILE)}, ${file.mode}, started ${file.createdAt}, ` +
        `${live.length} of ${file.services.length} processes alive`,
    );
  } else {
    say("  pid file: none");
  }
  return 0;
}

// ---------------------------------------------------------------------------------------------
// Starting

function refuseIfBusy(states: PortState[]): string | null {
  const foreign = states.filter((state) => state.foreign.length > 0);
  if (foreign.length > 0) {
    const lines = ["Cannot start the dev stack."];
    for (const state of foreign) {
      lines.push(`Port ${state.info.port} (${state.info.service}) is already in use by another program:`);
      for (const holder of state.foreign) lines.push(`  ${holderLine(holder)}`);
    }
    lines.push("It is not part of this dev stack, so it was left alone. Stop it, then start again.");
    return lines.join("\n");
  }
  const ours = states.filter((state) => state.ours.length > 0);
  if (ours.length > 0) {
    const lines = ["The dev stack, or a leftover of it, already holds a port:"];
    for (const state of ours) {
      for (const holder of state.ours) lines.push(`  port ${state.info.port} (${state.info.service})  ${holderLine(holder)}`);
    }
    lines.push("Run `bun stop` first, then start again.");
    return lines.join("\n");
  }
  return null;
}

function missingPrerequisite(node: ResolvedNode | null): string | null {
  if (!node) return nodeMissingMessage();
  if (!Bun.which("uv")) return "uv was not found on PATH. It runs the API. Install it: https://docs.astral.sh/uv/";
  if (!nextBin()) return "Dependencies are not installed. Run `bun install` first.";
  if (!existsSync(resolve(API_DIR, "pyproject.toml"))) return "apps/api/pyproject.toml is missing.";
  return null;
}

const nextBin = () => packageFile("next", "dist/bin/next", WEB_DIR);

type Child = { info: ServiceInfo; process: ChildProcess; exit: { code: number | null; signal: string | null } | null };

function prefixLines(child: Child, stream: NodeJS.ReadableStream | null, file: NodeJS.WritableStream): void {
  if (!stream) return;
  let rest = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk: string) => {
    file.write(chunk);
    const lines = (rest + chunk).split("\n");
    rest = lines.pop() ?? "";
    for (const line of lines) process.stdout.write(`${tag(child.info.service)} ${line}\n`);
  });
  stream.on("end", () => {
    if (rest) process.stdout.write(`${tag(child.info.service)} ${rest}\n`);
  });
}

function launch(service: Service, node: ResolvedNode, detach: boolean): Child {
  const info = SERVICES[service];
  const env: NodeJS.ProcessEnv = {
    ...envWithNode(node),
    NEXT_TELEMETRY_DISABLED: "1",
    PYTHONUNBUFFERED: "1",
  };
  delete env.VIRTUAL_ENV;
  if (!detach && useColour) env.FORCE_COLOR = "1";

  const [command, args, cwd] =
    service === "web"
      ? ([node.path, [nextBin() ?? "next", "dev", "-p", String(WEB_PORT)], WEB_DIR] as const)
      : ([
          "uv",
          ["run", "uvicorn", "rooftop_api.main:app", "--host", "127.0.0.1", "--port", String(API_PORT), "--reload", "--reload-dir", "src"],
          API_DIR,
        ] as const);

  let child: ChildProcess;
  if (detach) {
    const fd = openSync(info.log, "w");
    child = spawn(command, [...args], { cwd, env, detached: true, stdio: ["ignore", fd, fd] });
    closeSync(fd);
    child.unref();
  } else {
    child = spawn(command, [...args], { cwd, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  }

  const started: Child = { info, process: child, exit: null };
  child.on("exit", (code, signalName) => {
    started.exit = { code, signal: signalName };
  });
  child.on("error", (error) => {
    started.exit = { code: 1, signal: null };
    complain(`${tag(service)} could not start: ${error.message}`);
  });
  if (!detach) {
    const file = createWriteStream(info.log, { flags: "w" });
    prefixLines(started, child.stdout, file);
    prefixLines(started, child.stderr, file);
  }
  return started;
}

async function waitUntilHealthy(children: Child[]): Promise<string | null> {
  const deadline = Date.now() + HEALTH_TIMEOUT_MS;
  const healthy = new Set<Service>();
  while (Date.now() < deadline) {
    for (const child of children) {
      if (child.exit) {
        const how = child.exit.signal ? `signal ${child.exit.signal}` : `exit code ${child.exit.code}`;
        return `${child.info.service} stopped while starting (${how}).`;
      }
      if (!healthy.has(child.info.service) && (await isHealthy(child.info.healthUrl))) healthy.add(child.info.service);
    }
    if (healthy.size === children.length) return null;
    await sleep(250);
  }
  const missing = children.filter((child) => !healthy.has(child.info.service)).map((child) => child.info.healthUrl);
  return `No answer within ${HEALTH_TIMEOUT_MS / 1000} s from ${missing.join(" and ")}.`;
}

function logTail(path: string, lines = 25): string {
  try {
    return readFileSync(path, "utf8").trimEnd().split("\n").slice(-lines).join("\n");
  } catch {
    return "";
  }
}

function printUrls(): void {
  say("");
  say(`  web  ${WEB_URL}`);
  say(`  api  ${API_HEALTH_URL}`);
  say("");
}

async function start(detach: boolean): Promise<number> {
  const states = inspect();

  const allOurs = states.every((state) => state.ours.length > 0 && state.foreign.length === 0);
  if (allOurs && (await Promise.all(states.map((state) => isHealthy(state.info.healthUrl)))).every(Boolean)) {
    say("The dev stack is already running.");
    for (const state of states) for (const holder of state.ours) say(`  ${state.info.service}  ${holderLine(holder)}`);
    printUrls();
    if (detach) return 0;
    complain("It runs in the background or in another terminal. Run `bun stop` first to start it here.");
    return 1;
  }

  const refusal = refuseIfBusy(states);
  if (refusal) {
    complain(refusal);
    return 1;
  }

  const node = resolveNode();
  const missing = missingPrerequisite(node);
  if (missing || !node) {
    complain(missing ?? nodeMissingMessage());
    return 1;
  }

  mkdirSync(DEV_DIR, { recursive: true });
  say(`${DIM}Node ${node.version} at ${node.path}${RESET}`);
  say(`Starting web on ${WEB_PORT} and api on ${API_PORT}${detach ? " in the background" : ""}.`);

  const children = ORDER.map((service) => launch(service, node, detach));
  writePidFile({
    version: 1,
    mode: detach ? "detached" : "foreground",
    createdAt: new Date().toISOString(),
    supervisor: detach ? null : { pid: process.pid, startedAt: startedAtOf(process.pid) },
    services: children.map((child) => ({
      service: child.info.service,
      pid: child.process.pid ?? -1,
      startedAt: child.process.pid ? startedAtOf(child.process.pid) : null,
      port: child.info.port,
      command: [child.process.spawnfile, ...child.process.spawnargs.slice(1)].join(" "),
      log: relative(REPO_ROOT, child.info.log),
    })),
  });

  let shuttingDown = false;
  const shutDown = async (code: number, reason?: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (reason) say(reason);
    await Promise.all(children.map((child) => (child.process.pid ? stopGroup(child.process.pid) : undefined)));
    removePidFile();
    say("Stopped web and api.");
    process.exit(code);
  };
  if (!detach) {
    // Asked to stop is not a failure: exit code 0, so bun prints no error line after Ctrl+C.
    process.on("SIGINT", () => void shutDown(0, "\nStopping."));
    process.on("SIGTERM", () => void shutDown(0, "Stopping."));
    process.on("SIGHUP", () => void shutDown(0, "Stopping."));
  }

  const failure = await waitUntilHealthy(children);
  if (shuttingDown) return await new Promise<number>(() => {});
  if (failure) {
    complain(`The dev stack did not come up: ${failure}`);
    if (detach) {
      for (const child of children) {
        const tail = logTail(child.info.log);
        if (tail) complain(`\nLast lines of ${relative(REPO_ROOT, child.info.log)}:\n${tail}`);
      }
    }
    shuttingDown = true;
    await Promise.all(children.map((child) => (child.process.pid ? stopGroup(child.process.pid) : undefined)));
    removePidFile();
    // A port taken in the moment between the check and the start shows up here.
    for (const state of inspect()) {
      for (const holder of state.foreign) {
        complain(`\nPort ${state.info.port} (${state.info.service}) is held by another program:\n  ${holderLine(holder)}`);
      }
    }
    return 1;
  }

  say("Both are up.");
  printUrls();

  if (detach) {
    say(`Logs: ${relative(REPO_ROOT, SERVICES.web.log)}, ${relative(REPO_ROOT, SERVICES.api.log)}. Stop with \`bun stop\`.`);
    return 0;
  }

  say(`${DIM}Ctrl+C stops both.${RESET}`);
  // Foreground: stay until a child stops by itself, then stop the other.
  while (!shuttingDown) {
    const gone = children.find((child) => child.exit);
    if (gone) {
      const how = gone.exit?.signal ? `signal ${gone.exit.signal}` : `exit code ${gone.exit?.code}`;
      await shutDown(1, `${gone.info.service} stopped (${how}).`);
    }
    await sleep(300);
  }
  return await new Promise<number>(() => {});
}

// ---------------------------------------------------------------------------------------------

const USAGE = `Usage: bun tools/dev.ts <start [--detach] | stop | status>

  bun dev       start web (${WEB_PORT}) and api (${API_PORT}) in this terminal
  bun dev:bg    start both in the background and return when they answer
  bun stop      stop both
  bun status    show what is running`;

async function main(): Promise<number> {
  const [command, ...flags] = process.argv.slice(2);
  switch (command) {
    case "start":
      return start(flags.includes("--detach"));
    case "stop":
      return stop();
    case "status":
      return status();
    default:
      say(USAGE);
      return command === undefined || command === "--help" || command === "help" ? 0 : 2;
  }
}

if (import.meta.main) {
  try {
    process.exit(await main());
  } catch (error) {
    if (error instanceof LsofMissingError) complain(error.message);
    else complain(`dev: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
