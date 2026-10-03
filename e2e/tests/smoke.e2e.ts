import { expect, test } from "../fixtures";
import { webUrl } from "../stack";

test("home page loads, names the app and reaches the API for the demo's card", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  expect(new URL(page.url()).origin, "the tests run against the test stack").toBe(webUrl());

  await expect(page.getByRole("img", { name: "SolarLayout Rooftop" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Find your roof/ })).toBeVisible();
  await expect(page).toHaveTitle("SolarLayout Rooftop");

  // The demo's card is read from the API: its name on the page says the API was reached.
  await expect(page.getByTestId("demo-card")).toHaveAttribute("data-state", "here");
  await expect(page.getByTestId("demo-name")).toHaveText("Pune demo roof");

  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll, "no horizontal scroll").toBeLessThanOrEqual(width.client);

  expect(consoleErrors, "console errors").toEqual([]);
});
