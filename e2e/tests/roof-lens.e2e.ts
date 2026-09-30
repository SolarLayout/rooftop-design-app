import { expect, test } from "../fixtures";

// The Roof lens of the Studio (plan/phase-05-plan.md, steps 10 to 13; the boards "Studio, Roof lens" on
// three sizes, "Obstacle edited on the roof" and "Import with missing heights"): the inspector mounted once,
// in the container of the size (decision 9).

const RUN = 90_000;

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the inspector, mounted once", () => {
  test("the card of the roof stands once in the page, on every size", async ({ page }) => {
    await page.goto("/studio/roof");

    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand · 4 corners · 6 obstacles", { timeout: RUN });
    await expect(page.getByTestId("roof-how")).toHaveCount(1);
    await expect(page.getByRole("radiogroup", { name: "Roof type" })).toHaveCount(1);
  });
});
