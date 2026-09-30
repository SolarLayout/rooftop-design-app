import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { A_MAP, findOpened as opened, IMAGERY, roofMap as map, scaleLabel, searchField, withTheGeocoder, withTheImagery } from "../find";
import { expect, test } from "../fixtures";

// Find and outline (plan/phase-04-plan.md, step 3): the map with the imagery, the frame of the screen on
// three sizes, the ways to it, and the states without a map. The imagery comes from a fixture tile on
// this machine: the browser tests never touch the network (e2e/fixtures.ts).

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

async function graveFindings(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

/** What the console said that is a fault: an error of the page, or of React, or of the map. */
function faultsOf(page: Page): string[] {
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") faults.push(message.text());
  });
  return faults;
}

test.describe("the map", () => {
  test("it renders with the imagery, its attribution and its scale, and no request leaves this machine", async ({ page }, testInfo) => {
    const faults = faultsOf(page);
    await opened(page);

    await expect(map(page)).toHaveAccessibleName("Satellite map");
    await expect(map(page).locator("canvas")).toBeVisible();
    await expect(page.getByText("Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community")).toBeVisible();
    // The phone board has no scale bar.
    if (isPhone(testInfo.project.name)) await expect(page.getByTestId("scale-bar")).toBeHidden();
    else await expect(page.getByTestId("scale-bar")).toBeVisible();
    await expect(page).toHaveTitle("Find and outline · SolarLayout Rooftop");
    expect(faults).toEqual([]);
  });

  test("the frame: back, the search, the steps, the panel, the buttons of the map", async ({ page }, testInfo) => {
    await opened(page);

    await expect(page.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    await expect(searchField(page)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Find the roof" })).toBeVisible();
    const steps = page.getByRole("list", { name: "Steps" });
    if (isPhone(testInfo.project.name)) {
      // The phone has no buttons of the map and no pill of steps: the sheet says which step it is.
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeHidden();
      await expect(steps).toBeHidden();
      await expect(page.getByText("Step 1 of 3")).toBeVisible();
    } else {
      await expect(page.getByRole("button", { name: "North up" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
      await expect(steps.getByRole("listitem")).toHaveText(["1Find", "2Outline", "3Build"]);
      await expect(steps.locator('[aria-current="step"]')).toHaveText("1Find");
    }
    await expect(page.getByRole("banner")).toHaveCount(0);
  });

  test("on phone and tablet the map ends above the sheet; on desktop the panel floats at the right", async ({ page }, testInfo) => {
    await opened(page);
    const screen = page.viewportSize()!;
    const stage = (await map(page).boundingBox())!;
    const panel = (await page.getByRole("complementary", { name: "Find the roof" }).boundingBox())!;

    if (isDesktop(testInfo.project.name)) {
      expect([stage.x, stage.y, stage.width, stage.height]).toEqual([0, 0, screen.width, screen.height]);
      expect([panel.width, Math.round(panel.x + panel.width), panel.y]).toEqual([380, screen.width - 20, 20]);
      return;
    }
    expect([stage.x, stage.y, stage.width]).toEqual([0, 0, screen.width]);
    expect(stage.y + stage.height).toBe(panel.y);
    expect([panel.height, panel.y + panel.height]).toEqual([384, screen.height]);
  });

  test("the buttons zoom and turn the map", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "The phone has no buttons of the map.");
    await opened(page);
    const label = page.getByTestId("scale-bar").locator("code");
    const before = await label.textContent();

    await page.getByRole("button", { name: "Zoom in" }).click();

    await expect(label).not.toHaveText(before!);
  });

  test("nothing scrolls sideways", async ({ page }) => {
    await opened(page);

    const beyond = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(beyond).toBeLessThanOrEqual(0);
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    await opened(page);

    expect(await graveFindings(page)).toEqual([]);
  });
});

test.describe("without a map", () => {
  test("no WebGL: the map's place says why, and the way on by hand is there", async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
        if (kind === "webgl" || kind === "webgl2") return null;
        return (getContext as (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) => unknown).call(this, kind, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    await withTheImagery(page);
    await page.goto("/find");

    const said = page.getByRole("status");
    await expect(said).toContainText("This browser cannot draw the map");
    await expect(said).toContainText("It has no WebGL. Try another browser, or enter the roof by its measurements.");
    await expect(said.getByRole("button", { name: "Enter dimensions by hand instead" })).toHaveAttribute("aria-disabled", "true");
    await expect(map(page)).toHaveCount(0);
  });

  test("the tiles do not come: the map's place says so", async ({ page }) => {
    await page.route(IMAGERY, (route) => route.abort("connectionrefused"));
    await page.goto("/find");

    const said = page.getByRole("status");
    await expect(said).toContainText("The imagery does not load", { timeout: A_MAP });
    await expect(said).toContainText("Check the connection and try again, or enter the roof by its measurements.");
  });
});

test.describe("the ways to it", () => {
  test("from the project switcher: New design", async ({ page }) => {
    await withTheImagery(page);
    await page.goto("/studio/array");
    const trigger = page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ });
    await expect(trigger).toBeVisible({ timeout: 90_000 });

    await trigger.click();
    await page.getByRole("menu", { name: "Project" }).getByRole("menuitem", { name: "New design" }).click();

    await expect(page).toHaveURL(/\/find$/);
    await expect(map(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
    // The design that is open is where the map begins.
    await expect(page.getByTestId("scale-bar").locator("code")).toHaveText("20 m");
  });

  test("from Home: Find my roof", async ({ page }) => {
    await withTheImagery(page);
    await page.goto("/");

    await page.getByRole("link", { name: "Find my roof" }).click();

    await expect(page).toHaveURL(/\/find$/);
    await expect(page.getByRole("heading", { level: 1, name: "Find the roof" })).toBeVisible();
  });

  test("the demo is not opened here", async ({ page }) => {
    const asked: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/")) asked.push(new URL(request.url()).pathname);
    });
    await opened(page);

    expect(asked).toEqual([]);
  });
});

test.describe("the search", () => {
  const HINJEWADI = "Hinjewadi Phase 2, Pune, Maharashtra";
  const isTablet = (projectName: string) => projectName === "tablet";

  /** The map stands at the roof zoom on the place: the scale bar says 20 m, the panel says step 2. */
  async function arrivedAt(page: Page, projectName: string, label: string) {
    await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
    await expect(page.getByRole("heading", { level: 1, name: "Outline the roof" })).toBeVisible();
    if (isPhone(projectName)) await expect(page.getByText("Step 2 of 3")).toBeVisible();
    else {
      await expect(page.getByRole("list", { name: "Steps" }).locator('[aria-current="step"]')).toHaveText("2Outline");
      await expect(page.getByTestId("found-at")).toHaveText(label);
    }
  }

  test("words: the places found, the first marked; Enter takes it and the map flies there", async ({ page }, testInfo) => {
    const asked = await withTheGeocoder(page);
    await opened(page);

    await searchField(page).fill("Hinjewadi Phase 2");
    await searchField(page).press("Enter");

    const list = page.getByRole("listbox", { name: "Places found" });
    await expect(list.getByRole("option")).toHaveText([
      `${HINJEWADI}Locality`,
      "Hinjewadi Phase 2 Rd, Hinjewadi, Pune, MaharashtraStreet",
      "Phase 2, Rajiv Gandhi Infotech Park, Hinjewadi, Pune, MaharashtraPlace",
    ]);
    await expect(list.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
    expect(asked).toHaveLength(1);
    const url = new URL(asked[0]);
    expect(url.searchParams.get("singleLine")).toBe("Hinjewadi Phase 2");
    expect(url.searchParams.get("maxLocations")).toBe("5");
    expect(url.searchParams.has("token")).toBe(true);

    await searchField(page).press("Enter");

    await expect(list).toBeHidden();
    await arrivedAt(page, testInfo.project.name, HINJEWADI);
  });

  test("the arrows mark the next place, a press takes one", async ({ page }, testInfo) => {
    await withTheGeocoder(page);
    await opened(page);
    await searchField(page).fill("Hinjewadi");
    await searchField(page).press("Enter");
    const options = page.getByRole("listbox", { name: "Places found" }).getByRole("option");
    await expect(options).toHaveCount(3);

    await searchField(page).press("ArrowDown");
    await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(options.nth(0)).toHaveAttribute("aria-selected", "false");
    await options.nth(2).click();

    await arrivedAt(page, testInfo.project.name, "Phase 2, Rajiv Gandhi Infotech Park, Hinjewadi, Pune, Maharashtra");
  });

  test("Escape closes the list and keeps the words", async ({ page }) => {
    await withTheGeocoder(page);
    await opened(page);
    await searchField(page).fill("Hinjewadi");
    await searchField(page).press("Enter");
    await expect(page.getByRole("listbox", { name: "Places found" })).toBeVisible();

    await searchField(page).press("Escape");

    await expect(page.getByRole("listbox", { name: "Places found" })).toBeHidden();
    await expect(searchField(page)).toHaveValue("Hinjewadi");
    await expect(page.getByRole("heading", { level: 1, name: "Find the roof" })).toBeVisible();
  });

  test("nothing found: it says so, and what to try", async ({ page }) => {
    await withTheGeocoder(page, "nothing");
    await opened(page);

    await searchField(page).fill("xq9 street");
    await searchField(page).press("Enter");

    await expect(page.getByRole("status").filter({ hasText: "Nothing found" })).toHaveText(
      /Nothing found for “xq9 street”\. Try a fuller address, or paste coordinates\./,
    );
  });

  test("the search cannot be reached: it says so", async ({ page }) => {
    await page.route(/geocode-api\.arcgis\.com/, (route) => route.abort("connectionrefused"));
    await opened(page);

    await searchField(page).fill("Hinjewadi");
    await searchField(page).press("Enter");

    await expect(page.getByRole("status").filter({ hasText: "search" })).toContainText("The search cannot be reached. Check the connection and try again.");
  });

  test("coordinates typed: no request, the map flies at once, the place is said in full", async ({ page }, testInfo) => {
    const asked = await withTheGeocoder(page);
    await opened(page);

    await searchField(page).fill("18.52000, 73.86000");
    await searchField(page).press("Enter");

    await arrivedAt(page, testInfo.project.name, "18.52000° N, 73.86000° E");
    expect(asked).toEqual([]);
  });

  test("a maps link pasted: its coordinates are read", async ({ page }, testInfo) => {
    const asked = await withTheGeocoder(page);
    await opened(page);

    await searchField(page).fill("https://www.google.com/maps/@18.5204,73.8567,19z");
    await searchField(page).press("Enter");

    await arrivedAt(page, testInfo.project.name, "18.52040° N, 73.85670° E");
    expect(asked).toEqual([]);
  });

  test("on phone and tablet: Use my location flies to where the device is", async ({ page, context }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), "Desktop has no button for the location: it has a keyboard and an address.");
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 18.52, longitude: 73.86 });
    await opened(page);

    await page.getByRole("button", { name: "Use my location" }).click();

    await arrivedAt(page, testInfo.project.name, "18.52000° N, 73.86000° E");
    if (isTablet(testInfo.project.name)) await expect(page.getByRole("button", { name: "Use my location" })).toBeHidden();
  });

  test("on phone and tablet: a location that is not given says so", async ({ page, context }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), "Desktop has no button for the location.");
    await context.setGeolocation(null);
    await context.grantPermissions([]);
    await opened(page);

    await page.getByRole("button", { name: "Use my location" }).click();

    await expect(page.getByRole("status").filter({ hasText: "location" })).toContainText("Your location is not available", { timeout: A_MAP });
  });
});
