import type { Locator, Page } from "@playwright/test";
import path from "node:path";
import { expect, test } from "../fixtures";

// The Array lens inspector (plan/phase-05-plan.md, steps 14 to 16): every field commits an edit of the
// document, and the request of /layout that follows carries it. The module card with Replace; the
// mounting, the spacing and the shade-free window; the states of the stage while a layout is on its
// way and when it failed. On three sizes; on phone in the sheet, opened to its full stop.

const RUN = 90_000;
const PAN = path.resolve(__dirname, "../fixtures/test-module.PAN");

type ArrayRequest = {
  pan_text: string;
  pan_path: string;
  array: { tilt_deg: number; orientation: string; modules_in_tilt: number; row_pitch_m: number | null; window_start_h: number; design_doy: number | null; allow_shaded: boolean };
};

const isPhone = (projectName: string) => projectName === "phone";

const moduleCard = (page: Page) => page.getByTestId("module-card").filter({ visible: true });
const moduleTitle = (page: Page) => page.getByTestId("module-title").filter({ visible: true });

/** The Array lens with the demo, its first run over: what /layout is asked next is an edit. */
async function arrayLensOpened(page: Page, projectName: string) {
  await page.goto("/studio/array");
  await expect(moduleTitle(page)).toHaveText("INA-144MHC-TF-560", { timeout: RUN });
  if (isPhone(projectName)) {
    await page.getByRole("separator", { name: "Inspector" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Open");
  }
}

/** The next request of /layout, as the web app sends it. */
function nextLayout(page: Page): Promise<ArrayRequest> {
  return page.waitForRequest((request) => request.url().endsWith("/api/layout"), { timeout: RUN }).then((request) => request.postDataJSON() as ArrayRequest);
}

/** The handle of a slider dragged to a value: released there, not before. */
async function dragged(page: Page, handle: Locator, share: number) {
  await handle.scrollIntoViewIfNeeded();
  const rail = (await handle.locator("xpath=..").boundingBox())!;
  const from = (await handle.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width * share, from.y + from.height / 2, { steps: 6 });
  await page.mouse.up();
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the module card", () => {
  test("says the module of the design: its names as the file states them, the facts, the coefficients, the note, the file", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const card = moduleCard(page);

    await expect(card).toContainText("INSOLATION GREEN ENERGY PVT. LTD. · 560 Wp");
    await expect(card).toContainText("2.277 × 1.133 m · bifacial 0.80");
    await expect(card).toContainText("Voc 49.95 V · Isc 14.30 A · 3 diodes · twin half-cell");
    await expect(card).toContainText("Coefficients (one-diode model): Voc −0.164, Vmp −0.228, Pmpp −0.212 %/°C");
    await expect(card.getByTestId("module-note")).toHaveText(
      "Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.",
    );
    await expect(card.getByTestId("module-file")).toHaveText("insolation-ina-144mhc-tf-560.PAN");
    await expect(card.getByRole("button", { name: "Replace" })).toBeVisible();
  });

  test("Replace with a PAN file: the request carries its text, and the card shows the module read", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    await moduleCard(page).getByRole("button", { name: "Replace" }).click();
    const dialog = page.getByRole("dialog", { name: "Replace the module" });
    await expect(dialog).toBeVisible();
    const asked = nextLayout(page);

    await dialog.locator("input[type=file]").setInputFiles(PAN);

    const request = await asked;
    expect(request.pan_path).toBe("test-module.PAN");
    expect(request.pan_text).toContain("PNom=560.0");
    await expect(dialog).toBeHidden();
    await expect(moduleTitle(page)).toHaveText("Test");
    await expect(moduleCard(page).getByTestId("module-file")).toHaveText("test-module.PAN");
  });

  test("a file that is no PAN is refused in the words of the engine, and the card keeps its module", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const layouts: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/layout")) layouts.push(request.url());
    });
    await moduleCard(page).getByRole("button", { name: "Replace" }).click();
    const dialog = page.getByRole("dialog", { name: "Replace the module" });

    await dialog.locator("input[type=file]").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello, not a module") });

    await expect(dialog.getByRole("status")).toContainText("This file was not loaded");
    await expect(dialog.getByRole("status")).toContainText("notes.txt: not a PVsyst module file (PNom, Voc or Isc missing)");
    await expect(dialog.getByRole("button", { name: "Choose another" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(moduleTitle(page)).toHaveText("INA-144MHC-TF-560");
    expect(layouts).toEqual([]);
  });
});

test.describe("the mounting", () => {
  test("the tilt released at 10°: the request follows within 200 ms of the release", async ({ page }, testInfo) => {
    // The moments are taken in the page: when the pointer was released, when /layout was asked.
    await page.addInitScript(() => {
      const marks: Record<string, number> = {};
      (window as unknown as { marks: Record<string, number> }).marks = marks;
      window.addEventListener("pointerup", () => (marks.released = performance.now()), true);
      const fetchOfTheBrowser = window.fetch;
      window.fetch = (input, init) => {
        if (String(input instanceof Request ? input.url : input).endsWith("/api/layout")) marks.asked = performance.now();
        return fetchOfTheBrowser(input, init);
      };
    });
    await arrayLensOpened(page, testInfo.project.name);
    const handle = page.getByRole("slider", { name: "Tilt" });
    await expect(handle).toHaveAttribute("aria-valuenow", "15");
    const asked = nextLayout(page);

    await dragged(page, handle, 10 / 45);

    expect((await asked).array.tilt_deg).toBe(10);
    await expect(handle).toHaveAttribute("aria-valuenow", "10");
    const marks = await page.evaluate(() => (window as unknown as { marks: Record<string, number> }).marks);
    expect(marks.asked - marks.released, `asked ${marks.asked - marks.released} ms after the release`).toBeLessThan(200);
  });

  test("the orientation and the modules in tilt commit at once", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const landscape = page.getByRole("radiogroup", { name: "Orientation" }).getByRole("radio", { name: "Landscape" });
    await landscape.scrollIntoViewIfNeeded();
    let asked = nextLayout(page);

    await landscape.click();

    expect((await asked).array.orientation).toBe("landscape");
    await expect(landscape).toHaveAttribute("aria-checked", "true");

    const more = page.getByRole("button", { name: "More" });
    await more.scrollIntoViewIfNeeded();
    asked = nextLayout(page);

    await more.click();

    expect((await asked).array.modules_in_tilt).toBe(3);
    await expect(page.getByRole("textbox", { name: "Modules in tilt" })).toHaveValue("3");
  });

  test("the fields of the roof type: tilted rows, east-west, sloped", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const inspector = page.getByRole("region", { name: "Mounting" });
    await expect(inspector.getByRole("slider", { name: "Tilt" })).toBeVisible();
    await expect(inspector.getByText("Latitude 18.5° N suggests 15°")).toBeVisible();
    await expect(inspector.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveValue("0.50");

    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: { roof: Record<string, unknown> } = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, roof: { ...demo.roof, roof_type: "flat_ew" } } });
    });
    await arrayLensOpened(page, testInfo.project.name);
    await expect(inspector.getByRole("slider", { name: "East-west tilt" })).toHaveAttribute("aria-valuemax", "30");
    await expect(inspector.getByText("Each side, away from the ridge")).toBeVisible();
    await expect(inspector.getByRole("textbox", { name: "Ridge gap" })).toHaveValue("0.30");
    await expect(inspector.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveValue("0.50");
    await expect(inspector.getByRole("radiogroup", { name: "Orientation" })).toHaveCount(0);

    await page.unroute("**/api/demo");
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: { roof: Record<string, unknown> } = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, roof: { ...demo.roof, roof_type: "sloped_flush", slope_deg: 10, parapet_h: 0 } } });
    });
    await arrayLensOpened(page, testInfo.project.name);
    await expect(inspector.getByTestId("read-out-line")).toHaveText("Follows the roof pitch · 10° facing 180° S · set in the Roof lens");
    await expect(inspector.getByRole("slider")).toHaveCount(0);
    await expect(inspector.getByRole("radiogroup", { name: "Orientation" })).toBeVisible();
    await expect(inspector.getByRole("textbox", { name: "Modules in tilt" })).toHaveValue("2");
    await expect(inspector.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveCount(0);
  });
});
