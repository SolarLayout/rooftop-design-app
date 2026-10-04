import { expect, test } from "../fixtures";
import { A_MAP, findOpened, roofMap, scaleLabel, searchField } from "../find";
import { expectScreen } from "../screens";

// The pictures of Find, each against its baseline in e2e/baselines (find*.png: the find group's own, tools/check/e2e-groups.ts).
// After a change that is meant, look at the new picture beside the preview in docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test find-screens --update-snapshots   (in e2e/)

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
