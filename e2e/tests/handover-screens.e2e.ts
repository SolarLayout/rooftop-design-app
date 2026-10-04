import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { expectScreen, expectWholeScreen, topBarSettled } from "../screens";

// The pictures of Handover, each against its baseline in e2e/baselines (handover*.png: the handover group's own,
// tools/check/e2e-groups.ts). After a change that is meant, look at the new picture beside the preview in
// docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test handover-screens --update-snapshots   (in e2e/)

// Handover with the demo from the API of the test stack. A picture is taken once the result is there.
const RUN = 90_000;
test.describe.configure({ timeout: RUN + 30_000 });

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

// Handover with the demo (the boards "Handover" on three sizes): the list with its facts, the first item beside it on desktop and tablet.
const factsLanded = async (page: Page) => {
  await expect(page.getByTestId("deliverables").getByTestId("deliverable-facts").nth(1)).toContainText("strings of", { timeout: RUN });
};
// The report's page 1 prints the day of the report, which is the browser's (plan/phase-09-plan.md, decision 2): the page's
// clock is fixed before the page is opened, so that the picture does not move with the calendar.
const DAY_OF_THE_REPORT = new Date("2026-10-03T09:00:00");
const dayFixed = (page: Page) => page.clock.install({ time: DAY_OF_THE_REPORT });
// The paper with its page and every thumbnail drawn: the images are decoded before the picture is taken.
const reportLanded = async (page: Page) => {
  await expect(page.getByTestId("page-image")).toBeVisible({ timeout: RUN });
  await expect
    .poll(() => page.getByTestId("preview").locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)), { timeout: RUN })
    .toBe(true);
};

test("handover", async ({ page }, testInfo) => {
  await dayFixed(page);
  await page.goto("/handover");
  await factsLanded(page);
  if (!isPhone(testInfo.project.name)) await reportLanded(page);
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover");
});

// The report pushed over the list on phone (the board "Handover, tablet and phone"): the back row, the head, the paper, previous and next, the row of thumbnails.
test("handover, the report pushed", async ({ page }, testInfo) => {
  test.skip(!isPhone(testInfo.project.name), "The pushed screen is of the phone.");
  await dayFixed(page);
  await page.goto("/handover/report");
  await reportLanded(page);
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-report-pushed");
});

// Page 2 of the report after Next (the board "Handover"): the words of the head, the second thumbnail current.
test("handover, the report at page 2", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "The pages turned are pictured on desktop.");
  await dayFixed(page);
  await page.goto("/handover");
  await factsLanded(page);
  await reportLanded(page);
  await topBarSettled(page, testInfo.project.name);
  await page.getByRole("button", { name: "Next page" }).filter({ visible: true }).click();
  await expect(page.getByTestId("page-words").filter({ visible: true })).toContainText("Page 2 of");
  await reportLanded(page);
  await page.mouse.move(0, 0);

  await expectWholeScreen(page, "handover-report-page-2");
});

// The pages on their way (the board "Handover, states", "The first load"): the paper as a block of the page's shape and six thumbnail skeletons; the route is held.
test("handover, the report loading", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "The skeletons of the paper are pictured on desktop.");
  await page.route("**/api/export/report-pages**", () => {
    // Held: the pages stay on their way for the picture.
  });
  await dayFixed(page);
  await page.goto("/handover");
  await factsLanded(page);
  await expect(page.getByTestId("report-skeleton")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-report-loading");
});

// Before a system voltage (the board "Handover, states"): every row but the project file dim with the API's title, the decision card in the preview.
test("handover, before a voltage", async ({ page }, testInfo) => {
  await page.route("**/api/demo", async (route) => {
    const answer = await route.fetch();
    const demo: Record<string, unknown> = await answer.json();
    await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
  });
  await page.goto(isPhone(testInfo.project.name) ? "/handover/report" : "/handover");
  await expect(page.getByTestId("files-wait")).toContainText("Choose a system voltage to size the strings", { timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-no-voltage");
});

// The project file's item once the run has landed: its size is there, and what is in it says the weather and the option.
const projectFileLanded = async (page: Page) => {
  await expect(page.getByTestId("project-file").getByTestId("file-size")).toBeVisible({ timeout: RUN });
  await expect(page.getByTestId("in-the-file").filter({ hasText: "Weather" })).toContainText("hours", { timeout: RUN });
};

// The project file (the board "Handover, previews", last part): the name as a field, the file's name and size, what is in it.
test("handover, the project file", async ({ page }, testInfo) => {
  await page.goto("/handover/project-file");
  await projectFileLanded(page);
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-project-file");
});

// The name edited (the board "Handover, states"): the field with the focus and the draft, the file's name following it before the commit.
test("handover, the name edited", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "tablet", "The board draws the edited name on desktop and phone.");
  await page.goto("/handover/project-file");
  await projectFileLanded(page);
  await topBarSettled(page, testInfo.project.name);
  const field = page.getByTestId("project-file").getByRole("textbox", { name: "Name" });
  await field.fill("Pune demo roof, block B");
  await expect(page.getByTestId("file-name")).toHaveText("Pune-demo-roof,-block-B.rtd");

  await expectWholeScreen(page, "handover-name-edited");
});

// The single-line diagram (the board "Handover, previews", first part): the SVG in the Dusk palette at the panel's width;
// on phone and tablet the AC side runs down from the inverter.
const drawing = (page: Page) => page.getByTestId("sld-drawing");
const blockOf = (page: Page, mppt: number) => drawing(page).locator(`[data-testid="mppt-block"][data-mppt="${mppt}"]`);

test("handover, the single-line diagram", async ({ page }, testInfo) => {
  await page.goto("/handover/single-line-diagram");
  await expect(blockOf(page, 1)).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-sld");
});

// The block of MPPT 2 under the pointer: lifted, its tooltip at its right (the board draws this state on desktop).
test("handover, the single-line diagram, a block under the pointer", async ({ page }, testInfo) => {
  test.skip(isPhone(testInfo.project.name) || testInfo.project.name === "tablet", "The board draws the block under the pointer on desktop.");
  await page.goto("/handover/single-line-diagram");
  await expect(blockOf(page, 1)).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  await blockOf(page, 2).hover();
  await expect(page.getByTestId("value-tooltip").filter({ visible: true })).toBeVisible();

  await expectScreen(page, "handover-sld-hover");
});

// The bill of materials (the board "Handover, previews", second part): the Table, "In the report, page 5" and Copy as table in the head; cards on phone.
test("handover, the bill of materials", async ({ page }, testInfo) => {
  await page.goto("/handover/bill-of-materials");
  await expect(page.getByTestId("bom")).toContainText("PV module", { timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-bom");
});

// The DC cable schedule (the board "Handover, previews", third part), in the engine's order, the total row last.
const scheduleLanded = async (page: Page) => {
  await page.goto("/handover/cable-schedule");
  await expect(page.getByTestId("cable-schedule")).toContainText("22 strings", { timeout: RUN });
};

test("handover, the cable schedule", async ({ page }, testInfo) => {
  await scheduleLanded(page);
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-schedule");
});

// Sorted by DC cable m downwards, as the board draws it: the active head in text with its arrow, the longest string first.
test("handover, the cable schedule sorted", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The board draws the sorted schedule on desktop.");
  await scheduleLanded(page);
  await topBarSettled(page, testInfo.project.name);
  const head = page.getByTestId("cable-schedule").getByRole("columnheader", { name: "DC cable (m)" });
  await head.getByRole("button").click();
  await head.getByRole("button").click();
  await expect(head).toHaveAttribute("aria-sort", "descending");
  // The press was by the mouse: no focus ring in the picture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectWholeScreen(page, "handover-schedule-sorted");
});

// Copy as table pressed (the board "Handover, states"): the toast of something done at the bottom of the screen.
test("handover, a table copied", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The board draws the toast of the copy on desktop.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/handover/bill-of-materials");
  await expect(page.getByTestId("bom")).toContainText("PV module", { timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  await page.getByTestId("preview-action").getByRole("button", { name: "Copy as table" }).filter({ visible: true }).click();
  await expect(page.getByTestId("toast")).toContainText("Bill of materials copied as a table");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectScreen(page, "handover-table-copied");
});

// The CAD layout (the board "Handover, previews"): the engine's plan in its paper frame, the layers beside it on desktop and under it below that.
test("handover, the CAD layout", async ({ page }, testInfo) => {
  await dayFixed(page);
  await page.goto("/handover/cad-layout");
  await expect(page.getByTestId("layer")).toHaveCount(8, { timeout: RUN });
  await expect(page.getByTestId("plan-image")).toBeVisible({ timeout: RUN });
  await expect.poll(() => page.getByTestId("plan-image").evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0), { timeout: RUN }).toBe(true);
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-cad-layout");
});

// The Google Earth model (the same board): what is in the file and what is not, two columns on desktop.
test("handover, the Google Earth model", async ({ page }, testInfo) => {
  await page.goto("/handover/earth-model");
  await expect(page.getByTestId("kml-inside")).toHaveCount(8, { timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-earth-model");
});

// The hourly data (the same board): the header and the first eight rows in their card, the columns under it.
test("handover, the hourly data", async ({ page }, testInfo) => {
  await page.goto("/handover/hourly-data");
  await expect(page.getByTestId("csv-row")).toHaveCount(8, { timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "handover-hourly-data");
});

// Download all on its way (the board "Handover, states", "A download on its way"): the ring in the button, dim without its shadow; the route is held.
test("handover, Download all on its way", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "The board draws Download all on its way on desktop.");
  await page.route("**/api/export/zip**", () => {
    // Held: the zip stays on its way for the picture.
  });
  await dayFixed(page);
  await page.goto("/handover");
  await factsLanded(page);
  await reportLanded(page);
  await topBarSettled(page, testInfo.project.name);
  await page.getByRole("button", { name: "Download all" }).click();
  await expect(page.getByRole("button", { name: "Download all" })).toHaveAttribute("aria-disabled", "true");
  await page.mouse.move(0, 0);

  await expectWholeScreen(page, "handover-download-all");
});
