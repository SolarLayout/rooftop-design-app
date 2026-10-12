// The browser tests in groups, each keyed on what its suites can see. One turbo task per group
// (`//#e2e:<id>`, the root script `e2e:<id>`), so that a change to one folder of the web app runs the
// suites that can see it and no other. A suite belongs to a group by its file name; a name that matches
// no group is refused, so that a new suite is placed on purpose (tools/check/e2e-groups.test.ts holds
// turbo.json and package.json equal to this file).

export type GroupId = "kit" | "find" | "studio" | "performance" | "handover" | "home" | "present" | "shell";

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
  // The files at the root of lib, named one by one: a new file there is placed by hand (the test says when one is not).
  "apps/web/lib/clock*.ts",
  "apps/web/lib/routes*.ts",
  "apps/web/lib/api/**",
  "apps/web/lib/stores/**",
  "apps/web/lib/flow/**",
  "apps/web/lib/format/**",
  // The search for a place and its provider: Find's, Home's and Import a drawing's (plan/phase-11-plan.md, decision 4).
  "apps/web/lib/places/**",
  // The engine's metres and the 3D palette: Find's, the Studio's, the stores', the device's thumbnails' and Home's alike
  // (plan/phase-11-plan.md, decision 4, widened by the session).
  "apps/web/lib/geometry/**",
  // The designs kept on the device: the shell saves and opens them, so every page can see them (plan/phase-10-plan.md, decision 12).
  "apps/web/lib/device/**",
  // The in-app help (D80): its registry and its topics, opened from the headings of every workspace's panels.
  "apps/web/lib/help/**",
  // The docs' address and pages (D91): the help sheet, the project menu and Home link to them.
  "apps/web/lib/docs/**",
  // The installed app's name, colours, mark and icons (issue 147): the manifest and the head of every page.
  "apps/web/lib/brand/**",
  // The user's country and a new design's system voltage (D87): the stores open designs on every page.
  "apps/web/lib/country/**",
  // The words of the work explained in a line (D96): the steps in the top bar and the titles of every workspace.
  "apps/web/lib/words/**",
  // The words of every problem the app shows (V2 · 5, D101): the result chip, the steps' heads, the dialogs, on every page.
  "apps/web/lib/errors/**",
  "apps/web/content/**",
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

/** The pictures of a group: every baseline whose name begins with the group's, on every platform and size. */
export const baselinesOf = (id: GroupId): string => `e2e/baselines/*/*/${id}*.png`;
/** Whether an input pattern names pictures, as against folders of the web app or of e2e. */
export const isBaselines = (pattern: string): boolean => pattern.startsWith("e2e/baselines/");

// A group's own inputs are its folders, the folders of the groups it crosses into, and its own pictures alone: a
// picture belongs to the group whose name it begins with, taken by that group's screens suite (plan/phase-11-plan.md,
// decision 1). The folders are composed apart from the pictures, so that a change to find.png runs find, not every
// group that sees Find's folders.
const KIT_FOLDERS = ["apps/web/components/kit/**"];
// The pictures and the clips of the help's how-tos (e2e/help-pictures, D81; e2e/help-clips, Phase 15) are made on Find by
// hand, never by the check: placed here so that every file of e2e is seen.
const FIND_FOLDERS = ["apps/web/components/find/**", "apps/web/lib/map/**", "apps/web/lib/outline/**", "e2e/help-pictures/**", "e2e/help-clips/**"];
// Build and the Roof lens's Edit cross into Find; strings-lens and build import e2e/find.ts.
const STUDIO_FOLDERS = [
  "apps/web/components/studio/**",
  "apps/web/components/scene/**",
  "apps/web/lib/scene/**",
  "apps/web/lib/studio/**",
  // The equipment library's picker opens from the Array and Strings lenses' cards (D75).
  "apps/web/lib/equipment/**",
  ...FIND_FOLDERS,
];
// performance.e2e.ts chooses a voltage in the Strings lens; performance-weather builds a roof on the map.
const PERFORMANCE_FOLDERS = ["apps/web/components/performance/**", "apps/web/lib/performance/**", ...STUDIO_FOLDERS];
const HANDOVER_FOLDERS = ["apps/web/components/handover/**", "apps/web/lib/handover/**"];
// Home and the dialogs it shares with the project switcher (Open a project), which the shell opens on every page: the
// shell imports the dialog, so a change to it runs home and shell (plan/phase-10-plan.md, decision 12). Home's search is
// Find's, and "Find my roof" leads to the map at the place: home.e2e.ts crosses into Find, as performance's suites do.
const HOME_FOLDERS = ["apps/web/components/home/**", "apps/web/lib/home/**", ...FIND_FOLDERS];
// Present reuses the Studio's stage (plan/phase-10-plan.md, decisions 8 and 12): it sees the Studio's folders. The soak
// of Present (e2e/soak) is run by hand, never by the check; it is placed here so that every file of e2e is seen.
const PRESENT_FOLDERS = ["apps/web/components/present/**", "apps/web/lib/present/**", "e2e/soak/**", ...STUDIO_FOLDERS];
// The shell's suites open every workspace (device*.e2e.ts, routes, smoke): this group runs whenever anything of the web
// changed. Its pictures are the shell's own (the project switcher, Import a drawing, Saved on this device); each
// workspace's pictures are its own group's.
const SHELL_FOLDERS = [...new Set([...KIT_FOLDERS, ...FIND_FOLDERS, ...STUDIO_FOLDERS, ...PERFORMANCE_FOLDERS, ...HANDOVER_FOLDERS, ...HOME_FOLDERS, ...PRESENT_FOLDERS])];

export const GROUPS: readonly Group[] = [
  { id: "kit", suites: ["kit.e2e.ts", "kit-*.e2e.ts"], own: [...KIT_FOLDERS, baselinesOf("kit")] },
  { id: "find", suites: ["find.e2e.ts", "find-screens.e2e.ts", "outline.e2e.ts", "by-hand.e2e.ts", "obstacles.e2e.ts"], own: [...FIND_FOLDERS, baselinesOf("find")] },
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
      "studio-layers.e2e.ts",
      "studio-screens.e2e.ts",
      "sun-*.e2e.ts",
      "time.e2e.ts",
    ],
    own: [...STUDIO_FOLDERS, baselinesOf("studio")],
  },
  { id: "performance", suites: ["performance*.e2e.ts"], own: [...PERFORMANCE_FOLDERS, baselinesOf("performance")] },
  { id: "handover", suites: ["handover*.e2e.ts"], own: [...HANDOVER_FOLDERS, baselinesOf("handover")] },
  { id: "home", suites: ["home*.e2e.ts"], own: [...HOME_FOLDERS, baselinesOf("home")] },
  { id: "present", suites: ["present*.e2e.ts"], own: [...PRESENT_FOLDERS, baselinesOf("present")] },
  {
    id: "shell",
    // device*.e2e.ts opens every workspace and the map: the group that sees them all.
    suites: ["api-client.e2e.ts", "device*.e2e.ts", "fonts.e2e.ts", "routes.e2e.ts", "screens.e2e.ts", "shell.e2e.ts", "smoke.e2e.ts", "tokens.e2e.ts"],
    own: [...SHELL_FOLDERS, baselinesOf("shell")],
  },
];

const GROUP_NAMES = GROUPS.map((group) => group.id).join(", ");

/** The one group among `owners`, or the error that says why there is none: no owner, or more than one. */
function theOwner(owners: Group[], what: string, file: string, howToPlace: string): GroupId {
  if (owners.length === 1) return owners[0]!.id;
  const trouble = owners.length === 0 ? "belongs to no group" : `is claimed by ${owners.map((group) => group.id).join(" and ")}`;
  throw new Error(`The ${what} ${file} ${trouble}. Every ${what} belongs to exactly one of the groups ${GROUP_NAMES} by its name: ${howToPlace}.`);
}

/** The group a suite of e2e/tests belongs to, by its file name. Throws when no group claims it. */
export function groupOf(file: string): GroupId {
  const owners = GROUPS.filter((group) => group.suites.some((pattern) => new Bun.Glob(pattern).match(file)));
  return theOwner(owners, "browser suite", file, "place it in tools/check/e2e-groups.ts");
}

/**
 * The group a baseline belongs to, by the name its file begins with (`e2e/baselines/<platform>/<size>/<group>-<what>.png`,
 * from the repo's root). Throws when no group's name begins it, so that a picture is never keyed on no group at all.
 */
export function groupOfBaseline(file: string): GroupId {
  const owners = GROUPS.filter((group) => new Bun.Glob(baselinesOf(group.id)).match(file));
  return theOwner(owners, "baseline", file, "name it for the group whose screens suite takes it (<group>-<what>.png), or shell-<what>.png for the shell's");
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
