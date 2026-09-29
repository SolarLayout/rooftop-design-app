// Who holds a port, and is it one of ours? Uses lsof and ps; both ship with macOS and with the CI image.

import { spawnSync } from "node:child_process";
import { resolve, sep } from "node:path";

export type Service = "web" | "api";

export type PortHolder = {
  pid: number;
  /** Short name as lsof gives it, for example "node" or "Python". */
  name: string;
  /** Full command line from ps; falls back to the short name. */
  command: string;
  /** Working directory of the process; null when it cannot be read. */
  cwd: string | null;
};

/**
 * Reads the field output of `lsof -nP -iTCP:<port> -Fpcn` (one field per line: p<pid>, c<command>,
 * f<fd>, n<address>) and returns the processes that hold the port, in the order lsof listed them.
 *
 * A process holds the port when the local side of one of its sockets is on it: "127.0.0.1:4701",
 * "*:4700", "[::1]:4700", or the server side of a connection, "127.0.0.1:4701->127.0.0.1:55687".
 * Sockets that are bound but not listening yet count too: they block the port just the same.
 * A client connected to the port ("127.0.0.1:55687->127.0.0.1:4701") does not hold it.
 */
export function parseLsofFields(output: string, port: number): { pid: number; name: string }[] {
  const holders: { pid: number; name: string; holds: boolean }[] = [];
  let current: { pid: number; name: string; holds: boolean } | null = null;

  for (const line of output.split("\n")) {
    if (line.length < 2) continue;
    const field = line[0];
    const value = line.slice(1);
    if (field === "p") {
      const pid = Number(value);
      if (!Number.isInteger(pid) || pid <= 0) {
        current = null;
        continue;
      }
      current = holders.find((holder) => holder.pid === pid) ?? null;
      if (!current) {
        current = { pid, name: "", holds: false };
        holders.push(current);
      }
    } else if (field === "c" && current) {
      current.name = value;
    } else if (field === "n" && current) {
      const local = value.split("->")[0] ?? "";
      if (local.endsWith(`:${port}`)) current.holds = true;
    }
  }
  return holders.filter((holder) => holder.holds).map(({ pid, name }) => ({ pid, name }));
}

/** Reads the working directory from `lsof -a -p <pid> -d cwd -Fn`. */
export function parseLsofCwd(output: string): string | null {
  for (const line of output.split("\n")) {
    if (line.startsWith("n") && line.length > 1) return line.slice(1);
  }
  return null;
}

function isInside(directory: string | null, parent: string): boolean {
  if (!directory) return false;
  const child = resolve(directory);
  const base = resolve(parent);
  return child === base || child.startsWith(base + sep);
}

/**
 * True when the process is part of this repo's dev stack. Both signs are needed: it runs inside this
 * repo, and it looks like the right program. Anything else holding the port is left alone.
 *
 * web: Next renames its processes ("next-server (v16.2.11)"), so the command carries no path; the
 *      working directory is apps/web.
 * api: uvicorn is started from apps/api/.venv and names rooftop_api. Its reload worker is a Python
 *      multiprocessing child whose command names neither (on macOS the interpreter shows up under its
 *      framework path, not under .venv), so it is known by that shape and the working directory apps/api.
 */
export function isOurs(
  holder: Pick<PortHolder, "command" | "cwd">,
  service: Service,
  repoRoot: string,
): boolean {
  const command = holder.command;
  if (service === "web") {
    const looksLikeNext =
      /(^|[\s/])next-server\b/.test(command) ||
      /next\/dist\/bin\/next\b/.test(command) ||
      /(^|\s)next dev\b/.test(command);
    return looksLikeNext && isInside(holder.cwd, resolve(repoRoot, "apps/web"));
  }
  const venv = resolve(repoRoot, "apps/api/.venv") + sep;
  const looksLikeApi =
    command.includes(venv) ||
    /\buvicorn\b.*\brooftop_api\b/.test(command) ||
    /\bmultiprocessing\b.*(\bspawn_main\b|--multiprocessing-fork\b)/.test(command);
  return looksLikeApi && isInside(holder.cwd, resolve(repoRoot, "apps/api"));
}

function run(command: string, args: string[]): { ok: boolean; stdout: string; missing: boolean } {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const missing = (result.error as NodeJS.ErrnoException | undefined)?.code === "ENOENT";
  return { ok: result.status === 0, stdout: result.stdout ?? "", missing };
}

export function commandOf(pid: number): string | null {
  const result = run("ps", ["-ww", "-o", "command=", "-p", String(pid)]);
  const text = result.stdout.trim();
  return result.ok && text ? text : null;
}

export function parentOf(pid: number): number | null {
  const result = run("ps", ["-o", "ppid=", "-p", String(pid)]);
  const parent = Number(result.stdout.trim());
  return result.ok && Number.isInteger(parent) && parent > 0 ? parent : null;
}

export function groupOf(pid: number): number | null {
  const result = run("ps", ["-o", "pgid=", "-p", String(pid)]);
  const group = Number(result.stdout.trim());
  return result.ok && Number.isInteger(group) && group > 0 ? group : null;
}

/** Start time as ps prints it. With the pid it names one process for good, even after pid reuse. */
export function startedAtOf(pid: number): string | null {
  const result = run("ps", ["-o", "lstart=", "-p", String(pid)]);
  const text = result.stdout.trim();
  return result.ok && text ? text : null;
}

export function cwdOf(pid: number): string | null {
  return parseLsofCwd(run("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"]).stdout);
}

export function describe(pid: number, name = ""): PortHolder {
  return { pid, name, command: commandOf(pid) ?? name, cwd: cwdOf(pid) };
}

export class LsofMissingError extends Error {
  constructor() {
    super("lsof was not found. It is needed to see which process holds a port.");
  }
}

/** Every process holding the TCP port, listening or only bound. Empty when the port is free. */
export function portHolders(port: number): PortHolder[] {
  const result = run("lsof", ["-nP", `-iTCP:${port}`, "-Fpcn"]);
  if (result.missing) throw new LsofMissingError();
  return parseLsofFields(result.stdout, port).map(({ pid, name }) => describe(pid, name));
}

export function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}
