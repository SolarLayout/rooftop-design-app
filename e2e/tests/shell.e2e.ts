import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

// The shell on its routes, with the demo from the API of the test stack: it renders, it navigates, it
// never scrolls sideways, and axe finds nothing serious. Its parts, each in every state, are tested on
// the kit (kit-shell.e2e.ts); its numbers in shell-vitals.e2e.ts; its looks in screens.e2e.ts.

const RUN = 90_000;

const WORKSPACES = [
  { name: "Studio", path: "/studio/array", heading: "Array" },
  { name: "Performance", path: "/performance", heading: "Performance" },
  { name: "Handover", path: "/handover/report", heading: "Handover" },
];

const WIDTHS = [360, 390, 640, 834, 1100, 1101, 1440];

const isPhone = (projectName: string) => projectName === "phone";
const isTablet = (projectName: string) => projectName === "tablet";
const isDesktop = (projectName: string) => projectName === "desktop";

const bar = (page: Page) => page.getByRole("banner");
const workspaces = (page: Page) => page.getByRole("navigation", { name: "Workspaces" });
const lenses = (page: Page) => page.getByRole("navigation", { name: "Lenses" });
const switcher = (page: Page) => bar(page).getByRole("button", { name: /Pune demo roof/ });

/** The page with the demo open. In the Studio its numbers are there too. */
async function opened(page: Page, path: string) {
  expect((await page.goto(path))?.status()).toBe(200);
  await expect(switcher(page)).toBeVisible({ timeout: RUN });
  if (path.startsWith("/studio")) await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible({ timeout: RUN });
}

/** What the console said that is a fault: an error of the page, or of React. */
function faultsOf(page: Page): string[] {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") faults.push(message.text());
  });
  return faults;
}

async function graveFindings(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN + 30_000 });

for (const { name, path, heading } of WORKSPACES) {
  test.describe(`${name}, ${path}`, () => {
    test("it renders: the top bar, the workspaces, what the place is", async ({ page }, testInfo) => {
      const faults = faultsOf(page);
      await opened(page, path);

      await expect(bar(page).getByRole("img", { name: "SolarLayout Rooftop" })).toBeVisible();
      await expect(switcher(page)).toBeVisible();
      await expect(workspaces(page).getByRole("link")).toHaveText(["Studio", "Performance", "Handover"]);
      await expect(workspaces(page).getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      await expect(workspaces(page).locator('[aria-current="page"]')).toHaveCount(1);
      await expect(bar(page).getByRole("link", { name: "Export" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText([heading]);
      await expect(page.getByRole("main")).toHaveCount(1);
      if (!isPhone(testInfo.project.name)) await expect(bar(page).getByRole("button", { name: "Present" })).toBeVisible();
      expect(faults).toEqual([]);
    });

    test("the top bar is at the top and as wide as the screen; on phone the tab bar is at the bottom", async ({ page }, testInfo) => {
      await opened(page, path);
      const screen = page.viewportSize()!;
      const top = (await bar(page).boundingBox())!;

      expect([top.x, top.y, top.width]).toEqual([0, 0, screen.width]);
      expect(top.height).toBe(isTablet(testInfo.project.name) ? 60 : 56);
      if (!isPhone(testInfo.project.name)) return;

      const bottom = (await workspaces(page).boundingBox())!;
      expect([bottom.x, bottom.width, bottom.height]).toEqual([0, screen.width, 72]);
      expect(bottom.y + bottom.height).toBe(screen.height);
    });

    test("the bars stay where they are while what is between them scrolls", async ({ page }) => {
      await opened(page, path);

      expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
    });

    test("nothing scrolls sideways, from 360 px up", async ({ page }) => {
      await opened(page, path);

      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });
        const beyond = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(beyond, `the page at ${width} px`).toBeLessThanOrEqual(0);
        const top = await bar(page).evaluate((element) => element.scrollWidth - element.clientWidth);
        expect(top, `the top bar at ${width} px`).toBeLessThanOrEqual(0);
        const right = await bar(page)
          .getByRole("link", { name: "Export" })
          .evaluate((element) => element.getBoundingClientRect().right);
        expect(right, `Export at ${width} px`).toBeLessThanOrEqual(width);
      }
    });

    test("axe finds nothing serious or critical", async ({ page }) => {
      await opened(page, path);

      expect(await graveFindings(page)).toEqual([]);
    });
  });
}

test.describe("from workspace to workspace", () => {
  test("the workspaces lead to each other, and the design stays open", async ({ page }) => {
    const faults = faultsOf(page);
    await opened(page, "/studio/array");

    await workspaces(page).getByRole("link", { name: "Performance" }).click();
    await expect(page).toHaveURL(/\/performance$/);
    await expect(page.getByRole("heading", { level: 1, name: "Performance" })).toBeVisible();
    await expect(page).toHaveTitle("Performance · SolarLayout Rooftop");
    await expect(workspaces(page).getByRole("link", { name: "Performance" })).toHaveAttribute("aria-current", "page");
    await expect(switcher(page)).toBeVisible();

    await workspaces(page).getByRole("link", { name: "Handover" }).click();
    await expect(page).toHaveURL(/\/handover\/report$/);
    await expect(page.getByRole("heading", { level: 2, name: "Design report" })).toBeVisible();
    await expect(switcher(page)).toBeVisible();

    await workspaces(page).getByRole("link", { name: "Studio" }).click();
    await expect(page).toHaveURL(/\/studio\/array$/);
    await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible();
    expect(faults).toEqual([]);
  });

  test("the Studio is entered at the lens that was opened last", async ({ page }) => {
    await opened(page, "/studio/sun");

    await workspaces(page).getByRole("link", { name: "Performance" }).click();
    await expect(page).toHaveURL(/\/performance$/);
    await expect(workspaces(page).getByRole("link", { name: "Studio" })).toHaveAttribute("href", "/studio/sun");
    await workspaces(page).getByRole("link", { name: "Studio" }).click();

    await expect(page).toHaveURL(/\/studio\/sun$/);
    await expect(page.getByRole("heading", { level: 1, name: "Sun" })).toBeVisible();
  });

  test("Export leads to Handover", async ({ page }) => {
    await opened(page, "/studio/array");

    await bar(page).getByRole("link", { name: "Export" }).click();

    await expect(page).toHaveURL(/\/handover\/report$/);
    await expect(page.getByRole("heading", { level: 1, name: "Handover" })).toBeVisible();
  });

  test("the back of the browser leads back", async ({ page }) => {
    await opened(page, "/studio/array");
    await workspaces(page).getByRole("link", { name: "Performance" }).click();
    await expect(page).toHaveURL(/\/performance$/);

    await page.goBack();

    await expect(page).toHaveURL(/\/studio\/array$/);
    await expect(workspaces(page).getByRole("link", { name: "Studio" })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("the Studio, from lens to lens", () => {
  test("the four lenses lead to each other; the numbers stay, and no run is asked for again", async ({ page }) => {
    const runs: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/design")) runs.push(request.url());
    });
    await opened(page, "/studio/roof");

    for (const [lens, name] of [
      ["array", "Array"],
      ["sun", "Sun"],
      ["strings", "Strings"],
      ["roof", "Roof"],
    ]) {
      await lenses(page).getByRole("link", { name }).click();

      await expect(page).toHaveURL(new RegExp(`/studio/${lens}$`));
      await expect(page.getByRole("heading", { level: 1, name, exact: true })).toBeVisible();
      await expect(page).toHaveTitle(`${name} · Studio · SolarLayout Rooftop`);
      await expect(lenses(page).getByRole("link", { name })).toHaveAttribute("aria-current", "page");
      await expect(lenses(page).locator('[aria-current="page"]')).toHaveCount(1);
      await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible();
    }
    expect(runs).toHaveLength(1);
  });

  test("the lenses are where the size has them: a rail, a row over the stage, a switch in the sheet", async ({ page }, testInfo) => {
    await opened(page, "/studio/array");
    const nav = (await lenses(page).boundingBox())!;
    const top = (await bar(page).boundingBox())!;

    await expect(lenses(page)).toHaveCount(1);
    if (isDesktop(testInfo.project.name)) {
      expect([nav.x, nav.y, nav.width]).toEqual([0, top.height, 72]);
      expect(nav.height).toBe(page.viewportSize()!.height - top.height);
    }
    if (isTablet(testInfo.project.name)) {
      expect([nav.x, nav.y]).toEqual([20, top.height + 16]);
    }
    if (isPhone(testInfo.project.name)) {
      const sheet = (await page.getByRole("region", { name: "Inspector" }).boundingBox())!;
      expect(nav.y).toBeGreaterThan(sheet.y);
      expect([nav.x, nav.width]).toEqual([16, page.viewportSize()!.width - 32]);
    }
  });

  test("desktop: the vitals float at the bottom of the stage, between the rail and the inspector", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The bar is of the desktop.");
    await opened(page, "/studio/array");
    const vitals = (await page.getByRole("region", { name: "Design vitals" }).boundingBox())!;
    const inspector = (await page.getByRole("complementary", { name: "Array inspector" }).boundingBox())!;
    const screen = page.viewportSize()!;

    expect(vitals.x).toBe(72 + 20);
    expect(vitals.x + vitals.width).toBe(inspector.x - 20);
    expect(vitals.y + vitals.height).toBe(screen.height - 20);
    expect(vitals.height).toBe(78);
    expect(inspector.width).toBe(384);
    expect(inspector.x + inspector.width).toBe(screen.width);
  });

  test("tablet: the stage, under it the vitals with 20 at their sides, under them the inspector", async ({ page }, testInfo) => {
    test.skip(!isTablet(testInfo.project.name), "The grid is of the tablet.");
    await opened(page, "/studio/array");
    const vitals = (await page.getByRole("region", { name: "Design vitals" }).boundingBox())!;
    const inspector = (await page.getByRole("complementary", { name: "Array inspector" }).boundingBox())!;
    const screen = page.viewportSize()!;

    expect([vitals.x, vitals.width]).toEqual([20, screen.width - 40]);
    expect(vitals.y).toBe(60 + 508);
    expect(inspector.y).toBeGreaterThanOrEqual(vitals.y + vitals.height);
  });

  test("phone: the stage is 252 high, the vitals are a row under it, the inspector is a sheet that can be opened", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The sheet is of the phone.");
    await opened(page, "/studio/array");
    const vitals = (await page.getByRole("region", { name: "Design vitals" }).boundingBox())!;
    const sheet = page.getByRole("region", { name: "Inspector" });
    const handle = sheet.getByRole("separator", { name: "Inspector" });
    const tabs = (await workspaces(page).boundingBox())!;

    expect(vitals.y).toBe(56 + 252);
    expect((await sheet.boundingBox())!.y).toBeGreaterThanOrEqual(vitals.y + 64);
    expect(Math.round((await sheet.boundingBox())!.y + (await sheet.boundingBox())!.height)).toBe(tabs.y);
    await expect(handle).toHaveAttribute("aria-valuetext", "Half open");

    await handle.focus();
    await page.keyboard.press("End");
    await expect(handle).toHaveAttribute("aria-valuetext", "Open");
    await page.keyboard.press("Home");
    await expect(handle).toHaveAttribute("aria-valuetext", "Closed");
    await expect(lenses(page).getByRole("link", { name: "Array" })).toBeVisible();
  });
});

test.describe("the project switcher, in the shell", () => {
  test("it opens, and Home leads home", async ({ page }) => {
    await opened(page, "/performance");

    await switcher(page).click();
    const menu = page.getByRole("menu", { name: "Project" });
    await expect(menu).toBeVisible();
    await expect(page.locator("[popover]:popover-open").getByTestId("this-design")).toContainText("Pune demo roof");
    await menu.getByRole("menuitem", { name: "Home" }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1, name: "SolarLayout Rooftop" })).toBeVisible();
  });

  test("open, axe finds nothing serious or critical", async ({ page }) => {
    await opened(page, "/studio/array");
    await switcher(page).click();
    await expect(page.getByRole("menu", { name: "Project" })).toBeVisible();

    expect(await graveFindings(page)).toEqual([]);
  });
});

test.describe("the notes, in the shell", () => {
  async function openTheNotes(page: Page, projectName: string) {
    const opener = isPhone(projectName)
      ? bar(page).getByRole("button", { name: "1 note to review" })
      : page.getByRole("region", { name: "Design vitals" }).getByRole("button", { name: "1 note to review" });
    await opener.click();
    const drawer = page.getByRole("dialog", { name: "Notes to review" });
    await expect(drawer).toBeVisible();
    return { opener, drawer };
  }

  test("a note leads to where it can be answered, and the drawer closes", async ({ page }, testInfo) => {
    await opened(page, "/studio/roof");
    const { drawer } = await openTheNotes(page, testInfo.project.name);

    await drawer.getByRole("link", { name: "Open Array" }).click();

    await expect(page).toHaveURL(/\/studio\/array$/);
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("heading", { level: 1, name: "Array" })).toBeVisible();
  });

  test("Escape closes them and gives the focus back", async ({ page }, testInfo) => {
    await opened(page, "/studio/array");
    const { opener, drawer } = await openTheNotes(page, testInfo.project.name);

    await page.keyboard.press("Escape");

    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("open, axe finds nothing serious or critical", async ({ page }, testInfo) => {
    await opened(page, "/studio/array");
    await openTheNotes(page, testInfo.project.name);

    expect(await graveFindings(page)).toEqual([]);
  });
});

test.describe("by keyboard", () => {
  test("Tab goes through the top bar in the order it is read", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "A keyboard is of the desktop; the order is the same on every size.");
    await opened(page, "/studio/array");

    const reached: string[] = [];
    for (let step = 0; step < 6; step += 1) {
      await page.keyboard.press("Tab");
      reached.push(await page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim()));
    }

    expect(reached).toEqual(["Pune demo roof18.52° N · 73.86° E", "Studio", "Performance", "Handover", "Present", "Export"]);
  });

  test("what has the focus shows it", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "A keyboard is of the desktop.");
    await opened(page, "/studio/array");

    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    const link = workspaces(page).getByRole("link", { name: "Studio" });
    await expect(link).toBeFocused();
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toHaveCSS("outline-color", "rgb(255, 176, 32)");
  });
});

test.describe("before a system voltage", () => {
  test("axe finds nothing serious or critical, and nothing scrolls sideways", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto("/studio/strings");
    await expect(page.getByRole("region", { name: "Design vitals" }).getByText("442.40")).toBeVisible({ timeout: RUN });

    expect(await graveFindings(page)).toEqual([]);
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      const beyond = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(beyond, `at ${width} px`).toBeLessThanOrEqual(0);
    }
  });
});
