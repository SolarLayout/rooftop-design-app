import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { expectScreen } from "../screens";

// Each screen against its baseline in e2e/baselines. After a change that is meant, look at the new
// picture beside the preview in docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test screens --update-snapshots   (in e2e/)

test("home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("api-status")).toHaveAttribute("data-state", "reachable");

  await expectScreen(page, "home");
});

// The shell, with the demo from the API of the test stack. A picture is taken once the result is there.
test.describe("the shell", () => {
  const RUN = 90_000;
  test.describe.configure({ timeout: RUN + 30_000 });

  const isPhone = (projectName: string) => projectName === "phone";
  const design = (page: Page) => page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ });
  const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });

  test("studio", async ({ page }) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

    await expectScreen(page, "studio");
  });

  test("studio, before a system voltage", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("442.40")).toBeVisible({ timeout: RUN });

    await expectScreen(page, "studio-before-a-voltage");
  });

  test("studio, the notes to review", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const opener = isPhone(testInfo.project.name) ? page.getByRole("banner") : vitals(page);

    await opener.getByRole("button", { name: "1 note to review" }).click();
    await expect(page.getByRole("dialog", { name: "Notes to review" })).toBeVisible();

    await expectScreen(page, "studio-notes");
  });

  test("studio, the project switcher", async ({ page }) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

    await design(page).click();
    await expect(page.getByRole("menu", { name: "Project" })).toBeVisible();

    await expectScreen(page, "studio-project-switcher");
  });

  test("performance", async ({ page }) => {
    await page.goto("/performance");
    await expect(design(page)).toBeVisible({ timeout: RUN });

    await expectScreen(page, "performance");
  });

  test("handover", async ({ page }) => {
    await page.goto("/handover/report");
    await expect(design(page)).toBeVisible({ timeout: RUN });

    await expectScreen(page, "handover");
  });
});
