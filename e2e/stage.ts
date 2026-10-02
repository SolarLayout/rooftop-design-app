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
  await expect(page.getByTestId("on-the-roof-sun")).toContainText("solar time", { timeout: A_SCENE });
  await expect(page.getByTestId("on-the-roof-ground")).toContainText("The ground is", { timeout: A_SCENE });
}

/**
 * The lens switched by its link, in the navigation of the size. The Studio re-renders on the way, and under
 * load a press can land on a link that is being replaced: the press is made again until the address changes.
 */
export async function switchLens(page: Page, name: string): Promise<void> {
  const link = page.getByRole("navigation", { name: "Lenses" }).filter({ visible: true }).getByRole("link", { name, exact: true });
  const address = new RegExp(`/studio/${name.toLowerCase()}$`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await link.click();
    try {
      await expect(page).toHaveURL(address, { timeout: 3_000 });
      return;
    } catch {
      // The press was lost in a re-render: once more.
    }
  }
  await expect(page).toHaveURL(address);
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
  return planFrameOf(page);
}

/**
 * The frame of the plan as it stands now, from the four edge labels, also after a zoom has taken them off the
 * canvas: they are still placed where their points fall, only clipped.
 */
export async function planFrameOf(page: Page): Promise<PlanFrame> {
  const placed = await stage(page)
    .getByTestId("stage-label")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        return { words: node.textContent ?? "", x: box.x + box.width / 2, y: box.y + box.height / 2 };
      }),
    );
  const [north, south] = placed.filter((label) => label.words === "90.0 m").sort((a, b) => a.y - b.y);
  const [west, east] = placed.filter((label) => label.words === "40.0 m").sort((a, b) => a.x - b.x);
  return (metresEast, metresNorth) => ({
    x: west.x + ((east.x - west.x) * metresEast) / 90 + ((north.x - south.x) * (metresNorth - 20)) / 40,
    y: west.y + ((east.y - west.y) * metresEast) / 90 + ((north.y - south.y) * (metresNorth - 20)) / 40,
  });
}

/** The middle of a handle of the selected obstacle on the stage, by its name ("corner-2", "turn", "height", "edge"). */
export async function handleAt(page: Page, id: string): Promise<{ x: number; y: number }> {
  const box = await page.locator(`[data-testid="stage-handle"][data-handle="${id}"]`).boundingBox();
  if (!box) throw new Error(`The handle ${id} is not on the stage.`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The handles of the selected obstacle have stopped moving: the camera has settled after a zoom or a turn. */
export async function handlesSettled(page: Page): Promise<void> {
  const handles = page.getByTestId("stage-handle");
  await expect(handles.first()).toBeVisible({ timeout: A_SCENE });
  const places = () => handles.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()).map(({ x, y }) => `${Math.round(x)},${Math.round(y)}`).join(" "));
  await expect
    .poll(
      async () => {
        const before = await places();
        await page.waitForTimeout(300);
        return (await places()) === before;
      },
      { timeout: A_SCENE },
    )
    .toBe(true);
}

/** A place on the page, in pixels. */
type Place = { x: number; y: number };

/** Two fingers on the canvas, so many pixels either side of a point, through the browser's own touch events. */
async function twoFingers(page: Page, steps: (readonly [Place, number])[]): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  const points = ([{ x, y }, half]: readonly [Place, number]) => [
    { x: x - half, y, id: 0 },
    { x: x + half, y, id: 1 },
  ];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(steps[0]) });
  for (const step of steps.slice(1)) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(step) });
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

/** The fingers stand this far either side of what they pinch or pan: clear of the handles of a small obstacle. */
const FINGERS_APART = 60;

/** Pixels the fingers move in, between the start and the end of a pinch or a pan. */
const TOUCH_STEPS = 12;

const between = (from: number, to: number, n: number) => from + ((to - from) * n) / TOUCH_STEPS;

/** The camera has settled after a move: the labels of the roof's edges have stopped moving on the page. */
export async function cameraSettled(page: Page): Promise<void> {
  const labels = stage(page).getByTestId("stage-label");
  // To a hundredth of a pixel, over half a second: the damping of the orbit tails off slowly, and a label still
  // gliding by a fraction of a pixel is drawn differently in two pictures.
  const places = () => labels.evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect()).map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" "));
  await expect
    .poll(
      async () => {
        const before = await places();
        await page.waitForTimeout(500);
        return (await places()) === before;
      },
      { timeout: A_SCENE },
    )
    .toBe(true);
}

/** One wheel event zooms the camera by one notch, a twentieth, whatever its delta says. */
const A_NOTCH = 1 / 0.95;

/**
 * The stage zoomed in about a point of the page by about the factor asked (or as far as the camera goes),
 * so that what is there grows and stays on screen. The camera zooms about its own middle, so what is at
 * the point is first panned to the middle of the canvas: by a drag of the right button with a mouse, by
 * two fingers on touch, either beginning a little west of the point, clear of the handles of the thing
 * there. Then the wheel turns notch by notch, or two fingers pinch twice (a pinch wider than the screen
 * would leave it), the camera settling between the gestures so that no finger lands on a handle still
 * gliding, and at the end.
 */
export async function zoomedInAt(page: Page, at: Place, times: number, hasTouch: boolean): Promise<void> {
  const box = await sceneCanvas(page).boundingBox();
  if (!box) throw new Error("The canvas has no box.");
  const middle = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const steps = Array.from({ length: TOUCH_STEPS + 1 }, (_, n) => n);
  if (hasTouch) {
    await twoFingers(page, steps.map((n) => [{ x: between(at.x, middle.x, n), y: between(at.y, middle.y, n) }, FINGERS_APART] as const));
    await cameraSettled(page);
    const round = Math.sqrt(times);
    for (let pinch = 0; pinch < 2; pinch += 1) {
      await twoFingers(page, steps.map((n) => [middle, between(FINGERS_APART, FINGERS_APART * round, n)] as const));
      await cameraSettled(page);
    }
    return;
  }
  await page.mouse.move(at.x - FINGERS_APART, at.y);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(middle.x - FINGERS_APART, middle.y, { steps: TOUCH_STEPS });
  await page.mouse.up({ button: "right" });
  await cameraSettled(page);
  const notches = Math.ceil(Math.log(times) / Math.log(A_NOTCH));
  // A breath between the notches: the browser merges wheel events that come together, and a merged pair zooms once.
  for (let notch = 0; notch < notches; notch += 1) {
    await page.mouse.wheel(0, -100);
    await page.waitForTimeout(30);
  }
  await cameraSettled(page);
}

/** A place of the page, and the way east and north go from it, in pixels per metre. */
export type BoxFrame = { x: number; y: number; east: [number, number]; north: [number, number] };

/**
 * The top of the selected box as its four corner handles place it: where its middle is on the page, and
 * the way east and north go, from a box of the given sides (the corner handles go counter-clockwise from
 * the south-west, as the engine's corners do).
 */
export async function boxFrameOf(page: Page, length: number, width: number): Promise<BoxFrame> {
  const [sw, se, ne, nw] = await Promise.all(["corner-0", "corner-1", "corner-2", "corner-3"].map((id) => handleAt(page, id)));
  return {
    x: (sw.x + se.x + ne.x + nw.x) / 4,
    y: (sw.y + se.y + ne.y + nw.y) / 4,
    east: [(se.x - sw.x) / length, (se.y - sw.y) / length],
    north: [(nw.x - sw.x) / width, (nw.y - sw.y) / width],
  };
}

/** A place so many metres east and north of a box's middle, on the page. */
export const metresFrom = ({ x, y, east, north }: BoxFrame, metresEast: number, metresNorth: number) => ({
  x: x + east[0] * metresEast + north[0] * metresNorth,
  y: y + east[1] * metresEast + north[1] * metresNorth,
});
