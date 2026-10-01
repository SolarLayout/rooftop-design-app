import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

// Undo and redo of committed edits in the Studio (plan/phase-05-plan.md, step 18, decision 11): Cmd or Ctrl with
// Z undoes, with Shift redoes; an undo is an edit like any other, so the layout follows it.

const RUN = 90_000;

type Asked = { roof: { roof_type: string } };

function layoutsAsked(page: Page): Asked[] {
  const asked: Asked[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/layout")) asked.push(request.postDataJSON() as Asked);
  });
  return asked;
}

const roofType = (page: Page) => page.getByRole("radiogroup", { name: "Roof type" }).filter({ visible: true });
const undoKey = (projectName: string) => (projectName === "desktop" ? "Meta+z" : "Control+z");
const redoKey = (projectName: string) => (projectName === "desktop" ? "Meta+Shift+z" : "Control+Shift+z");

test.describe.configure({ timeout: RUN + 30_000 });

test("an edit undone by the keys gives the document of before, and the layout follows; redone, the one after", async ({ page }, testInfo) => {
  const asked = layoutsAsked(page);
  await page.goto("/studio/roof");
  await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });

  await roofType(page).getByRole("radio", { name: "East-west" }).click();
  await expect(roofType(page).getByRole("radio", { name: "East-west" })).toHaveAttribute("aria-checked", "true");
  await expect.poll(() => asked.at(-1)?.roof.roof_type).toBe("flat_ew");
  // The keys are the Studio's, not a field's: the focus leaves the control first.
  await page.getByRole("heading", { level: 1 }).first().click({ force: true });

  await page.keyboard.press(undoKey(testInfo.project.name));

  await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true");
  await expect.poll(() => asked.at(-1)?.roof.roof_type).toBe("flat_tilted");

  await page.keyboard.press(redoKey(testInfo.project.name));

  await expect(roofType(page).getByRole("radio", { name: "East-west" })).toHaveAttribute("aria-checked", "true");
  await expect.poll(() => asked.at(-1)?.roof.roof_type).toBe("flat_ew");
});

test("with nothing done there is nothing to undo: the keys ask for nothing", async ({ page }, testInfo) => {
  const asked = layoutsAsked(page);
  await page.goto("/studio/roof");
  await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
  await expect.poll(() => asked.length, { timeout: RUN }).toBeGreaterThan(0);
  const before = asked.length;

  await page.keyboard.press(undoKey(testInfo.project.name));

  await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true");
  expect(asked.length).toBe(before);
});
