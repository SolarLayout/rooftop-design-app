import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "../fixtures";
import { expectScreen } from "../screens";

// The pages of the kit: every component in every state.
const PAGES = [
  { path: "/kit", name: "kit", heading: "Controls, depth and motion" },
  { path: "/kit/part-2", name: "kit-part-2", heading: "Controls, part 2" },
  { path: "/kit/shell", name: "kit-shell", heading: "Shell" },
];

for (const { path, name, heading } of PAGES) {
  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      expect((await page.goto(path))?.status()).toBe(200);
    });

    test("the kit names itself", async ({ page }) => {
      await expect(page).toHaveTitle("Kit · SolarLayout Rooftop");
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    });

    test("the pages of the kit lead to each other", async ({ page }) => {
      const pages = page.getByRole("navigation", { name: "Pages of the kit" });

      await expect(pages.getByRole("link")).toHaveText(PAGES.map((one) => one.heading));
      await expect(pages.getByRole("link", { name: heading })).toHaveAttribute("aria-current", "page");
    });

    test("nothing scrolls sideways, from 360 px up", async ({ page }) => {
      const widths = [360, page.viewportSize()?.width ?? 360];

      for (const width of widths) {
        await page.setViewportSize({ width, height: 800 });
        const beyond = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(beyond, `at ${width} px`).toBeLessThanOrEqual(0);
      }
    });

    test("axe finds nothing serious or critical", async ({ page }) => {
      const found = await new AxeBuilder({ page }).analyze();
      const grave = found.violations
        .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);

      expect(grave).toEqual([]);
    });

    test("looks as its baseline", async ({ page }) => {
      await expectScreen(page, name);
    });
  });
}
