import type { Locator, Page, Route } from "@playwright/test";
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
const subLine = (page: Page) => page.getByTestId("stage-subline");
const modulesDrawn = (page: Page) => page.getByTestId("on-the-roof-modules");
const layoutFailed = (page: Page) => page.getByTestId("layout-failed");
const moduleTitle = (page: Page) => page.getByTestId("module-title").filter({ visible: true });

/** The Array lens with the demo, its first run over: what /layout is asked next is an edit. */
/**
 * The Array lens open on the demo. It waits for the module's card, which comes with the design run; a test
 * of the fields alone waits for the Mounting section, which comes with the document: a demo of another roof
 * type needs a run of its own, which under load can take longer than a test may wait.
 */
async function arrayLensOpened(page: Page, projectName: string, waitFor: "module" | "mounting" = "module") {
  await page.goto("/studio/array");
  if (waitFor === "module") await expect(moduleTitle(page)).toHaveText("INA-144MHC-TF-560", { timeout: RUN });
  else await expect(page.getByRole("region", { name: "Mounting" }).filter({ visible: true })).toBeVisible({ timeout: RUN });
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

  // One test per roof type: each opens the lens once, and a demo of another type needs a design run of its own.
  test("the fields of tilted rows: the tilt with the latitude's hint, the orientation, the clearance", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const inspector = page.getByRole("region", { name: "Mounting" });

    await expect(inspector.getByRole("slider", { name: "Tilt" })).toBeVisible();
    await expect(inspector.getByText("Latitude 18.5° N suggests 15°")).toBeVisible();
    await expect(inspector.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveValue("0.50");
  });

  test("the fields of an east-west roof: its tilt, the ridge gap, the clearance; no orientation", async ({ page }, testInfo) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: { roof: Record<string, unknown> } = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, roof: { ...demo.roof, roof_type: "flat_ew" } } });
    });
    await arrayLensOpened(page, testInfo.project.name, "mounting");
    const inspector = page.getByRole("region", { name: "Mounting" });

    await expect(inspector.getByRole("slider", { name: "East-west tilt" })).toHaveAttribute("aria-valuemax", "30");
    await expect(inspector.getByText("Each side, away from the ridge")).toBeVisible();
    await expect(inspector.getByRole("textbox", { name: "Ridge gap" })).toHaveValue("0.30");
    await expect(inspector.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveValue("0.50");
    await expect(inspector.getByRole("radiogroup", { name: "Orientation" })).toHaveCount(0);
  });

  test("the fields of a sloped roof: the pitch read out, the orientation and the modules in tilt; no tilt, no clearance", async ({ page }, testInfo) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: { roof: Record<string, unknown> } = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, roof: { ...demo.roof, roof_type: "sloped_flush", slope_deg: 10, parapet_h: 0 } } });
    });
    await arrayLensOpened(page, testInfo.project.name, "mounting");
    const inspector = page.getByRole("region", { name: "Mounting" });

    await expect(inspector.getByTestId("read-out-line")).toHaveText("Follows the roof pitch · 10° facing 180° S · set in the Roof lens");
    await expect(inspector.getByRole("slider")).toHaveCount(0);
    await expect(inspector.getByRole("radiogroup", { name: "Orientation" })).toBeVisible();
    await expect(inspector.getByRole("textbox", { name: "Modules in tilt" })).toHaveValue("2");
    await expect(inspector.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveCount(0);
  });
});

test.describe("the spacing and the window", () => {
  test("the engine decides the pitch and the azimuth, and says why", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const spacing = page.getByRole("region", { name: "Spacing" });

    await expect(spacing.getByTestId("read-out").filter({ hasText: "Row pitch" })).toContainText("6.45 m");
    await expect(spacing.getByTestId("read-out").filter({ hasText: "Row pitch" })).toContainText("Shade-free · GCR 0.71 · profile angle 30.5°");
    await expect(spacing.getByTestId("read-out").filter({ hasText: "Azimuth" })).toContainText("180° S");
    await expect(spacing.getByTestId("read-out").filter({ hasText: "Azimuth" })).toContainText("Follows the roof edge closest to the equator");
    await expect(spacing.getByRole("switch", { name: "Shade-free row pitch" })).toHaveAttribute("aria-checked", "true");
    await expect(spacing.getByRole("switch", { name: "Follow the roof edge" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("group", { name: "Shade-free window" }).getByTestId("value")).toHaveText("09:00 – 16:00");
  });

  test("the pitch switched off is a field with the engine's last pitch; 7.00 typed goes to the engine; on hands it back", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const pitchSwitch = page.getByRole("switch", { name: "Shade-free row pitch" });
    await pitchSwitch.scrollIntoViewIfNeeded();
    let asked = nextLayout(page);

    await pitchSwitch.click();

    expect((await asked).array.row_pitch_m).toBe(6.45);
    const field = page.getByRole("textbox", { name: "Row pitch" });
    await expect(field).toHaveValue("6.45");
    await expect(page.getByRole("region", { name: "Spacing" })).toContainText("Shade-free would be 6.45 m");
    asked = nextLayout(page);

    await field.fill("7.00");
    await field.press("Enter");

    expect((await asked).array.row_pitch_m).toBe(7);
    asked = nextLayout(page);

    await pitchSwitch.click();

    expect((await asked).array.row_pitch_m).toBeNull();
    await expect(field).toHaveCount(0);
  });

  test("the start of the window dragged to 09:15", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const from = page.getByRole("slider", { name: "Shade-free window, from" });
    await expect(from).toHaveAttribute("aria-valuetext", "09:00 solar time");
    const asked = nextLayout(page);

    await dragged(page, from, (9.25 - 5) / 14);

    expect((await asked).array.window_start_h).toBe(9.25);
    await expect(page.getByRole("group", { name: "Shade-free window" }).getByTestId("value")).toHaveText("09:15 – 16:00");
  });

  test("the design day and the shaded positions commit at once", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    const june = page.getByRole("radiogroup", { name: "Design day" }).getByRole("radio", { name: "21 Jun" });
    await june.scrollIntoViewIfNeeded();
    let asked = nextLayout(page);

    await june.click();

    expect((await asked).array.design_doy).toBe(172);
    const shaded = page.getByRole("switch", { name: "Allow shaded positions" });
    await expect(page.getByText("Off: positions shaded inside the window stay empty")).toBeVisible();
    asked = nextLayout(page);

    await shaded.click();

    expect((await asked).array.allow_shaded).toBe(true);
    await expect(page.getByText("On: positions shaded inside the window are used too")).toBeVisible();
  });
});

test.describe("the states of the stage", () => {
  const CROSSES = { error: { code: "engine_error", message: "The roof outline crosses itself. Give the corners in order around the roof.", field: null } };

  /** One more module in tilt: an edit that asks for the layout again, and changes what it counts. */
  async function edited(page: Page) {
    const more = page.getByRole("button", { name: "More" });
    await more.scrollIntoViewIfNeeded();
    await more.click();
  }

  /** On phone the sheet is brought down to its peek, so that the stage can be pressed. */
  async function stageUncovered(page: Page, projectName: string) {
    if (!isPhone(projectName)) return;
    await page.getByRole("separator", { name: "Inspector" }).focus();
    await page.keyboard.press("Home");
    await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Closed");
  }

  test("while the layout is on its way the line is dimmed with a ring and the modules of before stay; released, the new ones land", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    await expect(subLine(page)).toHaveAttribute("data-state", "settled");
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });
    const wordsBefore = (await subLine(page).textContent()) ?? "";
    let held: Route | null = null;
    await page.route("**/api/layout", (route) => {
      held = route;
    });

    await edited(page);

    await expect(subLine(page)).toHaveAttribute("data-state", "updating");
    await expect(subLine(page).getByTestId("ring-arc")).toHaveCount(1);
    await expect(subLine(page)).toHaveText(wordsBefore);
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows");
    await expect.poll(() => held !== null).toBe(true);

    await held!.continue();

    await expect(subLine(page)).toHaveAttribute("data-state", "settled", { timeout: RUN });
    await expect(subLine(page).getByTestId("ring-arc")).toHaveCount(0);
    await expect(subLine(page)).not.toHaveText(wordsBefore);
    await expect(modulesDrawn(page)).not.toHaveText("790 modules in 6 rows");
  });

  test("a layout that failed is a chip with the words of the API; the last good modules stay; Try again asks again", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });
    let fails = true;
    const asked: string[] = [];
    await page.route("**/api/layout", (route) => {
      asked.push(route.request().url());
      return fails ? route.fulfill({ status: 422, json: CROSSES }) : route.continue();
    });

    await edited(page);

    await expect(layoutFailed(page)).toContainText("The layout was not updated");
    await expect(layoutFailed(page)).toContainText(CROSSES.error.message);
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows");
    await expect(subLine(page)).toHaveAttribute("data-state", "settled");
    expect(asked).toHaveLength(1);

    fails = false;
    await stageUncovered(page, testInfo.project.name);
    await layoutFailed(page).getByRole("button", { name: "Try again" }).click();

    await expect(layoutFailed(page)).toHaveCount(0, { timeout: RUN });
    expect(asked).toHaveLength(2);
    await expect(modulesDrawn(page)).not.toHaveText("790 modules in 6 rows", { timeout: RUN });
  });

  test("Escape closes the chip until the next failure", async ({ page }, testInfo) => {
    await arrayLensOpened(page, testInfo.project.name);
    await page.route("**/api/layout", (route) => route.fulfill({ status: 422, json: CROSSES }));
    await edited(page);
    await expect(layoutFailed(page)).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(layoutFailed(page)).toHaveCount(0);

    await edited(page);

    await expect(layoutFailed(page)).toBeVisible();
  });
});
