import type { Page } from "@playwright/test";
import { A_MAP, findOpened, roofMap, scaleLabel, searchField } from "../find";
import { expect, test } from "../fixtures";

// Obstacles on the map (plan/phase-04-plan.md, step 14; the board "Obstacles on the map and their
// heights"): once the roof is closed the toolbar holds a box, a tank, a wall and a building; each asks
// its height right after, with nothing preselected; they go to Build with the roof, and the card of the
// Roof lens counts them. The map stands at roof zoom on 18.52° N 73.86° E: one CSS pixel is 0.2831 m.

const METRES_PER_PX = 0.28313;
const PX_PER_M = 1 / METRES_PER_PX;
const RUN = 90_000;

type Centre = { cx: number; cy: number };

const at = (centre: Centre, east: number, north: number) => ({ x: Math.round(centre.cx + east * PX_PER_M), y: Math.round(centre.cy - north * PX_PER_M) });
const press = async (page: Page, centre: Centre, east: number, north: number) => {
  const { x, y } = at(centre, east, north);
  await page.mouse.click(x, y);
};
const drag = async (page: Page, centre: Centre, from: [number, number], to: [number, number]) => {
  const a = at(centre, ...from);
  const b = at(centre, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 6 });
  await page.mouse.up();
};

const tool = (page: Page, name: string) => page.getByRole("toolbar", { name: "Outline tools" }).getByRole("button", { name, exact: true });
const rows = (page: Page) => page.getByTestId("obstacle-row");
const dialog = (page: Page) => page.getByRole("dialog");
const heightField = (page: Page) => dialog(page).getByRole("textbox", { name: "Height" });

/** The roof of the demo, drawn and closed: the obstacles can be drawn. */
async function roofClosed(page: Page): Promise<Centre> {
  await findOpened(page);
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  const box = (await roofMap(page).boundingBox())!;
  const centre = { cx: box.x + box.width / 2, cy: box.y + box.height / 2 };
  for (const [east, north] of [
    [-45, -20],
    [45, -20],
    [45, 20],
    [-45, 20],
  ]) {
    await press(page, centre, east, north);
  }
  await page.getByTestId("corner").first().click();
  await expect(page.getByRole("textbox", { name: "South" })).toBeVisible();
  return centre;
}

/** The height typed into the dialog and the obstacle added. */
async function heightGiven(page: Page, word: string, height: string, name = "") {
  await expect(dialog(page)).toContainText(`Height of the ${word}`);
  if (name) await dialog(page).getByRole("textbox", { name: "Name" }).fill(name);
  await heightField(page).fill(height);
  await heightField(page).press("Enter");
  await expect(dialog(page)).toBeHidden();
}

test.describe.configure({ timeout: A_MAP + 30_000 });

test.describe("once the roof is closed", () => {
  test("the toolbar holds the four obstacles, with the box in hand; opened again, the ways to outline", async ({ page }) => {
    await roofClosed(page);

    await expect(page.getByRole("toolbar", { name: "Outline tools" }).getByRole("button", { pressed: true })).toHaveAccessibleName("Box");
    for (const name of ["Box", "Tank", "Wall", "Building"]) await expect(tool(page, name)).toBeVisible();
    await expect(tool(page, "Corners")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Obstacles" })).toContainText("None yet. Draw a box, a tank, a wall or a building with the tools on the map. Each asks its height.");

    await page.getByRole("button", { name: "Undo" }).click();

    await expect(tool(page, "Corners")).toHaveAttribute("aria-pressed", "true");
    await expect(tool(page, "Box")).toHaveCount(0);
  });

  test("a box dragged asks its height right after: the field is empty, the action waits for a number; given, the box is listed and labelled", async ({ page }) => {
    const centre = await roofClosed(page);

    await drag(page, centre, [10, 5], [15, 9]);

    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page)).toContainText("Height of the box");
    await expect(dialog(page)).toContainText("The imagery cannot give it. Enter its height above the roof surface.");
    await expect(heightField(page)).toHaveValue("");
    await expect(heightField(page)).toBeFocused();
    await expect(dialog(page).getByRole("button", { name: "Add the box" })).toHaveAttribute("aria-disabled", "true");
    await expect(dialog(page).getByRole("textbox", { name: "Name" })).toHaveAttribute("placeholder", "Box 1");

    // The action waits for the number; leaving the field commits it, and the action takes it.
    await heightField(page).fill("3");
    await heightField(page).press("Tab");
    await expect(dialog(page).getByRole("button", { name: "Add the box" })).not.toHaveAttribute("aria-disabled", "true");
    await dialog(page).getByRole("button", { name: "Add the box" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Box 1");
    await expect(rows(page).first()).toContainText(/^Box 1[45]\.\d × [34]\.\d · h 3\.0 m$/);
    await expect(rows(page).first()).toHaveAttribute("data-selected", "true");
    await expect(page.getByTestId("obstacle-label")).toHaveText("Box 1 · h 3.0 m");
    await expect(page.getByTestId("obstacle-corner")).toHaveCount(4);
    await expect(page.getByRole("region", { name: "Obstacles" })).toContainText("Obstacles · 1");
  });

  test("Remove in the dialog takes the shape off the map; Delete removes the selected obstacle; the row's Remove too; undo brings it back", async ({ page }) => {
    const centre = await roofClosed(page);
    await drag(page, centre, [10, 5], [15, 9]);
    await dialog(page).getByRole("button", { name: "Remove" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(rows(page)).toHaveCount(0);

    await drag(page, centre, [10, 5], [15, 9]);
    await heightGiven(page, "box", "3");
    await expect(rows(page)).toHaveCount(1);
    await page.keyboard.press("Delete");
    await expect(rows(page)).toHaveCount(0);
    await expect(page.getByTestId("corner")).toHaveCount(4);

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(rows(page)).toHaveCount(1);
    await rows(page).first().getByRole("button", { name: "Remove Box 1" }).click();
    await expect(rows(page)).toHaveCount(0);
    await expect(page.getByTestId("obstacle-label")).toHaveCount(0);
  });
});

test.describe("one of each kind, built", () => {
  test.describe.configure({ timeout: RUN + 60_000 });

  test("a box, a tank, a wall and a building with their heights go to Build; the card of the Roof lens counts them", async ({ page }) => {
    const layouts: { roof: { obstacles: { kind: string; name: string; height: number; diameter: number; points: [number, number][] }[] } }[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
    });
    const centre = await roofClosed(page);

    await drag(page, centre, [10, 5], [15, 9]);
    await heightGiven(page, "box", "3", "Stair room");

    await tool(page, "Tank").click();
    await drag(page, centre, [30, 10], [31.25, 10]);
    await heightGiven(page, "tank", "2");

    await tool(page, "Wall").click();
    await press(page, centre, -40, -15);
    await press(page, centre, -40, 15);
    await expect(page.getByTestId("live-point")).toHaveCount(2);
    await press(page, centre, -40, 15);
    await heightGiven(page, "wall", "0.8");

    // North of the roof, clear of the targets of its handles: the phone's map holds 55 m either side of
    // the centre and 65 m above it.
    await tool(page, "Building").click();
    await press(page, centre, -10, 30);
    await press(page, centre, 0, 30);
    await press(page, centre, 0, 40);
    await press(page, centre, -10, 40);
    await press(page, centre, -10, 30);
    await heightGiven(page, "building", "8");

    await expect(rows(page)).toHaveCount(4);
    await expect(rows(page)).toHaveText([/^Stair room/, /^Tank 1⌀ 2\.\d · h 2\.0 m$/, /^Wall 1(29|30)\.\d m · h 0\.8 m$/, /^Building 1(9\d|10\d) m² · h 8\.0 m$/]);
    await expect(page.getByTestId("obstacle-label")).toHaveCount(4);

    await page.getByRole("button", { name: "Build this roof" }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
    await expect(page.getByTestId("roof-how")).toHaveText("Outlined on satellite");
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners · 4 obstacles");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBeGreaterThan(0);
    const { obstacles } = layouts[0].roof;
    expect(obstacles.map((obstacle) => [obstacle.kind, obstacle.name, obstacle.height])).toEqual([
      ["box", "Stair room", 3],
      ["cylinder", "Tank 1", 2],
      ["wall", "Wall 1", 0.8],
      ["building", "Building 1", 8],
    ]);
    expect(Math.abs(obstacles[1].diameter - 2.5)).toBeLessThanOrEqual(0.6);
    expect(obstacles[2].points).toHaveLength(2);
    expect(obstacles[3].points).toHaveLength(4);
  });
});
