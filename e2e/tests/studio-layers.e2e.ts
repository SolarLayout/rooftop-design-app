import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, fit, north, sceneSettled, sceneShown, stage, switchLens } from "../stage";

// The Layers button of the stage and its panel (plan/phase-11-plan.md, step 35; the board "Stage, Layers";
// decision D57): fourth in the view controls on every size, after Fit and the north button where those are;
// pressed, a floating panel of 240 with one switch, Satellite imagery, on by default; off, the ground under the
// roof is the plain grid and the attribution of the imagery leaves; the setting is the view's, kept across the
// lenses. The panel stays a floating panel on tablet and phone, not a sheet. No request leaves the machine
// (e2e/fixtures.ts: the imagery is the fixture tile).

const RUN = 90_000;

/** The panel's width, the card's menu's: 240 (docs/design/components.md, "Layers button (the stage)"). */
const PANEL_WIDTH = 240;
/** Between the button and its panel (LIST_GAP). */
const GAP = 6;
/** The button's side: 38 on desktop, 44 on touch. */
const BUTTON_SIDE = { desktop: 38, tablet: 44, phone: 44 } as const;

const ATTRIBUTION = "Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community";
const IMAGERY_UNDER = "The ground is the satellite imagery";
const PLAIN_UNDER = "The ground is plain, with a grid";

const isPhone = (projectName: string) => projectName === "phone";

const layers = (page: Page) => stage(page).getByRole("button", { name: "Layers", exact: true });
const panel = (page: Page) => page.getByRole("dialog", { name: "Layers" });
const imagerySwitch = (page: Page) => panel(page).getByRole("switch", { name: "Satellite imagery" });
const ground = (page: Page) => page.getByTestId("on-the-roof-ground");
const attribution = (page: Page) => page.getByTestId("stage-attribution");

/** The panel opened by its button, with the switch holding the focus. */
async function opened(page: Page): Promise<void> {
  await layers(page).click();
  await expect(panel(page)).toBeVisible();
  await expect(layers(page)).toHaveAttribute("aria-expanded", "true");
  await expect(imagerySwitch(page)).toBeFocused();
}

async function boxOf(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box, `${locator} has a box`).not.toBeNull();
  return box!;
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the Layers button of the stage", () => {
  test("it stands in the view controls on every size, after Fit and the north button where those are, closed at first", async ({ page }, testInfo) => {
    await page.goto("/studio/roof");
    await sceneShown(page);

    const button = layers(page);
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toHaveAttribute("aria-haspopup", "dialog");
    const box = await boxOf(button);
    const side = BUTTON_SIDE[testInfo.project.name as keyof typeof BUTTON_SIDE];
    expect(Math.round(box.width)).toBe(side);
    expect(Math.round(box.height)).toBe(side);

    // The phone has 3D or Plan and Layers alone; tablet and desktop have Fit and the north button before it.
    if (isPhone(testInfo.project.name)) {
      await expect(fit(page)).toBeHidden();
      await expect(north(page)).toBeHidden();
    } else {
      const northBox = await boxOf(north(page));
      expect(box.x).toBeGreaterThan(northBox.x + northBox.width);
      expect(Math.round(box.x - (northBox.x + northBox.width))).toBe(8);
    }
    const view = await boxOf(stage(page).getByRole("radiogroup", { name: "View" }));
    expect(box.x).toBeGreaterThan(view.x + view.width);
  });

  test("its panel opens on the button with the switch on and in focus; the button, Escape and a press beside it close it, and the focus goes back to the button", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);

    await opened(page);
    await expect(imagerySwitch(page)).toHaveAttribute("aria-checked", "true");
    await expect(panel(page).getByText("Satellite imagery", { exact: true })).toBeVisible();
    await expect(panel(page).getByText("Off: the plain grid")).toBeVisible();

    // The button closes it.
    await layers(page).click();
    await expect(panel(page)).toBeHidden();
    await expect(layers(page)).toHaveAttribute("aria-expanded", "false");
    await expect(layers(page)).toBeFocused();

    // Escape closes it and gives the focus back.
    await opened(page);
    await page.keyboard.press("Escape");
    await expect(panel(page)).toBeHidden();
    await expect(layers(page)).toBeFocused();

    // A press beside it, on the stage, closes it.
    await opened(page);
    const box = await boxOf(stage(page));
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.5);
    await expect(panel(page)).toBeHidden();
    await expect(layers(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("the panel is a floating panel on every size: 240 wide, 6 under the button with their right edges in line, and no sheet", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);
    await opened(page);

    const button = await boxOf(layers(page));
    const box = await boxOf(panel(page));
    expect(Math.round(box.width)).toBe(PANEL_WIDTH);
    expect(Math.abs(box.x + box.width - (button.x + button.width))).toBeLessThanOrEqual(1);
    expect(Math.round(box.y - (button.y + button.height))).toBe(GAP);
    // Not a bottom sheet: no handle to close it, and nothing dimmed.
    await expect(page.getByRole("button", { name: "Close" })).toHaveCount(0);
    await expect(panel(page).getByRole("heading")).toHaveCount(0);
    await expect(panel(page).getByText("Layers", { exact: true })).toBeVisible();
  });

  test("the switch off makes the ground the plain grid and the attribution leaves; on, the imagery and its attribution come back", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneSettled(page);
    await expect(ground(page)).toHaveText(IMAGERY_UNDER, { timeout: A_SCENE });
    await expect(attribution(page)).toHaveText(ATTRIBUTION);

    await opened(page);
    await imagerySwitch(page).click();
    await expect(imagerySwitch(page)).toHaveAttribute("aria-checked", "false");
    // At once, with the panel still open, so that the choice is seen.
    await expect(panel(page)).toBeVisible();
    await expect(ground(page)).toHaveText(PLAIN_UNDER);
    await expect(attribution(page)).toHaveCount(0);

    await imagerySwitch(page).click();
    await expect(imagerySwitch(page)).toHaveAttribute("aria-checked", "true");
    await expect(ground(page)).toHaveText(IMAGERY_UNDER, { timeout: A_SCENE });
    await expect(attribution(page)).toHaveText(ATTRIBUTION);
  });

  test("the space bar turns the switch, which holds the focus once the panel is open", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneSettled(page);
    await opened(page);

    await page.keyboard.press("Space");
    await expect(imagerySwitch(page)).toHaveAttribute("aria-checked", "false");
    await expect(ground(page)).toHaveText(PLAIN_UNDER);

    await page.keyboard.press("Space");
    await expect(imagerySwitch(page)).toHaveAttribute("aria-checked", "true");
  });

  test("every lens shows the same button, and the ground chosen is the view's: it stays across the lenses", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneSettled(page);
    await opened(page);
    await imagerySwitch(page).click();
    await expect(ground(page)).toHaveText(PLAIN_UNDER);
    await page.keyboard.press("Escape");

    for (const lens of ["Array", "Sun", "Strings"]) {
      await switchLens(page, lens);
      await sceneShown(page);
      await expect(layers(page)).toBeVisible();
      await expect(layers(page)).toHaveAttribute("aria-expanded", "false");
      await expect(ground(page)).toHaveText(PLAIN_UNDER, { timeout: A_SCENE });
      await expect(attribution(page)).toHaveCount(0);
    }

    await opened(page);
    await expect(imagerySwitch(page)).toHaveAttribute("aria-checked", "false");
  });

  test("the open panel: axe finds nothing serious or critical", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);
    await opened(page);

    const found = await new AxeBuilder({ page }).analyze();
    const serious = found.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
