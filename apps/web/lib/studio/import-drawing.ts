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
