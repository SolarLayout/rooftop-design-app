import path from "node:path";
import type { Page } from "@playwright/test";
import { arcFrom, boxOf, clipAround, HOW_TOS, pointOf, type Act, type Box } from "../../tools/help/pictures";
import { expect, IMAGERY, test } from "../fixtures";
import { A_MAP, roofMap } from "../find";

// Takes the pictures of the how-tos (D81) from the app as it is: the demo roof opened on Find by Edit in the Roof lens, the
// hand's acts of each picture done on the map, the roof cut out with its margin. The imagery is a plain ground (ground.jpg):
// no imagery to license, nothing behind the roof. Nothing leaves this machine (the fixtures' guard).

const GROUND = path.resolve(__dirname, "ground.jpg");
const PUBLIC_HELP = path.resolve(__dirname, "../../apps/web/public/help");
const STEPS = 12;

async function roofBox(page: Page): Promise<Box> {
  const corners = await page.locator("[aria-label^='Corner ']").evaluateAll((all) =>
    all.filter((corner) => /^Corner \d+$/.test(corner.getAttribute("aria-label") ?? "")).map((corner) => {
      const { x, y, width, height } = corner.getBoundingClientRect();
      return { x: x + width / 2, y: y + height / 2 };
    }),
  );
  expect(corners.length, "the roof's corners on the map").toBeGreaterThanOrEqual(3);
  return boxOf(corners);
}

async function centreOf(page: Page, name: string) {
  const box = await page.locator(`[aria-label="${name}"]`).boundingBox();
  if (!box) throw new Error(`"${name}" is not on the map: the act before this one did not show it.`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Does the act; returns how to take it back once the picture is taken (a held drag or turn), or null. */
async function act(page: Page, box: Box, done: Act): Promise<(() => Promise<void>) | null> {
  if (done.kind === "click") {
    const at = pointOf(box, done.at);
    await page.mouse.click(at.x, at.y);
    return null;
  }
  const from = done.kind === "drag" ? pointOf(box, done.from) : await centreOf(page, "Turn the roof");
  const middle = pointOf(box, { across: 0.5, down: 0.5 });
  const path = done.kind === "drag" ? [{ x: from.x + done.by.x, y: from.y + done.by.y }] : arcFrom(middle, from, done.degrees, STEPS);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (const point of path) await page.mouse.move(point.x, point.y, { steps: done.kind === "drag" ? STEPS : 1 });
  const back = async () => {
    for (const point of [...path].reverse().slice(1)) await page.mouse.move(point.x, point.y);
    await page.mouse.move(from.x, from.y, { steps: STEPS });
    await page.mouse.up();
  };
  if (done.held) return back;
  await page.mouse.up();
  return null;
}

for (const howTo of HOW_TOS) {
  test(howTo.dir, async ({ page }) => {
    await page.route(IMAGERY, (route) => route.fulfill({ path: GROUND, contentType: "image/jpeg" }));
    await page.setViewportSize(howTo.window);
    await page.goto("/studio/roof");
    await page.getByRole("link", { name: /Edit/ }).filter({ visible: true }).first().click();
    await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
    await expect(page.locator('[aria-label="Corner 1"]')).toBeVisible();
    // The tip of the roof comes up once the roof is shown, on a device that has not seen it: put away, as it covers the map.
    const gotIt = page.getByRole("button", { name: "Got it" });
    if (await gotIt.isVisible()) await gotIt.click();
    await page.waitForTimeout(800);
    const box = await roofBox(page);
    const clip = clipAround(box, howTo.margin);
    for (const shot of howTo.shots) {
      const takeBack: (() => Promise<void>)[] = [];
      for (const done of shot.acts) {
        const back = await act(page, box, done);
        if (back) takeBack.push(back);
      }
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(PUBLIC_HELP, howTo.dir, `${shot.name}.jpg`), clip, type: "jpeg", quality: 82 });
      for (const back of takeBack.reverse()) await back();
    }
  });
}
