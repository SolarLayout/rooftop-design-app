// Open a project (plan/phase-10-plan.md, step 9, decision 4): an .rtd of the user is taken by its ending, read in the
// browser as text and sent to POST /project/open as soon as it is chosen, where the engine's one reader reads it
// (formats 1 and 2); what the API answers stands in the dialog (the project's name, the notes in the engine's words),
// and Open keeps the project on this device as a new design and opens it, which runs it as the flow runs any design.
// The web parses no .rtd itself. Pure: what is sent and what is shown.
import { ApiError, type OpenedProject, type ProjectFile } from "../api";

export const PROJECT_FILE_ENDING = ".rtd";

/** The dialog's own words for a file that is no project file by its ending: no request is made for it. */
export const NOT_A_PROJECT_FILE = "Choose a project file (.rtd).";

/**
 * The largest request the deployed API takes: AWS Lambda's Function URL refuses one over 6 MiB with its own 413, before
 * the API sees it (issue #98). The API's limits keep every project it accepts, and so every file the app saves, under
 * it (#162): only a file the app did not write meets it.
 */
export const MAX_REQUEST_BYTES = 6_291_456;

/** The dialog's own words for a file whose request would pass MAX_REQUEST_BYTES: no request is made for it. */
export const TOO_LARGE = "This file is larger than any project this app saves, so it cannot be opened.";

/** The browser could not read the file: words of the app, since the API never saw it. */
export const COULD_NOT_BE_READ = "The file could not be read. Choose another.";

/** The second line of a file read, for every file: the results are never in the file (D5), and the answer carries no capacity and no energy. */
export const RUNS_IN_THE_STUDIO = "Capacity and energy come with the run in the Studio";

/** Whether the file is a project file by its ending, whatever the case. */
export function isProjectFile(name: string): boolean {
  return name.length > PROJECT_FILE_ENDING.length && name.toLowerCase().endsWith(PROJECT_FILE_ENDING);
}

/** The request of POST /project/open from the file of the device: its name, and the text it holds. */
export async function requestOf(file: Pick<File, "name" | "text">): Promise<ProjectFile> {
  return { name: file.name, text: await file.text() };
}

/** The bytes of the request as it is sent: its JSON, in UTF-8. */
export function requestBytes(request: ProjectFile): number {
  return new TextEncoder().encode(JSON.stringify(request)).length;
}

/** Whether the request can reach the deployed API at all (MAX_REQUEST_BYTES). */
export function fitsTheApi(request: ProjectFile): boolean {
  return requestBytes(request) <= MAX_REQUEST_BYTES;
}

/**
 * The lines of a file read, under its name: the project's name, then that the capacity and the energy come with the run.
 * The format is not shown: the answer's is the current one, not the file's.
 */
export function linesOf(opened: OpenedProject): string[] {
  return [opened.project.name, RUNS_IN_THE_STUDIO];
}

export type Refusal = {
  /** Why the file was not read: the API's words, or the app's for a fault that is not the API's. */
  words: string;
  /** The API was not reached, or the answer was not its: the same file may be read again. A file the API refused would be refused again. */
  canTryAgain: boolean;
};

const MAY_BE_TRIED_AGAIN = new Set(["api_unreachable", "unexpected_answer"]);

export function refusalOf(error: unknown): Refusal {
  if (error instanceof ApiError) return { words: error.message, canTryAgain: MAY_BE_TRIED_AGAIN.has(error.code) };
  return { words: COULD_NOT_BE_READ, canTryAgain: false };
}
