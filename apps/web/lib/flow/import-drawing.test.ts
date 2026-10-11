import { describe, expect, test } from "bun:test";
import type { ImportedRoof, Project, RoofFile } from "../api";
import { ApiError } from "../api";
import { createProjectStore } from "../stores/project-store";
import { createViewStore, toReviewOf } from "../stores/view-store";
import { base64OfDataUrl, DRAWING_TOO_LARGE, drawingFits, heldWordsOf, importDrawing, kindOfDrawing } from "./import-drawing";
import { MAX_REQUEST_BYTES } from "./open-project";

// Import a drawing (plan/phase-05-plan.md, step 13, decision 13): the file goes to /roof/import, the
// document it answers is opened, and the heights it could not give go on the list to review.

const PROJECT = { name: "warehouse-roof", roof: { lat: 18.52, lon: 73.86, obstacles: [] } } as unknown as Project;
const ANSWER = { source: "dxf", file: "warehouse-roof.dxf", missing_heights: ["Lift shaft", "Plant room"], notes: ["These obstacles have no height in the file and were set to 1.0 m."], project: PROJECT } as unknown as ImportedRoof;

function standIn(answer: () => Promise<ImportedRoof>) {
  const asked: RoofFile[] = [];
  return { asked, api: { importRoof: (file: RoofFile) => (asked.push(file), answer()) } };
}

describe("the kind of a drawing", () => {
  test("by its ending, whatever the case", () => {
    expect(kindOfDrawing("roof.dxf")).toBe("dxf");
    expect(kindOfDrawing("Roof.KMZ")).toBe("kmz");
    expect(kindOfDrawing("roof.kml")).toBe("kmz");
    expect(kindOfDrawing("roof.pdf")).toBeNull();
  });
});

describe("importing a drawing", () => {
  test("sends the file with its units and opens the document it answers; the missing heights go on the list", async () => {
    const { asked, api } = standIn(() => Promise.resolve(ANSWER));
    const project = createProjectStore();
    const view = createViewStore();

    const notes = await importDrawing({ name: "warehouse-roof.dxf", base64: "QUJD", units: "mm" }, { api, project, view });

    expect(asked).toEqual([{ name: "warehouse-roof.dxf", base64: "QUJD", units: "mm" }]);
    expect(project.getState().project).toBe(PROJECT);
    expect(toReviewOf(view.getState())).toEqual(["Lift shaft", "Plant room"]);
    expect(notes).toEqual(["These obstacles have no height in the file and were set to 1.0 m."]);
  });

  test("a file the API refuses opens nothing and the refusal is the caller's to show", async () => {
    const refused = new ApiError(422, "roof_file_unreadable", "The file holds no closed polyline.", "base64");
    const { api } = standIn(() => Promise.reject(refused));
    const project = createProjectStore();
    const view = createViewStore();
    view.getState().setToReview(["Old"]);

    await expect(importDrawing({ name: "roof.dxf", base64: "QUJD", units: "m" }, { api, project, view })).rejects.toBe(refused);
    expect(project.getState().project).toBeNull();
    expect(toReviewOf(view.getState())).toEqual(["Old"]);
  });

  test("a DXF goes with its place, which the file does not hold", async () => {
    const { asked, api } = standIn(() => Promise.resolve(ANSWER));

    await importDrawing({ name: "warehouse-roof.dxf", base64: "QUJD", units: "m", lat: 18.5912, lon: 73.7384 }, { api, project: createProjectStore(), view: createViewStore() });

    expect(asked[0]).toEqual({ name: "warehouse-roof.dxf", base64: "QUJD", units: "m", lat: 18.5912, lon: 73.7384 });
  });

  test("a KML needs no units", async () => {
    const { asked, api } = standIn(() => Promise.resolve({ ...ANSWER, missing_heights: [] }));
    const view = createViewStore();
    view.getState().setToReview(["Old"]);

    await importDrawing({ name: "roof.kml", base64: "QUJD" }, { api, project: createProjectStore(), view });

    expect(asked[0]).toEqual({ name: "roof.kml", base64: "QUJD" });
    expect(toReviewOf(view.getState())).toEqual([]);
  });
});

describe("a file held before it is read", () => {
  test("is said by its kind, its size in whole kilobytes, and when it is read", () => {
    expect(heldWordsOf("warehouse-roof.dxf", 48 * 1024)).toBe("DXF · 48 KB · read when the roof is opened");
    expect(heldWordsOf("Roof.KMZ", 1536)).toBe("KMZ · 2 KB · read when the roof is opened");
    expect(heldWordsOf("roof.kml", 300)).toBe("KML · 1 KB · read when the roof is opened");
  });

  test("a file of another kind is said by its ending, so that the refusal of the API is no surprise", () => {
    expect(heldWordsOf("notes.txt", 2048)).toBe("TXT · 2 KB · read when the roof is opened");
    expect(heldWordsOf("README", 10)).toBe("File · 1 KB · read when the roof is opened");
  });
});

describe("the base64 of what the browser read", () => {
  test("is what follows the comma of the data URL", () => {
    expect(base64OfDataUrl("data:application/octet-stream;base64,QUJD")).toBe("QUJD");
  });

  test("a URL without one is refused", () => {
    expect(() => base64OfDataUrl("QUJD")).toThrow("The file could not be read.");
  });
});

// #179, item 6: the deployed API refuses a request over 6 MiB with a 413 of its own, which the app cannot read; a drawing
// that large is refused in the dialog's words, before it is sent.
describe("a drawing too large to send", () => {
  const dxf = { name: "big.dxf", units: "m" as const, lat: 18.5912, lon: 73.7384 };
  const ENVELOPE = new TextEncoder().encode(JSON.stringify({ ...dxf, base64: "" })).length;

  test("fits up to the deployed API's limit to the byte, the request as it is sent, and not one byte over", () => {
    expect(drawingFits({ ...dxf, base64: "A".repeat(MAX_REQUEST_BYTES - ENVELOPE) })).toBe(true);
    expect(drawingFits({ ...dxf, base64: "A".repeat(MAX_REQUEST_BYTES - ENVELOPE + 1) })).toBe(false);
  });

  test("a KMZ is measured without the units and the place it does not send", () => {
    const kmz = { name: "big.kmz", base64: "A".repeat(MAX_REQUEST_BYTES - new TextEncoder().encode(JSON.stringify({ name: "big.kmz", base64: "" })).length) };
    expect(drawingFits(kmz)).toBe(true);
  });

  test("is refused in the dialog's own words, with the size that fits", () => {
    expect(DRAWING_TOO_LARGE).toBe("This drawing is larger than the app can send, about 4.7 MB. Save it with the roof and its obstacles alone, and choose it again.");
  });
});
