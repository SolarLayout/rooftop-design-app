import type { Page, Request } from "@playwright/test";
import path from "node:path";
import { expect, test } from "../fixtures";

// The inverter of the Strings lens (plan/phase-07-plan.md, steps 17 to 20; the board "Inverter and sizing"): the
// inverter replaced from an OND, a file that is no OND refused in the engine's words. Every number and every
// word of the engine is read from its answer, never written into the test.

const RUN = 90_000;
/** The demo's OND with its IMaxDC line taken out: no current limit per MPPT is known. */
const WITHOUT_IMAXDC = path.resolve(__dirname, "../fixtures/wattpower-without-imaxdc.OND");
const PAN = path.resolve(__dirname, "../fixtures/test-module.PAN");

type CurrentPerMppt = { value_a: number | null; source: string; note: string };
type Inverter = { manufacturer: string; model: string; source: string };
type Answer = { equipment: { inverter: Inverter; max_current_per_mppt: CurrentPerMppt } };

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

const ran = (page: Page, wanted: (body: Record<string, unknown>) => boolean = () => true) =>
  page.waitForRequest((request) => request.url().endsWith("/api/design") && wanted(request.postDataJSON()), { timeout: RUN });
const inverterCard = (page: Page) => page.getByTestId("inverter-card").filter({ visible: true });
const inverterName = (page: Page) => page.getByTestId("inverter-name").filter({ visible: true });
const inverterFile = (page: Page) => page.getByTestId("inverter-file").filter({ visible: true });

/** The Strings lens on the demo, its first run over. */
async function theStringsLens(page: Page): Promise<Answer> {
  const first = ran(page);
  await page.goto("/studio/strings");
  const answer = await resultOf(await first);
  await expect(inverterName(page)).toHaveText(answer.equipment.inverter.model, { timeout: RUN });
  return answer;
}

async function replaceDialogOpened(page: Page) {
  await inverterCard(page).getByRole("button", { name: "Replace" }).click();
  const dialog = page.getByRole("dialog", { name: "Replace the inverter" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("replace the inverter", () => {
  test("with an OND: the request carries its text, the card shows the file's names, and the run's inverter is the file's", async ({ page }) => {
    await theStringsLens(page);
    const dialog = await replaceDialogOpened(page);
    const read = page.waitForResponse((response) => response.url().endsWith("/api/equipment/inverter"), { timeout: RUN });
    const replaced = ran(page, (body) => body.ond_path === "wattpower-without-imaxdc.OND");

    await dialog.locator("input[type=file]").setInputFiles(WITHOUT_IMAXDC);

    const theFile = (await (await read).json()) as { inverter: Inverter };
    const request = await replaced;
    expect(request.postDataJSON().ond_text).toContain("PVObject_=pvGInverter");
    expect(request.postDataJSON().ond_text).not.toContain("IMaxDC=");
    expect(request.postDataJSON().imax_mppt_override).toBeNull();
    await expect(dialog).toBeHidden();
    await expect(inverterName(page)).toHaveText(theFile.inverter.model);
    await expect(inverterCard(page)).toContainText(theFile.inverter.manufacturer);
    await expect(inverterFile(page)).toHaveText("wattpower-without-imaxdc.OND");
    const answer = await resultOf(request);
    expect(answer.equipment.inverter.source).toBe("wattpower-without-imaxdc.OND");
    expect(answer.equipment.max_current_per_mppt.value_a).toBeNull();
    await expect(page.getByTestId("inverter-facts").filter({ visible: true })).toContainText("Current per MPPT not in the OND", { timeout: RUN });
  });

  test("a PAN given as an OND is refused in the engine's words, and the card keeps its inverter", async ({ page }) => {
    const answer = await theStringsLens(page);
    const runs: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/design")) runs.push(request.url());
    });
    const dialog = await replaceDialogOpened(page);
    const refused = page.waitForResponse((response) => response.url().endsWith("/api/equipment/inverter"), { timeout: RUN });

    await dialog.locator("input[type=file]").setInputFiles(PAN);

    const { error } = (await (await refused).json()) as { error: { message: string } };
    expect(error.message).toContain("test-module.PAN");
    await expect(dialog.getByRole("status")).toContainText("This file was not loaded");
    await expect(dialog.getByRole("status")).toContainText(error.message);
    await expect(dialog.getByRole("button", { name: "Choose another" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(inverterName(page)).toHaveText(answer.equipment.inverter.model);
    await expect(inverterFile(page)).toHaveText(answer.equipment.inverter.source);
    expect(runs).toEqual([]);
  });
});
