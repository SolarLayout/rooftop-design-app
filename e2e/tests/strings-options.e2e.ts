import type { Page, Request } from "@playwright/test";
import { expect, test } from "../fixtures";
import { sceneSettled } from "../stage";

// The options of the Strings lens (plan/phase-07-plan.md, steps 9 to 11; the boards "Studio, Strings lens" and
// "Options and your own"): the run's options as cards, chosen at once without a run; your own added, changed and
// removed, and refused in the engine's words when it cannot be built. Every number is read from the run's answer.

const RUN = 90_000;
/** The pause before a run, twice over: after it, a run that was to come has been asked for. */
const LONGER_THAN_THE_PAUSE = 1_000;

type Option = { key: string; letter: string; caption: string; n_series: number; n_strings: number; n_inverters: number; dc_kwp: number; dcac: number; custom: boolean; energy: { energy_mwh: number } };
type Answer = { options: Option[]; chosen_option: string; custom_refused: { title: string; detail: string } | null };

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
const cards = (page: Page) => page.getByTestId("option-card").filter({ visible: true });
const card = (page: Page, letter: string) => cards(page).filter({ has: page.getByText(letter, { exact: true }) });
const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });
const two = (value: number) => value.toFixed(2);
const one = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

async function theStringsLens(page: Page): Promise<Answer> {
  const first = ran(page);
  await page.goto("/studio/strings");
  const answer = await resultOf(await first);
  await sceneSettled(page);
  await expect(cards(page)).toHaveCount(answer.options.length, { timeout: RUN });
  return answer;
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the options", () => {
  test("are the run's: the letter, the engine's caption, the numbers, the energy; the chosen one is the run's", async ({ page }) => {
    const answer = await theStringsLens(page);
    for (const [index, option] of answer.options.entries()) {
      const shown = cards(page).nth(index);
      await expect(shown).toContainText(option.letter);
      await expect(shown).toContainText(option.caption);
      await expect(shown).toContainText(`${option.n_series} × ${option.n_strings} · ${two(option.dc_kwp)} · ${two(option.dcac)}`);
      await expect(shown).toContainText(one(option.energy.energy_mwh));
      await expect(shown).toHaveAttribute("aria-checked", String(option.key === answer.chosen_option));
    }
  });

  test("a card pressed is chosen at once, from the run's answer: the vitals show it, and nothing is asked", async ({ page }) => {
    const answer = await theStringsLens(page);
    const b = answer.options[1]!;
    const asked: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(design|layout)$/.test(request.url())) asked.push(request.url());
    });

    await card(page, b.letter).click();

    await expect(card(page, b.letter)).toHaveAttribute("aria-checked", "true");
    await expect(vitals(page)).toContainText(one(b.energy.energy_mwh));
    await page.keyboard.press("ArrowDown");
    await expect(card(page, answer.options[2]!.letter)).toHaveAttribute("aria-checked", "true");
    await expect(vitals(page)).toContainText(one(answer.options[2]!.energy.energy_mwh));
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(asked).toEqual([]);
  });
});

test.describe("your own", () => {
  test("added: a sixth card, chosen, its numbers the run's; removed: the five again", async ({ page }) => {
    await theStringsLens(page);
    await page.getByRole("button", { name: "Add your own" }).filter({ visible: true }).click();
    const fields = page.getByTestId("custom-fields").filter({ visible: true });
    for (const [name, value] of [["Series", "26"], ["Strings", "24"], ["Inverters", "1"]] as const) {
      await fields.getByRole("textbox", { name }).fill(value);
      await fields.getByRole("textbox", { name }).press("Tab");
    }
    const added = ran(page, (body) => JSON.stringify(body.custom) === "[26,24,1]" && body.chosen_option === "custom");

    await fields.getByRole("button", { name: "Add" }).click();

    const answer = await resultOf(await added);
    const own = answer.options.find((option) => option.custom)!;
    expect([own.key, own.n_series, own.n_strings, own.n_inverters]).toEqual(["custom", 26, 24, 1]);
    await expect(cards(page)).toHaveCount(answer.options.length, { timeout: RUN });
    await expect(card(page, own.letter)).toContainText("Your own");
    await expect(card(page, own.letter)).toHaveAttribute("aria-checked", "true");
    await expect(vitals(page)).toContainText(one(own.energy.energy_mwh));

    const removed = ran(page, (body) => body.custom === null);
    await page.getByRole("button", { name: "Remove" }).filter({ visible: true }).click();
    const after = await resultOf(await removed);
    await expect(cards(page)).toHaveCount(after.options.length, { timeout: RUN });
    expect(after.options.some((option) => option.custom)).toBe(false);
  });

  test("refused at 1000 V: the engine's words on its card, with Change and Remove, and no energy", async ({ page }) => {
    await theStringsLens(page);
    await page.getByRole("button", { name: "Add your own" }).filter({ visible: true }).click();
    const fields = page.getByTestId("custom-fields").filter({ visible: true });
    const added = ran(page, (body) => body.chosen_option === "custom");
    await fields.getByRole("button", { name: "Add" }).click();
    await resultOf(await added);
    const at1000 = ran(page, (body) => body.system_voltage === 1000);

    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).click();

    const answer = await resultOf(await at1000);
    const refused = page.getByTestId("custom-refused").filter({ visible: true });
    await expect(refused).toContainText(answer.custom_refused!.title, { timeout: RUN });
    await expect(refused).toContainText(answer.custom_refused!.detail);
    await expect(refused).not.toContainText("MWh");
    await expect(page.getByRole("button", { name: "Change" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Remove" }).filter({ visible: true })).toBeVisible();
  });
});
