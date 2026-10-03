import { describe, expect, test } from "bun:test";
import type { OpenedProject, Project, ProjectFile } from "../api";
import { ApiError } from "../api";
import { COULD_NOT_BE_READ, heldWordsOf, isProjectFile, NOT_A_PROJECT_FILE, openProjectFile, refusalOf, requestOf, sizeWordsOf } from "./open-project";

// Open a project (plan/phase-10-plan.md, step 9, decision 4): a file is taken by its ending, read in the browser as text,
// sent to /project/open as {name, text}; the project it answers is kept on this device as a new design; the notes come
// back in the API's words; a refusal is the API's words, and may be tried again when the API was not reached.

const PROJECT = { name: "Block B", roof: { lat: 18.52, lon: 73.86, obstacles: [] } } as unknown as Project;
const PAN_NOTE = "The module file Test.PAN (PAN) is not included in this project. Choose it again.";

function standIn(answer: () => Promise<OpenedProject>) {
  const asked: ProjectFile[] = [];
  const kept: Project[] = [];
  return { asked, kept, api: { openProject: (file: ProjectFile) => (asked.push(file), answer()) }, keep: (document: Project) => void kept.push(document) };
}

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

describe("the words of the size", () => {
  test("whole kilobytes under a megabyte, never under 1 KB; megabytes with one decimal from there", () => {
    expect(sizeWordsOf(300)).toBe("1 KB");
    expect(sizeWordsOf(48 * 1024)).toBe("48 KB");
    expect(sizeWordsOf(1536)).toBe("2 KB");
    expect(sizeWordsOf(1024 * 1024 - 1)).toBe("1024 KB");
    expect(sizeWordsOf(1024 * 1024)).toBe("1.0 MB");
    expect(sizeWordsOf(2.44 * 1024 * 1024)).toBe("2.4 MB");
  });

  test("what the dialog says of the file it holds before it is opened", () => {
    expect(heldWordsOf(48 * 1024)).toBe("Project file · 48 KB · read when it is opened");
  });
});

describe("the request from a file", () => {
  test("is the file's name and the text it holds", async () => {
    const file = new File(['{"format": 2}'], "Pune-demo-roof.rtd", { type: "application/octet-stream" });

    expect(await requestOf(file)).toEqual({ name: "Pune-demo-roof.rtd", text: '{"format": 2}' });
  });
});

describe("opening a project file", () => {
  test("sends the file, keeps the project it answers as a new design, and gives back the notes in the API's words", async () => {
    const { asked, kept, api, keep } = standIn(() => Promise.resolve({ project: PROJECT, notes: [PAN_NOTE] }));

    const notes = await openProjectFile({ name: "Test-project.rtd", text: "{}" }, { api, keep });

    expect(asked).toEqual([{ name: "Test-project.rtd", text: "{}" }]);
    expect(kept).toEqual([PROJECT]);
    expect(notes).toEqual([PAN_NOTE]);
  });

  test("a file the API refuses keeps nothing, and the refusal is the caller's to show", async () => {
    const refused = new ApiError(422, "project_file_unreadable", "The file is not a project file (.rtd): it is not JSON.", "text");
    const { kept, api, keep } = standIn(() => Promise.reject(refused));

    await expect(openProjectFile({ name: "notes.rtd", text: "PVObject_=pvModule" }, { api, keep })).rejects.toBe(refused);
    expect(kept).toEqual([]);
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
