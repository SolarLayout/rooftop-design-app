import type { Page, Route } from "@playwright/test";
import { expect, test } from "../fixtures";
import { sceneShown } from "../stage";

// The states of the Sun lens (plan/phase-06-plan.md, step 14; the boards "Time on the stage" and "Shade map"): a
// sun that could not be fetched, said on the stage with Try again; a day the sun does not rise; the shade map
// while its run is on its way. On three sizes.

const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";

const timeline = (page: Page) => page.getByTestId("sun-timeline").filter({ visible: true });

/** A day at a place far north in December, where the sun stays down: no sunrise, no sunset, every hour below. */
const A_DAY_WITHOUT_SUN = {
  day_of_year: 355,
  positions: Array.from({ length: 97 }, (_, n) => ({ hour: n / 4, elevation_deg: -2 - Math.abs(12 - n / 4), azimuth_deg: (n * 3.75 + 180) % 360 })),
  sunrise_h: null,
  sunset_h: null,
  shadows: null,
};

test.beforeEach(() => test.setTimeout(RUN * 2));

test.describe("the states of the Sun lens", () => {
  test("a sun that could not be fetched is said on the stage, and Try again brings it", async ({ page }) => {
    let refused = 0;
    await page.route("**/api/sun", (route: Route) => {
      if (refused === 0) {
        refused += 1;
        return route.abort("connectionrefused");
      }
      return route.fallback();
    });
    await page.goto("/studio/sun");
    await sceneShown(page);

    const chip = page.getByTestId("sun-failed");
    await expect(chip).toContainText("The sun was not updated", { timeout: RUN });
    await expect(chip).toContainText("Try again");
    await expect(page.getByTestId("on-the-roof-sun")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Sun at 10:30" })).toContainText("The sun was not fetched");

    await chip.getByRole("button", { name: "Try again" }).click();

    await expect(chip).toHaveCount(0, { timeout: RUN });
    await expect(page.getByTestId("on-the-roof-sun")).toHaveText("21 Dec, 10:30 solar time, sun 42.6° high, 28.5° E of south", { timeout: RUN });
  });

  test("a day the sun stays down runs from midnight to midnight and says so", async ({ page }, testInfo) => {
    await page.route("**/api/sun", (route: Route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(A_DAY_WITHOUT_SUN) }));
    await page.goto("/studio/sun");
    await sceneShown(page);

    await expect(timeline(page)).toContainText("The sun stays below the horizon all day", { timeout: RUN });
    if (!isPhone(testInfo.project.name)) await expect(timeline(page)).toContainText("00:00");
    await expect(page.getByTestId("on-the-roof-sun")).toHaveText("21 Dec, 10:30 solar time, the sun is down");
    await expect(page.getByTestId("sun-marker")).toHaveCount(0);
  });

  test("the shade map waits for its run, and comes with it", async ({ page }, testInfo) => {
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/api/design", async (route: Route) => {
      await held;
      await route.fallback();
    });
    await page.goto("/studio/sun");
    await sceneShown(page);
    if (isPhone(testInfo.project.name)) {
      await page.getByRole("separator", { name: "Inspector" }).focus();
      await page.keyboard.press("End");
    }
    await page.getByRole("radiogroup", { name: "Sun lens" }).getByRole("radio", { name: "Shade map" }).click();

    await expect(page.getByTestId("shade-legend")).toContainText("The shade map follows the design run", { timeout: RUN });
    await expect(page.getByTestId("on-the-roof-shade-map")).toHaveText("The shade map follows the design run");

    release();

    await expect(page.getByTestId("on-the-roof-shade-map")).toContainText("The shade map: near shading over the year", { timeout: RUN });
  });
});
