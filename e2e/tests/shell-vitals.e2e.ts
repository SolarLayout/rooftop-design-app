import type { Locator, Page, Route } from "@playwright/test";
import { expect, test } from "../fixtures";

// The vitals of the shell with the numbers of the demo, from the API of the test stack
// (plan/reference/demo-numbers.md). A design run of the demo takes 12 s the first time and less once the
// server kept its results: a test waits for the result, never for a time.

const RUN = 90_000;

const DEMO = [
  ["Energy, year 1", "617.8 MWh"],
  ["DC capacity", "357.28 kWp"],
  ["AC capacity", "275 kW"],
  ["DC/AC", "1.30"],
  ["Modules", "638 of 790"],
  ["PR", "86.6 %"],
  ["Yield", "1,729 kWh/kWp"],
];

const BEFORE_A_VOLTAGE = [
  ["Roof", "3,600 m²"],
  ["Positions", "790 modules"],
  ["If all were used", "442.40 kWp"],
];

const VOC =
  "Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.";

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

const vitalsOf = (page: Page) => page.getByRole("region", { name: "Design vitals" });

/** The values of the vitals as they are read, in the order of the page. */
async function valuesOf(vitals: Locator): Promise<string[][]> {
  return vitals
    .locator("dl > div")
    .evaluateAll((cells) =>
      cells.map((cell) => [cell.querySelector("dt")?.textContent ?? "", (cell.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim()]),
    );
}

/** The demo as the API hands it out, with its system voltage left out. The request stays on this machine. */
async function leaveTheVoltageOut(page: Page) {
  await page.route("**/api/demo", async (route) => {
    const answer = await route.fetch();
    const demo: Record<string, unknown> = await answer.json();
    await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
  });
}

/** Holds every design run back until the test lets it go. */
async function holdTheRun(page: Page) {
  const held: Route[] = [];
  let isHeld = true;
  await page.route("**/api/design", async (route) => {
    if (isHeld) held.push(route);
    else await route.continue();
  });
  return {
    held,
    async letGo() {
      isHeld = false;
      await Promise.all(held.map((route) => route.continue()));
    },
  };
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the demo, as the API hands it out", () => {
  test("a workspace without a design opens the demo, and says its name", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    const trigger = page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ });

    await expect(trigger).toBeVisible({ timeout: RUN });
    if (isDesktop(testInfo.project.name)) await expect(trigger).toContainText("18.52° N · 73.86° E");
    await expect(page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ })).toHaveAttribute("aria-expanded", "false");
  });

  test("the vitals show its seven numbers", async ({ page }) => {
    await page.goto("/studio/array");
    const vitals = vitalsOf(page);

    await expect(vitals.getByText("617.8")).toBeVisible({ timeout: RUN });

    expect(await valuesOf(vitals)).toEqual(DEMO);
  });

  test("DC/AC is in target: a tick", async ({ page }) => {
    await page.goto("/studio/array");

    await expect(vitalsOf(page).getByRole("img", { name: "In target" })).toBeVisible({ timeout: RUN });
  });

  test("it has one note to review, in the words of the API", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    await expect(vitalsOf(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const opener = isPhone(testInfo.project.name)
      ? page.getByRole("banner").getByRole("button", { name: "1 note to review" })
      : vitalsOf(page).getByRole("button", { name: "1 note to review" });

    if (!isPhone(testInfo.project.name)) await expect(opener).toContainText("Voc coefficient");
    await opener.click();

    const drawer = page.getByRole("dialog", { name: "Notes to review" });
    await expect(drawer.getByTestId("notes-count")).toHaveText("1");
    await expect(drawer.getByRole("listitem")).toHaveCount(1);
    await expect(drawer.getByRole("listitem")).toContainText("Voc coefficient");
    await expect(drawer.getByRole("listitem")).toContainText(VOC);
    await expect(drawer.getByRole("listitem")).toContainText("Module · Array lens");
  });

  test("it is not kept on this device, and says so", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    const bar = page.getByRole("banner");
    await expect(bar.getByRole("button", { name: /Pune demo roof/ })).toBeVisible({ timeout: RUN });

    if (isDesktop(testInfo.project.name)) {
      await expect(bar.getByText("Not kept on this device").and(page.locator(":visible"))).toHaveCount(1);
      return;
    }
    await bar.getByRole("button", { name: /Pune demo roof/ }).click();
    await expect(page.locator("[popover]:popover-open").getByTestId("this-design")).toContainText("Not kept on this device");
  });

  test("the design stays while the workspaces are gone through: it is not asked for again", async ({ page }) => {
    const runs: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/design")) runs.push(request.url());
    });
    await page.goto("/studio/array");
    await expect(vitalsOf(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const workspaces = page.getByRole("navigation", { name: "Workspaces" });

    await workspaces.getByRole("link", { name: "Performance" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Performance" })).toBeVisible();
    await expect(page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ })).toBeVisible();
    await workspaces.getByRole("link", { name: "Studio" }).click();

    await expect(page).toHaveURL(/\/studio\/array$/);
    await expect(vitalsOf(page).getByText("617.8")).toBeVisible();
    expect(await valuesOf(vitalsOf(page))).toEqual(DEMO);
    expect(runs).toHaveLength(1);
  });
});

test.describe("while the first run is on its way", () => {
  test("skeletons in the place of the values, and the last cell says what is opened", async ({ page }) => {
    const run = await holdTheRun(page);
    await page.goto("/studio/array");
    const vitals = vitalsOf(page);

    await expect(vitals.getByTestId("vitals-last")).toContainText("Opening Pune demo roof", { timeout: RUN });
    await expect(vitals.getByTestId("skeleton")).toHaveCount(14);
    await expect(vitals.locator("dd")).toHaveCount(0);
    await expect(vitals.getByTestId("vitals-last")).toHaveAttribute("role", "status");

    await run.letGo();
    await expect(vitals.getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(vitals.getByTestId("skeleton")).toHaveCount(0);
  });
});

test.describe("before a system voltage", () => {
  test.beforeEach(async ({ page }) => {
    await leaveTheVoltageOut(page);
    await page.goto("/studio/array");
    await expect(vitalsOf(page).getByText("442.40")).toBeVisible({ timeout: RUN });
  });

  test("the run was asked for without one: none is chosen for the user", async ({ page }) => {
    const asked = page.waitForRequest("**/api/design");
    await page.reload();

    expect((await asked).postDataJSON()).toMatchObject({ name: "Pune demo roof", system_voltage: null });
  });

  test("the vitals show the roof and the positions only", async ({ page }) => {
    expect(await valuesOf(vitalsOf(page))).toEqual(BEFORE_A_VOLTAGE);
  });

  test("no energy, no capacity of the design, no ratio, no yield", async ({ page }) => {
    const vitals = vitalsOf(page);

    for (const label of ["Energy, year 1", "DC capacity", "AC capacity", "DC/AC", "Modules", "PR", "Yield"]) {
      await expect(vitals.getByText(label, { exact: true })).toHaveCount(0);
    }
    await expect(vitals).not.toContainText("MWh");
  });

  test("what is waited for is said in the words of the API, and leads to the Strings lens", async ({ page }, testInfo) => {
    const note = vitalsOf(page).getByTestId("vitals-last");

    await expect(note).toContainText("Choose a system voltage to size the strings");
    if (!isPhone(testInfo.project.name)) await expect(note).toContainText("600, 1000 or 1500 V. Nothing is sized until you choose.");
    await expect(note).toHaveAttribute("href", "/studio/strings");

    await note.click();
    await expect(page).toHaveURL(/\/studio\/strings$/);
    await expect(page.getByRole("heading", { level: 1, name: "Strings" })).toBeVisible();
    expect(await valuesOf(vitalsOf(page))).toEqual(BEFORE_A_VOLTAGE);
  });

  test("the note of the module is there to review all the same", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "On desktop and tablet the last cell says what is waited for; the notes have their button on phone.");

    await expect(page.getByRole("banner").getByRole("button", { name: "1 note to review" })).toBeVisible();
  });
});

test.describe("the run fails", () => {
  test("at the first load: what failed is said in the notes, and it can be tried again", async ({ page }, testInfo) => {
    let fails = true;
    await page.route("**/api/design", (route) => (fails ? route.abort("connectionrefused") : route.continue()));
    await page.goto("/studio/array");
    const vitals = vitalsOf(page);
    const failed = vitals.getByRole("button", { name: "Energy was not computed" });

    await expect(failed).toBeVisible({ timeout: RUN });
    await expect(failed).toContainText("There are no values yet · Try again");
    // The layout answers in its own time, which is long while the server runs designs for other tests.
    await expect
      .poll(() => valuesOf(vitals), { timeout: RUN })
      .toEqual([
        ["Roof", "3,600 m²"],
        ["Positions", "790 modules"],
      ]);

    await failed.click();
    const drawer = page.getByRole("dialog", { name: "Notes to review" });
    const note = drawer.getByRole("listitem").filter({ hasText: "Energy was not computed" });
    await expect(note).toContainText("The server cannot be reached. Check the connection and try again.");

    fails = false;
    await note.getByRole("button", { name: "Try again" }).click();

    await expect(drawer).toBeHidden();
    await expect(vitals.getByText("617.8")).toBeVisible({ timeout: RUN });
    expect(await valuesOf(vitals)).toEqual(DEMO);
    const notes = isPhone(testInfo.project.name)
      ? page.getByRole("banner").getByRole("button", { name: "1 note to review" })
      : vitals.getByRole("button", { name: "1 note to review" });
    await expect(notes).toBeVisible();
  });

  test("the demo itself does not come: it is said, and it can be tried again", async ({ page }) => {
    let fails = true;
    await page.route("**/api/demo", (route) => (fails ? route.abort("connectionrefused") : route.continue()));
    await page.goto("/studio/array");
    const vitals = vitalsOf(page);
    const failed = vitals.getByRole("button", { name: "Energy was not computed" });

    await expect(failed).toBeVisible({ timeout: RUN });
    await expect(vitals.locator("dd")).toHaveCount(0);
    await expect(vitals.getByTestId("skeleton")).toHaveCount(0);

    await failed.click();
    fails = false;
    await page.getByRole("dialog", { name: "Notes to review" }).getByRole("button", { name: "Try again" }).click();

    await expect(page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ })).toBeVisible({ timeout: RUN });
    await expect(vitals.getByText("617.8")).toBeVisible({ timeout: RUN });
  });
});
