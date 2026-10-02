import type { Locator, Page, Request } from "@playwright/test";
import { expect, test } from "../fixtures";

// The loss chain of Performance (plan/phase-08-plan.md, steps 7 to 11; the boards "Performance" on three sizes and
// "Loss chain, edited"): the 21 rows equal the run's steps at the precision shown; a loss entered is an edit of the
// document that asks one run after the pause and no layout, and the energy and the chain follow; LID is given back to
// the PAN's; an entry outside the range is brought to the limit and said so (D31); the readout under the pointer and
// on a tap. Every number is read from the run's answer.

const RUN = 90_000;
/** The pause before a run, twice over: after it, a run that was to come has been asked for. */
const LONGER_THAN_THE_PAUSE = 1_000;

type Step = { label: string; value: number; kind: "irr_total" | "irr" | "energy_total" | "energy" | "result"; pct: number };
type Option = { key: string; energy: { energy_mwh: number; lid_pct: number; steps: Step[] } };
type Answer = { options: Option[]; chosen_option: string | null };

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

type Losses = { soiling_pct: number; lid_pct: number | null; bifacial: boolean };

const isARun = (request: Request) => request.url().endsWith("/api/design");
const ran = (page: Page) => page.waitForRequest(isARun, { timeout: RUN });
/** The run whose document has these losses. */
const ranWith = (page: Page, losses: Partial<Losses>) =>
  page.waitForRequest((request) => isARun(request) && Object.entries(losses).every(([name, value]) => (request.postDataJSON().losses as Losses)[name as keyof Losses] === value), { timeout: RUN });

/** A number as the page shows it: fixed decimals, a comma between thousands. */
const fixed = (value: number, decimals: number) => value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
/** A change of the chain as the page shows it: two decimals, a plus for a gain, the true minus for a loss, nothing under half a hundredth. */
const changeOf = (pct: number) => (Math.abs(pct) < 0.005 ? "0.00 %" : `${pct > 0 ? "+" : "−"}${fixed(Math.abs(pct), 2)} %`);
const isTotal = (step: Step) => step.kind !== "irr" && step.kind !== "energy";
const unitOf = (step: Step) => (step.kind === "irr_total" || step.kind === "irr" ? "kWh/m²" : "MWh");
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const stepOf = (answer: Answer, label: RegExp) => chosenOf(answer).energy.steps.find((step) => label.test(step.label))!;
const isPhone = (projectName: string) => projectName === "phone";

const energyTile = (page: Page) => page.getByTestId("kpi-energy");
const chain = (page: Page) => page.getByTestId("loss-chain");
const row = (page: Page, label: string) => chain(page).locator(`[data-testid="loss-row"][data-step="${label}"]`);

async function thePerformancePage(page: Page): Promise<Answer> {
  const first = ran(page);
  await page.goto("/performance");
  const answer = await resultOf(await first);
  await expect(energyTile(page)).toContainText(fixed(chosenOf(answer).energy.energy_mwh, 1), { timeout: RUN });
  return answer;
}

/** Enters a value into a field of the chain and commits it with Enter. */
async function enter(field: Locator, value: string): Promise<void> {
  await field.fill(value);
  await field.press("Enter");
}

/** Every request of the layout or the run from now on, by its path. */
function asked(page: Page): string[] {
  const paths: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(design|layout)$/.test(request.url())) paths.push(new URL(request.url()).pathname);
  });
  return paths;
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the rows", () => {
  test("the 21 rows equal the run's steps, in the engine's order and words, the change at two decimals and the running total at one, the unit on the totals", async ({ page }) => {
    const answer = await thePerformancePage(page);
    const { steps } = chosenOf(answer).energy;
    const rows = chain(page).getByTestId("loss-row");

    expect(steps).toHaveLength(21);
    await expect(chain(page)).toContainText("From sunlight to the grid");
    await expect(chain(page)).toContainText("Boxed values are yours to change");
    await expect(rows).toHaveCount(steps.length);
    for (const [index, step] of steps.entries()) {
      const shown = rows.nth(index);
      await expect(shown).toHaveAttribute("data-step", step.label);
      await expect(shown.getByTestId("running-total")).toContainText(fixed(step.value, 1));
      if (isTotal(step)) {
        await expect(shown.getByTestId("running-total")).toContainText(unitOf(step));
        await expect(shown.getByTestId("change")).toHaveCount(0);
      } else {
        await expect(shown.getByTestId("change")).toHaveText(changeOf(step.pct));
      }
    }
  });

  test("the fields show the document's losses, LID the PAN's inside itself, the rear gain on", async ({ page }) => {
    const answer = await thePerformancePage(page);
    const lid = stepOf(answer, /^LID/);

    expect(lid.label).toBe("LID (PAN)");
    await expect(chain(page).getByRole("textbox", { name: "Soiling" })).toHaveValue("2.0");
    await expect(chain(page).getByRole("textbox", { name: "Module quality" })).toHaveValue("0.0");
    await expect(chain(page).getByRole("textbox", { name: "Mismatch" })).toHaveValue("1.0");
    await expect(chain(page).getByRole("textbox", { name: "DC ohmic" })).toHaveValue("1.5");
    await expect(chain(page).getByRole("textbox", { name: "AC ohmic" })).toHaveValue("1.0");
    await expect(chain(page).getByRole("textbox", { name: "Availability" })).toHaveValue("99.5");
    const lidField = chain(page).getByRole("textbox", { name: "LID (PAN)" });
    await expect(lidField).toHaveValue("");
    await expect(lidField).toHaveAttribute("placeholder", `PAN ${fixed(chosenOf(answer).energy.lid_pct, 1)} %`);
    await expect(chain(page).getByRole("switch", { name: "Bifacial rear gain" })).toHaveAttribute("aria-checked", "true");
    await expect(chain(page).getByRole("switch", { name: "Bifacial rear gain" })).toBeEnabled();
  });
});

test.describe("soiling 2 to 3: the acceptance", () => {
  test("one run after the pause and no layout; the energy and the soiling row equal the new run's and differ from the first", async ({ page }) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);
    const next = ranWith(page, { soiling_pct: 3 });

    await enter(chain(page).getByRole("textbox", { name: "Soiling" }), "3");

    const after = await resultOf(await next);
    const energy = { before: chosenOf(before).energy.energy_mwh, after: chosenOf(after).energy.energy_mwh };
    const soiling = { before: stepOf(before, /^Soiling$/), after: stepOf(after, /^Soiling$/) };
    expect(fixed(energy.after, 1)).not.toBe(fixed(energy.before, 1));
    expect(changeOf(soiling.after.pct)).toBe("−3.00 %");
    expect(changeOf(soiling.before.pct)).toBe("−2.00 %");
    await expect(energyTile(page)).toContainText(fixed(energy.after, 1), { timeout: RUN });
    await expect(row(page, "Soiling").getByTestId("change")).toHaveText(changeOf(soiling.after.pct));
    await expect(row(page, "Soiling").getByTestId("running-total")).toHaveText(fixed(soiling.after.value, 1));
    await expect(row(page, "Energy to grid").getByTestId("running-total")).toContainText(fixed(energy.after, 1));
    await expect(chain(page).getByRole("textbox", { name: "Soiling" })).toHaveValue("3.0");
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(paths).toEqual(["/api/design"]);
  });

  test("while the run is on its way the figures of before stand dimmed; the field keeps its value", async ({ page }) => {
    const before = await thePerformancePage(page);
    let held = false;
    await page.route("**/api/design", async (route) => {
      held = true;
      await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
      await route.continue();
    });
    const soiling = stepOf(before, /^Soiling$/);

    await enter(chain(page).getByRole("textbox", { name: "Soiling" }), "3");

    await expect.poll(() => held, { timeout: RUN }).toBe(true);
    await expect(row(page, "Soiling").getByTestId("change")).toHaveClass(/opacity-updating/);
    await expect(row(page, "Soiling").getByTestId("change")).toHaveText(changeOf(soiling.pct));
    await expect(chain(page).getByRole("textbox", { name: "Soiling" })).toHaveValue("3.0");
    await expect(row(page, "Soiling").getByTestId("change")).not.toHaveClass(/opacity-updating/, { timeout: RUN });
  });
});

test.describe("the other steps of the user's", () => {
  test("the rear gain switched off changes the energy; its row reads nothing", async ({ page }) => {
    const before = await thePerformancePage(page);
    const next = ranWith(page, { bifacial: false });

    await chain(page).getByRole("switch", { name: "Bifacial rear gain" }).click();

    const after = await resultOf(await next);
    const energyOfBefore = chosenOf(before).energy.energy_mwh;
    const energyOfAfter = chosenOf(after).energy.energy_mwh;
    expect(energyOfAfter).toBeLessThan(energyOfBefore);
    await expect(energyTile(page)).toContainText(fixed(energyOfAfter, 1), { timeout: RUN });
    await expect(chain(page).getByRole("switch", { name: "Bifacial rear gain" })).toHaveAttribute("aria-checked", "false");
    await expect(row(page, "Bifacial rear gain").getByTestId("change")).toHaveText(changeOf(stepOf(after, /^Bifacial/).pct));
    await expect(row(page, "Bifacial rear gain").getByTestId("change")).toHaveText("0.00 %");
    await expect(row(page, "Bifacial rear gain").locator("[data-look=zero]")).toHaveCount(1);
  });

  test("LID entered takes the field and names the step LID; Use the PAN's gives it back", async ({ page }) => {
    const before = await thePerformancePage(page);
    const pan = `PAN ${fixed(chosenOf(before).energy.lid_pct, 1)} %`;
    const entered = ranWith(page, { lid_pct: 1 });

    await enter(chain(page).getByRole("textbox", { name: "LID (PAN)" }), "1");

    const withLid = await resultOf(await entered);
    expect(stepOf(withLid, /^LID/).label).toBe("LID");
    await expect(row(page, "LID")).toBeVisible({ timeout: RUN });
    await expect(row(page, "LID").getByTestId("change")).toHaveText(changeOf(stepOf(withLid, /^LID$/).pct));
    await expect(row(page, "LID").getByTestId("change")).toHaveText("−1.00 %");
    await expect(chain(page).getByRole("textbox", { name: "LID" })).toHaveValue("1.0");
    await expect(row(page, "LID")).toContainText(`PAN gives ${fixed(chosenOf(before).energy.lid_pct, 1)} %`);

    const givenBack = ranWith(page, { lid_pct: null });
    await row(page, "LID").getByRole("button", { name: "Use the PAN's" }).click();
    const back = await resultOf(await givenBack);
    expect(stepOf(back, /^LID/).label).toBe("LID (PAN)");
    await expect(row(page, "LID (PAN)")).toBeVisible({ timeout: RUN });
    const field = chain(page).getByRole("textbox", { name: "LID (PAN)" });
    await expect(field).toHaveValue("");
    await expect(field).toHaveAttribute("placeholder", pan);
    await expect(row(page, "LID (PAN)").getByRole("button", { name: "Use the PAN's" })).toHaveCount(0);
  });

  test("an entry outside the range is brought to the limit and the field says so (D31): 35 becomes 30.0 %", async ({ page }) => {
    await thePerformancePage(page);
    const next = ranWith(page, { soiling_pct: 30 });
    const field = chain(page).getByRole("textbox", { name: "Soiling" });

    await enter(field, "35");

    await expect(field).toHaveValue("30.0");
    await expect(row(page, "Soiling").getByRole("status")).toHaveText("30.0 % is the highest that can be set.");
    const after = await resultOf(await next);
    await expect(row(page, "Soiling").getByTestId("change")).toHaveText(changeOf(stepOf(after, /^Soiling$/).pct), { timeout: RUN });
    await expect(row(page, "Soiling").getByTestId("change")).toHaveText("−30.00 %");
  });
});

test.describe("the readout", () => {
  test("under the pointer, or on a tap, a row shows its running total with its unit and its change, then its label", async ({ page }, testInfo) => {
    const answer = await thePerformancePage(page);
    const temperature = stepOf(answer, /^Temperature$/);
    const target = row(page, "Temperature");
    const readout = target.getByTestId("readout");

    await expect(readout).toBeHidden();
    if (isPhone(testInfo.project.name)) await target.getByTestId("step-label").tap();
    else await target.hover();

    await expect(readout).toBeVisible();
    await expect(readout).toHaveText(`${fixed(temperature.value, 1)} MWh · ${changeOf(temperature.pct)}Temperature`);
    const [tip, box] = [(await readout.boundingBox())!, (await target.boundingBox())!];
    expect(tip.y + tip.height).toBeLessThanOrEqual(box.y);
    expect(Math.abs(tip.x + tip.width / 2 - (box.x + box.width / 2))).toBeLessThanOrEqual(1);

    if (isPhone(testInfo.project.name)) await target.getByTestId("step-label").tap();
    else await page.mouse.move(0, 0);
    await expect(readout).toBeHidden();
  });

  test("the keyboard focus in a row's field shows its readout; Escape takes it away", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "A phone has no keyboard focus to see");
    const answer = await thePerformancePage(page);
    const soiling = stepOf(answer, /^Soiling$/);
    const field = chain(page).getByRole("textbox", { name: "Soiling" });
    const readout = row(page, "Soiling").getByTestId("readout");

    await field.focus();
    await expect(field).toBeFocused();
    await expect(readout).toBeVisible();
    await expect(readout).toContainText(`${fixed(soiling.value, 1)} kWh/m² · ${changeOf(soiling.pct)}`);

    await page.keyboard.press("Escape");
    await expect(readout).toBeHidden();
  });
});
