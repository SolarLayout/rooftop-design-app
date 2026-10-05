import type { Page } from "@playwright/test";
import { TWO_DESIGNS, withDesignsOnTheDevice } from "../device";
import { expect, test } from "../fixtures";
import { asFile, asFormat1, demoProjectFile } from "../project-file";
import { expectScreen, projectSwitcher, vitals } from "../screens";
import { sceneSettled } from "../stage";

// The pictures of Home, and of Open a project (a dialog of Home's, which the shell opens from the project switcher on every
// page), each against its baseline in e2e/baselines (home*.png: the home group's own, tools/check/e2e-groups.ts). After a
// change that is meant, look at the new picture beside the preview in docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test home-screens --update-snapshots   (in e2e/)

// Home as the boards draw it on three sizes (plan/phase-10-plan.md, step 11): the demo's card read from the API, nothing kept.
test("home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("demo-name")).toHaveText("Pune demo roof");

  await expectScreen(page, "home");
});

const RUN_OF_HOME = 90_000;

/**
 * Two designs on this device as the app keeps them: the demo edited in the Studio (its roof type East-west), kept at that edit
 * with its run's facts and the plan of its layout as the thumbnail; and Block B seeded beside it, not run yet (the roof alone).
 */
async function theDemoKeptBesideBlockB(page: Page): Promise<void> {
  await withDesignsOnTheDevice(page, [TWO_DESIGNS[1]!], null);
  await page.goto("/studio/roof");
  const roofType = page.getByRole("radiogroup", { name: "Roof type" }).filter({ visible: true });
  await expect(roofType.getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN_OF_HOME });
  // The untouched demo's run lands first, so that the demo's card says its numbers on every size alike (decision 5).
  await expect(page.getByRole("region", { name: "Design vitals" }).getByText("MWh")).toBeVisible({ timeout: RUN_OF_HOME });
  const ran = page.waitForResponse((response) => response.url().endsWith("/api/design") && response.ok() && (response.request().postDataJSON() as { roof: { roof_type: string } }).roof.roof_type === "flat_ew", { timeout: RUN_OF_HOME });
  const vitalsEnergy = page.getByRole("region", { name: "Design vitals" }).getByTestId("stat-value").filter({ hasText: "MWh" }).first();
  const energyBefore = await vitalsEnergy.textContent();
  await roofType.getByRole("radio", { name: "East-west" }).click();
  await ran;
  await expect(vitalsEnergy).not.toHaveText(energyBefore ?? "", { timeout: RUN_OF_HOME });
  const energy = Number.parseFloat((await vitalsEnergy.textContent())!.replace(/[^\d.]/g, ""));
  // The run's facts and the plan are written to the device a moment after the run lands: the page is left once the record
  // carries the energy of this run (not the untouched demo's) and the plan of this layout.
  let editedAt: number | null = null;
  await expect
    .poll(
      async () =>
        (editedAt = await page.evaluate(async (energy) => {
          const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const opening = indexedDB.open("rooftop", 1);
            opening.onsuccess = () => resolve(opening.result);
            opening.onerror = () => reject(opening.error);
          });
          type Record = { name: string; facts: { dcKwp: number | null; energyMwh: number | null }; thumbnail: string | null; editedAt: number };
          const kept = await new Promise<Record[]>((resolve, reject) => {
            const request = db.transaction("designs", "readonly").objectStore("designs").getAll();
            request.onsuccess = () => resolve(request.result as Record[]);
            request.onerror = () => reject(request.error);
          });
          db.close();
          const demo = kept.find((one) => one.name === "Pune demo roof");
          const landed = demo !== undefined && demo.facts.energyMwh !== null && Math.abs(demo.facts.energyMwh - energy) < 0.05 && demo.thumbnail !== null && demo.thumbnail.includes('data-module="true"');
          return landed ? demo.editedAt : null;
        }, energy)),
      { timeout: RUN_OF_HOME },
    )
    .not.toBeNull();
  // Home says when each design was edited, from the browser's clock: under load the run can take more than a minute, and
  // "Edited just now" would turn into "1 minute ago". The clock stands at the demo's edit.
  await page.clock.setFixedTime(editedAt!);
  await page.goto("/");
  await expect(page.getByTestId("demo-name")).toHaveText("Pune demo roof");
  await expect(page.getByTestId("design-card")).toHaveCount(2);
  await expect(page.getByRole("article", { name: "Pune demo roof", exact: true })).toContainText("MWh");
}

// Home with two designs kept on this device (plan/phase-10-plan.md, step 12; the board "Home, designs on this device"): the demo
// kept with the facts of its run and its plan, Block B not run yet, as cards under On this device.
test("home, designs on this device", async ({ page }) => {
  test.setTimeout(RUN_OF_HOME * 2);
  await theDemoKeptBesideBlockB(page);

  await expectScreen(page, "home-designs");
});

// Delete asked over the dimmed page, as the board draws it.
test("home, delete asked", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The board draws Delete asked on desktop.");
  test.setTimeout(RUN_OF_HOME * 2);
  await theDemoKeptBesideBlockB(page);
  const card = page.getByRole("article", { name: "Pune demo roof", exact: true });
  await card.scrollIntoViewIfNeeded();
  await card.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("menu", { name: "Pune demo roof", exact: true }).getByRole("menuitem", { name: "Delete" }).click();
  await expect(page.getByRole("dialog", { name: "Delete Pune demo roof?" })).toBeVisible();

  await expectScreen(page, "home-delete");
});

// Open a project over the Studio, with the demo from the API of the test stack: the dialog stands once the result is there.
const RUN = 90_000;
const isDesktop = (projectName: string) => projectName === "desktop";

/** The Studio on the Roof lens with the demo run, the project switcher opened and Open a project taken: the dialog stands. */
const openProjectOpened = async (page: Page) => {
  await page.goto("/studio/roof");
  await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
  await sceneSettled(page);
  await projectSwitcher(page).click();
  await page.getByRole("menu", { name: "Project" }).getByRole("menuitem", { name: "Open a project" }).click();
  const dialog = page.getByRole("dialog", { name: "Open a project" });
  await expect(dialog).toBeVisible();
  return dialog;
};

// Open a project with the demo's project file read (the board "Open a project", a file read): its name in mono, the project's name and the line under it, Open live.
test("open a project, a file read", async ({ page }) => {
  test.setTimeout(RUN + 30_000);
  const file = JSON.stringify(await demoProjectFile(page));
  const dialog = await openProjectOpened(page);
  await dialog.locator("input[type=file]").setInputFiles(asFile("Pune-demo-roof.rtd", file));
  await expect(dialog.getByTestId("file-drop-line")).toHaveText(["Pune demo roof", "Capacity and energy come with the run in the Studio"]);
  await expect(dialog.getByRole("button", { name: "Open", exact: true })).not.toHaveAttribute("aria-disabled", "true");
  // The focus leaves the dialog's field, so that no ring is in the picture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectScreen(page, "home-open-project");
});

// A format 1 file of the desktop app read (the same board): the engine's two notes on the files to choose again stand under the field, Open live.
test("open a project, a format 1 file read with its notes", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "The notes stand the same way on every size; one picture.");
  test.setTimeout(RUN + 30_000);
  const file = JSON.stringify(asFormat1(await demoProjectFile(page)));
  const dialog = await openProjectOpened(page);
  await dialog.locator("input[type=file]").setInputFiles(asFile("Test-project.rtd", file));
  await expect(dialog.getByTestId("open-note")).toHaveCount(2);
  await expect(dialog.getByRole("button", { name: "Open", exact: true })).not.toHaveAttribute("aria-disabled", "true");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectScreen(page, "home-open-project-notes");
});

// A file that is no JSON refused in the field in the API's words (the board "Open a project", a file refused), as soon as it is chosen.
test("open a project, a file refused", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "The refusal is the same on every size; one picture.");
  test.setTimeout(RUN + 30_000);
  const dialog = await openProjectOpened(page);
  await dialog.locator("input[type=file]").setInputFiles(asFile("roof-notes.rtd", "The tank is 2.4 m high.\n"));
  await expect(dialog.getByTestId("file-drop")).toContainText("The file is not a project file (.rtd): it is not JSON.");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectScreen(page, "home-open-project-refused");
});
