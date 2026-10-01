import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, sceneShown } from "../stage";

// The Roof lens of the Studio (plan/phase-05-plan.md, steps 10 to 13; the boards "Studio, Roof lens" on
// three sizes, "Obstacle edited on the roof" and "Import with missing heights"): the inspector mounted once,
// in the container of the size (decision 9); the card of the roof; the edges and access as fields that
// commit as fields do (decision 16), each a committed edit that asks for the layout again; the obstacles
// as a list whose selection is the scene's (decision 10), a new one a draft until its height is typed
// (decision 15).

const RUN = 90_000;

const isPhone = (projectName: string) => projectName === "phone";

type ObstacleSent = { name: string; kind: string; length: number; height: number; diameter: number; trunk_height: number; points: [number, number][] };
type LayoutRequest = { roof: { roof_type: string; parapet_h: number; setback_m: number; slope_deg: number; obstacles: ObstacleSent[] } };

/** Every request of the layout the page sends, as it is sent. */
function layoutsOf(page: Page): LayoutRequest[] {
  const layouts: LayoutRequest[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
  });
  return layouts;
}

/** The Roof lens with the demo open and its first layout asked for; on phone the sheet is opened in full. */
async function roofLensOpened(page: Page, projectName: string, layouts: LayoutRequest[]) {
  await page.goto("/studio/roof");
  await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
  await expect.poll(() => layouts.length, { timeout: RUN }).toBe(1);
  if (isPhone(projectName)) {
    await page.getByRole("separator", { name: "Inspector" }).press("End");
    await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Open");
  }
}

const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });

/** The first design run over: what floats beside a control closes when the page moves, and the vitals move it when the energy lands. */
const designSettled = (page: Page) => expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible({ timeout: RUN });

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the inspector, mounted once", () => {
  test("the card of the roof stands once in the page, on every size: the place, how, what it has, its size", async ({ page }) => {
    await page.goto("/studio/roof");

    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
    await expect(page.getByTestId("roof-how")).toHaveCount(1);
    await expect(page.getByTestId("roof-place")).toHaveText("18.52000° N, 73.86000° E");
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners · 6 obstacles");
    await expect(page.getByTestId("roof-size")).toHaveText("90.0 × 40.0 m · faces 180° S");
    await expect(page.getByRole("radiogroup", { name: "Roof type" })).toHaveCount(1);
  });
});

test.describe("edges and access", () => {
  test("the fields of the demo, two to a row; a parapet of 1.2 typed is a committed edit: the next layout carries it, the roof says it", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    const edges = page.getByRole("region", { name: "Edges and access" });
    for (const [name, value] of [
      ["Parapet", "0.90"],
      ["Setback", "1.00"],
      ["Walkway", "0.60"],
      ["Every", "24"],
      ["Clearance", "0.50"],
      ["Albedo", "0.20"],
    ] as const) {
      await expect(edges.getByRole("textbox", { name, exact: true })).toHaveValue(value);
    }
    await expect(field(page, "Pitch")).toHaveCount(0);
    if (!isPhone(testInfo.project.name)) {
      const [parapet, setback, walkway] = await Promise.all(["Parapet", "Setback", "Walkway"].map(async (name) => (await field(page, name).boundingBox())!));
      expect(Math.round(parapet.y)).toBe(Math.round(setback.y));
      expect(walkway.y).toBeGreaterThan(parapet.y);
    }

    await field(page, "Parapet").fill("1.2");
    await field(page, "Parapet").press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof).toMatchObject({ parapet_h: 1.2, setback_m: 1 });
    await expect(field(page, "Parapet")).toHaveValue("1.20");
    await expect(page.getByTestId("on-the-roof-roof")).toContainText("parapet 1.2 m", { timeout: RUN });
  });

  test("sloped chosen: the pitch and where it faces appear, and the parapet reads 0.00", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);

    await page.getByRole("radiogroup", { name: "Roof type" }).getByRole("radio", { name: "Sloped" }).click();

    await expect(field(page, "Pitch")).toHaveValue("10");
    await expect(field(page, "Faces")).toHaveValue("180.0");
    await expect(field(page, "Parapet")).toHaveValue("0.00");
    await expect(field(page, "Every")).toHaveValue("4");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof).toMatchObject({ roof_type: "sloped_flush", parapet_h: 0 });

    await field(page, "Pitch").fill("15");
    await field(page, "Pitch").press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(3);
    expect(layouts[2].roof.slope_deg).toBe(15);
  });
});

const row = (page: Page, name: string) => page.getByTestId("obstacle-row").filter({ hasText: name });
const card = (page: Page) => page.getByTestId("obstacle-card");
const onTheRoof = (page: Page, name: string) => page.getByTestId("on-the-roof-obstacle").filter({ hasText: name });

test.describe("the obstacles", () => {
  test("a row selects: its card opens with its fields, the roof says it, the callout stands over it; Escape clears", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    await expect(page.getByTestId("obstacle-row")).toHaveCount(6);
    await expect(page.getByRole("heading", { name: "Obstacles · 6" })).toBeVisible();

    await row(page, "Stair room").click();

    await expect(card(page)).toHaveCount(1);
    await expect(card(page).getByRole("textbox", { name: "Name" })).toHaveValue("Stair room");
    await expect(card(page)).toContainText("Box");
    for (const [name, value] of [["Length", "5.00"], ["Width", "4.00"], ["Height", "3.00"], ["Rotation", "0"], ["East", "22.50"], ["North", "18.00"]] as const) {
      await expect(card(page).getByRole("textbox", { name, exact: true })).toHaveValue(value);
    }
    await expect(row(page, "Stair room")).toHaveCount(0);
    await expect(onTheRoof(page, "Stair room")).toHaveText("Stair room, box 5.0 × 4.0 m, 3.0 m high, selected");
    await sceneShown(page);
    const callout = page.getByTestId("stage-callout");
    await expect(callout).toContainText("Stair room · selected", { timeout: A_SCENE });
    await expect(callout).toContainText("5.0 × 4.0 m · 3.0 m high");

    await page.keyboard.press("Escape");

    await expect(card(page)).toHaveCount(0);
    await expect(callout).toHaveCount(0);
    await expect(page.getByTestId("obstacle-row")).toHaveCount(6);
  });

  test("a length typed is a committed edit: the next layout carries it and the roof says the new size", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    await row(page, "Stair room").click();

    await card(page).getByRole("textbox", { name: "Length", exact: true }).fill("6");
    await card(page).getByRole("textbox", { name: "Length", exact: true }).press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles[0]).toMatchObject({ name: "Stair room", length: 6 });
    await expect(onTheRoof(page, "Stair room")).toContainText("box 6.0 × 4.0 m");

    await card(page).getByRole("textbox", { name: "Name" }).fill("Lift room");
    await card(page).getByRole("textbox", { name: "Name" }).press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(3);
    expect(layouts[2].roof.obstacles[0].name).toBe("Lift room");
  });

  test("Add opens the kinds; a tree is a draft until its height is typed, then joins the design selected; Remove takes it away", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    await designSettled(page);

    await page.getByRole("button", { name: "Add", exact: true }).click();
    const menu = page.getByRole("menu", { name: "Add an obstacle" });
    await expect(menu.getByRole("menuitem")).toHaveText([/Box.*2\.0 × 2\.0 m/, /Tank.*⌀ 2\.0 m/, /Wall.*6\.0 m, points/, /Tree.*crown ⌀ 4\.0 m/, /Building.*beside the roof, points/]);
    await menu.getByRole("menuitem", { name: "Tree" }).click();

    await expect(card(page).getByRole("textbox", { name: "Name" })).toHaveValue("Tree 1");
    const height = card(page).getByRole("textbox", { name: "Height", exact: true });
    await expect(height).toHaveValue("");
    await expect(height).toBeFocused();
    await expect(card(page).getByRole("textbox", { name: "Crown ⌀", exact: true })).toHaveValue("4.00");
    await expect(card(page).getByRole("textbox", { name: "Crown starts at", exact: true })).toHaveValue("2.00");
    await expect(card(page).getByRole("button", { name: "Add the tree" })).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("on-the-roof-draft")).toHaveText("Tree 1 · draft");
    expect(layouts).toHaveLength(1);

    await height.fill("6");
    await height.press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles).toHaveLength(7);
    expect(layouts[1].roof.obstacles[6]).toMatchObject({ name: "Tree 1", kind: "tree", height: 6, trunk_height: 2, diameter: 4 });
    await expect(page.getByTestId("on-the-roof-draft")).toHaveCount(0);
    await expect(onTheRoof(page, "Tree 1")).toHaveText("Tree 1, tree, crown ⌀ 4.0 m, 6.0 m high, selected");
    await expect(card(page).getByRole("textbox", { name: "Height", exact: true })).toHaveValue("6.00");
    await expect(page.getByRole("heading", { name: "Obstacles · 7" })).toBeVisible();

    await card(page).getByRole("button", { name: "Remove Tree 1" }).click();

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(3);
    expect(layouts[2].roof.obstacles).toHaveLength(6);
    await expect(card(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Obstacles · 6" })).toBeVisible();
  });

  test("a wall is entered by its points: two at least, one added goes on along it; the draft's Remove drops it", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    await designSettled(page);

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menu", { name: "Add an obstacle" }).getByRole("menuitem", { name: "Wall" }).click();

    const points = card(page).getByTestId("point-row");
    await expect(points).toHaveCount(2);
    await expect(points.nth(0).getByRole("textbox", { name: "East of point 1" })).toHaveValue("42.00");
    await expect(points.nth(0).getByRole("button", { name: "Remove point 1" })).toBeDisabled();
    await card(page).getByRole("button", { name: "Add a point" }).click();
    await expect(points).toHaveCount(3);
    await expect(points.nth(2).getByRole("textbox", { name: "East of point 3" })).toHaveValue("54.00");
    await expect(points.nth(0).getByRole("button", { name: "Remove point 1" })).toBeEnabled();
    await expect(card(page).getByRole("textbox", { name: "Thickness", exact: true })).toHaveValue("0.20");

    await card(page).getByRole("textbox", { name: "Height", exact: true }).fill("2");
    await card(page).getByRole("textbox", { name: "Height", exact: true }).press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles[6]).toMatchObject({ name: "Wall 1", kind: "wall", height: 2, points: [[42, 20], [48, 20], [54, 20]] });

    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menu", { name: "Add an obstacle" }).getByRole("menuitem", { name: "Box" }).click();
    await expect(card(page).getByRole("textbox", { name: "Name" })).toHaveValue("Box 6");
    await card(page).getByRole("button", { name: "Remove", exact: true }).click();

    await expect(card(page)).toHaveCount(0);
    await expect(page.getByTestId("on-the-roof-draft")).toHaveCount(0);
    expect(layouts).toHaveLength(2);
  });

  test("the parapet is a read-only row at the end, as long as there is one", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    await expect(page.getByTestId("parapet-row")).toHaveText("Parapet, all edgesh 0.9 m");

    await field(page, "Parapet").fill("0");
    await field(page, "Parapet").press("Enter");

    await expect(page.getByTestId("parapet-row")).toHaveCount(0);
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
  });
});
