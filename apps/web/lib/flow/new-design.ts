// A new design, built on Find or from a drawing (D118): its inverter is set by the app, which the run takes for its roof
// from Waaree's on-grid range, as its system voltage is set for the user's country (D87). Pure.
import type { Project } from "../api";

/** The document with its inverter set by the app, unless it has an inverter file of its own or says who set it. */
export function asANewDesign(document: Project): Project {
  if (document.ond_text || document.inverter_by) return document;
  return { ...document, inverter_by: "app" };
}
