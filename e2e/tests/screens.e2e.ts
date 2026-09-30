import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { expectScreen } from "../screens";
import { A_MAP, findOpened, roofMap, scaleLabel, searchField } from "../find";
import { sceneSettled } from "../stage";

// Each screen against its baseline in e2e/baselines. After a change that is meant, look at the new
// picture beside the preview in docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test screens --update-snapshots   (in e2e/)

test("home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("api-status")).toHaveAttribute("data-state", "reachable");

  await expectScreen(page, "home");
});

// Find and outline, with the imagery from the fixture tile.
test("find", async ({ page }) => {
  await findOpened(page);

  await expectScreen(page, "find");
});

// The roof of the demo outlined by corners, as the boards "Find and outline" draw it.
test("find, the roof outlined", async ({ page }) => {
  await findOpened(page);
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  const box = (await roofMap(page).boundingBox())!;
  const pxPerM = 1 / 0.28313;
  for (const [east, north] of [
    [-45, -20],
    [45, -20],
    [45, 20],
    [-45, 20],
  ]) {
    await page.mouse.click(Math.round(box.x + box.width / 2 + east * pxPerM), Math.round(box.y + box.height / 2 - north * pxPerM));
  }
  await page.getByTestId("corner").first().click();
  await expect(page.getByRole("textbox", { name: "South" })).toBeVisible();
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false");

  await expectScreen(page, "find-outline");
});

// The roof closed, a box and a tank on it, the tank selected: the toolbar holds the obstacles and the
// panel lists them, as the board "Obstacles on the map and their heights" draws it.
test("find, the obstacles drawn", async ({ page }) => {
  await findOpened(page);
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  const box = (await roofMap(page).boundingBox())!;
  const pxPerM = 1 / 0.28313;
  const at = (east: number, north: number) => ({ x: Math.round(box.x + box.width / 2 + east * pxPerM), y: Math.round(box.y + box.height / 2 - north * pxPerM) });
  for (const [east, north] of [
    [-45, -20],
    [45, -20],
    [45, 20],
    [-45, 20],
  ]) {
    await page.mouse.click(at(east, north).x, at(east, north).y);
  }
  await page.getByTestId("corner").first().click();
  await expect(page.getByRole("textbox", { name: "South" })).toBeVisible();
  const dragged = async (from: [number, number], to: [number, number]) => {
    await page.mouse.move(at(...from).x, at(...from).y);
    await page.mouse.down();
    await page.mouse.move(at(...to).x, at(...to).y, { steps: 6 });
    await page.mouse.up();
  };
  const dialog = page.getByRole("dialog");
  await dragged([-31, 4], [-26, 8]);
  await dialog.getByRole("textbox", { name: "Height" }).fill("3");
  await dialog.getByRole("textbox", { name: "Height" }).press("Enter");
  await expect(dialog).toBeHidden();
  await page.getByRole("toolbar", { name: "Outline tools" }).getByRole("button", { name: "Tank", exact: true }).click();
  await dragged([17, 4], [18.25, 4]);
  // The last one by the mouse: the focus goes back to the map without the ring a key would leave.
  await dialog.getByRole("textbox", { name: "Height" }).fill("2");
  await dialog.getByRole("textbox", { name: "Height" }).press("Tab");
  await dialog.getByRole("button", { name: "Add the tank" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("obstacle-row")).toHaveCount(2);
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false");

  await expectScreen(page, "find-obstacles");
});

// The roof entered by hand without a map (no WebGL): the plan on the stage, the fields in the panel, as
// the board "Enter dimensions by hand" draws it.
test("find, the roof by hand", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return (getContext as (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) => unknown).call(this, kind, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/find");
  await page.getByRole("status").getByRole("button", { name: "Enter dimensions by hand instead" }).click();
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(page.getByRole("textbox", { name: "Latitude" })).toHaveValue("18.52000");
  for (const [name, value] of [
    ["Length", "90"],
    ["Width", "40"],
    ["Long side faces", "180"],
  ] as const) {
    await page.getByRole("textbox", { name }).fill(value);
    await page.getByRole("textbox", { name }).press("Enter");
  }
  await expect(page.getByTestId("plan-view").getByTestId("plan-label")).toHaveCount(4);
  // The last field commits by the mouse: no focus ring in the picture.
  await page.getByRole("heading", { level: 1, name: "Enter the roof by hand" }).click();

  await expectScreen(page, "find-by-hand");
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

    await sceneSettled(page);
    await expectScreen(page, "studio");
  });

  test("studio, the Roof lens", async ({ page }) => {
    await page.goto("/studio/roof");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("roof-how").filter({ visible: true })).toHaveText("Entered by hand · 4 corners · 6 obstacles");

    await sceneSettled(page);
    await expectScreen(page, "studio-roof");
  });

  test("studio, before a system voltage", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("442.40")).toBeVisible({ timeout: RUN });

    await sceneSettled(page);
    await expectScreen(page, "studio-before-a-voltage");
  });

  test("studio, the notes to review", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const opener = isPhone(testInfo.project.name) ? page.getByRole("banner") : vitals(page);

    await opener.getByRole("button", { name: "1 note to review" }).click();
    await expect(page.getByRole("dialog", { name: "Notes to review" })).toBeVisible();

    await sceneSettled(page);
    await expectScreen(page, "studio-notes");
  });

  test("studio, the project switcher", async ({ page }) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

    await design(page).click();
    await expect(page.getByRole("menu", { name: "Project" })).toBeVisible();

    await sceneSettled(page);
    await expectScreen(page, "studio-project-switcher");
  });

  // On phone the top bar says the notes once the run is over: the picture is taken after that, not before.
  const settled = async (page: Page, projectName: string) => {
    await expect(design(page)).toBeVisible({ timeout: RUN });
    if (isPhone(projectName)) await expect(page.getByRole("banner").getByRole("button", { name: "1 note to review" })).toBeVisible({ timeout: RUN });
  };

  test("performance", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await settled(page, testInfo.project.name);

    await expectScreen(page, "performance");
  });

  test("handover", async ({ page }, testInfo) => {
    await page.goto("/handover/report");
    await settled(page, testInfo.project.name);

    await expectScreen(page, "handover");
  });
});
