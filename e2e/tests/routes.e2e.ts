import { expect, test } from "../fixtures";

// The routes of docs/design/information-architecture.md. What stands at each is a placeholder until its
// phase; what is tested here is that each answers, and that what is no lens and no item is not found.

const LENSES = [
  ["roof", "Roof"],
  ["array", "Array"],
  ["sun", "Sun"],
  ["strings", "Strings"],
] as const;

const ITEMS = [
  ["report", "Design report"],
  ["single-line-diagram", "Single-line diagram"],
  ["bill-of-materials", "Bill of materials"],
  ["cable-schedule", "DC cable schedule"],
  ["cad-layout", "CAD layout"],
  ["earth-model", "Google Earth model"],
  ["hourly-data", "Hourly data"],
  ["project-file", "Project file"],
] as const;

test("home answers", async ({ page }) => {
  expect((await page.goto("/"))?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: /Find your roof/ })).toBeVisible();
});

for (const [lens, name] of LENSES) {
  test(`/studio/${lens} answers, and says which lens it is`, async ({ page }) => {
    expect((await page.goto(`/studio/${lens}`))?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(`${name} · Studio · SolarLayout Rooftop`);
  });
}

test("/studio leads to the first lens", async ({ page }) => {
  await page.goto("/studio");

  await expect(page).toHaveURL(/\/studio\/roof$/);
  await expect(page.getByRole("heading", { level: 1, name: "Roof", exact: true })).toBeVisible();
});

test("/performance answers", async ({ page }) => {
  expect((await page.goto("/performance"))?.status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Performance" })).toBeVisible();
  await expect(page).toHaveTitle("Performance · SolarLayout Rooftop");
});

for (const [item, name] of ITEMS) {
  test(`/handover/${item} answers, and says which item it is`, async ({ page }, testInfo) => {
    expect((await page.goto(`/handover/${item}`))?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name: "Handover" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    await expect(page).toHaveTitle(`${name} · Handover · SolarLayout Rooftop`);
    // On phone the item is pushed over the list, and a row at the top leads back to it (plan/phase-09-plan.md, decision 3).
    const back = page.getByRole("link", { name: "Back to Handover" });
    if (testInfo.project.name === "phone") await expect(back).toHaveAttribute("href", "/handover");
    else await expect(page.getByRole("navigation", { name: "Deliverables" })).toBeVisible();
  });
}

test("/handover is the list; on desktop and tablet the first item stands beside it, on phone the list alone", async ({ page }, testInfo) => {
  expect((await page.goto("/handover"))?.status()).toBe(200);

  await expect(page).toHaveURL(/\/handover$/);
  await expect(page.getByRole("heading", { level: 1, name: "Handover" })).toBeVisible();
  await expect(page).toHaveTitle("Handover · SolarLayout Rooftop");
  const first = page.getByRole("heading", { level: 2, name: "Design report" });
  if (testInfo.project.name === "phone") await expect(first).toHaveCount(0);
  else await expect(first).toBeVisible();
});

for (const path of ["/studio/energy", "/studio/Roof", "/handover/pdf", "/handover/report/2", "/studio/roof/more", "/nowhere"]) {
  test(`${path} is not found`, async ({ page }) => {
    expect((await page.goto(path))?.status()).toBe(404);
  });
}
