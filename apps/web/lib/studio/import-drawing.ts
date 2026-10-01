// Import a drawing (plan/phase-05-plan.md, step 13, decision 13): a KMZ, KML or DXF goes to /roof/import as
// base64, the whole document it answers is opened, and the heights the file could not give go on the
// list to review in the Roof lens. The refusal of the API is the caller's to show.
import type { Api, RoofFile } from "../api";
import type { ProjectStore } from "../stores/project-store";
import type { ViewStore } from "../stores/view-store";

export type DrawingKind = "kmz" | "dxf";

export type Drawing = { name: string; base64: string; units?: RoofFile["units"] };

type Stores = { api: Pick<Api, "importRoof">; project: ProjectStore; view: ViewStore };

/** What a file is by its ending; null when it is no drawing the API reads. */
export function kindOfDrawing(name: string): DrawingKind | null {
  const ending = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (ending === "dxf") return "dxf";
  if (ending === "kmz" || ending === "kml") return "kmz";
  return null;
}

/** Sends the drawing, opens its document, lists the heights to review; gives back the API's notes. */
export async function importDrawing({ name, base64, units }: Drawing, { api, project, view }: Stores): Promise<string[]> {
  const answer = await api.importRoof(units === undefined ? { name, base64 } : { name, base64, units });
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

/** What the dialog says of a file it holds before it is read: "DXF · 48 KB · read when the roof is opened". */
export function heldWordsOf(name: string, bytes: number): string {
  return `${kindWordOf(name)} · ${Math.max(1, Math.round(bytes / KILOBYTE))} KB · read when the roof is opened`;
}

/** The base64 of a data URL, as FileReader.readAsDataURL gives one. */
export function base64OfDataUrl(url: string): string {
  const comma = url.indexOf(",");
  if (!url.startsWith("data:") || comma === -1) throw new Error("The file could not be read.");
  return url.slice(comma + 1);
}
