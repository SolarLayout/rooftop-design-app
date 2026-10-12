// Import a drawing (plan/phase-05-plan.md, step 13, decision 13): a KMZ, KML or DXF goes to /roof/import as
// base64, the whole document it answers is opened, and the heights the file could not give go on the
// list to review in the Roof lens. The refusal of the API is the caller's to show; a drawing too large to reach the
// deployed API is refused before it is sent (#179, item 6).
import type { Api, RoofFile } from "../api";
import type { ProjectStore } from "../stores/project-store";
import type { ViewStore } from "../stores/view-store";
import { MAX_REQUEST_BYTES } from "./open-project";

export type DrawingKind = "kmz" | "dxf";

/** A drawing to import; a DXF comes with its units and its place, which the file does not hold. */
export type Drawing = { name: string; base64: string; units?: RoofFile["units"]; lat?: number; lon?: number };

type Stores = { api: Pick<Api, "importRoof">; project: ProjectStore; view: ViewStore };

/** What a file is by its ending; null when it is no drawing the API reads. */
export function kindOfDrawing(name: string): DrawingKind | null {
  const ending = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ending === "dxf") return "dxf";
  if (ending === "kmz" || ending === "kml") return "kmz";
  return null;
}

/** The dialog's own words for a drawing whose request would pass MAX_REQUEST_BYTES: about 4.7 MB of file once in base64. */
export const DRAWING_TOO_LARGE = "The app can send a drawing of about 4.7 MB at most. Save this one with only the roof and its obstacles, then choose it again.";

/** The request of POST /roof/import: the units and the place only where they are given. */
function requestOf({ name, base64, units, lat, lon }: Drawing): RoofFile {
  return { name, base64, ...(units === undefined ? {} : { units }), ...(lat === undefined || lon === undefined ? {} : { lat, lon }) };
}

/**
 * Whether the drawing's request can reach the deployed API at all: its JSON in UTF-8 within MAX_REQUEST_BYTES. Over it,
 * AWS answers a 413 of its own before the API sees the file, in a form the app cannot read.
 */
export function drawingFits(drawing: Drawing): boolean {
  return new TextEncoder().encode(JSON.stringify(requestOf(drawing))).length <= MAX_REQUEST_BYTES;
}

/** Sends the drawing, opens its document, lists the heights to review; gives back the API's notes. */
export async function importDrawing(drawing: Drawing, { api, project, view }: Stores): Promise<string[]> {
  const answer = await api.importRoof(requestOf(drawing));
  project.getState().open(answer.project);
  view.getState().setToReview(answer.missing_heights);
  return answer.notes;
}

const KILOBYTE = 1024;

/** The ending of a file name in capitals, "DXF"; "File" where it has none. */
function kindWordOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1).toUpperCase() : "File";
}

/** What the dialog says of a file it holds before it is read: "DXF · 48 KB". */
export function heldWordsOf(name: string, bytes: number): string {
  return `${kindWordOf(name)} · ${Math.max(1, Math.round(bytes / KILOBYTE))} KB`;
}

/** The base64 of a data URL, as FileReader.readAsDataURL gives one. */
export function base64OfDataUrl(url: string): string {
  const comma = url.indexOf(",");
  if (!url.startsWith("data:") || comma === -1) throw new Error("The file could not be read.");
  return url.slice(comma + 1);
}
