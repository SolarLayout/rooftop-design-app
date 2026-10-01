import { expect, type Page } from "@playwright/test";

// The 3D stage in the browser tests: the canvas keeps its drawing buffer (plan/phase-05-plan.md,
// decision 7), so a pixel of it can be read through the page.

export const A_SCENE = 60_000;

export type Pixel = [red: number, green: number, blue: number];

/** The background of the stage: the ground token, #0B0E13. */
export const STAGE: Pixel = [11, 14, 19];

export const stage = (page: Page) => page.getByTestId("stage");

// The view controls of the stage (plan step 4).
export const planView = (page: Page) => stage(page).getByRole("radio", { name: "Plan view" });
export const threeDView = (page: Page) => stage(page).getByRole("radio", { name: "3D view" });
export const fit = (page: Page) => stage(page).getByRole("button", { name: "Fit the roof" });
export const north = (page: Page) => stage(page).getByRole("button", { name: /^North: the view looks/ });
export const sceneCanvas = (page: Page) => stage(page).locator("canvas");

/** A place on the canvas as shares of its width and height, from its top left. */
export type Share = readonly [xShare: number, yShare: number];

/**
 * The colours of the canvas at places given as shares of its width and height, from its top left: one
 * picture of the canvas as the screen shows it, read back through the page (a 2D canvas), so that no
 * drawing buffer need be kept. What stands over the canvas in the DOM is in the picture too.
 */
export async function pixelsAt(page: Page, places: readonly Share[]): Promise<Pixel[]> {
  const picture = await sceneCanvas(page).screenshot({ type: "png" });
  return page.evaluate(
    ([data, places]) =>
      new Promise<[number, number, number][]>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("No 2D context to read the picture with."));
          context.drawImage(image, 0, 0);
          resolve(
            places.map(([xShare, yShare]) => {
              const [red, green, blue] = context.getImageData(Math.round((image.width - 1) * xShare), Math.round((image.height - 1) * yShare), 1, 1).data;
              return [red, green, blue];
            }),
          );
        };
        image.onerror = () => reject(new Error("The picture of the canvas could not be read."));
        image.src = `data:image/png;base64,${data}`;
      }),
    [picture.toString("base64"), places] as const,
  );
}

/** The colour of the canvas at a share of its width and height, from its top left. */
export async function pixelAt(page: Page, xShare: number, yShare: number): Promise<Pixel> {
  const [pixel] = await pixelsAt(page, [[xShare, yShare]]);
  return pixel;
}

/** The colour at a place of the canvas once it satisfies `wanted`; the last read when it never does. */
export async function pixelOnce(page: Page, xShare: number, yShare: number, wanted: (pixel: Pixel) => boolean, timeout = A_SCENE): Promise<Pixel> {
  const until = Date.now() + timeout;
  let pixel = await pixelAt(page, xShare, yShare);
  while (!wanted(pixel) && Date.now() < until) {
    await page.waitForTimeout(250);
    pixel = await pixelAt(page, xShare, yShare);
  }
  return pixel;
}

/** Whether two colours are the same, give or take the rounding of a display. */
export const isNear = ([r1, g1, b1]: Pixel, [r2, g2, b2]: Pixel, within = 6) => Math.abs(r1 - r2) <= within && Math.abs(g1 - g2) <= within && Math.abs(b1 - b2) <= within;

/** The roof is the brightest thing on the stage; until the first frame is drawn the pixels are black. */
export const isBright = ([red, green, blue]: Pixel) => Math.min(red, green, blue) > 120;

/** Something of the design is drawn there: the roof's grey or the modules' blue, not the background and not black. */
export const isDrawn = (pixel: Pixel) => !isNear(pixel, STAGE) && !isNear(pixel, [0, 0, 0]) && (isBright(pixel) || pixel[2] > pixel[0] + 15);

/** The stage drawn with the roof on it: its text equivalent names the roof and the canvas is there. */
export async function sceneShown(page: Page): Promise<void> {
  await expect(stage(page)).toHaveAttribute("data-state", "scene", { timeout: A_SCENE });
  await expect(page.getByTestId("on-the-roof-roof")).toContainText("Roof", { timeout: A_SCENE });
  await expect(sceneCanvas(page)).toBeVisible({ timeout: A_SCENE });
}

/** The scene with everything it draws for the demo: the modules of the layout and the sun's light. */
export async function sceneSettled(page: Page): Promise<void> {
  await sceneShown(page);
  await expect(page.getByTestId("on-the-roof-modules")).toContainText("modules", { timeout: A_SCENE });
  await expect(page.getByTestId("on-the-roof-sun")).toContainText("Sun", { timeout: A_SCENE });
  await expect(page.getByTestId("on-the-roof-ground")).toContainText("The ground is", { timeout: A_SCENE });
}

/** The page without WebGL, as a browser that has none. */
export async function withoutWebGL(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return (getContext as (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) => unknown).call(this, kind, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

/** A point of the roof in the document's metres as a pixel of the page. */
export type PlanFrame = (metresEast: number, metresNorth: number) => { x: number; y: number };

/**
 * The plan view, with the frame that maps the demo roof's metres to pixels of the page: in the plan the
 * metres map in a straight line, and the four edge labels stand at the middle of each edge, so they give
 * the frame (the long edges north and south, the short ones east and west; the roof is 90 by 40 m).
 */
export async function inThePlan(page: Page): Promise<PlanFrame> {
  await planView(page).click();
  await expect(planView(page)).toHaveAttribute("aria-checked", "true");
  const labels = stage(page).getByTestId("stage-label");
  await expect(labels).toHaveCount(4, { timeout: A_SCENE });
  // The plan is drawn once the long edges' labels stand one over the other.
  await expect
    .poll(
      async () => {
        const boxes = await labels.evaluateAll((nodes) => nodes.map((node) => ({ words: node.textContent, x: node.getBoundingClientRect().x })));
        const long = boxes.filter((box) => box.words === "90.0 m");
        return long.length === 2 && Math.abs(long[0].x - long[1].x) < 2;
      },
      { timeout: A_SCENE },
    )
    .toBe(true);
  const placed = await Promise.all(
    [0, 1, 2, 3].map(async (n) => {
      const box = (await labels.nth(n).boundingBox())!;
      return { words: await labels.nth(n).innerText(), x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }),
  );
  const [north, south] = placed.filter((label) => label.words === "90.0 m").sort((a, b) => a.y - b.y);
  const [west, east] = placed.filter((label) => label.words === "40.0 m").sort((a, b) => a.x - b.x);
  return (metresEast, metresNorth) => ({
    x: west.x + ((east.x - west.x) * metresEast) / 90 + ((north.x - south.x) * (metresNorth - 20)) / 40,
    y: west.y + ((east.y - west.y) * metresEast) / 90 + ((north.y - south.y) * (metresNorth - 20)) / 40,
  });
}
