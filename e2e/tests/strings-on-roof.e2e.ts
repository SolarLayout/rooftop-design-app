import AxeBuilder from "@axe-core/playwright";
import type { Page, Response } from "@playwright/test";
import { expect, test } from "../fixtures";
import { inThePlan, pixelsAt, sceneCanvas, sceneSettled, stage, type PlanFrame, type Pixel, type Share } from "../stage";

// The strings on the roof (plan/phase-07-plan.md, steps 12 to 16, decisions 12 and 13; the boards "Strings on the
// roof" and "Studio, Strings lens" on three sizes): the glass of every position in its string's colour, its MPPT's or
// its inverter's, a string's colour by its label whatever the option; the colours written without the modules; the
// inverters where the engine places them; a string traced under the pointer and selected with its callout; the text
// equivalent. Every number is the design run's, read here from its answer.

const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";

type Wired = { label: string; modules: number[]; inverter: number; mppt: number };
type Option = {
  key: string;
  letter: string;
  system: { strings: Wired[]; inverters: { label: string; position: [number, number] }[] };
  cable_schedule: { string: string; inverter: string; modules: number; voc_cold_v: number; length_m: number }[];
};
type Answer = { layout: { modules: { idx: number; outline: [number, number][] }[] }; chosen_option: string; options: Option[] };

/** The result of the design run, from the events of its answer. */
async function resultOf(response: Response): Promise<Answer> {
  const events = (await response.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

/** The series colours of design-tokens.md in their fixed order, and the modules' blue. */
const SERIES: Pixel[] = [
  [0x39, 0x87, 0xe5],
  [0xd9, 0x59, 0x26],
  [0x19, 0x9e, 0x70],
  [0xc9, 0x85, 0x00],
  [0xd5, 0x51, 0x81],
  [0x00, 0x83, 0x00],
];
const GLASS: Pixel = [0x16, 0x29, 0x4d];

/** The series colour of a category counted from 1: ((k − 1) mod 6) + 1. */
const seriesOf = (category: number) => ((category - 1) % 6) + 1;
const numberOf = (label: string) => Number(label.slice(1));

/**
 * Which of the six series colours, or the modules' blue, a pixel of the scene is: the nearest by its share of each
 * channel, which the light, near white, scales alike. Returns 1 to 6, or 0 for the blue.
 */
function seriesOfPixel(pixel: Pixel): number {
  const shares = ([red, green, blue]: Pixel) => {
    const sum = Math.max(1, red + green + blue);
    return [red / sum, green / sum, blue / sum];
  };
  const [r, g, b] = shares(pixel);
  const candidates = [GLASS, ...SERIES].map((colour) => {
    const [cr, cg, cb] = shares(colour);
    return Math.hypot(r - cr, g - cg, b - cb);
  });
  return candidates.indexOf(Math.min(...candidates));
}

/** White, give or take the light: the glass of a string traced or selected. */
const isWhite = ([red, green, blue]: Pixel) => Math.min(red, green, blue) > 190 && Math.max(red, green, blue) - Math.min(red, green, blue) < 30;

const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const colourSwitch = (page: Page) => page.getByRole("radiogroup", { name: "Colour the strings by" }).filter({ visible: true });
const moduleWrites = async (page: Page) => Number(await stage(page).getAttribute("data-module-writes"));
const sheetTo = async (page: Page, key: "Home" | "End") => {
  await page.getByRole("separator", { name: "Inspector" }).focus();
  await page.keyboard.press(key);
};

/** The Strings lens on the demo with its first run over; the run's answer. */
async function stringsLensWithTheRun(page: Page): Promise<Answer> {
  const answered = page.waitForResponse((response) => response.url().endsWith("/api/design"), { timeout: RUN });
  await page.goto("/studio/strings");
  const answer = await resultOf(await answered);
  await sceneSettled(page);
  await expect(page.getByTestId("on-the-roof-strings")).toContainText("coloured by", { timeout: RUN });
  return answer;
}

/** The colours chosen with the switch; on phone the switch is in the sheet, which is let down again after. */
async function colourBy(page: Page, projectName: string, name: "String" | "MPPT" | "Inverter"): Promise<void> {
  if (isPhone(projectName)) await sheetTo(page, "End");
  await colourSwitch(page).getByRole("radio", { name }).click();
  await expect(colourSwitch(page).getByRole("radio", { name })).toHaveAttribute("aria-checked", "true");
  if (isPhone(projectName)) await sheetTo(page, "Home");
}

/**
 * A point of a position in the plan, as a share of the canvas: its middle, or a quarter of the way from its middle
 * toward its first corner, clear of the line a traced string draws through the middles.
 */
async function shareOf(page: Page, point: PlanFrame, answer: Answer, idx: number, clearOfTheLine = false): Promise<Share> {
  const position = answer.layout.modules.find((one) => one.idx === idx)!;
  const [cx, cy] = position.outline.reduce(([sx, sy], [px, py]) => [sx + px / position.outline.length, sy + py / position.outline.length], [0, 0]);
  const [kx, ky] = position.outline[0]!;
  const [x, y] = clearOfTheLine ? [cx + (kx - cx) / 4, cy + (ky - cy) / 4] : [cx, cy];
  const at = point(x, y);
  const box = (await sceneCanvas(page).boundingBox())!;
  return [(at.x - box.x) / box.width, (at.y - box.y) / box.height];
}

/**
 * A module of a string seen in the plan: from its middle in wired order outward (clear of its ends, where a parapet's
 * shadow may lie), the first whose middle no control over the stage covers.
 */
async function seenOf(page: Page, point: PlanFrame, answer: Answer, string: Wired): Promise<number> {
  const half = Math.floor(string.modules.length / 2);
  const order = string.modules.map((_, n) => string.modules[(half + (n % 2 ? -1 : 1) * Math.ceil(n / 2) + string.modules.length) % string.modules.length]!);
  for (const idx of order) {
    const position = answer.layout.modules.find((one) => one.idx === idx)!;
    const [x, y] = position.outline.reduce(([sx, sy], [px, py]) => [sx + px / position.outline.length, sy + py / position.outline.length], [0, 0]);
    const at = point(x, y);
    if (await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.tagName === "CANVAS", [at.x, at.y] as const)) return idx;
  }
  throw new Error(`No module of ${string.label} is seen in the plan.`);
}

/** The first string of *option*, in their order, one of whose modules is seen in the plan; and that module. */
async function seenStringOf(page: Page, point: PlanFrame, answer: Answer, option: Answer["options"][number]): Promise<{ string: Wired; idx: number }> {
  for (const string of option.system.strings) {
    try {
      return { string, idx: await seenOf(page, point, answer, string) };
    } catch {
      // None of this string's modules is seen: the next.
    }
  }
  throw new Error(`No string of option ${option.letter} is seen in the plan.`);
}

test.beforeEach(() => test.setTimeout(RUN * 2));

test.describe("the colours of the strings", () => {
  test("a module of S12 is the series colour of 12 by string and its MPPT's by MPPT, without the modules written again", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const option = chosenOf(answer);
    const s12 = option.system.strings.find((string) => string.label === "S12")!;
    if (isPhone(testInfo.project.name)) await sheetTo(page, "Home");
    const point = await inThePlan(page);
    const share = await shareOf(page, point, answer, await seenOf(page, point, answer, s12));
    const writes = await moduleWrites(page);

    // By MPPT at first, as the board.
    await expect.poll(async () => seriesOfPixel((await pixelsAt(page, [share]))[0]), { timeout: RUN }).toBe(seriesOf(s12.mppt));

    await colourBy(page, testInfo.project.name, "String");
    await expect.poll(async () => seriesOfPixel((await pixelsAt(page, [share]))[0]), { timeout: RUN }).toBe(seriesOf(numberOf("S12")));
    expect(seriesOf(numberOf("S12"))).toBe(6);
    expect(await moduleWrites(page)).toBe(writes);
  });

  test("switching the option keeps a string's colour with its label, and writes the colours alone", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const other = answer.options.find((option) => option.key !== answer.chosen_option)!;
    await colourBy(page, testInfo.project.name, "String");
    if (isPhone(testInfo.project.name)) await sheetTo(page, "Home");
    const point = await inThePlan(page);
    // A string of the other option whose module is seen in the plan, where no control of the stage covers it.
    const { string, idx } = await seenStringOf(page, point, answer, other);
    const share = await shareOf(page, point, answer, idx);
    const writes = await moduleWrites(page);

    if (isPhone(testInfo.project.name)) await sheetTo(page, "End");
    await page.getByTestId("option-card").filter({ visible: true }).filter({ has: page.getByText(other.letter, { exact: true }) }).click();
    if (isPhone(testInfo.project.name)) await sheetTo(page, "Home");

    await expect(page.getByTestId("on-the-roof-strings")).toContainText(`of option ${other.letter}, coloured by string`, { timeout: RUN });
    await expect.poll(async () => seriesOfPixel((await pixelsAt(page, [share]))[0]), { timeout: RUN }).toBe(seriesOf(numberOf(string.label)));
    expect(await moduleWrites(page)).toBe(writes);
  });

  test("leaving the Strings lens takes the colours off: the modules are of their blue", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const s12 = chosenOf(answer).system.strings.find((string) => string.label === "S12")!;
    if (isPhone(testInfo.project.name)) await sheetTo(page, "Home");
    const point = await inThePlan(page);
    const share = await shareOf(page, point, answer, await seenOf(page, point, answer, s12));

    await page.goto("/studio/array");
    await sceneSettled(page);
    await inThePlan(page);

    await expect.poll(async () => seriesOfPixel((await pixelsAt(page, [share]))[0]), { timeout: RUN }).toBe(0);
    await expect(page.getByTestId("on-the-roof-strings")).toHaveCount(0);
    await expect(page.getByTestId("string-legend")).toHaveCount(0);
  });
});

test.describe("the legend and the inverters", () => {
  test("the legend says the run's MPPTs, then by string the strings of each colour", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const strings = chosenOf(answer).system.strings;
    const mppts = [...new Set(strings.map((string) => string.mppt))].sort((a, b) => a - b);
    const legend = page.getByTestId("string-legend").filter({ visible: true });

    await expect(legend).toHaveAttribute("aria-label", `Colours: ${mppts.map((n) => `MPPT ${n}`).join(", ")}, Not used`);

    await colourBy(page, testInfo.project.name, "String");
    const first = strings
      .map((string) => numberOf(string.label))
      .filter((n) => seriesOf(n) === 1)
      .sort((a, b) => a - b)
      .map((n) => `S${n}`)
      .join(" · ");
    await expect(legend).toContainText(first);
  });

  test("the marker INV-1 stands where the engine places it", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const inverter = chosenOf(answer).system.inverters[0]!;
    if (isPhone(testInfo.project.name)) await sheetTo(page, "Home");
    const point = await inThePlan(page);
    const at = point(...inverter.position);

    const chip = page.getByTestId("inverter-chip").filter({ hasText: inverter.label });
    await expect(chip).toBeVisible({ timeout: RUN });
    const box = (await chip.boundingBox())!;
    // The chip stands centred over the box's top, its foot 4 over it; in the plan the top falls on the engine's place.
    expect(Math.abs(box.x + box.width / 2 - at.x)).toBeLessThan(8);
    expect(Math.abs(box.y + box.height + 4 - at.y)).toBeLessThan(10);
    // It stands clear of every edge label: on phone it would cover the "90.0 m" of the south edge, and moves off it.
    for (const label of await page.getByTestId("stage-label").all()) {
      const edge = (await label.boundingBox())!;
      const apart = box.x >= edge.x + edge.width || edge.x >= box.x + box.width || box.y >= edge.y + edge.height || edge.y >= box.y + box.height;
      expect(apart).toBe(true);
    }
  });

  test("option D's two inverters, each with its chip, coloured by inverter", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const d = answer.options.find((option) => option.letter === "D")!;
    if (isPhone(testInfo.project.name)) await sheetTo(page, "End");
    await page.getByTestId("option-card").filter({ visible: true }).filter({ has: page.getByText("D", { exact: true }) }).click();
    await colourBy(page, testInfo.project.name, "Inverter");

    await expect(page.getByTestId("inverter-chip")).toHaveText(d.system.inverters.map((inverter) => inverter.label), { timeout: RUN });
    await expect(page.getByTestId("string-legend").filter({ visible: true })).toHaveAttribute("aria-label", /^Colours: INV-1, INV-2/);
  });
});

test.describe("a string traced and selected", () => {
  test("the pointer over a module traces its string: its glass white", async ({ page }, testInfo) => {
    test.skip(testInfo.project.use.hasTouch === true, "On touch nothing is traced: a tap selects.");
    const answer = await stringsLensWithTheRun(page);
    const s12 = chosenOf(answer).system.strings.find((string) => string.label === "S12")!;
    const point = await inThePlan(page);
    const seen = await seenOf(page, point, answer, s12);
    const over = await shareOf(page, point, answer, seen);
    // Another module of the string, not the one under the pointer: the whole string is traced.
    const another = await shareOf(page, point, answer, await seenOf(page, point, answer, { ...s12, modules: s12.modules.filter((idx) => idx !== seen) }), true);
    const box = (await sceneCanvas(page).boundingBox())!;

    await page.mouse.move(box.x + over[0] * box.width, box.y + over[1] * box.height);

    await expect.poll(async () => isWhite((await pixelsAt(page, [another]))[0]), { timeout: RUN }).toBe(true);
    await page.mouse.move(box.x + 2, box.y + 2);
    await expect.poll(async () => seriesOfPixel((await pixelsAt(page, [another]))[0]), { timeout: RUN }).toBe(seriesOf(s12.mppt));
  });

  test("a press, a tap on touch, selects the string: the callout with the run's numbers, the text equivalent; Escape clears it", async ({ page }, testInfo) => {
    const answer = await stringsLensWithTheRun(page);
    const option = chosenOf(answer);
    const s12 = option.system.strings.find((string) => string.label === "S12")!;
    const cable = option.cable_schedule.find((row) => row.string === "S12")!;
    if (isPhone(testInfo.project.name)) await sheetTo(page, "Home");
    const point = await inThePlan(page);
    const seenIdx = await seenOf(page, point, answer, s12);
    const position = answer.layout.modules.find((one) => one.idx === seenIdx)!;
    const [x, y] = position.outline.reduce(([sx, sy], [px, py]) => [sx + px / 4, sy + py / 4], [0, 0]);
    const at = point(x, y);

    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(at.x, at.y);
    else await page.mouse.click(at.x, at.y);

    const detail = `${cable.modules} modules · Voc cold ${cable.voc_cold_v.toLocaleString("en-US", { maximumFractionDigits: 0 })} V · ${Math.round(cable.length_m)} m of cable`;
    const callout = page.getByTestId("stage-callout");
    await expect(callout).toContainText(`String 12 · ${cable.inverter}, MPPT ${s12.mppt}`, { timeout: RUN });
    await expect(callout).toContainText(detail);
    await expect(page.getByTestId("on-the-roof-string-selected")).toHaveText(`String 12 · ${cable.inverter}, MPPT ${s12.mppt}, selected: ${detail}`);

    await page.keyboard.press("Escape");
    await expect(callout).toHaveCount(0);
    await expect(page.getByTestId("on-the-roof-string-selected")).toHaveCount(0);
  });
});

test.describe("the text equivalent", () => {
  test("says the run's strings by MPPT with each MPPT's count, the positions not used and the inverters", async ({ page }) => {
    const answer = await stringsLensWithTheRun(page);
    const option = chosenOf(answer);
    const strings = option.system.strings;
    const mppts = [...new Set(strings.map((string) => string.mppt))].sort((a, b) => a - b);
    const each = mppts.map((n) => {
      const count = strings.filter((string) => string.mppt === n).length;
      return `MPPT ${n}, ${count} ${count === 1 ? "string" : "strings"}`;
    });
    const used = strings.reduce((sum, string) => sum + string.modules.length, 0);
    const unused = answer.layout.modules.length - used;
    const places = option.system.inverters.map(({ label, position: [x, y] }) => `${label} at ${x.toFixed(1)} m east, ${y.toFixed(1)} m north`);

    await expect(page.getByTestId("on-the-roof-strings")).toHaveText(`${strings.length} strings of option ${option.letter}, coloured by MPPT: ${each.join("; ")}`);
    await expect(page.getByTestId("on-the-roof-unused")).toHaveText(`${unused} positions not used`);
    await expect(page.getByTestId("on-the-roof-inverters")).toHaveText(`${places.length === 1 ? "Inverter" : "Inverters"} ${places.join("; ")}`);
  });

  test("the Strings lens with its strings on the roof: axe finds nothing serious or critical", async ({ page }) => {
    await stringsLensWithTheRun(page);
    await expect(page.getByTestId("string-legend").filter({ visible: true })).toBeVisible();
    const found = await new AxeBuilder({ page }).analyze();
    const serious = found.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
