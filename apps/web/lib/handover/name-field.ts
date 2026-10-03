// The name of the design as an edit of the document (plan/phase-09-plan.md, decision 13): trimmed, 200 characters at most
// as the API's Project.name, never empty. It asks neither the layout nor the run (lib/flow/edit-parts.ts). Pure.
import type { TextRules } from "../../components/ui/text-entry";
import type { Project } from "../api";

/** What the API's Project.name takes at most. */
export const LONGEST_NAME = 200;

export const NAME_RULES: TextRules = { maxLength: LONGEST_NAME, needed: "A name is needed" };

/** The document with *name*; the same document when the name is the same, so that nothing is committed. */
export function withName(document: Project, name: string): Project {
  return document.name === name ? document : { ...document, name };
}
