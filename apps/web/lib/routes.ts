// The places of the app that have a name of their own in the address (docs/design/information-architecture.md).

/** The three workspaces. They share one project and one top bar. */
export const WORKSPACES = [
  { id: "studio", name: "Studio" },
  { id: "performance", name: "Performance" },
  { id: "handover", name: "Handover" },
] as const;

export type Workspace = (typeof WORKSPACES)[number]["id"];

/** The lenses of the Studio, in the order of the work. */
export const LENSES = [
  { id: "roof", name: "Roof" },
  { id: "array", name: "Array" },
  { id: "sun", name: "Sun" },
  { id: "strings", name: "Strings" },
] as const;

export type Lens = (typeof LENSES)[number]["id"];

/** What Handover delivers, in the order of its list. */
export const HANDOVER_ITEMS = [
  { id: "report", name: "Design report" },
  { id: "single-line-diagram", name: "Single-line diagram" },
  { id: "bill-of-materials", name: "Bill of materials" },
  { id: "cable-schedule", name: "DC cable schedule" },
  { id: "cad-layout", name: "CAD layout" },
  { id: "earth-model", name: "Google Earth model" },
  { id: "hourly-data", name: "Hourly data" },
  { id: "project-file", name: "Project file" },
] as const;

export type HandoverItem = (typeof HANDOVER_ITEMS)[number]["id"];

export const FIRST_LENS: Lens = LENSES[0].id;
export const FIRST_ITEM: HandoverItem = HANDOVER_ITEMS[0].id;

export function isLens(value: string): value is Lens {
  return LENSES.some((lens) => lens.id === value);
}

export function isHandoverItem(value: string): value is HandoverItem {
  return HANDOVER_ITEMS.some((item) => item.id === value);
}

export const pathOfLens = (lens: Lens) => `/studio/${lens}` as const;
export const pathOfItem = (item: HandoverItem) => `/handover/${item}` as const;

/**
 * The list of Handover (plan/phase-09-plan.md, decision 3): on desktop and tablet with the first item's preview beside
 * it, on phone the list alone. An item's own address is `pathOfItem`.
 */
export const HANDOVER = "/handover";

/** Where a workspace is entered. The Studio is entered at `lens`: the one that was opened last. */
export function pathOfWorkspace(workspace: Workspace, lens: Lens) {
  if (workspace === "studio") return pathOfLens(lens);
  if (workspace === "handover") return HANDOVER;
  return "/performance" as const;
}

/** The workspace that an address is in, or null. */
export function workspaceOf(path: string): Workspace | null {
  const [, first] = path.split("/");
  return WORKSPACES.find((workspace) => workspace.id === first)?.id ?? null;
}
