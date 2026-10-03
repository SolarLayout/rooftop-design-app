// The browser tests in groups, each keyed on what its suites can see. One turbo task per group
// (`//#e2e:<id>`, the root script `e2e:<id>`), so that a change to one folder of the web app runs the
// suites that can see it and no other. A suite belongs to a group by its file name; a name that matches
// no group is refused, so that a new suite is placed on purpose (tools/check/e2e-groups.test.ts holds
// turbo.json and package.json equal to this file).

export type GroupId = "kit" | "find" | "studio" | "performance" | "handover" | "home" | "shell";

export type Group = {
  id: GroupId;
  /** The suites, as globs over the file name in e2e/tests. */
  suites: string[];
  /** The group's own inputs, beside BASE_INPUTS. */
  own: string[];
};

/** What every suite can see: the shell and the pages around every workspace, the API, the stack. */
export const BASE_INPUTS: string[] = [
  "apps/web/app/**",
  "apps/web/components/shell/**",
  "apps/web/components/ui/**",
  "apps/web/components/*",
  // The files at the root of lib, named: turbo applies an exclusion to every input of a task, so the
  // Studio's roof-card.ts and scene-palette.ts cannot be taken out of `lib/*` without taking them out of
  // the Studio's own inputs too. A new file there is placed by hand (the test says when one is not).
  "apps/web/lib/clock*.ts",
  "apps/web/lib/routes*.ts",
  "apps/web/lib/api/**",
  "apps/web/lib/stores/**",
  "apps/web/lib/flow/**",
  "apps/web/lib/format/**",
  // The designs kept on the device: the shell saves and opens them, so every page can see them (plan/phase-10-plan.md, decision 12).
  "apps/web/lib/device/**",
  "apps/web/public/**",
  "apps/web/*",
  "!apps/web/CLAUDE.md",
  "!apps/web/.next*/**",
  "!apps/web/*.tsbuildinfo",
  "!apps/web/next-env.d.ts",
  "packages/api-types/**",
  "apps/api/src/**",
  "apps/api/pyproject.toml",
  "apps/api/uv.lock",
  "apps/api/.python-version",
  "e2e/*.ts",
  "e2e/package.json",
  "e2e/tsconfig.json",
  "e2e/fixtures/**",
  "!e2e/test-results/**",
  "!e2e/playwright-report/**",
  "tools/dev.ts",
  "tools/lib/**",
  "tools/with-node.ts",
  "bun.lock",
  ".nvmrc",
  "!**/node_modules/**",
  "!**/.turbo/**",
  "!**/__pycache__/**",
];

const KIT_BASELINES = "e2e/baselines/*/*/kit*.png";
const KIT_OWN = ["apps/web/components/kit/**", KIT_BASELINES];
const FIND_OWN = ["apps/web/components/find/**", "apps/web/lib/map/**", "apps/web/lib/outline/**"];
// Build and the Roof lens's Edit cross into Find; strings-lens and build import e2e/find.ts.
const STUDIO_OWN = [
  "apps/web/components/studio/**",
  "apps/web/components/scene/**",
  "apps/web/lib/scene/**",
  "apps/web/lib/studio/**",
  "apps/web/lib/roof-card*.ts",
  "apps/web/lib/scene-palette*.ts",
  ...FIND_OWN,
];
// performance.e2e.ts chooses a voltage in the Strings lens; performance-weather builds a roof on the map.
const PERFORMANCE_OWN = ["apps/web/components/performance/**", "apps/web/lib/performance/**", ...STUDIO_OWN];
const HANDOVER_OWN = ["apps/web/components/handover/**", "apps/web/lib/handover/**"];
// Home and the dialogs it shares with the project switcher (Open a project), which the shell opens on every page: the
// shell imports the dialog, so a change to it runs home and shell (plan/phase-10-plan.md, decision 12).
const HOME_OWN = ["apps/web/components/home/**", "apps/web/lib/home/**"];
// The screens suite pictures every page but the kit's, whose pictures the kit suite takes: this group runs
// whenever anything of the web changed.
const SHELL_OWN = [
  ...new Set([...KIT_OWN, ...FIND_OWN, ...STUDIO_OWN, ...PERFORMANCE_OWN, ...HANDOVER_OWN, ...HOME_OWN].filter((pattern) => pattern !== KIT_BASELINES)),
  "e2e/baselines/*/*/*.png",
  `!${KIT_BASELINES}`,
];

export const GROUPS: readonly Group[] = [
  { id: "kit", suites: ["kit.e2e.ts", "kit-*.e2e.ts"], own: KIT_OWN },
  { id: "find", suites: ["find.e2e.ts", "outline.e2e.ts", "by-hand.e2e.ts", "obstacles.e2e.ts"], own: FIND_OWN },
  {
    id: "studio",
    suites: [
      "array-lens.e2e.ts",
      "build.e2e.ts",
      "history.e2e.ts",
      "lens-switches.e2e.ts",
      "manipulation.e2e.ts",
      "modules.e2e.ts",
      "roof-lens.e2e.ts",
      "selection.e2e.ts",
      "shade-map.e2e.ts",
      "shadow-outlines.e2e.ts",
      "shell-vitals.e2e.ts",
      "stage.e2e.ts",
      "strings-*.e2e.ts",
      "sun-*.e2e.ts",
      "time.e2e.ts",
    ],
    own: STUDIO_OWN,
  },
  { id: "performance", suites: ["performance*.e2e.ts"], own: PERFORMANCE_OWN },
  { id: "handover", suites: ["handover*.e2e.ts"], own: HANDOVER_OWN },
  { id: "home", suites: ["home*.e2e.ts"], own: HOME_OWN },
  {
    id: "shell",
    // device*.e2e.ts opens every workspace and the map: the group that sees them all.
    suites: ["api-client.e2e.ts", "device*.e2e.ts", "fonts.e2e.ts", "routes.e2e.ts", "screens.e2e.ts", "shell.e2e.ts", "smoke.e2e.ts", "tokens.e2e.ts"],
    own: SHELL_OWN,
  },
];

const GROUP_NAMES = GROUPS.map((group) => group.id).join(", ");

/** The group a suite of e2e/tests belongs to, by its file name. Throws when no group claims it. */
export function groupOf(file: string): GroupId {
  const owners = GROUPS.filter((group) => group.suites.some((pattern) => new Bun.Glob(pattern).match(file)));
  if (owners.length === 1) return owners[0]!.id;
  const trouble = owners.length === 0 ? "belongs to no group" : `is claimed by ${owners.map((group) => group.id).join(" and ")}`;
  throw new Error(
    `The browser suite ${file} ${trouble}. Every suite belongs to exactly one of the groups ${GROUP_NAMES} by its name: ` +
      "place it in tools/check/e2e-groups.ts.",
  );
}

export function groupById(id: string): Group | null {
  return GROUPS.find((group) => group.id === id) ?? null;
}

/** The turbo inputs of a group's task: the base, the group's suites, then its own inputs. */
export function inputsOf(group: Group): string[] {
  return [...BASE_INPUTS, ...group.suites.map((pattern) => `e2e/tests/${pattern}`), ...group.own];
}

/**
 * The group's suites among the files of e2e/tests, as arguments for `playwright test` run in e2e. Every
 * suite is placed first (groupOf), so that a stray file is refused rather than left out.
 */
export function suitesOf(group: Group, files: string[]): string[] {
  const suites = files.filter((file) => file.endsWith(".e2e.ts")).sort();
  return suites.filter((file) => groupOf(file) === group.id).map((file) => `tests/${file}`);
}

export const taskOf = (group: Group): string => `//#e2e:${group.id}`;
export const scriptOf = (group: Group): string => `e2e:${group.id}`;

/** The group's name from its task id, for the check's summary; any other task id as it is. */
export function groupNameOf(taskId: string): string {
  const group = GROUPS.find((candidate) => taskOf(candidate) === taskId);
  return group ? group.id : taskId;
}
