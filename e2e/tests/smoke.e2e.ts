import { expect, test } from "../fixtures";
import { webUrl } from "../stack";

test("home page loads, names the app and reaches the API", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).origin, "the tests run against the test stack").toBe(webUrl());

  await expect(page.getByRole("heading", { level: 1, name: "SolarLayout Rooftop" })).toBeVisible();
  await expect(page).toHaveTitle("SolarLayout Rooftop");

  const apiStatus = page.getByTestId("api-status");
  await expect(apiStatus).toHaveAttribute("data-state", "reachable");
  await expect(apiStatus).toHaveText("API reachable (version 0.1.0)");

  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll, "no horizontal scroll").toBeLessThanOrEqual(width.client);

  expect(consoleErrors, "console errors").toEqual([]);
});
