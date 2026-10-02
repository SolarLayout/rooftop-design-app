// The stack: web (Next.js on Node) and API (uvicorn), in two profiles that never meet.
//
//   bun dev                     start the dev profile in this terminal; Ctrl+C stops both
//   bun dev:bg                  start it in the background, wait until healthy, print the URLs, return
//   bun dev:bg --profile test   the same for the test profile (tests and agents use this one)
//   bun stop                    stop the dev profile, including leftovers of a crashed run
//   bun stop --profile test     stop the test profile
//   bun stop --all              stop both
//   bun status                  show both profiles
//
// Profiles (tools/lib/profiles.ts): dev prefers web 4700 and api 4701, test prefers 4710 and 4711.
// When another program holds a preferred port, the next free pair of the profile's range is taken.
// Only processes of this repo's stack are ever stopped. Another program on a port is named and left alone.

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { envWithNode, nodeMissingMessage, resolveNode, type ResolvedNode } from "./lib/node.ts";
import { API_DIR, DEV_DIR, packageFile, REPO_ROOT, WEB_DIR } from "./lib/paths.ts";
import {
  commandOf,
  cwdOf,
  groupOf,
  holdersInRange,
  isAlive,
  isOurs,
  LsofMissingError,
  parentOf,
  startedAtOf,
  type PortHolder,
  type Service,
} from "./lib/ports.ts";
import {
  apiEnvOf,
  choosePair,
  mapKeyNote,
  pairsOf,
  PROFILES,
  rangeOf,
  selectProfiles,
  urlsOf,
  type Pair,
  type Profile,
  type ProfileName,
} from "./lib/profiles.ts";

const ORDER: Service[] = ["web", "api"];
const COLOURS: Record<Service, string> = { web: "\x1b[36m", api: "\x1b[35m" };

const useColour = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const RESET = useColour ? "\x1b[0m" : "";
const DIM = useColour ? "\x1b[2m" : "";
const tag = (service: Service) => (useColour ? `${COLOURS[service]}[${service}]${RESET}` : `[${service}]`);

const HEALTH_TIMEOUT_MS = 120_000;
const STOP_GRACE_MS = 6_000;

type PidEntry = { service: Service; pid: number; startedAt: string | null; port: number; command: string; log: string };
type PidFile = {
  version: 2;
  profile: ProfileName;
  mode: "foreground" | "detached";
  createdAt: string;
  ports: Pair;
  urls: { web: string; api: string };
  distDir: string;
  /** The `bun dev` process that owns the children; null in detached mode. */
  supervisor: { pid: number; startedAt: string | null } | null;
  services: PidEntry[];
};

const say = (text = "") => process.stdout.write(text + "\n");
const complain = (text = "") => process.stderr.write(text + "\n");
const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms));
const here = (path: string) => relative(REPO_ROOT, path);

// ---------------------------------------------------------------------------------------------
// Where a profile keeps its files

function filesOf(profile: Profile): { directory: string; pidFile: string; log: Record<Service, string> } {
  const directory = resolve(DEV_DIR, profile.name);
  return {
    directory,
    pidFile: resolve(directory, "pids.json"),
    log: { web: resolve(directory, "web.log"), api: resolve(directory, "api.log") },
  };
}

/** Before the profiles there was one stack, with its files directly in .dev/. It was the dev stack. */
const LEGACY_FILES = ["pids.json", "web.log", "api.log"].map((name) => resolve(DEV_DIR, name));

const stopCommand = (profile: Profile) => (profile.name === "dev" ? "bun stop" : `bun stop --profile ${profile.name}`);

// ---------------------------------------------------------------------------------------------
// Ports

type PortState = { port: number; service: Service; ours: PortHolder[]; foreign: PortHolder[] };

/** Every port of the profile's range that somebody holds, with the holders sorted into ours and not ours. */
function scan(profile: Profile): PortState[] {
  const { first, last } = rangeOf(profile);
  const held = holdersInRange(first, last);
  const states: PortState[] = [];
  for (const pair of pairsOf(profile)) {
    for (const service of ORDER) {
      const port = pair[service];
      const holders = held.get(port) ?? [];
      if (holders.length === 0) continue;
      states.push({
        port,
        service,
        ours: holders.filter((holder) => isOurs(holder, service, REPO_ROOT)),
        foreign: holders.filter((holder) => !isOurs(holder, service, REPO_ROOT)),
      });
    }
  }
  return states;
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

/**
 * The pair our own stack of this profile runs on, when it is whole: our web and our api on the two
 * ports of one pair, and nothing else of ours anywhere in the range. Null otherwise.
 */
function wholeStack(profile: Profile, states: PortState[]): Pair | null {
  const ours = states.filter((state) => state.ours.length > 0);
  if (ours.length !== 2) return null;
  return (
    pairsOf(profile).find((pair) => ours.some((state) => state.port === pair.web) && ours.some((state) => state.port === pair.api)) ??
    null
  );
}

// ---------------------------------------------------------------------------------------------
// Pid file

function readPidFile(profile: Profile): PidFile | null {
  const candidates = [filesOf(profile).pidFile, ...(profile.name === "dev" ? [LEGACY_FILES[0] as string] : [])];
  for (const path of candidates) {
    try {
      const parsed = JSON.parse(readFileSync(path, "utf8")) as PidFile;
      if (parsed && Array.isArray(parsed.services)) return parsed;
    } catch {
      // Missing or unreadable: try the next place.
    }
  }
  return null;
}

function writePidFile(profile: Profile, file: PidFile): void {
  mkdirSync(filesOf(profile).directory, { recursive: true });
  writeFileSync(filesOf(profile).pidFile, JSON.stringify(file, null, 2) + "\n");
}

function removePidFile(profile: Profile): void {
  rmSync(filesOf(profile).pidFile, { force: true });
  if (profile.name === "dev") for (const path of LEGACY_FILES) rmSync(path, { force: true });
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

async function stopProfile(profile: Profile): Promise<number> {
  const stopped: string[] = [];
  const file = readPidFile(profile);
  const { first, last } = rangeOf(profile);

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
        stopped.push(`${entry.service} on ${entry.port} (pid ${entry.pid})`);
      } else if (groupIsAlive(entry.pid) && groupMembersAreOurs(entry.pid, entry.service)) {
        // The leader died, the rest of its group did not.
        await stopGroup(entry.pid);
        stopped.push(`${entry.service} on ${entry.port} (leftovers of pid ${entry.pid})`);
      }
    }
  }

  // Leftovers of a crashed run: whatever of ours still holds a port anywhere in the profile's range.
  for (const state of scan(profile)) {
    for (const holder of state.ours) {
      if (!isAlive(holder.pid)) continue;
      const pids = withOurParents(holder, state.service);
      await stopProcesses(pids);
      stopped.push(`${state.service} leftover on ${state.port} (pid ${pids.join(", ")})`);
    }
  }

  removePidFile(profile);

  if (stopped.length === 0) say(`${profile.name}: nothing of this stack was running.`);
  else say(`${profile.name}: stopped ${stopped.join("; ")}.`);

  const after = scan(profile);
  const stillOurs = after.flatMap((state) => state.ours.map((holder) => `port ${state.port}: ${holderLine(holder)}`));
  if (stillOurs.length > 0) {
    complain(`${profile.name}: could not stop\n  ${stillOurs.join("\n  ")}`);
    return 1;
  }
  const others = after.flatMap((state) => state.foreign.map((holder) => `port ${state.port}  ${holderLine(holder)}`));
  if (others.length > 0) {
    say(`${profile.name}: nothing of ours is left on ports ${first} to ${last}. Other programs there were left alone:`);
    for (const line of others) say(`  ${line}`);
  } else {
    say(`${profile.name}: ports ${first} to ${last} are free.`);
  }
  return 0;
}

async function stop(profiles: Profile[]): Promise<number> {
  let code = 0;
  for (const profile of profiles) code = Math.max(code, await stopProfile(profile));
  return code;
}

// ---------------------------------------------------------------------------------------------
// Status

async function status(): Promise<number> {
  say("SolarLayout Rooftop stacks");
  for (const profile of Object.values(PROFILES)) {
    const { first, last } = rangeOf(profile);
    const preferred = pairsOf(profile)[0] as Pair;
    say("");
    say(`${profile.name} profile  (ports ${first} to ${last}, prefers web ${preferred.web} and api ${preferred.api})`);

    const states = scan(profile);
    const ours = states.filter((state) => state.ours.length > 0);
    if (ours.length === 0) say("  not running");
    for (const state of ours) {
      const url = state.service === "web" ? `http://localhost:${state.port}` : `http://127.0.0.1:${state.port}/health`;
      const healthy = await isHealthy(url);
      say(`  ${state.service}  port ${state.port}  running, ${healthy ? "healthy" : "not answering"}  ${url}`);
      for (const holder of state.ours) say(`       ${holderLine(holder)}`);
    }
    if (ours.length > 0 && !wholeStack(profile, states)) {
      say(`  This is not a whole stack (leftovers, or still starting). \`${stopCommand(profile)}\` clears it.`);
    }
    const running = wholeStack(profile, states);
    const note = running ? mapKeyNote(profile, running.web) : null;
    if (note) say(note.replace(/^/gm, "  "));

    for (const state of states) {
      for (const holder of state.foreign) {
        say(`  port ${state.port}  held by another program (not part of this stack)`);
        say(`       ${holderLine(holder)}`);
      }
    }

    const file = readPidFile(profile);
    if (file) {
      const live = file.services.filter((entry) => stillThatProcess(entry.pid, entry.startedAt));
      const ports = file.ports ? `web ${file.ports.web}, api ${file.ports.api}, ` : "";
      say(
        `  pid file: ${here(filesOf(profile).pidFile)}, ${ports}${file.mode}, started ${file.createdAt}, ` +
          `${live.length} of ${file.services.length} processes alive`,
      );
    } else {
      say("  pid file: none");
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------------------------
// Starting

function missingPrerequisite(node: ResolvedNode | null): string | null {
  if (!node) return nodeMissingMessage();
  if (!Bun.which("uv")) return "uv was not found on PATH. It runs the API. Install it: https://docs.astral.sh/uv/";
  if (!nextBin()) return "Dependencies are not installed. Run `bun install` first.";
  if (!existsSync(resolve(API_DIR, "pyproject.toml"))) return "apps/api/pyproject.toml is missing.";
  return null;
}

const nextBin = () => packageFile("next", "dist/bin/next", WEB_DIR);

type Child = {
  service: Service;
  port: number;
  healthUrl: string;
  log: string;
  process: ChildProcess;
  exit: { code: number | null; signal: string | null } | null;
};

function prefixLines(child: Child, stream: NodeJS.ReadableStream | null, file: NodeJS.WritableStream): void {
  if (!stream) return;
  let rest = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk: string) => {
    file.write(chunk);
    const lines = (rest + chunk).split("\n");
    rest = lines.pop() ?? "";
    for (const line of lines) process.stdout.write(`${tag(child.service)} ${line}\n`);
  });
  stream.on("end", () => {
    if (rest) process.stdout.write(`${tag(child.service)} ${rest}\n`);
  });
}

function launch(service: Service, profile: Profile, pair: Pair, node: ResolvedNode, detach: boolean): Child {
  const urls = urlsOf(pair);
  const log = filesOf(profile).log[service];
  const env: NodeJS.ProcessEnv = {
    ...envWithNode(node),
    NEXT_TELEMETRY_DISABLED: "1",
    PYTHONUNBUFFERED: "1",
    // Read by apps/web/next.config.ts: where /api/* goes, and where Next builds.
    ROOFTOP_PROFILE: profile.name,
    ROOFTOP_WEB_PORT: String(pair.web),
    ROOFTOP_API_PORT: String(pair.api),
    ROOFTOP_DIST_DIR: profile.distDir,
    PORT: String(pair[service]),
    ...(service === "api" ? apiEnvOf(profile) : {}),
  };
  delete env.VIRTUAL_ENV;
  if (!detach && useColour) env.FORCE_COLOR = "1";

  const [command, args, cwd] =
    service === "web"
      ? ([node.path, [nextBin() ?? "next", "dev", "-p", String(pair.web)], WEB_DIR] as const)
      : ([
          "uv",
          ["run", "uvicorn", "rooftop_api.main:app", "--host", "127.0.0.1", "--port", String(pair.api), "--reload", "--reload-dir", "src"],
          API_DIR,
        ] as const);

  let child: ChildProcess;
  if (detach) {
    const fd = openSync(log, "w");
    child = spawn(command, [...args], { cwd, env, detached: true, stdio: ["ignore", fd, fd] });
    closeSync(fd);
    child.unref();
  } else {
    child = spawn(command, [...args], { cwd, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  }

  const started: Child = {
    service,
    port: pair[service],
    healthUrl: service === "web" ? urls.web : urls.apiHealth,
    log,
    process: child,
    exit: null,
  };
  child.on("exit", (code, signalName) => {
    started.exit = { code, signal: signalName };
  });
  child.on("error", (error) => {
    started.exit = { code: 1, signal: null };
    complain(`${tag(service)} could not start: ${error.message}`);
  });
  if (!detach) {
    const file = createWriteStream(log, { flags: "w" });
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
        return `${child.service} stopped while starting (${how}).`;
      }
      if (!healthy.has(child.service) && (await isHealthy(child.healthUrl))) healthy.add(child.service);
    }
    if (healthy.size === children.length) return null;
    await sleep(250);
  }
  const missing = children.filter((child) => !healthy.has(child.service)).map((child) => child.healthUrl);
  return `No answer within ${HEALTH_TIMEOUT_MS / 1000} s from ${missing.join(" and ")}.`;
}

function logTail(path: string, lines = 25): string {
  try {
    return readFileSync(path, "utf8").trimEnd().split("\n").slice(-lines).join("\n");
  } catch {
    return "";
  }
}

function printUrls(profile: Profile, pair: Pair): void {
  const urls = urlsOf(pair);
  say("");
  say(`  web  ${urls.web}`);
  say(`  api  ${urls.apiHealth}`);
  say("");
  const note = mapKeyNote(profile, pair.web);
  if (note) {
    say(note);
    say("");
  }
}

async function start(profile: Profile, detach: boolean): Promise<number> {
  const name = `${profile.name} stack`;
  const { first, last } = rangeOf(profile);
  const states = scan(profile);

  // 1. Our own stack of this profile, or what is left of it.
  const ours = states.filter((state) => state.ours.length > 0);
  if (ours.length > 0) {
    const running = wholeStack(profile, states);
    const urls = running ? urlsOf(running) : null;
    if (running && urls && (await isHealthy(urls.web)) && (await isHealthy(urls.apiHealth))) {
      say(`The ${name} is already running.`);
      for (const state of ours) for (const holder of state.ours) say(`  ${state.service}  port ${state.port}  ${holderLine(holder)}`);
      printUrls(profile, running);
      if (detach) return 0;
      complain(`It runs in the background or in another terminal. Run \`${stopCommand(profile)}\` first to start it here.`);
      return 1;
    }
    const lines = [`The ${name}, or a leftover of it, already holds a port and does not answer as a whole stack:`];
    for (const state of ours) for (const holder of state.ours) lines.push(`  port ${state.port} (${state.service})  ${holderLine(holder)}`);
    lines.push(`If it is still starting, wait. Otherwise run \`${stopCommand(profile)}\` first, then start again.`);
    complain(lines.join("\n"));
    return 1;
  }

  // 2. Ports held by other programs: take the next free pair.
  const busy = new Set(states.filter((state) => state.foreign.length > 0).map((state) => state.port));
  const choice = choosePair(profile, busy);
  const holdersOf = (port: number) => states.find((state) => state.port === port)?.foreign ?? [];

  if (!choice.ok) {
    const lines = [`Cannot start the ${name}: every pair of ports from ${first} to ${last} is taken by other programs.`];
    for (const passed of choice.passedOver) {
      for (const port of passed.busy) for (const holder of holdersOf(port)) lines.push(`  port ${port}  ${holderLine(holder)}`);
    }
    lines.push("They are not part of this stack, so they were left alone. Free one pair (both ports), then start again.");
    complain(lines.join("\n"));
    return 1;
  }
  const pair = choice.pair;

  const node = resolveNode();
  const missing = missingPrerequisite(node);
  if (missing || !node) {
    complain(missing ?? nodeMissingMessage());
    return 1;
  }

  for (const passed of choice.passedOver) {
    for (const port of passed.busy) {
      say(`Port ${port} (${port === passed.pair.web ? "web" : "api"}) is held by another program:`);
      for (const holder of holdersOf(port)) say(`  ${holderLine(holder)}`);
    }
  }
  if (choice.passedOver.length > 0) {
    say(`Left alone. Using the next free pair instead: web ${pair.web}, api ${pair.api}.`);
  }

  const files = filesOf(profile);
  mkdirSync(files.directory, { recursive: true });
  say(`${DIM}Node ${node.version} at ${node.path}${RESET}`);
  say(`Starting the ${name}: web on ${pair.web}, api on ${pair.api}${detach ? ", in the background" : ""}.`);

  const children = ORDER.map((service) => launch(service, profile, pair, node, detach));
  const urls = urlsOf(pair);
  writePidFile(profile, {
    version: 2,
    profile: profile.name,
    mode: detach ? "detached" : "foreground",
    createdAt: new Date().toISOString(),
    ports: pair,
    urls: { web: urls.web, api: urls.api },
    distDir: profile.distDir,
    supervisor: detach ? null : { pid: process.pid, startedAt: startedAtOf(process.pid) },
    services: children.map((child) => ({
      service: child.service,
      pid: child.process.pid ?? -1,
      startedAt: child.process.pid ? startedAtOf(child.process.pid) : null,
      port: child.port,
      command: [child.process.spawnfile, ...child.process.spawnargs.slice(1)].join(" "),
      log: here(child.log),
    })),
  });

  let shuttingDown = false;
  const stopChildren = () => Promise.all(children.map((child) => (child.process.pid ? stopGroup(child.process.pid) : undefined)));
  const shutDown = async (code: number, reason?: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (reason) say(reason);
    await stopChildren();
    removePidFile(profile);
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
    complain(`The ${name} did not come up: ${failure}`);
    if (detach) {
      for (const child of children) {
        const tail = logTail(child.log);
        if (tail) complain(`\nLast lines of ${here(child.log)}:\n${tail}`);
      }
    }
    shuttingDown = true;
    await stopChildren();
    removePidFile(profile);
    // A port taken in the moment between the check and the start shows up here.
    for (const state of scan(profile)) {
      if (state.port !== pair.web && state.port !== pair.api) continue;
      for (const holder of state.foreign) {
        complain(`\nPort ${state.port} (${state.service}) is held by another program:\n  ${holderLine(holder)}`);
      }
    }
    return 1;
  }

  say("Both are up.");
  printUrls(profile, pair);

  if (detach) {
    say(`Logs: ${here(files.log.web)}, ${here(files.log.api)}. Stop with \`${stopCommand(profile)}\`.`);
    return 0;
  }

  say(`${DIM}Ctrl+C stops both.${RESET}`);
  // Foreground: stay until a child stops by itself, then stop the other.
  while (!shuttingDown) {
    const gone = children.find((child) => child.exit);
    if (gone) {
      const how = gone.exit?.signal ? `signal ${gone.exit.signal}` : `exit code ${gone.exit?.code}`;
      await shutDown(1, `${gone.service} stopped (${how}).`);
    }
    await sleep(300);
  }
  return await new Promise<number>(() => {});
}

// ---------------------------------------------------------------------------------------------

const USAGE = `Usage: bun tools/dev.ts <start [--detach] | stop [--all] | status> [--profile dev|test]

  bun dev                     start the dev profile (web 4700, api 4701) in this terminal
  bun dev:bg                  start it in the background and return when it answers
  bun dev:bg --profile test   the same for the test profile (web 4710, api 4711)
  bun stop                    stop the dev profile
  bun stop --profile test     stop the test profile
  bun stop --all              stop both
  bun status                  show both profiles

The profile can also be set with ROOFTOP_PROFILE. When another program holds a port, the next free
pair in the profile's range of ten ports is used.`;

async function main(): Promise<number> {
  const [command, ...flags] = process.argv.slice(2);
  if (command === undefined || command === "--help" || command === "help") {
    say(USAGE);
    return 0;
  }

  const selection = selectProfiles(flags, process.env);
  if (!selection.ok) {
    complain(selection.error);
    return 2;
  }
  const profiles = selection.names.map((name) => PROFILES[name]);

  switch (command) {
    case "start":
      if (profiles.length !== 1) {
        complain("Start one profile at a time: --all only goes with stop.");
        return 2;
      }
      return start(profiles[0] as Profile, flags.includes("--detach"));
    case "stop":
      return stop(profiles);
    case "status":
      return status();
    default:
      say(USAGE);
      return 2;
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
