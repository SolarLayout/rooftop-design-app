import { describe, expect, test } from "bun:test";
import type { OpenedProject, Project } from "../api";
import { ApiError } from "../api";
import { COULD_NOT_BE_READ, isProjectFile, linesOf, NOT_A_PROJECT_FILE, refusalOf, requestOf, RUNS_IN_THE_STUDIO } from "./open-project";

// Open a project (plan/phase-10-plan.md, step 9, decision 4): a file is taken by its ending, read in the browser as text
// and sent to /project/open as {name, text} as soon as it is chosen; what the API answers stands in the dialog as the
// project's name and its notes, word for word; a refusal is the API's words, and may be tried again when the API was not
// reached.

const PROJECT = { name: "Block B", roof: { lat: 18.52, lon: 73.86, obstacles: [] } } as unknown as Project;

describe("a project file by its ending", () => {
  test("is an .rtd, whatever the case; anything else is not", () => {
    expect(isProjectFile("Pune-demo-roof.rtd")).toBe(true);
    expect(isProjectFile("WAREHOUSE.RTD")).toBe(true);
    expect(isProjectFile("roof-notes.txt")).toBe(false);
    expect(isProjectFile("notes.PAN")).toBe(false);
    expect(isProjectFile(".rtd")).toBe(false);
    expect(isProjectFile("rtd")).toBe(false);
  });

  test("the dialog's own words for a file that is none", () => {
    expect(NOT_A_PROJECT_FILE).toBe("Choose a project file (.rtd).");
  });
});

describe("the request from a file", () => {
  test("is the file's name and the text it holds", async () => {
    const file = new File(['{"format": 2}'], "Pune-demo-roof.rtd", { type: "application/octet-stream" });

    expect(await requestOf(file)).toEqual({ name: "Pune-demo-roof.rtd", text: '{"format": 2}' });
  });
});

describe("the lines of a file read", () => {
  test("are the project's name and that the capacity and the energy come with the run, for every file: the answer carries neither, and its format is the current one, not the file's", () => {
    const opened: OpenedProject = { project: PROJECT, notes: [] };

    expect(linesOf(opened)).toEqual(["Block B", "Capacity and energy come with the run in the Studio"]);
    expect(RUNS_IN_THE_STUDIO).toBe("Capacity and energy come with the run in the Studio");
  });
});

describe("the refusal", () => {
  test("is the API's words, word for word, and cannot be tried again with the same file", () => {
    const error = new ApiError(422, "unsupported_project_format", "This project file is format 3. This version reads formats 1 and 2. Open it with a newer version of the app.", "format");

    expect(refusalOf(error)).toEqual({ words: "This project file is format 3. This version reads formats 1 and 2. Open it with a newer version of the app.", canTryAgain: false });
  });

  test("an API that was not reached, or an answer that was not its, may be tried again", () => {
    expect(refusalOf(ApiError.unreachable(new TypeError("fetch failed")))).toEqual({ words: "The server cannot be reached. Check the connection and try again.", canTryAgain: true });
    expect(refusalOf(ApiError.unexpected(500))).toMatchObject({ canTryAgain: true });
  });

  test("a fault that is not the API's (the browser could not read the file) is said in the app's words", () => {
    expect(refusalOf(new Error("NotReadableError"))).toEqual({ words: COULD_NOT_BE_READ, canTryAgain: false });
    expect(COULD_NOT_BE_READ).toBe("The file could not be read. Choose another.");
  });
});
