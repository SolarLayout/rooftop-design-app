import type { Locator, Page } from "@playwright/test";
import { A_MAP, findOpened, scaleLabel, searchField } from "../find";
import { expect, test } from "../fixtures";

// Outlining the roof by corners (plan/phase-04-plan.md, step 7), on three sizes: the acceptance's 90.0 by
// 40.0 m rectangle within 0.5 m per edge and 2 % of area, dragging, a midpoint, typed lengths, undo, the
// keyboard. The map stands at zoom 19 on 18.52° N 73.86° E after the search; at that latitude one CSS
// pixel is 0.2831 m (lib/map/scale-bar.ts), so a corner is a press at a known offset from the centre.

const METRES_PER_PX = 0.28313;
const PX_PER_M = 1 / METRES_PER_PX;

const isPhone = (projectName: string) => projectName === "phone";

const map = (page: Page) => page.getByTestId("roof-map");
const corners = (page: Page) => page.getByTestId("corner");
const midpoints = (page: Page) => page.getByTestId("midpoint");
const edgeLabels = (page: Page) => page.getByTestId("edge-label");
const field = (page: Page, name: string) => page.getByRole("textbox", { name });
const tile = (page: Page, label: string) => page.getByRole("region", { name: "Measurements" }).locator("div").filter({ hasText: label }).locator("code");

/** The map at the place, at roof zoom; the centre of the map in the page. */
async function atTheRoof(page: Page): Promise<{ cx: number; cy: number }> {
  await findOpened(page);
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
  // A press would stop the flight where it is: the map says while it moves.
  await expect(map(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  await expect(map(page)).toHaveAttribute("data-state", "ready");
  const box = (await map(page).boundingBox())!;
  return { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
}

/** A press on the map at metres east and north of the centre. */
async function press(page: Page, centre: { cx: number; cy: number }, east: number, north: number) {
  await page.mouse.click(Math.round(centre.cx + east * PX_PER_M), Math.round(centre.cy - north * PX_PER_M));
}

/** The 90 by 40 rectangle, corner by corner, counter-clockwise from the south-west, closed on the first. */
async function drawTheRectangle(page: Page, centre: { cx: number; cy: number }) {
  await press(page, centre, -45, -20);
  await expect(corners(page)).toHaveCount(1);
  await press(page, centre, 45, -20);
  await press(page, centre, 45, 20);
  await press(page, centre, -45, 20);
  await expect(corners(page)).toHaveCount(4);
  await corners(page).first().click();
}

/** The number a field holds, or a label or a tile shows. */
async function numberOf(locator: Locator): Promise<number> {
  const words = (await locator.evaluate((element) => (element instanceof HTMLInputElement ? element.value : element.textContent) ?? "")) as string;
  return Number(words.replace(/[^\d.−-]/g, "").replace("−", "-"));
}

test.describe.configure({ timeout: A_MAP + 30_000 });

test.describe("by corners", () => {
  test("the 90 by 40 m rectangle: every edge within 0.5 m, the area within 2 %, it faces south", async ({ page }) => {
    const centre = await atTheRoof(page);

    await drawTheRectangle(page, centre);

    for (const [name, length] of [
      ["South", 90],
      ["East", 40],
      ["North", 90],
      ["West", 40],
    ] as const) {
      expect(Math.abs((await numberOf(field(page, name))) - length), name).toBeLessThanOrEqual(0.5);
    }
    const area = await numberOf(tile(page, "Area"));
    expect(Math.abs(area - 3600) / 3600).toBeLessThanOrEqual(0.02);
    await expect(tile(page, "Faces")).toHaveText("180° S");
    await expect(tile(page, "Corners")).toHaveText("4");
    await expect(edgeLabels(page)).toHaveCount(4);
    await expect(edgeLabels(page).first()).toHaveText(/^(89|90)\.\d m$/);
  });

  test("while it is drawn the panel counts the corners, and Enter closes it", async ({ page }) => {
    const centre = await atTheRoof(page);
    await expect(page.getByRole("status").filter({ hasText: "first corner" })).toContainText("Click the first corner of the roof.");

    await press(page, centre, -45, -20);
    await press(page, centre, 45, -20);
    await expect(page.getByRole("status").filter({ hasText: "corners" })).toContainText("2 of at least 3 corners placed.");
    await press(page, centre, 45, 20);
    await expect(page.getByRole("status").filter({ hasText: "corners" })).toContainText("3 corners placed. Click the first corner, or press Enter, to close the outline.");

    await page.keyboard.press("Enter");

    await expect(field(page, "Edge 1")).toBeVisible();
    await expect(tile(page, "Corners")).toHaveText("3");
  });

  test("a corner dragged moves, and the numbers follow", async ({ page }) => {
    const centre = await atTheRoof(page);
    await drawTheRectangle(page, centre);
    const corner = corners(page).nth(1);
    const box = (await corner.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 10 * PX_PER_M, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();

    // Dragged along its edge, the roof is no rectangle any more: the edges go by their number.
    expect(Math.abs((await numberOf(edgeLabels(page).first())) - 100)).toBeLessThanOrEqual(0.6);
    await expect(field(page, "Edge 1")).toBeVisible();
    await expect(tile(page, "Faces")).toHaveText("180° S");
  });

  test("a midpoint dragged becomes a corner", async ({ page }) => {
    const centre = await atTheRoof(page);
    await drawTheRectangle(page, centre);
    await expect(midpoints(page)).toHaveCount(4);
    const middle = midpoints(page).first();
    const box = (await middle.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 5 * PX_PER_M, { steps: 8 });
    await page.mouse.up();

    await expect(corners(page)).toHaveCount(5);
    await expect(tile(page, "Corners")).toHaveText("5");
    await expect(field(page, "Edge 1")).toBeVisible();
  });

  test("a length typed into an edge corrects the outline, and every number follows", async ({ page }) => {
    const centre = await atTheRoof(page);
    await drawTheRectangle(page, centre);

    await field(page, "East").fill("50");
    await field(page, "East").press("Enter");

    await expect(field(page, "East")).toHaveValue("50.0");
    await expect(field(page, "West")).toHaveValue("50.0");
    expect(Math.abs((await numberOf(field(page, "South"))) - 90)).toBeLessThanOrEqual(0.5);
    expect(Math.abs((await numberOf(tile(page, "Area"))) - 4500) / 4500).toBeLessThanOrEqual(0.02);
    await expect(edgeLabels(page).nth(1)).toHaveText("50.0 m");
  });

  test("undo takes a corner back, redo brings it again, clear takes all", async ({ page }, testInfo) => {
    const centre = await atTheRoof(page);
    const undo = process.platform === "darwin" ? "Meta+z" : "Control+z";
    const redo = process.platform === "darwin" ? "Meta+Shift+z" : "Control+Shift+z";
    await press(page, centre, -45, -20);
    await press(page, centre, 45, -20);
    await expect(corners(page)).toHaveCount(2);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(corners(page)).toHaveCount(1);
    await page.keyboard.press(redo);
    await expect(corners(page)).toHaveCount(2);
    // Escape takes the last corner back, as a step of its own: what could have been redone is gone.
    await page.keyboard.press("Escape");
    await expect(corners(page)).toHaveCount(1);
    await page.keyboard.press(undo);
    await expect(corners(page)).toHaveCount(2);
    await page.keyboard.press(redo);
    await expect(corners(page)).toHaveCount(1);
    if (isPhone(testInfo.project.name)) return;

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(corners(page)).toHaveCount(2);
    await page.getByRole("button", { name: "Redo" }).click();
    await expect(corners(page)).toHaveCount(1);
    await page.getByRole("button", { name: "Clear outline" }).click();
    await expect(corners(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(corners(page)).toHaveCount(1);
  });

  test("the keyboard nudges the selected corner a tenth of a metre", async ({ page }) => {
    const centre = await atTheRoof(page);
    await drawTheRectangle(page, centre);
    const before = await numberOf(edgeLabels(page).nth(1));

    await corners(page).nth(2).click();
    await expect(corners(page).nth(2)).toHaveAccessibleName("Corner 3, selected");
    for (let n = 0; n < 5; n += 1) await page.keyboard.press("ArrowUp");

    expect(await numberOf(edgeLabels(page).nth(1))).toBeCloseTo(before + 0.5, 1);
    // Half a metre on forty is within a degree: still a rectangle, still named by its sides.
    await expect(field(page, "East")).toBeVisible();
  });

  test("on touch a loupe stands above the finger while a corner is dragged, twice the imagery; on desktop none", async ({ page }, testInfo) => {
    const centre = await atTheRoof(page);
    await drawTheRectangle(page, centre);
    const corner = corners(page).nth(1);
    const box = (await corner.boundingBox())!;
    const loupe = page.getByTestId("loupe");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 3 * PX_PER_M, box.y + box.height / 2, { steps: 4 });

    if (testInfo.project.name === "desktop") {
      await expect(loupe).toHaveCount(0);
    } else {
      await expect(loupe).toBeVisible();
      const seen = (await loupe.boundingBox())!;
      expect([Math.round(seen.width), Math.round(seen.height)]).toEqual([104, 104]);
      // Above the finger: its middle is 92 above the corner.
      const now = (await corner.boundingBox())!;
      expect(Math.round(now.y + now.height / 2 - (seen.y + seen.height / 2))).toBe(92);
    }
    await page.mouse.up();

    await expect(loupe).toHaveCount(0);
  });

  test("the handles: 18 on desktop, 22 on touch, in a target of 44", async ({ page }, testInfo) => {
    const centre = await atTheRoof(page);
    await press(page, centre, 0, 0);
    const handle = corners(page).first();
    const dot = handle.locator("span").first();

    const target = (await handle.boundingBox())!;
    const seen = (await dot.boundingBox())!;
    expect([Math.round(target.width), Math.round(target.height)]).toEqual([44, 44]);
    expect(Math.round(seen.width)).toBe(testInfo.project.name === "desktop" ? 18 : 22);
    await expect(handle).toHaveAccessibleName("Corner 1, selected");
    if (isPhone(testInfo.project.name)) await expect(page.getByRole("button", { name: "Redo" })).toBeHidden();
  });
});

test.describe("by rectangle", () => {
  /** A box dragged from the south-west corner to the north-east. */
  async function dragTheBox(page: Page, centre: { cx: number; cy: number }) {
    await page.getByRole("button", { name: "Rectangle" }).click();
    await page.mouse.move(Math.round(centre.cx - 45 * PX_PER_M), Math.round(centre.cy + 20 * PX_PER_M));
    await page.mouse.down();
    await page.mouse.move(Math.round(centre.cx + 45 * PX_PER_M), Math.round(centre.cy - 20 * PX_PER_M), { steps: 6 });
    await page.mouse.up();
  }

  test("a box dragged across the roof is the same rectangle: 90 by 40 within 0.5 m, facing south", async ({ page }) => {
    const centre = await atTheRoof(page);

    await dragTheBox(page, centre);

    await expect(corners(page)).toHaveCount(4);
    for (const [name, length] of [
      ["South", 90],
      ["East", 40],
      ["North", 90],
      ["West", 40],
    ] as const) {
      expect(Math.abs((await numberOf(field(page, name))) - length), name).toBeLessThanOrEqual(0.5);
    }
    await expect(tile(page, "Faces")).toHaveText("180° S");
    await expect(page.getByRole("button", { name: "Turn the rectangle" })).toBeVisible();
  });

  test("its handle turns it: the edges keep their lengths, the direction it faces follows", async ({ page }) => {
    const centre = await atTheRoof(page);
    await dragTheBox(page, centre);
    const handle = page.getByRole("button", { name: "Turn the rectangle" });
    const box = (await handle.boundingBox())!;
    const from = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    // The handle stands above the top edge; 10° counter-clockwise about the centre is up and to the left.
    const radius = Math.hypot(from.x - centre.cx, from.y - centre.cy);
    const to = { x: centre.cx - radius * Math.sin((10 * Math.PI) / 180), y: centre.cy - radius * Math.cos((10 * Math.PI) / 180) };

    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();

    await expect(tile(page, "Faces")).toHaveText(/^1(69|70|71)° S$/);
    for (const [edge, length] of [
      [0, 90],
      [1, 40],
    ] as const) {
      expect(Math.abs((await numberOf(edgeLabels(page).nth(edge))) - length)).toBeLessThanOrEqual(0.5);
    }
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(tile(page, "Faces")).toHaveText("180° S");
  });

  test("a corner of the box dragged makes it a polygon: the handle goes", async ({ page }) => {
    const centre = await atTheRoof(page);
    await dragTheBox(page, centre);
    const corner = corners(page).nth(2);
    const box = (await corner.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 5 * PX_PER_M, box.y + box.height / 2 - 5 * PX_PER_M, { steps: 6 });
    await page.mouse.up();

    await expect(page.getByRole("button", { name: "Turn the rectangle" })).toHaveCount(0);
    await expect(tile(page, "Corners")).toHaveText("4");
  });
});
