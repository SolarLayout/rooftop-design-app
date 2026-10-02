import type { Page, Request, Route } from "@playwright/test";
import { expect, test } from "../fixtures";
import { sceneSettled } from "../stage";

// The states of the Strings lens (plan/phase-07-plan.md, step 21): a run on its way leaves what it will replace
// dimmed, with a ring; a run that failed leaves the values of before; a roof too small for a string says so in the
// API's words. Every word is the API's, read from its answer.

const RUN = 90_000;

type Answer = { options: { key: string }[]; no_options: { code: string; title: string; message: string } | null };

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

const cards = (page: Page) => page.getByTestId("option-card").filter({ visible: true });
const voltage = (page: Page, volts: string) => page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: volts });

async function theStringsLens(page: Page): Promise<void> {
  await page.goto("/studio/strings");
  await expect(cards(page).first()).toBeVisible({ timeout: RUN });
  await sceneSettled(page);
}

test.describe.configure({ timeout: RUN * 2 });

test("a run on its way: the series range, the options and the MPPT loading of before stand dimmed with a ring; the strings stay", async ({ page }) => {
  await theStringsLens(page);
  let held: Route | null = null;
  await page.route("**/api/design", (route) => {
    held = route;
  });

  await voltage(page, "1000 V").click();

  const sized = page.getByTestId("strings-sized").filter({ visible: true });
  await expect(sized.first()).toHaveAttribute("data-state", "updating", { timeout: RUN });
  await expect(page.getByTestId("series-range").filter({ visible: true }).getByTestId("series-ring")).toBeVisible();
  await expect(page.getByTestId("series-range").filter({ visible: true })).toHaveAttribute("data-state", "updating");
  await expect(cards(page)).toHaveCount(5);
  await expect(page.getByTestId("string-legend").filter({ visible: true })).toBeVisible();
  await expect.poll(() => held !== null, { timeout: RUN }).toBe(true);
  await page.unroute("**/api/design");
  await (held as unknown as Route).continue();
  await expect(sized.first()).toHaveAttribute("data-state", "settled", { timeout: RUN });
});

test("a run that failed: the options of before stay, not dimmed, and the vitals say the energy was not updated", async ({ page }) => {
  await theStringsLens(page);
  await page.route("**/api/design", (route) => route.abort("connectionrefused"));

  await voltage(page, "1000 V").click();

  await expect(page.getByRole("region", { name: "Design vitals" })).toContainText("Energy was not updated", { timeout: RUN });
  await expect(cards(page)).toHaveCount(5);
  await expect(page.getByTestId("strings-sized").filter({ visible: true }).first()).toHaveAttribute("data-state", "settled");
});

test("a roof too small for a string: the API's words in the inspector, and no options", async ({ page }) => {
  // The demo with a roof of 9 by 6 m and no obstacles: its run is the engine's own.
  await page.route("**/api/demo", async (route) => {
    const answer = await route.fetch();
    const demo = await answer.json();
    const outline = [[0, 0], [9, 0], [9, 6], [0, 6]];
    await route.fulfill({ response: answer, json: { ...demo, roof: { ...demo.roof, outline, obstacles: [] } } });
  });
  const ran = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });
  await page.goto("/studio/strings");
  const answer = await resultOf(await ran);

  expect(answer.options).toEqual([]);
  const words = page.getByTestId("no-options").filter({ visible: true });
  await expect(words).toContainText(answer.no_options!.title, { timeout: RUN });
  await expect(words).toContainText(answer.no_options!.message);
  await expect(cards(page)).toHaveCount(0);
});
