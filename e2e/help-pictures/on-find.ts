import path from "node:path";
import type { Page } from "@playwright/test";
import { arcFrom, boxOf, clipAround, clipAt, placeOnScreen, pointOf, screenOf, type Act, type Box, type Clip, type HowTo, type Place, type Point } from "../../tools/help/pictures";
import { expect, IMAGERY } from "../fixtures";
import { A_MAP, atTheRoof, roofMap, withTheFootprints } from "../find";

// The hand on Find, for the help's pictures and clips (D81, Phase 15): how a how-to begins (the demo's roof opened on Find,
// or the demo's place searched), where things are on the screen, each act done on the map, and the part of the screen kept.
// The imagery is a plain ground (ground.jpg): no imagery to license, nothing behind the roof. The footprints of Detect
// building come from the tests' fixture. Nothing leaves this machine (the fixtures' guard, e2e/fixtures.ts).

export const GROUND = path.resolve(__dirname, "ground.jpg");
export const PUBLIC_HELP = path.resolve(__dirname, "../../apps/web/public/help");
export const STEPS = 12;

/** Where the map is: its middle, and its scale in pixels a metre, read off its scale bar. */
export type OnTheMap = { middle: Point; pixelsPerMetre: number };

export async function onTheMap(page: Page): Promise<OnTheMap> {
  const box = await roofMap(page).boundingBox();
  if (!box) throw new Error("The map is not on the screen.");
  const bar = page.getByTestId("scale-bar");
  // From far the bar is in kilometres; at a roof, in metres.
  const [, value, unit] = /^([\d.]+)\s*(km|m)$/.exec((await bar.locator("code").textContent())?.trim() ?? "") ?? [];
  const metres = Number(value) * (unit === "km" ? 1000 : 1);
  const width = (await bar.locator("div > div").boundingBox())?.width ?? 0;
  if (!(metres > 0 && width > 0)) throw new Error("The scale bar could not be read: the map's scale is not known.");
  return { middle: { x: box.x + box.width / 2, y: box.y + box.height / 2 }, pixelsPerMetre: width / metres };
}

export async function roofBox(page: Page): Promise<Box> {
  const corners = await page.locator("[aria-label^='Corner ']").evaluateAll((all) =>
    all
      .filter((corner) => /^Corner \d+(, selected)?$/.test(corner.getAttribute("aria-label") ?? ""))
      .map((corner) => {
        const { x, y, width, height } = corner.getBoundingClientRect();
        return { x: x + width / 2, y: y + height / 2 };
      }),
  );
  expect(corners.length, "the roof's corners on the map").toBeGreaterThanOrEqual(3);
  return boxOf(corners);
}

/** The middle of the obstacle picked: of its corners' handles. */
export async function obstacleMiddle(page: Page): Promise<Point> {
  const corners = await page.locator("[aria-label$=' of the obstacle']").evaluateAll((all) =>
    all.map((corner) => {
      const { x, y, width, height } = corner.getBoundingClientRect();
      return { x: x + width / 2, y: y + height / 2 };
    }),
  );
  if (corners.length === 0) throw new Error("No obstacle is picked: its corners are not on the map.");
  return pointOf(boxOf(corners), { across: 0.5, down: 0.5 });
}

export async function centreOf(page: Page, name: string): Promise<Point> {
  const box = await page.locator(`[aria-label="${name}"]`).boundingBox();
  if (!box) throw new Error(`"${name}" is not on the map: the act before this one did not show it.`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** A press held from one point along a path; let go, or kept to be taken back after the picture. */
export async function held(page: Page, from: Point, path: readonly Point[], keep: boolean, steps: number): Promise<(() => Promise<void>) | null> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const point of path) await page.mouse.move(point.x, point.y, { steps });
  if (!keep) {
    await page.mouse.up();
    return null;
  }
  return async () => {
    for (const point of [...path].reverse().slice(1)) await page.mouse.move(point.x, point.y);
    await page.mouse.move(from.x, from.y, { steps: STEPS });
    await page.mouse.up();
  };
}

/** Does the act; returns how to take it back once the picture is taken (a held drag or turn), or null. */
export async function act(page: Page, map: OnTheMap, done: Act): Promise<(() => Promise<void>) | null> {
  // A spot is on the roof; a place in metres needs none (while the corners are pressed there is no roof yet).
  const at = async (place: Place) => placeOnScreen(place, "across" in place ? await roofBox(page) : null, map);
  switch (done.kind) {
    case "tool":
      await page.getByRole("button", { name: done.name, exact: true }).click();
      return null;
    case "corner": {
      const point = await at(done.at);
      await page.mouse.click(point.x, point.y);
      return null;
    }
    case "click": {
      const point = pointOf(await roofBox(page), done.at);
      await page.mouse.click(point.x, point.y);
      return null;
    }
    case "drag": {
      const from = pointOf(await roofBox(page), done.from);
      return held(page, from, [{ x: from.x + done.by.x, y: from.y + done.by.y }], done.held, STEPS);
    }
    case "draw": {
      const from = await at(done.from);
      const to = await at(done.to);
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: STEPS });
      // A drawn box is kept: held, it is let go after the picture, and the next picture shows it drawn.
      if (done.held) return () => page.mouse.up();
      await page.mouse.up();
      return null;
    }
    case "turn": {
      const middle = done.around === "obstacle" ? await obstacleMiddle(page) : pointOf(await roofBox(page), { across: 0.5, down: 0.5 });
      const from = await centreOf(page, done.handle);
      return held(page, from, arcFrom(middle, from, done.degrees, STEPS), done.held, 1);
    }
    case "found": {
      // The footprints are drawn once their tile is there: a press before that finds nothing and is pressed again.
      const point = screenOf(map.middle, map.pixelsPerMetre, done.at);
      const callout = page.getByTestId("detected");
      await expect
        .poll(
          async () => {
            await page.mouse.click(point.x, point.y);
            return (await callout.textContent().catch(() => "")) ?? "";
          },
          { timeout: A_MAP, intervals: [500, 1000] },
        )
        .toContain("Footprint found");
      return null;
    }
    case "press":
      await page.getByRole("button", { name: done.name, exact: true }).click();
      return null;
    case "fill": {
      const field = page.getByRole("textbox", { name: done.label, exact: true });
      await field.fill(done.text);
      // Left by a blur, not by Tab: the next control would show its focus ring in the picture.
      await field.blur();
      return null;
    }
    case "key":
      await page.keyboard.press(done.key);
      return null;
  }
}

export async function begun(page: Page, howTo: HowTo): Promise<void> {
  if (howTo.start === "edit") {
    // The demo opened in the Studio, then its roof on Find (/find?edit=roof). The design is not kept across a reload, so
    // Find is reached in the page, by Next's router, as a link would.
    await page.goto("/studio/roof");
    await expect(page.getByRole("listitem").filter({ hasText: /^Roof, 4 corners/ })).toBeVisible({ timeout: A_MAP });
    await page.evaluate(() => (window as unknown as { next: { router: { push: (href: string) => void } } }).next.router.push("/find?edit=roof"));
    await expect(page).toHaveURL(/\/find\?edit=roof$/, { timeout: A_MAP });
    await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
    await expect(page.locator('[aria-label="Corner 1"]')).toBeVisible();
  } else {
    expect((await page.goto("/find"))?.status()).toBe(200);
    await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
    await atTheRoof(page);
  }
}

/** The how-to begun and ready for its first picture or clip: the plain ground, its window, its zoom; where the map is, and
 * the part of the screen kept. */
export async function readied(page: Page, howTo: HowTo): Promise<{ map: OnTheMap; clip: Clip }> {
  await withTheFootprints(page);
  await page.route(IMAGERY, (route) => route.fulfill({ path: GROUND, contentType: "image/jpeg" }));
  await page.setViewportSize(howTo.window);
  await begun(page, howTo);
  for (let step = 0; step < (howTo.zoomIn ?? 0); step++) {
    await page.getByRole("button", { name: "Zoom in" }).click();
    await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  }
  await page.waitForTimeout(800);
  const map = await onTheMap(page);
  const { keep } = howTo;
  const clip =
    keep.around === "roof"
      ? clipAround(await roofBox(page), keep.margin)
      : keep.around === "spot"
        ? clipAt(pointOf(await roofBox(page), keep.at), keep.size)
        : clipAt(screenOf(map.middle, map.pixelsPerMetre, keep.at ?? { east: 0, north: 0 }), keep.size);
  return { map, clip };
}
