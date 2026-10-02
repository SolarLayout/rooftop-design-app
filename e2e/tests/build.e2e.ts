import type { Page } from "@playwright/test";
import { A_MAP, atTheRoof, drawTheRectangle, findOpened, roofMap, scaleLabel } from "../find";
import { expect, test } from "../fixtures";

// "Build this roof" (plan/phase-04-plan.md, step 11): the roof type, the document from the API, the
// Studio on the Roof lens with the card of the roof, Edit back to the map, and the roof type as the first
// committed edit. The acceptance of the phase: from Home to the Studio in under 60 s; the 90.0 by 40.0 m
// rectangle within 0.5 m per edge and 2 % of area in the request the web app sends.

const RUN = 90_000;
const UNDER = 60_000;

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

/** The roof type chosen, as the size offers it: a card on desktop, a segmented control on touch. */
async function chooseRoofType(page: Page, projectName: string, name: string, short: string) {
  if (isDesktop(projectName)) await page.getByRole("group", { name: "Roof type" }).getByRole("button", { name }).click();
  else await page.getByRole("radiogroup", { name: "Roof type" }).getByRole("radio", { name: short }).click();
}

const edgesOf = (outline: [number, number][]) => outline.map(([x, y], n) => Math.hypot(outline[(n + 1) % outline.length][0] - x, outline[(n + 1) % outline.length][1] - y));
const areaOf = (outline: [number, number][]) => Math.abs(outline.reduce((sum, [x, y], n) => sum + x * outline[(n + 1) % outline.length][1] - outline[(n + 1) % outline.length][0] * y, 0)) / 2;

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("Build this roof", () => {
  test("from Home to the Studio on the Roof lens in under 60 s; the outline sent within 0.5 m per edge and 2 % of area", async ({ page }, testInfo) => {
    const layouts: { roof: { outline: [number, number][]; roof_type: string; source: string }; name: string }[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
    });
    const began = Date.now();
    await page.goto("/");

    await page.getByRole("link", { name: "Find my roof" }).click();
    await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
    await atTheRoof(page);
    await drawTheRectangle(page);
    await chooseRoofType(page, testInfo.project.name, "Flat, east-west", "East-west");
    await page.getByRole("button", { name: "Build this roof" }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
    await expect(page.getByRole("heading", { level: 1, name: "Roof", exact: true })).toBeVisible();
    await expect(page.getByTestId("roof-how")).toHaveText("Outlined on satellite");
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners");
    await expect(page.getByTestId("roof-size")).toHaveText(/^(89|90)\.\d × (39|40)\.\d m · faces 180° S$/);
    await expect(page.getByTestId("roof-place")).toHaveText(/^18\.5\d{4}° N, 73\.8\d{4}° E$/);
    expect(Date.now() - began).toBeLessThan(UNDER);
    await expect(page.getByRole("banner").getByRole("button", { name: /Untitled roof/ })).toBeVisible();

    await expect.poll(() => layouts.length, { timeout: RUN }).toBeGreaterThan(0);
    const { roof, name } = layouts[0];
    expect([name, roof.source, roof.roof_type]).toEqual(["Untitled roof", "map", "flat_ew"]);
    const edges = edgesOf(roof.outline);
    [90, 40, 90, 40].forEach((length, n) => expect(Math.abs(edges[n] - length), `edge ${n + 1}`).toBeLessThanOrEqual(0.5));
    expect(Math.abs(areaOf(roof.outline) - 3600) / 3600).toBeLessThanOrEqual(0.02);
  });

  test("Build waits for a closed outline", async ({ page }) => {
    await findOpened(page);
    await atTheRoof(page);

    await expect(page.getByRole("button", { name: "Build this roof" })).toBeDisabled();
  });

  test("a build that fails says why, in the words of the API, and the outline stays", async ({ page }) => {
    await page.route("**/api/roof/from-map", (route) =>
      route.fulfill({ status: 503, json: { error: { code: "unavailable", message: "The engine is not available. Try again in a minute.", field: null } } }),
    );
    await findOpened(page);
    await atTheRoof(page);
    await drawTheRectangle(page);

    await page.getByRole("button", { name: "Build this roof" }).click();

    await expect(page.getByRole("status").filter({ hasText: "engine" })).toContainText("The engine is not available. Try again in a minute.");
    await expect(page).toHaveURL(/\/find$/);
    await expect(page.getByTestId("corner")).toHaveCount(4);
    await expect(page.getByRole("button", { name: "Build this roof" })).toBeEnabled();
  });
});

test.describe("the Roof lens", () => {
  test("Edit shows the design's outline on the map; Build again keeps the design and its name", async ({ page }) => {
    const layouts: { name: string; roof: { source: string } }[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
    });
    await page.goto("/studio/roof");
    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners · 6 obstacles");
    await expect(page.getByTestId("roof-size")).toHaveText("90.0 × 40.0 m · faces 180° S");

    await page.getByRole("link", { name: "Edit" }).click();

    await expect(page).toHaveURL(/\/find\?edit=roof$/);
    await expect(page.getByTestId("corner")).toHaveCount(4, { timeout: A_MAP });
    await expect(page.getByRole("heading", { level: 1, name: "Outline the roof" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "South" })).toHaveValue("90.0");
    await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });

    await page.getByRole("button", { name: "Build this roof" }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
    await expect(page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ })).toBeVisible();
    await expect(page.getByTestId("roof-how")).toHaveText("Outlined on satellite");
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners · 6 obstacles");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBeGreaterThan(1);
    expect(layouts.at(-1)).toMatchObject({ name: "Pune demo roof", roof: { source: "map" } });
  });

  test("the roof type is a committed edit: the layout is asked for again", async ({ page }, testInfo) => {
    const layouts: { roof: { roof_type: string } }[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
    });
    await page.goto("/studio/roof");
    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(1);
    const group = page.getByRole("radiogroup", { name: "Roof type" });
    if (isPhone(testInfo.project.name)) await page.getByRole("separator", { name: "Inspector" }).press("End");

    await group.getByRole("radio", { name: "East-west" }).click();

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof.roof_type).toBe("flat_ew");
    await expect(group.getByRole("radio", { name: "East-west" })).toHaveAttribute("aria-checked", "true");
  });
});
