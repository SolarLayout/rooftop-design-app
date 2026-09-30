import { expect, type Page } from "@playwright/test";

// The 3D stage in the browser tests: the canvas keeps its drawing buffer (plan/phase-05-plan.md,
// decision 7), so a pixel of it can be read through the page.

export const A_SCENE = 60_000;

export type Pixel = [red: number, green: number, blue: number];

/** The background of the stage: the ground token, #0B0E13. */
export const STAGE: Pixel = [11, 14, 19];

export const stage = (page: Page) => page.getByTestId("stage");
export const sceneCanvas = (page: Page) => stage(page).locator("canvas");

/**
 * The colour of the canvas at a share of its width and height, from its top left: a picture of the canvas
 * as the screen shows it, read back through the page (a 2D canvas), so that no drawing buffer need be kept.
 */
export async function pixelAt(page: Page, xShare: number, yShare: number): Promise<Pixel> {
  const picture = await sceneCanvas(page).screenshot({ type: "png" });
  return page.evaluate(
    ([data, xShare, yShare]) =>
      new Promise<[number, number, number]>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const context = canvas.getContext("2d");
          if (!context) return reject(new Error("No 2D context to read the picture with."));
          context.drawImage(image, 0, 0);
          const [red, green, blue] = context.getImageData(Math.round((image.width - 1) * xShare), Math.round((image.height - 1) * yShare), 1, 1).data;
          resolve([red, green, blue]);
        };
        image.onerror = () => reject(new Error("The picture of the canvas could not be read."));
        image.src = `data:image/png;base64,${data}`;
      }),
    [picture.toString("base64"), xShare, yShare] as const,
  );
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

/** The stage drawn with the roof on it: its text equivalent names the roof and the canvas is there. */
export async function sceneShown(page: Page): Promise<void> {
  await expect(stage(page)).toHaveAttribute("data-state", "scene", { timeout: A_SCENE });
  await expect(page.getByTestId("on-the-roof-roof")).toContainText("Roof", { timeout: A_SCENE });
  await expect(sceneCanvas(page)).toBeVisible({ timeout: A_SCENE });
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
