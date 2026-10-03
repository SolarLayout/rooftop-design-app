import AxeBuilder from "@axe-core/playwright";
import type { Page, Request } from "@playwright/test";
import { expect, test } from "../fixtures";

// The design report's paper preview, pull request 2 of Phase 9 (plan/phase-09-plan.md, steps 11 and 12, decisions 2, 4 and
// 5; the boards "Handover" on three sizes and "Handover, states"): the pages come once per edit of the document, as the
// engine draws them; the thumbnails are the answer's pages with its titles; the paper shows the first page at the answer's
// size; previous, next, the thumbnails and the keys turn the pages and the head's words follow, the ends dim; on phone the
// row of thumbnails scrolls sideways, never the page; the facts count the pages; a failure to get the pages is said under the
// head in the API's words, and Try again asks again. Every number and word is read from the API's answer.

const RUN = 90_000;

type PageAnswer = { number: number; title: string; width: number; height: number; png: string };
type PagesAnswer = { day: string; dpi: number; pages: PageAnswer[] };

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";
const isPagesRequest = (request: Request) => /\/api\/export\/report-pages(\?|$)/.test(request.url());

const preview = (page: Page) => page.getByTestId("preview");
const paper = (page: Page) => page.getByTestId("paper");
const pageImage = (page: Page) => page.getByTestId("page-image");
const thumbnails = (page: Page) => page.getByTestId("thumbnails");
const thumbnail = (page: Page) => thumbnails(page).getByRole("button");
const words = (page: Page) => page.getByTestId("page-words").filter({ visible: true });
const previous = (page: Page) => page.getByRole("button", { name: "Previous page" }).filter({ visible: true });
const next = (page: Page) => page.getByRole("button", { name: "Next page" }).filter({ visible: true });
const facts = (page: Page) => page.getByTestId("preview-facts");
const reportRowFacts = (page: Page) => page.getByTestId("deliverables").getByTestId("deliverable-facts").first();
const failed = (page: Page) => preview(page).getByTestId("run-failed");
const rows = (page: Page) => page.getByTestId("deliverables").getByTestId("deliverable");

const nameOf = (one: PageAnswer) => `Page ${one.number}, ${one.title}`;
const wordsOf = (pages: PagesAnswer, number: number) => `Page ${number} of ${pages.pages.length} · ${pages.pages[number - 1]!.title}`;
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The report at its address on phone, beside the list on tablet and desktop. */
const reportPath = (projectName: string) => (isPhone(projectName) ? "/handover/report" : "/handover");

/** Hears every request for the pages from now on. */
function pagesAsked(page: Page): Request[] {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (isPagesRequest(request)) requests.push(request);
  });
  return requests;
}

/** The report open with its pages there: the answer of the API, and the requests that were made for it. */
async function theReport(page: Page, projectName: string): Promise<{ pages: PagesAnswer; requests: Request[] }> {
  const requests = pagesAsked(page);
  const asked = page.waitForRequest(isPagesRequest, { timeout: RUN });
  await page.goto(reportPath(projectName));
  const response = await (await asked).response();
  const pages = (await response!.json()) as PagesAnswer;
  await expect(thumbnail(page)).toHaveCount(pages.pages.length, { timeout: RUN });
  return { pages, requests };
}

/** The page shown: the words of the head, the image, the current thumbnail. */
async function expectPage(page: Page, pages: PagesAnswer, number: number): Promise<void> {
  const one = pages.pages[number - 1]!;
  await expect(words(page)).toHaveText(wordsOf(pages, number));
  await expect(pageImage(page)).toHaveAttribute("alt", one.title);
  await expect(pageImage(page)).toHaveAttribute("src", `data:image/png;base64,${one.png}`);
  await expect(thumbnail(page).nth(number - 1)).toHaveAttribute("aria-current", "true");
  await expect(thumbnails(page).locator("[aria-current='true']")).toHaveCount(1);
}

async function grave(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the pages (decisions 4 and 5)", () => {
  test("they come once when the report opens, with the browser's day; the thumbnails are the answer's pages with its titles; the paper shows the first page at the answer's size; the facts count the pages; a second visit asks nothing", async ({ page }, testInfo) => {
    const { pages, requests } = await theReport(page, testInfo.project.name);
    const day = await page.evaluate(() => {
      const now = new Date();
      const two = (value: number) => String(value).padStart(2, "0");
      return `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
    });

    expect(requests).toHaveLength(1);
    expect(new URL(requests[0]!.url()).searchParams.get("day")).toBe(day);
    expect(pages.day).toBe(day);
    expect(pages.pages.length).toBeGreaterThan(1);
    for (const [index, one] of pages.pages.entries()) await expect(thumbnail(page).nth(index)).toHaveAccessibleName(nameOf(one));
    await expect(pageImage(page)).toHaveAttribute("width", String(pages.pages[0]!.width));
    await expect(pageImage(page)).toHaveAttribute("height", String(pages.pages[0]!.height));
    await expectPage(page, pages, 1);
    await expect(paper(page)).toHaveAccessibleName(wordsOf(pages, 1));
    const count = `A4 landscape · ${plural(pages.pages.length, "page", "pages")}`;
    await expect(facts(page)).toHaveText(count);
    await expect(reportRowFacts(page)).toHaveText(count);

    // A second visit of the same edit: the pages are kept.
    if (isPhone(testInfo.project.name)) {
      await page.getByRole("link", { name: "Back to Handover" }).click();
      await rows(page).filter({ hasText: "Design report" }).click();
    } else {
      await rows(page).filter({ hasText: "Bill of materials" }).click();
      await expect(preview(page).getByRole("heading", { level: 2, name: "Bill of materials" })).toBeVisible();
      await rows(page).filter({ hasText: "Design report" }).click();
    }
    await expect(thumbnail(page)).toHaveCount(pages.pages.length);
    await expectPage(page, pages, 1);
    expect(requests).toHaveLength(1);
  });

  test("next and previous turn the pages and the head's words; a thumbnail opens its page; the ends are dim and cannot be used", async ({ page }, testInfo) => {
    const { pages } = await theReport(page, testInfo.project.name);
    const last = pages.pages.length;

    await expect(previous(page)).toHaveAttribute("aria-disabled", "true");
    await expect(previous(page)).toHaveCSS("opacity", "0.45");
    await expect(next(page)).not.toHaveAttribute("aria-disabled", "true");
    await previous(page).click();
    await expectPage(page, pages, 1);

    await next(page).click();
    await expectPage(page, pages, 2);
    await expect(previous(page)).not.toHaveAttribute("aria-disabled", "true");

    await thumbnail(page).nth(last - 1).click();
    await expectPage(page, pages, last);
    await expect(next(page)).toHaveAttribute("aria-disabled", "true");
    await expect(next(page)).toHaveCSS("opacity", "0.45");
    await next(page).click();
    await expectPage(page, pages, last);

    await previous(page).click();
    await expectPage(page, pages, last - 1);
  });

  test("desktop: Left and Right on the focused paper turn the pages; on the thumbnails the focus follows", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The keys are of the desktop.");
    const { pages } = await theReport(page, testInfo.project.name);

    await paper(page).focus();
    await page.keyboard.press("ArrowRight");
    await expectPage(page, pages, 2);
    await page.keyboard.press("ArrowRight");
    await expectPage(page, pages, 3);
    await page.keyboard.press("ArrowLeft");
    await expectPage(page, pages, 2);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expectPage(page, pages, 1);

    await thumbnail(page).first().focus();
    await page.keyboard.press("ArrowRight");
    await expectPage(page, pages, 2);
    await expect(thumbnail(page).nth(1)).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expectPage(page, pages, 1);
    await expect(thumbnail(page).first()).toBeFocused();
  });

  test("phone: the words stand between previous and next; the row of thumbnails scrolls sideways, the page never does", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The row under the paper is of the phone.");
    const { pages } = await theReport(page, testInfo.project.name);

    await expect(words(page)).toHaveCount(1);
    const [previousBox, wordsBox, nextBox] = await Promise.all([previous(page).boundingBox(), words(page).boundingBox(), next(page).boundingBox()]);
    expect(previousBox!.x + previousBox!.width).toBeLessThanOrEqual(wordsBox!.x);
    expect(wordsBox!.x + wordsBox!.width).toBeLessThanOrEqual(nextBox!.x);
    expect(previousBox!.height).toBe(44);
    expect(nextBox!.width).toBe(44);

    await expect(thumbnails(page)).toHaveCSS("overflow-x", "auto");
    await thumbnail(page).last().scrollIntoViewIfNeeded();
    await expect(thumbnail(page).last()).toBeInViewport();
    await thumbnail(page).last().click();
    await expectPage(page, pages, pages.pages.length);
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });

  test("the pages refused are said under the head in the API's words with Try again, which asks again; nothing is said in a toast", async ({ page }, testInfo) => {
    const REFUSED = { error: { code: "export_failed", message: "The report could not be drawn. Try again.", field: null } };
    await page.route("**/api/export/report-pages**", (route) => route.fulfill({ status: 503, json: REFUSED }));
    const requests = pagesAsked(page);
    await page.goto(reportPath(testInfo.project.name));

    await expect(failed(page)).toContainText("The pages were not made", { timeout: RUN });
    await expect(failed(page)).toContainText("There is no preview yet");
    await expect(failed(page)).toContainText(REFUSED.error.message);
    await expect(page.getByTestId("toast")).toHaveCount(0);
    await expect(thumbnail(page)).toHaveCount(0);
    expect(requests).toHaveLength(1);

    await page.unroute("**/api/export/report-pages**");
    const asked = page.waitForRequest(isPagesRequest, { timeout: RUN });
    await failed(page).getByRole("button", { name: "Try again" }).click();
    const pages = (await (await (await asked).response())!.json()) as PagesAnswer;
    await expect(thumbnail(page)).toHaveCount(pages.pages.length, { timeout: RUN });
    await expect(failed(page)).toHaveCount(0);
    await expectPage(page, pages, 1);
    expect(requests).toHaveLength(2);
  });

  test("axe finds nothing serious or critical on the report", async ({ page }, testInfo) => {
    await theReport(page, testInfo.project.name);

    expect(await grave(page)).toEqual([]);
  });
});
