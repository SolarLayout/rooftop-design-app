import { expect, type Page } from "@playwright/test";

// The project file (.rtd) in the browser tests (plan/phase-10-plan.md, step 10): the demo's, written by the API's own
// writer (/export/rtd) and read back as JSON so that a test can change it (its name; its format, as the desktop app wrote
// format 1), then given to the dialog's file input as a file of the device. Nothing of the format is typed here.

/** How many times the export is asked for when the answer is not the API's: the rewrite of `next dev` drops one now and then (docs/checks.md). */
const EXPORT_TRIES = 3;

export type ProjectFileJson = Record<string, unknown> & { name: string };

/** The demo's project file as the API writes it, read back as JSON. */
export async function demoProjectFile(page: Page): Promise<ProjectFileJson> {
  const demo = (await (await page.request.get("/api/demo")).json()) as Record<string, unknown>;
  for (let attempt = 1; ; attempt += 1) {
    const exported = await page.request.post("/api/export/rtd", { data: demo });
    if (exported.status() === 200) return JSON.parse(await exported.text()) as ProjectFileJson;
    expect(attempt, `the export of the demo's project file answered ${exported.status()}`).toBeLessThan(EXPORT_TRIES);
  }
}

/** A file of the device for `setInputFiles`: *text* under *name*. */
export function asFile(name: string, text: string) {
  return { name, mimeType: "application/octet-stream", buffer: Buffer.from(text, "utf8") };
}

/** The demo's project file written as the desktop app wrote format 1: the module file named by its path on that machine, its text not included. */
export function asFormat1(file: ProjectFileJson): ProjectFileJson {
  return { ...file, format: 1, pan_text: "", pan_path: "C:\\PVsyst\\Test.PAN" };
}
