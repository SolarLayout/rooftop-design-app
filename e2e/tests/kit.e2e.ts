import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { expectScreen } from "../screens";

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test("the kit names itself", async ({ page }) => {
  await expect(page).toHaveTitle("Kit · SolarLayout Rooftop");
  await expect(page.getByRole("heading", { level: 1, name: "Controls, depth and motion" })).toBeVisible();
});

test("axe finds nothing serious or critical", async ({ page }) => {
  const found = await new AxeBuilder({ page }).analyze();
  const grave = found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);

  expect(grave).toEqual([]);
});

test("looks as its baseline", async ({ page }) => {
  await expectScreen(page, "kit");
});
