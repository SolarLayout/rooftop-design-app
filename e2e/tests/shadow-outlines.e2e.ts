import type { Page, Request } from "@playwright/test";
import { expect, test } from "../fixtures";
import { cameraSettled, inThePlan, planFrameOf, sceneSettled, zoomedInAt, type PlanFrame } from "../stage";

// The engine's shadow outlines and the acceptance of Phase 6 (plan/phase-06-plan.md, steps 6, 7 and 9,
// decisions 7, 8, 9 and 15): the outlines asked for the roof alone when the time rests; and the stair room's
// rendered shadow at 16:00 on 21 December within 0.2 m of the engine's polygon at its far corner, the corner
// read from the engine's answer. On three sizes.

const RUN = 90_000;
const WITHIN = 0.2;
const isPhone = (projectName: string) => projectName === "phone";

type Corner = [east: number, north: number];
type Polygon = { exterior: Corner[]; holes: Corner[][] };
type Obstacle = { name: string; x: number; y: number; length: number; width: number; height: number };
type ShadowRequest = { lat: number; day: unknown; hours: number[]; shadows: { roof: { obstacles: Obstacle[] }; hour: number } };
type ShadowAnswer = { shadows: { elevation_deg: number; azimuth_deg: number; polygons: Polygon[] } };

const readOut = (page: Page) => page.getByTestId("on-the-roof-sun");
const outlinesSwitch = (page: Page) => page.getByRole("switch", { name: "Calculated shadow outlines" });

const isShadowRequest = (request: Request) => request.url().endsWith("/api/sun") && Boolean((request.postDataJSON() as { shadows?: unknown }).shadows);

/** The Sun lens at 16:00 on 21 December, set by the keys of the timeline, a quarter hour each. */
async function atFourOnTheDesignDay(page: Page) {
  await page.goto("/studio/sun");
  await sceneSettled(page);
  const slider = page.getByTestId("sun-timeline").filter({ visible: true }).getByRole("slider", { name: "Time of day" });
  await slider.focus();
  for (let step = 0; step < 22; step += 1) await page.keyboard.press("ArrowRight");
  await expect(readOut(page)).toHaveText("21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south", { timeout: RUN });
}

/** The inspector's switch reached: on phone in the sheet, opened to its full stop. */
async function switchReached(page: Page, projectName: string) {
  if (isPhone(projectName)) {
    await page.getByRole("separator", { name: "Inspector" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Open");
  }
  await outlinesSwitch(page).scrollIntoViewIfNeeded();
}

/** The sheet back to half on phone, so that the stage is seen. */
async function stageSeen(page: Page, projectName: string) {
  if (!isPhone(projectName)) return;
  await page.getByRole("separator", { name: "Inspector" }).focus();
  await page.keyboard.press("Home");
}

/**
 * The far corner of the stair room's shadow as the engine has it: where the corner of its top farthest along the
 * light falls on the roof, and the vertex of the engine's polygon there (which must be it, within a centimetre).
 */
function engineCornerOf(request: ShadowRequest, answer: ShadowAnswer): Corner {
  const stair = request.shadows.roof.obstacles.find((obstacle) => obstacle.name === "Stair room")!;
  const { elevation_deg: elevation, azimuth_deg: azimuth } = answer.shadows;
  const along = 1 / Math.tan((elevation * Math.PI) / 180);
  const toward: Corner = [-Math.sin((azimuth * Math.PI) / 180) * along, -Math.cos((azimuth * Math.PI) / 180) * along];
  const top: Corner[] = [-1, 1].flatMap((sx) => [-1, 1].map((sy): Corner => [stair.x + (sx * stair.length) / 2, stair.y + (sy * stair.width) / 2]));
  const far = top.map(([x, y]): Corner => [x + toward[0] * stair.height, y + toward[1] * stair.height]).sort((a, b) => b[0] * toward[0] + b[1] * toward[1] - (a[0] * toward[0] + a[1] * toward[1]))[0];
  const vertex = answer.shadows.polygons
    .flatMap((polygon) => polygon.exterior)
    .sort((a, b) => Math.hypot(a[0] - far[0], a[1] - far[1]) - Math.hypot(b[0] - far[0], b[1] - far[1]))[0];
  expect(Math.hypot(vertex[0] - far[0], vertex[1] - far[1]), "the engine's polygon has the corner").toBeLessThan(0.01);
  return vertex;
}

/** The light along a line of the plan, from a picture of the page decoded in the page, at each point given in metres. */
async function lightAlong(page: Page, frame: PlanFrame, points: readonly Corner[]): Promise<number[]> {
  const picture = await page.screenshot({ type: "png" });
  const pixels = points.map(([east, north]) => frame(east, north));
  const scale = await page.evaluate(() => window.devicePixelRatio);
  return page.evaluate(
    ([data, pixels, scale]) =>
      new Promise<number[]>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("No 2D context to read the picture with."));
          context.drawImage(image, 0, 0);
          resolve(
            pixels.map(({ x, y }) => {
              const [red, green, blue] = context.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data;
              return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
            }),
          );
        };
        image.onerror = () => reject(new Error("The picture of the page could not be read."));
        image.src = `data:image/png;base64,${data}`;
      }),
    [picture.toString("base64"), pixels, scale] as const,
  );
}

/** Where the light along a line steps from the shadow up to the lit roof: at the middle of the step, between two samples. */
function edgeOf(light: readonly number[], along: readonly number[]): number {
  const [low, high] = [Math.min(...light), Math.max(...light)];
  expect(high - low, "a shadow and a lit roof along the line").toBeGreaterThan(8);
  const middle = (low + high) / 2;
  const after = light.findIndex((value, index) => index > 0 && light[index - 1] < middle && value >= middle);
  expect(after, "the line steps out of the shadow").toBeGreaterThan(0);
  const share = (middle - light[after - 1]) / (light[after] - light[after - 1]);
  return along[after - 1] + share * (along[after] - along[after - 1]);
}

const steps = (from: number, to: number, by: number) => Array.from({ length: Math.round((to - from) / by) + 1 }, (_, n) => from + n * by);

test.beforeEach(() => test.setTimeout(RUN * 2));

test.describe("the engine's shadow outlines", () => {
  test("are asked for the roof alone once the time rests, and drawn; switched off they go", async ({ page }, testInfo) => {
    await atFourOnTheDesignDay(page);
    await switchReached(page, testInfo.project.name);
    const asked = page.waitForRequest(isShadowRequest, { timeout: RUN });

    await outlinesSwitch(page).click();

    const request = await asked;
    const body = request.postDataJSON() as ShadowRequest & { shadows: { project?: unknown } };
    expect(body.hours).toEqual([16]);
    expect(body.shadows.hour).toBe(16);
    expect(body.shadows.project).toBeUndefined();
    expect(request.postData()!.length, "the roof alone, not the document with its weather").toBeLessThan(20_000);
    await expect(page.getByTestId("on-the-roof-shadow-outlines")).toHaveText(/^The engine's shadow outlines at 16:00: \d+ polygons?$/, { timeout: RUN });

    await outlinesSwitch(page).click();
    await expect(page.getByTestId("on-the-roof-shadow-outlines")).toHaveCount(0);
  });
});

test.describe("the acceptance of Phase 6", () => {
  test("the stair room's shadow at 16:00 on 21 December lies within 0.2 m of the engine's polygon at its far corner", async ({ page }, testInfo) => {
    await atFourOnTheDesignDay(page);
    await switchReached(page, testInfo.project.name);
    const asked = page.waitForRequest(isShadowRequest, { timeout: RUN });
    await outlinesSwitch(page).click();
    const request = await asked;
    const answer = (await (await request.response())!.json()) as ShadowAnswer;
    const [east, north] = engineCornerOf(request.postDataJSON() as ShadowRequest, answer);
    // The outlines off again, so that their dashes do not stand on the edge that is measured.
    await outlinesSwitch(page).click();
    await stageSeen(page, testInfo.project.name);

    const before = await inThePlan(page);
    const corner = before(east, north);
    // As far in as makes a metre about 18 pixels: the phone's plan begins at about 2, the desktop's at 7.
    const fitPerMetre = Math.hypot(before(1, 0).x - before(0, 0).x, before(1, 0).y - before(0, 0).y);
    await zoomedInAt(page, corner, Math.min(12, Math.max(2, 18 / fitPerMetre)), testInfo.project.use.hasTouch ?? false);
    await cameraSettled(page);
    const frame = await planFrameOf(page);
    // The picture is read in the device's pixels: three to a CSS pixel on phone, where the plan zooms to 11 a metre at most.
    const devicePerMetre = Math.hypot(frame(1, 0).x - frame(0, 0).x, frame(1, 0).y - frame(0, 0).y) * (await page.evaluate(() => window.devicePixelRatio));
    expect(devicePerMetre, "the plan zoomed in to see a tenth of a metre").toBeGreaterThan(14);

    // Eastward along a row just south of the corner, over bare roof between the stair room's shadow and the lit
    // roof: the rows' modules end 0.3 m south of the corner. Northward along a column 1.2 m west of it, in the
    // area the stair room keeps clear.
    const row = steps(east - 1.2, east + 0.5, 0.02);
    const column = steps(north - 0.2, north + 0.9, 0.02);
    const eastEdge = edgeOf(await lightAlong(page, frame, row.map((x): Corner => [x, north - 0.15])), row);
    const northEdge = edgeOf(await lightAlong(page, frame, column.map((y): Corner => [east - 1.2, y])), column);

    // The measure, for the record of the phase ("As built").
    console.log(`${testInfo.project.name}: the shadow ends ${(eastEdge - east).toFixed(3)} m eastward and ${(northEdge - north).toFixed(3)} m northward of the engine's corner`);
    expect(Math.abs(eastEdge - east), `the shadow ends eastward at ${eastEdge.toFixed(3)} m, the engine's corner at ${east.toFixed(3)} m`).toBeLessThanOrEqual(WITHIN);
    expect(Math.abs(northEdge - north), `the shadow ends northward at ${northEdge.toFixed(3)} m, the engine's corner at ${north.toFixed(3)} m`).toBeLessThanOrEqual(WITHIN);
  });
});
