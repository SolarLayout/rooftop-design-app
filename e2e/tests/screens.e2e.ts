import path from "node:path";
import { TWO_DESIGNS, withDesignsOnTheDevice } from "../device";
import { expect, test } from "../fixtures";
import { expectScreen, projectSwitcher, vitals } from "../screens";
import { sceneSettled } from "../stage";

// The pictures of the shell, each against its baseline in e2e/baselines (shell*.png: the shell group's own,
// tools/check/e2e-groups.ts): the project switcher, Saved on this device, Import a drawing. Each workspace's pictures are
// in its group's screens suite (<group>-screens.e2e.ts), the kit's in kit.e2e.ts. After a change that is meant, look at
// the new picture beside the preview in docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test tests/screens.e2e.ts --update-snapshots   (in e2e/)

// The shell over the Studio, with the demo from the API of the test stack. A picture is taken once the result is there.
const RUN = 90_000;
test.describe.configure({ timeout: RUN + 30_000 });

const isDesktop = (projectName: string) => projectName === "desktop";

test("studio, the project switcher", async ({ page }) => {
  await page.goto("/studio/array");
  await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

  await projectSwitcher(page).click();
  await expect(page.getByRole("menu", { name: "Project" })).toBeVisible();

  await sceneSettled(page);
  await expectScreen(page, "shell-project-switcher");
});

// A design kept on this device, open: the state of saving in the top bar, the dot (the board "Home, designs on this device",
// the states of saving). Tablet and phone say it in the switcher, pictured below.
test("shell, saved on this device", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "On tablet and phone the state of saving is in the project switcher.");
  await withDesignsOnTheDevice(page, TWO_DESIGNS, TWO_DESIGNS[0]!.id);
  await page.goto("/studio/array");
  await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
  await expect(page.getByRole("banner").getByTestId("save-state").and(page.locator('[data-look="bar"]'))).toHaveText("Saved on this device");

  await sceneSettled(page);
  await expectScreen(page, "shell-saved-on-this-device");
});

// The switcher over two designs kept on this device: the open one with the tick and its capacity, the other by its roof.
test("studio, the project switcher, designs on this device", async ({ page }) => {
  await withDesignsOnTheDevice(page, TWO_DESIGNS, TWO_DESIGNS[0]!.id);
  await page.goto("/studio/array");
  await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

  await projectSwitcher(page).click();
  await expect(page.getByRole("menu", { name: "On this device" }).getByRole("menuitem")).toHaveCount(2);
  await expect(page.getByTestId("this-design")).toContainText("Saved on this device");

  await sceneSettled(page);
  await expectScreen(page, "shell-project-switcher-designs");
});

// Import a drawing with a DXF held: its units and its place asked, as the board draws them.
test("import a drawing, a DXF held", async ({ page }) => {
  test.setTimeout(RUN + 30_000);
  await page.goto("/studio/roof");
  // The picture holds the vitals behind the dialog: the run is waited for, as the baseline has it.
  await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
  await sceneSettled(page);
  await page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ }).click();
  await page.getByRole("menu", { name: "Project" }).getByRole("menuitem", { name: "Import a drawing" }).click();
  const dialog = page.getByRole("dialog", { name: "Import a drawing" });
  await dialog.locator("input[type=file]").setInputFiles(path.resolve(__dirname, "../fixtures/roof-with-tank.dxf"));
  await expect(dialog.getByTestId("import-place")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Open the roof" })).toHaveAttribute("aria-disabled", "true");
  // The focus leaves the dialog's field, so that no ring is in the picture; on phone the sheet's heading may be scrolled away.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectScreen(page, "shell-import-dxf");
});
