// Profiles of the stack. Each has its own ports, pid file, logs and Next build directory, so the
// developer's `bun dev` and the tests (or an agent) can run at the same time without meeting.
//
//   dev    web 4700, api 4701, then 4702/4703 ... 4708/4709    .dev/dev/     .next         next dev, uvicorn --reload
//   test   web 4710, api 4711, then 4712/4713 ... 4718/4719    .dev/test/    .next-test    the same, for the tests and agents
//   start  the dev ports                                       .dev/start/   .next-start   next build then next start, uvicorn without reload
//
// `start` runs the app as production does, on this machine (plan/phase-11-plan.md, decision 5): the laptop fallback of the
// stand and the local proof of the build. It shares the dev range, so the two never run at once; tools/dev.ts refuses the
// second. `--built` asks the same of any profile (the test stack is measured on the build that way).
//
// Everything here is a pure function of its arguments; tools/dev.ts does the looking and the starting.

export type ProfileName = "dev" | "test" | "start";
export type Pair = { web: number; api: number };

export type Profile = {
  name: ProfileName;
  /** Web port of the preferred pair; the api port is the next one. */
  first: number;
  /** Next's build directory, relative to apps/web. One per profile: Next locks it while running. */
  distDir: string;
  /** `dev`: next dev and uvicorn reloading on a change; `built`: next build then next start, uvicorn without reload. */
  mode: "dev" | "built";
};

export const PAIRS_PER_PROFILE = 5;

export const PROFILES: Record<ProfileName, Profile> = {
  dev: { name: "dev", first: 4700, distDir: ".next", mode: "dev" },
  test: { name: "test", first: 4710, distDir: ".next-test", mode: "dev" },
  start: { name: "start", first: 4700, distDir: ".next-start", mode: "built" },
};

export const PROFILE_NAMES = Object.keys(PROFILES) as ProfileName[];

/** The only web port the Esri key of the owner accepts as a referrer. */
export const MAP_KEY_WEB_PORT = 4700;

/** The pairs of a profile, preferred one first. */
export function pairsOf(profile: Profile): Pair[] {
  return Array.from({ length: PAIRS_PER_PROFILE }, (_, index) => ({
    web: profile.first + 2 * index,
    api: profile.first + 2 * index + 1,
  }));
}

export function rangeOf(profile: Profile): { first: number; last: number } {
  return { first: profile.first, last: profile.first + 2 * PAIRS_PER_PROFILE - 1 };
}

/** The other profiles on the same ports (dev and start): only one of them can run at a time. */
export function rangeMatesOf(profile: Profile): Profile[] {
  return PROFILE_NAMES.map((name) => PROFILES[name]).filter((other) => other.name !== profile.name && other.first === profile.first);
}

/** Whether the stack is built and served as production does: the profile's own mode, or `--built` asked for it. */
export function isBuilt(profile: Profile, args: readonly string[]): boolean {
  return profile.mode === "built" || args.includes("--built");
}

/** Whether the port serves the web app or the API in its pair; null outside the profile's range. */
export function roleOf(profile: Profile, port: number): "web" | "api" | null {
  const { first, last } = rangeOf(profile);
  if (!Number.isInteger(port) || port < first || port > last) return null;
  return (port - first) % 2 === 0 ? "web" : "api";
}

export type PassedOver = { pair: Pair; busy: number[] };
export type PairChoice =
  | { ok: true; pair: Pair; passedOver: PassedOver[] }
  | { ok: false; passedOver: PassedOver[] };

/**
 * Picks the pair to start on: the first pair of the profile of which both ports are free.
 * `busy` holds the ports that are taken (bound or listening). Pairs that were passed over come back
 * with the ports that made them unusable, so the caller can name the holders. When every pair is
 * taken the answer is a refusal.
 */
export function choosePair(profile: Profile, busy: ReadonlySet<number>): PairChoice {
  const passedOver: PassedOver[] = [];
  for (const pair of pairsOf(profile)) {
    const taken = [pair.web, pair.api].filter((port) => busy.has(port));
    if (taken.length === 0) return { ok: true, pair, passedOver };
    passedOver.push({ pair, busy: taken });
  }
  return { ok: false, passedOver };
}

/**
 * What the API of a profile is told through its environment, besides its port. The test stack never
 * downloads weather: a browser test that misses a route is refused in words by the API
 * (rooftop_api.settings) instead of reaching PVGIS unseen (plan/phase-08-plan.md, decision 13). The dev
 * stack is told nothing, so the owner's app downloads as it should.
 */
export function apiEnvOf(profile: Profile): Record<string, string> {
  return profile.name === "test" ? { ROOFTOP_WEATHER_DOWNLOADS: "off" } : {};
}

export function urlsOf(pair: Pair): { web: string; api: string; apiHealth: string } {
  return {
    web: `http://localhost:${pair.web}`,
    api: `http://127.0.0.1:${pair.api}`,
    apiHealth: `http://127.0.0.1:${pair.api}/health`,
  };
}

/**
 * The note about the satellite map, or null when none is needed. Only the dev and start profiles show a map to
 * a person; tests never touch the network.
 */
export function mapKeyNote(profile: Profile, webPort: number): string | null {
  if (profile.name === "test" || webPort === MAP_KEY_WEB_PORT) return null;
  return [
    `Note: the web app is on port ${webPort}, not ${MAP_KEY_WEB_PORT}. The Esri key only accepts`,
    `http://localhost:${MAP_KEY_WEB_PORT} and http://127.0.0.1:${MAP_KEY_WEB_PORT}, so the satellite map will be refused on`,
    `this port until port ${MAP_KEY_WEB_PORT} is free again (then \`bun stop --profile ${profile.name}\` and start again), or until`,
    `http://localhost:${webPort} is added to the key's referrers in the Esri portal.`,
  ].join("\n");
}

export type ProfileSelection = { ok: true; names: ProfileName[] } | { ok: false; error: string };

/**
 * Reads the profile from the arguments and the environment. `--profile test` and `--profile=test`
 * both work; the flag wins over ROOFTOP_PROFILE; without either it is dev. `--all` means every profile.
 */
export function selectProfiles(args: readonly string[], env: Record<string, string | undefined>): ProfileSelection {
  if (args.includes("--all")) return { ok: true, names: [...PROFILE_NAMES] };

  let wanted: string | undefined;
  let source = "";
  for (let index = 0; index < args.length; index++) {
    const argument = args[index] ?? "";
    if (argument === "--profile") {
      wanted = args[index + 1] ?? "";
      source = "--profile";
    } else if (argument.startsWith("--profile=")) {
      wanted = argument.slice("--profile=".length);
      source = "--profile";
    }
  }
  if (wanted === undefined && env.ROOFTOP_PROFILE) {
    wanted = env.ROOFTOP_PROFILE;
    source = "ROOFTOP_PROFILE";
  }
  if (wanted === undefined) return { ok: true, names: ["dev"] };
  if ((PROFILE_NAMES as string[]).includes(wanted)) return { ok: true, names: [wanted as ProfileName] };
  return { ok: false, error: `Unknown profile "${wanted}" (from ${source}). Profiles: ${PROFILE_NAMES.join(", ")}.` };
}
