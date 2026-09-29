import { expect, test } from "../fixtures";

// The tokens as the browser sees them. That the stylesheet has every token of the document, with the
// same value, is held by apps/web/app/globals.test.ts.

test("the page wears the Dusk theme", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dusk");
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(11, 14, 19)");
  await expect(page.locator("body")).toHaveCSS("color", "rgb(242, 244, 247)");
});

test("body text is 15 px on touch sizes and 14 px on desktop", async ({ page }, testInfo) => {
  await page.goto("/");

  const size = testInfo.project.name === "desktop" ? "14px" : "15px";
  await expect(page.locator("body")).toHaveCSS("font-size", size);
  await expect(page.locator("body")).toHaveCSS("line-height", "20px");
});

test("desktop begins over 1100 px", async ({ page }) => {
  await page.goto("/");

  await page.setViewportSize({ width: 1100, height: 800 });
  await expect(page.locator("body")).toHaveCSS("font-size", "15px");

  await page.setViewportSize({ width: 1101, height: 800 });
  await expect(page.locator("body")).toHaveCSS("font-size", "14px");
});
