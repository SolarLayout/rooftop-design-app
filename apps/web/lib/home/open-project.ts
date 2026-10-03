// Open a project (plan/phase-10-plan.md, step 9, decision 4): an .rtd of the user is taken by its ending, read in the
// browser as text and sent to POST /project/open, where the engine's one reader reads it (formats 1 and 2); the project
// it answers is kept on this device as a new design and opened, which runs it as the flow runs any design; the notes come
// back in the API's words for the caller to say. The web parses no .rtd itself. Pure in what it decides: the ways to send
// and to keep are given to it.
import { ApiError, type Api, type Project, type ProjectFile } from "../api";

export const PROJECT_FILE_ENDING = ".rtd";

/** The dialog's own words for a file that is no project file by its ending: no request is made for it. */
export const NOT_A_PROJECT_FILE = "Choose a project file (.rtd).";

/** The browser could not read the file: words of the app, since the API never saw it. */
export const COULD_NOT_BE_READ = "The file could not be read. Choose another.";

/** Whether the file is a project file by its ending, whatever the case. */
export function isProjectFile(name: string): boolean {
  return name.length > PROJECT_FILE_ENDING.length && name.toLowerCase().endsWith(PROJECT_FILE_ENDING);
}

const KILOBYTE = 1024;
const MEGABYTE = KILOBYTE * KILOBYTE;

/** The size of a file in words: whole kilobytes under a megabyte, never under 1 ("48 KB"); megabytes with one decimal from there ("2.4 MB", a format 2 file embeds its weather). */
export function sizeWordsOf(bytes: number): string {
  if (bytes < MEGABYTE) return `${Math.max(1, Math.round(bytes / KILOBYTE))} KB`;
  return `${(bytes / MEGABYTE).toFixed(1)} MB`;
}

/** What the dialog says of the file it holds before Open: "Project file · 48 KB · read when it is opened". */
export function heldWordsOf(bytes: number): string {
  return `Project file · ${sizeWordsOf(bytes)} · read when it is opened`;
}

/** The request of POST /project/open from the file of the device: its name, and the text it holds. */
export async function requestOf(file: Pick<File, "name" | "text">): Promise<ProjectFile> {
  return { name: file.name, text: await file.text() };
}

type Ways = {
  api: Pick<Api, "openProject">;
  /** Keeps the project on this device as a new design and opens it (lib/device/saving.ts, keepAndOpen). */
  keep: (document: Project) => void;
};

/** Sends the file; the project it answers is kept and opened. Gives back the notes, in the API's words. A refusal is the caller's to show. */
export async function openProjectFile(file: ProjectFile, { api, keep }: Ways): Promise<string[]> {
  const { project, notes } = await api.openProject(file);
  keep(project);
  return notes;
}

export type Refusal = {
  /** Why the file was not opened: the API's words, or the app's for a fault that is not the API's. */
  words: string;
  /** The API was not reached, or the answer was not its: the same file may be sent again. A file the API refused would be refused again. */
  canTryAgain: boolean;
};

const MAY_BE_TRIED_AGAIN = new Set(["api_unreachable", "unexpected_answer"]);

export function refusalOf(error: unknown): Refusal {
  if (error instanceof ApiError) return { words: error.message, canTryAgain: MAY_BE_TRIED_AGAIN.has(error.code) };
  return { words: COULD_NOT_BE_READ, canTryAgain: false };
}
