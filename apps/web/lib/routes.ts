// The places of the app that have a name of their own in the address (docs/design/information-architecture.md).
import { placeInFull } from "./format/place";

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

/** Present: the tour of the design on the whole screen, without the shell (plan/phase-10-plan.md, decision 8). */
export const PRESENT = "/present";

/** Where a workspace is entered. The Studio is entered at `lens`: the one that was opened last. */
export function pathOfWorkspace(workspace: Workspace, lens: Lens) {
  if (workspace === "studio") return pathOfLens(lens);
  if (workspace === "handover") return HANDOVER;
  return "/performance" as const;
}

/** Find and outline: the map, the roof outlined on it (plan/phase-04-plan.md). */
export const FIND = "/find";

/** A place found for Find, carried in its address: Home's search leads there with it (plan/phase-10-plan.md, step 11). */
export type PlaceInAddress = {
  lat: number;
  lon: number;
  /** The place in words: the geocoder's label when it was found by words, the coordinates in full otherwise. */
  label: string;
  /** Found by words: the design takes the label as its name (D49). */
  byWords: boolean;
};

const AT = "at";
const PLACE = "place";

/** The address of Find: with a place, `/find?at=<lat>,<lon>`, and for a place found by words `&place=<label>` as well. */
export function pathOfFind(place: PlaceInAddress | null = null): string {
  if (place === null) return FIND;
  const params = new URLSearchParams({ [AT]: `${place.lat},${place.lon}` });
  if (place.byWords) params.set(PLACE, place.label);
  return `${FIND}?${params}`;
}

const isLatitude = (value: number) => Number.isFinite(value) && Math.abs(value) <= 90;
const isLongitude = (value: number) => Number.isFinite(value) && Math.abs(value) <= 180;

/** The place an address of Find carries; null without one, or with one that is no pair of coordinates. */
export function placeOfFindAddress(params: URLSearchParams): PlaceInAddress | null {
  const at = params.get(AT);
  if (at === null) return null;
  const parts = at.split(",");
  if (parts.length !== 2 || parts.some((part) => part.trim() === "")) return null;
  const [lat, lon] = parts.map(Number) as [number, number];
  if (!isLatitude(lat) || !isLongitude(lon)) return null;
  const label = params.get(PLACE);
  return label === null ? { lat, lon, label: placeInFull(lat, lon), byWords: false } : { lat, lon, label, byWords: true };
}

/** The workspace that an address is in, or null. */
export function workspaceOf(path: string): Workspace | null {
  const [, first] = path.split("/");
  return WORKSPACES.find((workspace) => workspace.id === first)?.id ?? null;
}
