import type { Page, TestInfo } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, boxFrameOf, handleAt, handlesSettled, inThePlan, metresFrom, sceneShown, zoomedInAt, type BoxFrame } from "../stage";

// Direct manipulation of the selected obstacle (plan/phase-05-plan.md, step 19, decision 12; the board
// "Obstacle edited on the roof"): a drag on the roof plane moves it, snapped to 0.1 m, and the drop is one
// edit that the layout follows and an undo takes back; the handles size, turn and raise it. The tests work in
// the plan, where metres map to pixels in a straight line, zoomed in about the stair room so that its
// handles stand clear of each other and of its top; the height handle, which the plan cannot show, in 3D.

const RUN = 90_000;

/** How many times the plan is zoomed in about the stair room: as far as it goes (decision 17, five times the fit). */
const ZOOM_IN = 5;

type ObstacleSent = { name: string; x: number; y: number; length: number; width: number; rotation_deg: number; height: number };
type LayoutRequest = { roof: { obstacles: ObstacleSent[] } };

/** Every request of the layout the page sends, as it is sent. */
function layoutsOf(page: Page): LayoutRequest[] {
  const layouts: LayoutRequest[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
  });
  return layouts;
}

const card = (page: Page) => page.getByTestId("obstacle-card");
const field = (page: Page, name: string) => card(page).getByRole("textbox", { name, exact: true });
const live = (page: Page) => page.getByTestId("stage-live");
const handles = (page: Page) => page.getByTestId("stage-handle");
const stairRoomKeptClear = (page: Page) => page.getByTestId("on-the-roof-keepout").filter({ hasText: "Stair room shades" });
const undoKey = (testInfo: TestInfo) => (testInfo.project.name === "desktop" ? "Meta+z" : "Control+z");

/** The Roof lens with the stair room selected and its layout asked for. */
async function stairRoomSelected(page: Page, layouts: LayoutRequest[]) {
  await page.goto("/studio/roof");
  await sceneShown(page);
  await expect(page.getByTestId("on-the-roof-modules")).toContainText("790 modules", { timeout: RUN });
  await expect.poll(() => layouts.length, { timeout: RUN }).toBe(1);
  await page.getByTestId("obstacle-row").filter({ hasText: "Stair room" }).click();
  await expect(field(page, "East")).toHaveValue("22.50");
}

/** The stair room's top (5 by 4 m) in the plan, zoomed in about it: where its middle is on the page, and the way east and north go. */
async function stairRoomInThePlan(page: Page, testInfo: TestInfo): Promise<BoxFrame> {
  const point = await inThePlan(page);
  await zoomedInAt(page, point(22.5, 18), ZOOM_IN, Boolean(testInfo.project.use.hasTouch));
  await handlesSettled(page);
  return boxFrameOf(page, 5, 4);
}

/** A drag of the pointer from one pixel to another, in steps, with a look in between. */
async function dragged(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, midway?: () => Promise<void>) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 4 });
  if (midway) await midway();
  await page.mouse.up();
}

test.describe.configure({ timeout: RUN + 60_000 });

test.describe("the stair room dragged", () => {
  test("5 m east: its East reads 27.50, the layout carries it and its kept-clear count changes; undo restores both", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await stairRoomSelected(page, layouts);
    await expect(stairRoomKeptClear(page)).toContainText("Kept clear · 18 positions", { timeout: RUN });
    const frame = await stairRoomInThePlan(page, testInfo);

    await dragged(page, frame, metresFrom(frame, 5, 0), async () => {
      // While it moves: the live place beside the pointer, the handles away, the card saying the live place.
      await expect(live(page)).toHaveText("East 27.5 m · North 18.0 m", { timeout: A_SCENE });
      await expect(handles(page)).toHaveCount(0);
      await expect(field(page, "East")).toHaveValue("27.50");
    });

    await expect(field(page, "East")).toHaveValue("27.50");
    await expect(field(page, "North")).toHaveValue("18.00");
    await expect(live(page)).toHaveCount(0);
    await expect(handles(page).first()).toBeVisible({ timeout: A_SCENE });
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles[0]).toMatchObject({ name: "Stair room", x: 27.5, y: 18 });
    await expect(stairRoomKeptClear(page)).not.toContainText("18 positions", { timeout: RUN });

    // Nothing of the drag took the focus: the key is the Studio's.
    await page.keyboard.press(undoKey(testInfo));

    await expect(field(page, "East")).toHaveValue("22.50");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(3);
    expect(layouts[2].roof.obstacles[0]).toMatchObject({ x: 22.5, y: 18 });
    await expect(stairRoomKeptClear(page)).toContainText("Kept clear · 18 positions", { timeout: RUN });
  });
});

test.describe("the handles of a box", () => {
  test("a corner dragged sizes it: the opposite corner stays, Length and Width follow", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await stairRoomSelected(page, layouts);
    const frame = await stairRoomInThePlan(page, testInfo);

    // The north-east corner a metre east and half a metre north.
    await dragged(page, await handleAt(page, "corner-2"), metresFrom(frame, 3.5, 2.5), async () => {
      await expect(live(page)).toHaveText("6.0 × 4.5 m", { timeout: A_SCENE });
      await expect(field(page, "Length")).toHaveValue("6.00");
    });

    await expect(field(page, "Length")).toHaveValue("6.00");
    await expect(field(page, "Width")).toHaveValue("4.50");
    await expect(field(page, "East")).toHaveValue("23.00");
    await expect(field(page, "North")).toHaveValue("18.25");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles[0]).toMatchObject({ length: 6, width: 4.5, x: 23, y: 18.25 });
  });

  test("the turn handle dragged due west of the middle turns it to 90°, snapping to the right angle", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await stairRoomSelected(page, layouts);
    const frame = await stairRoomInThePlan(page, testInfo);

    // A touch off due west: within the snap of 3°.
    await dragged(page, await handleAt(page, "turn"), metresFrom(frame, -6, 0.2), async () => {
      await expect(live(page)).toHaveText("Rotation 90°", { timeout: A_SCENE });
    });

    await expect(field(page, "Rotation")).toHaveValue("90");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles[0]).toMatchObject({ rotation_deg: 90, length: 5, width: 4 });
  });

  test("the height handle, in 3D, dragged up raises it: Height follows, and the layout carries it", async ({ page }) => {
    const layouts = layoutsOf(page);
    await stairRoomSelected(page, layouts);
    await handlesSettled(page);
    const height = await handleAt(page, "height");

    await dragged(page, height, { x: height.x, y: height.y - 30 }, async () => {
      await expect(live(page)).toHaveText(/^\d+\.\d m high$/, { timeout: A_SCENE });
    });

    await expect(field(page, "Height")).not.toHaveValue("3.00");
    const raised = Number(await field(page, "Height").inputValue());
    expect(raised).toBeGreaterThan(3);
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.obstacles[0].height).toBeCloseTo(raised, 6);
  });

  test("a wall has no handles and is not dragged: the callout says it is moved by its points", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await page.goto("/studio/roof");
    await sceneShown(page);
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(1);
    // What floats beside Add closes when the page moves, and the vitals move it when the energy lands; on phone the
    // top bar says the notes after that, and moves it again.
    await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible({ timeout: RUN });
    if (testInfo.project.name === "phone") await expect(page.getByRole("banner").getByRole("button", { name: "1 note to review" })).toBeVisible({ timeout: RUN });
    if (testInfo.project.name === "phone") await page.getByRole("separator", { name: "Inspector" }).press("End");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await page.getByRole("menu", { name: "Add an obstacle" }).getByRole("menuitem", { name: "Wall" }).click();
    await field(page, "Height").fill("2");
    await field(page, "Height").press("Enter");

    await expect(page.getByTestId("stage-callout")).toContainText("Wall 1 · selected", { timeout: A_SCENE });
    await expect(page.getByTestId("stage-callout")).toContainText("moved by its points in the list");
    await expect(handles(page)).toHaveCount(0);
  });
});
