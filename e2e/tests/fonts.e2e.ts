import { expect, test } from "../fixtures";

// The three families of the design, by the token that names each (docs/design/design-tokens.md).
const FAMILIES = [
  { token: "--font-display", name: "Bricolage Grotesque", weight: 600 },
  { token: "--font-sans", name: "Geist", weight: 400 },
  { token: "--font-sans", name: "Geist", weight: 500 },
  { token: "--font-sans", name: "Geist", weight: 600 },
  { token: "--font-mono", name: "Geist Mono", weight: 400 },
  { token: "--font-mono", name: "Geist Mono", weight: 500 },
];

for (const { token, name, weight } of FAMILIES) {
  test(`${name} ${weight} comes from this machine`, async ({ page }) => {
    const fontFiles: string[] = [];
    page.on("response", (response) => {
      if (response.request().resourceType() === "font" && response.ok()) fontFiles.push(response.url());
    });

    await page.goto("/");

    const loaded = await page.evaluate(
      async ({ token, weight }) => {
        const families = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
        if (families === "") return { families, faces: [] };
        const faces = await document.fonts.load(`${weight} 16px ${families}`, "Roof 617.8");
        return { families, faces: faces.map((face) => `${face.family} ${face.status}`) };
      },
      { token, weight },
    );

    expect(loaded.families, `${token} names a family`).not.toBe("");
    expect(loaded.faces.length, `a face of ${loaded.families} was loaded`).toBeGreaterThan(0);
    for (const face of loaded.faces) expect(face).toMatch(/ loaded$/);

    expect(fontFiles.length, "a font file was fetched").toBeGreaterThan(0);
    for (const file of fontFiles) expect(new URL(file).origin).toBe(new URL(page.url()).origin);
  });
}

test("the page is set in Geist, its title in Bricolage Grotesque", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);

  const used = await page.evaluate(() => {
    const first = (element: Element) => getComputedStyle(element).fontFamily.split(",")[0].trim().replaceAll('"', "");
    const heading = document.querySelector("h1");
    if (!heading) throw new Error("The page has no h1.");
    const root = getComputedStyle(document.documentElement);
    const token = (name: string) => root.getPropertyValue(name).split(",")[0].trim().replaceAll('"', "");
    return {
      body: first(document.body),
      heading: first(heading),
      sans: token("--font-sans"),
      display: token("--font-display"),
    };
  });

  expect(used.sans).not.toBe("");
  expect(used.display).not.toBe("");
  expect(used.body).toBe(used.sans);
  expect(used.heading).toBe(used.display);
});
