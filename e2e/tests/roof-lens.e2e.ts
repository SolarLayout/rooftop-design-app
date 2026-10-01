import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

// The Roof lens of the Studio (plan/phase-05-plan.md, steps 10 to 13; the boards "Studio, Roof lens" on
// three sizes, "Obstacle edited on the roof" and "Import with missing heights"): the inspector mounted once,
// in the container of the size (decision 9); the card of the roof; the edges and access as fields that
// commit as fields do (decision 16), each a committed edit that asks for the layout again.

const RUN = 90_000;

const isPhone = (projectName: string) => projectName === "phone";

type LayoutRequest = { roof: { roof_type: string; parapet_h: number; setback_m: number; slope_deg: number } };

/** Every request of the layout the page sends, as it is sent. */
function layoutsOf(page: Page): LayoutRequest[] {
  const layouts: LayoutRequest[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
  });
  return layouts;
}

/** The Roof lens with the demo open and its first layout asked for; on phone the sheet is opened in full. */
async function roofLensOpened(page: Page, projectName: string, layouts: LayoutRequest[]) {
  await page.goto("/studio/roof");
  await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
  await expect.poll(() => layouts.length, { timeout: RUN }).toBe(1);
  if (isPhone(projectName)) {
    await page.getByRole("separator", { name: "Inspector" }).press("End");
    await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Open");
  }
}

const field = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the inspector, mounted once", () => {
  test("the card of the roof stands once in the page, on every size: the place, how, what it has, its size", async ({ page }) => {
    await page.goto("/studio/roof");

    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
    await expect(page.getByTestId("roof-how")).toHaveCount(1);
    await expect(page.getByTestId("roof-place")).toHaveText("18.52000° N, 73.86000° E");
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners · 6 obstacles");
    await expect(page.getByTestId("roof-size")).toHaveText("90.0 × 40.0 m · faces 180° S");
    await expect(page.getByRole("radiogroup", { name: "Roof type" })).toHaveCount(1);
  });
});

test.describe("edges and access", () => {
  test("the fields of the demo, two to a row; a parapet of 1.2 typed is a committed edit: the next layout carries it, the roof says it", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);
    const edges = page.getByRole("region", { name: "Edges and access" });
    for (const [name, value] of [
      ["Parapet", "0.90"],
      ["Setback", "1.00"],
      ["Walkway", "0.60"],
      ["Every", "24"],
      ["Clearance", "0.50"],
      ["Albedo", "0.20"],
    ] as const) {
      await expect(edges.getByRole("textbox", { name, exact: true })).toHaveValue(value);
    }
    await expect(field(page, "Pitch")).toHaveCount(0);
    if (!isPhone(testInfo.project.name)) {
      const [parapet, setback, walkway] = await Promise.all(["Parapet", "Setback", "Walkway"].map(async (name) => (await field(page, name).boundingBox())!));
      expect(Math.round(parapet.y)).toBe(Math.round(setback.y));
      expect(walkway.y).toBeGreaterThan(parapet.y);
    }

    await field(page, "Parapet").fill("1.2");
    await field(page, "Parapet").press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof).toMatchObject({ parapet_h: 1.2, setback_m: 1 });
    await expect(field(page, "Parapet")).toHaveValue("1.20");
    await expect(page.getByTestId("on-the-roof-roof")).toContainText("parapet 1.2 m", { timeout: RUN });
  });

  test("sloped chosen: the pitch and where it faces appear, and the parapet reads 0.00", async ({ page }, testInfo) => {
    const layouts = layoutsOf(page);
    await roofLensOpened(page, testInfo.project.name, layouts);

    await page.getByRole("radiogroup", { name: "Roof type" }).getByRole("radio", { name: "Sloped" }).click();

    await expect(field(page, "Pitch")).toHaveValue("10");
    await expect(field(page, "Faces")).toHaveValue("180.0");
    await expect(field(page, "Parapet")).toHaveValue("0.00");
    await expect(field(page, "Every")).toHaveValue("4");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(2);
    expect(layouts[1].roof).toMatchObject({ roof_type: "sloped_flush", parapet_h: 0 });

    await field(page, "Pitch").fill("15");
    await field(page, "Pitch").press("Enter");

    await expect.poll(() => layouts.length, { timeout: RUN }).toBe(3);
    expect(layouts[2].roof.slope_deg).toBe(15);
  });
});
