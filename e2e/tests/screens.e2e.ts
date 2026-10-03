import type { Page, Route } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { TWO_DESIGNS, withDesignsOnTheDevice } from "../device";
import { expect, test } from "../fixtures";
import { expectScreen, expectWholeScreen } from "../screens";
import { A_MAP, findOpened, roofMap, scaleLabel, searchField } from "../find";
import { boxFrameOf, handlesSettled, inThePlan, metresFrom, obstacleSelectedOnStage, sceneSettled, zoomedInAt, cameraSettled } from "../stage";

// Each screen against its baseline in e2e/baselines. After a change that is meant, look at the new
// picture beside the preview in docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test screens --update-snapshots   (in e2e/)

test("home", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("api-status")).toHaveAttribute("data-state", "reachable");

  await expectScreen(page, "home");
});

// Find and outline, with the imagery from the fixture tile.
test("find", async ({ page }) => {
  await findOpened(page);

  await expectScreen(page, "find");
});

// The roof of the demo outlined by corners, as the boards "Find and outline" draw it.
test("find, the roof outlined", async ({ page }) => {
  await findOpened(page);
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  const box = (await roofMap(page).boundingBox())!;
  const pxPerM = 1 / 0.28313;
  for (const [east, north] of [
    [-45, -20],
    [45, -20],
    [45, 20],
    [-45, 20],
  ]) {
    await page.mouse.click(Math.round(box.x + box.width / 2 + east * pxPerM), Math.round(box.y + box.height / 2 - north * pxPerM));
  }
  await page.getByTestId("corner").first().click();
  await expect(page.getByRole("textbox", { name: "South" })).toBeVisible();
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false");

  await expectScreen(page, "find-outline");
});

// The roof closed, a box and a tank on it, the tank selected: the toolbar holds the obstacles and the
// panel lists them, as the board "Obstacles on the map and their heights" draws it.
test("find, the obstacles drawn", async ({ page }) => {
  await findOpened(page);
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false", { timeout: A_MAP });
  const box = (await roofMap(page).boundingBox())!;
  const pxPerM = 1 / 0.28313;
  const at = (east: number, north: number) => ({ x: Math.round(box.x + box.width / 2 + east * pxPerM), y: Math.round(box.y + box.height / 2 - north * pxPerM) });
  for (const [east, north] of [
    [-45, -20],
    [45, -20],
    [45, 20],
    [-45, 20],
  ]) {
    await page.mouse.click(at(east, north).x, at(east, north).y);
  }
  await page.getByTestId("corner").first().click();
  await expect(page.getByRole("textbox", { name: "South" })).toBeVisible();
  const dragged = async (from: [number, number], to: [number, number]) => {
    await page.mouse.move(at(...from).x, at(...from).y);
    await page.mouse.down();
    await page.mouse.move(at(...to).x, at(...to).y, { steps: 6 });
    await page.mouse.up();
  };
  const dialog = page.getByRole("dialog");
  await dragged([-31, 4], [-26, 8]);
  await dialog.getByRole("textbox", { name: "Height" }).fill("3");
  await dialog.getByRole("textbox", { name: "Height" }).press("Enter");
  await expect(dialog).toBeHidden();
  await page.getByRole("toolbar", { name: "Outline tools" }).getByRole("button", { name: "Tank", exact: true }).click();
  await dragged([17, 4], [18.25, 4]);
  // The last one by the mouse: the focus goes back to the map without the ring a key would leave.
  await dialog.getByRole("textbox", { name: "Height" }).fill("2");
  await dialog.getByRole("textbox", { name: "Height" }).press("Tab");
  await dialog.getByRole("button", { name: "Add the tank" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByTestId("obstacle-row")).toHaveCount(2);
  await expect(roofMap(page)).toHaveAttribute("aria-busy", "false");

  await expectScreen(page, "find-obstacles");
});

// The roof entered by hand without a map (no WebGL): the plan on the stage, the fields in the panel, as
// the board "Enter dimensions by hand" draws it.
test("find, the roof by hand", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return (getContext as (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) => unknown).call(this, kind, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/find");
  await page.getByRole("status").getByRole("button", { name: "Enter dimensions by hand instead" }).click();
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(page.getByRole("textbox", { name: "Latitude" })).toHaveValue("18.52000");
  for (const [name, value] of [
    ["Length", "90"],
    ["Width", "40"],
    ["Long side faces", "180"],
  ] as const) {
    await page.getByRole("textbox", { name }).fill(value);
    await page.getByRole("textbox", { name }).press("Enter");
  }
  await expect(page.getByTestId("plan-view").getByTestId("plan-label")).toHaveCount(4);
  // The last field commits by the mouse: no focus ring in the picture.
  await page.getByRole("heading", { level: 1, name: "Enter the roof by hand" }).click();

  await expectScreen(page, "find-by-hand");
});

/**
 * On phone, scrolling to a control in the sheet moves what holds it, sideways too, also where the overflow is
 * hidden: every scroll is put back before a picture, the sheet's to its top.
 */
async function scrollsBack(page: Page): Promise<void> {
  await page.evaluate(() =>
    document.querySelectorAll("*").forEach((node) => {
      if (node.scrollLeft !== 0) node.scrollLeft = 0;
      if (node.scrollTop !== 0 && node.closest("[data-sheet]")) node.scrollTop = 0;
    }),
  );
}

// The shell, with the demo from the API of the test stack. A picture is taken once the result is there.
test.describe("the shell", () => {
  const RUN = 90_000;
  test.describe.configure({ timeout: RUN + 30_000 });

  const isPhone = (projectName: string) => projectName === "phone";
  const isDesktop = (projectName: string) => projectName === "desktop";
  const design = (page: Page) => page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ });
  const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });

  test("studio", async ({ page }) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

    await sceneSettled(page);
    await expectScreen(page, "studio");
  });

  /**
   * An edit of the Array lens, one more module in tilt, with the layout and the design run that follow it
   * held back by the test, so that the stage stands in the state of the edit. On phone the inspector is
   * reached through the sheet, which is brought back to half, as the board draws it.
   */
  const edited = async (page: Page, projectName: string, layout: (route: Route) => Promise<void>) => {
    await page.route("**/api/layout", layout);
    const designRuns: Route[] = [];
    await page.route("**/api/design", (route) => {
      designRuns.push(route);
    });
    const grip = page.getByRole("separator", { name: "Inspector" });
    if (isPhone(projectName)) {
      await grip.focus();
      await page.keyboard.press("End");
      await expect(grip).toHaveAttribute("aria-valuetext", "Open");
    }
    const more = page.getByRole("button", { name: "More" });
    await more.scrollIntoViewIfNeeded();
    await more.click();
    await more.blur();
    if (isPhone(projectName)) {
      await grip.focus();
      await page.keyboard.press("ArrowDown");
      await expect(grip).toHaveAttribute("aria-valuetext", "Half open");
      await grip.blur();
    }
    // On tablet the inspector scrolled under the stage to reach the field: the stage comes back into view.
    await page.getByTestId("stage").scrollIntoViewIfNeeded();
    // The run waits for the pause after an edit, then is held: the vitals stand still at "Updating energy".
    await expect.poll(() => designRuns.length, { timeout: RUN }).toBe(1);
  };

  // The layout on its way: the line under the title dimmed with its ring, the modules of before (the
  // board "Studio, Array lens, states").
  test("studio, the layout on its way", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await sceneSettled(page);

    await edited(page, testInfo.project.name, async () => {});
    await expect(page.getByTestId("stage-subline")).toHaveAttribute("data-state", "updating");

    await expectScreen(page, "studio-array-updating");
  });

  // The layout that failed: the chip over the stage with the words of the API, the last good modules.
  test("studio, the layout failed", async ({ page }, testInfo) => {
    const CROSSES = { error: { code: "engine_error", message: "The roof outline crosses itself. Give the corners in order around the roof.", field: null } };
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await sceneSettled(page);

    await edited(page, testInfo.project.name, (route) => route.fulfill({ status: 422, json: CROSSES }));
    await expect(page.getByTestId("layout-failed")).toContainText("The layout was not updated");

    await expectScreen(page, "studio-array-failed");
  });

  // The Sun lens at 16:00 on 21 December, the end of the shade-free window, as the boards "Studio, Sun lens"
  // draw it; the time set by the keys of the slider, a quarter hour each. On phone the sheet at half, with
  // the timeline at its top.
  test("studio, the Sun lens", async ({ page }) => {
    await page.goto("/studio/sun");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await sceneSettled(page);
    const slider = page.getByTestId("sun-timeline").filter({ visible: true }).getByRole("slider", { name: "Time of day" });
    await slider.focus();
    for (let step = 0; step < 22; step += 1) await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("on-the-roof-sun")).toHaveText("21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south");
    await slider.blur();

    await cameraSettled(page);
    await expectScreen(page, "studio-sun");
  });

  // The engine's shadow outlines switched on at 16:00 on 21 December, as the board "Sun path and shadow
  // outlines" draws them; on phone switched in the sheet, the sheet back at half.
  test("studio, the Sun lens, the shadow outlines", async ({ page }, testInfo) => {
    await page.goto("/studio/sun");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await sceneSettled(page);
    const slider = page.getByTestId("sun-timeline").filter({ visible: true }).getByRole("slider", { name: "Time of day" });
    await slider.focus();
    for (let step = 0; step < 22; step += 1) await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("on-the-roof-sun")).toHaveText("21 Dec, 16:00 solar time, sun 18.0° high, 56.6° W of south");
    const sheet = page.getByRole("separator", { name: "Inspector" });
    if (isPhone(testInfo.project.name)) {
      await sheet.focus();
      await page.keyboard.press("End");
    }
    await page.getByRole("switch", { name: "Calculated shadow outlines" }).click();
    await expect(page.getByTestId("on-the-roof-shadow-outlines")).toHaveText(/^The engine's shadow outlines at 16:00/, { timeout: RUN });
    if (isPhone(testInfo.project.name)) {
      // One stop down, from full to half, where the board has it; then the focus leaves the handle.
      await sheet.focus();
      await page.keyboard.press("ArrowDown");
      await expect(sheet).not.toHaveAttribute("aria-valuetext", "Open");
      await sheet.blur();
      await scrollsBack(page);
    } else await page.getByRole("switch", { name: "Calculated shadow outlines" }).blur();

    await cameraSettled(page);
    await expectScreen(page, "studio-sun-outlines");
  });

  // The Shade map tab of the Sun lens, as the board "Shade map" draws it: the modules by their near shading over
  // the year, the legend on the stage, the steps in the inspector; on phone the sheet at half.
  test("studio, the Sun lens, the shade map", async ({ page }, testInfo) => {
    await page.goto("/studio/sun");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await sceneSettled(page);
    const sheet = page.getByRole("separator", { name: "Inspector" });
    if (isPhone(testInfo.project.name)) {
      await sheet.focus();
      await page.keyboard.press("End");
    }
    await page.getByRole("radiogroup", { name: "Sun lens" }).getByRole("radio", { name: "Shade map" }).click();
    await expect(page.getByTestId("on-the-roof-shade-map")).toContainText("776", { timeout: RUN });
    if (isPhone(testInfo.project.name)) {
      await sheet.focus();
      await page.keyboard.press("ArrowDown");
      await expect(sheet).not.toHaveAttribute("aria-valuetext", "Open");
      await sheet.blur();
      await scrollsBack(page);
    } else await page.getByRole("radiogroup", { name: "Sun lens" }).getByRole("radio", { name: "Shade map" }).blur();

    await cameraSettled(page);
    await expectScreen(page, "studio-sun-shade-map");
  });

  // A sun that could not be fetched, as the board "Time on the stage" draws it: the chip of the stage with the
  // API's sentence and Try again.
  test("studio, the Sun lens, the sun not fetched", async ({ page }) => {
    await page.route("**/api/sun", (route) => route.abort("connectionrefused"));
    await page.goto("/studio/sun");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("sun-failed")).toContainText("The sun was not updated", { timeout: RUN });
    await expect(page.getByTestId("on-the-roof-modules")).toContainText("modules", { timeout: RUN });
    await expect(page.getByTestId("on-the-roof-ground")).toContainText("The ground is", { timeout: RUN });

    await cameraSettled(page);
    await expectScreen(page, "studio-sun-failed");
  });

  test("studio, the Roof lens", async ({ page }) => {
    await page.goto("/studio/roof");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("roof-count")).toHaveText("4 corners · 6 obstacles");

    await sceneSettled(page);
    await expectScreen(page, "studio-roof");
  });

  // The stair room selected from the list, as the board "Obstacle edited on the roof" draws it; on phone the
  // sheet at its full stop, scrolled to the card.
  test("studio, the Roof lens, an obstacle selected", async ({ page }, testInfo) => {
    await page.goto("/studio/roof");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    if (isPhone(testInfo.project.name)) {
      await page.getByRole("separator", { name: "Inspector" }).press("End");
      await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Open");
    }
    await page.getByTestId("obstacle-row").filter({ hasText: "Stair room" }).click();
    await expect(page.getByTestId("obstacle-card")).toBeVisible();
    await obstacleSelectedOnStage(page, "Stair room", isPhone(testInfo.project.name));
    // On phone the list heads the sheet, as the board draws it; where the sheet scrolls to is otherwise a matter of timing.
    if (isPhone(testInfo.project.name)) await page.getByRole("heading", { name: "Obstacles · 6" }).evaluate((heading) => heading.scrollIntoView({ block: "start" }));

    await sceneSettled(page);
    await expectScreen(page, "studio-roof-obstacle");
  });

  // The stair room mid-drag, as the board "Obstacle edited on the roof" draws it: in the plan, zoomed in about
  // it, the pointer held down with the stair room moved 5 m east, its old place a dashed ghost, the live place
  // beside the pointer, the handles away. The picture is taken before the pointer is let go. On phone the sheet
  // stays at its half stop, so that the stage is in the picture.
  test("studio, an obstacle dragged", async ({ page }, testInfo) => {
    // The design's run, the plan, the pinches and the drag: more than a test's half minute under load.
    test.setTimeout(RUN + 30_000);
    await page.goto("/studio/roof");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByTestId("obstacle-row").filter({ hasText: "Stair room" }).click();
    await obstacleSelectedOnStage(page, "Stair room", isPhone(testInfo.project.name));
    await sceneSettled(page);
    const point = await inThePlan(page);
    // On touch the plan is pinched in about the stair room, which is too small to take hold of at the fit zoom; the
    // pinches land the same every time, where the wheel of a mouse does not (the browser merges its notches), so on
    // desktop the box is dragged at the fit zoom, where it is large enough.
    if (testInfo.project.use.hasTouch) await zoomedInAt(page, point(22.5, 18), 5, true);
    await cameraSettled(page);
    await handlesSettled(page);
    if (isPhone(testInfo.project.name)) {
      // On phone the picture is the selected box with its touch handles, as the board draws it: the live label of a
      // drag lands a pixel apart from one run to the next there, and the plan board shows the drag already.
      await expectScreen(page, "studio-obstacle-handles");
      return;
    }
    const frame = await boxFrameOf(page, 5, 4);
    const to = metresFrom(frame, 5, 0);

    await page.mouse.move(frame.x, frame.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 6 });
    await expect(page.getByTestId("stage-live")).toHaveText("East 27.5 m · North 18.0 m", { timeout: RUN });
    await expect(page.getByTestId("stage-handle")).toHaveCount(0);

    await expectScreen(page, "studio-obstacle-dragged");
    await page.mouse.up();
  });

  // The Roof lens after a KML without every height is imported, as the board "Import with missing heights"
  // draws it. The imported roof has no weather of its own and the tests never touch the network: the design
  // run is answered as failed here, so that the picture is the same on every machine.
  test("studio, the Roof lens after an import with heights to review", async ({ page }, testInfo) => {
    await page.route("**/api/design", (route) =>
      route.fulfill({ status: 503, json: { error: { code: "unavailable", message: "The weather could not be fetched.", field: null } } }),
    );
    await page.goto("/studio/roof");
    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
    await design(page).click();
    await page.getByRole("menu", { name: "Project" }).getByRole("menuitem", { name: "Import a drawing" }).click();
    const dialog = page.getByRole("dialog", { name: "Import a drawing" });
    await dialog.locator("input[type=file]").setInputFiles(path.resolve(__dirname, "../fixtures/roof-two-obstacles.kml"));
    await dialog.getByRole("button", { name: "Open the roof" }).click();
    await expect(page.getByTestId("roof-how")).toHaveText("From a file", { timeout: RUN });
    await expect(page.getByTestId("review-note")).toContainText("1 to review");
    await expect(vitals(page).getByText("Energy was not computed")).toBeVisible({ timeout: RUN });
    if (isPhone(testInfo.project.name)) await page.getByRole("separator", { name: "Inspector" }).press("End");

    await sceneSettled(page);
    await expectScreen(page, "studio-import-heights");
  });

  // The Strings lens at the demo's 1500 V, option A chosen (the board "Studio, Strings lens"): the inspector, and the
  // strings on the roof coloured by MPPT with the legend and INV-1.
  test("studio, the Strings lens", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("series-verdict").filter({ visible: true })).toBeVisible();
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings");
  });

  // The colour switch, on phone in the sheet, which is let down again after so that the stage is in the picture.
  async function colourTheStringsBy(page: Page, projectName: string, name: "String" | "MPPT" | "Inverter") {
    const separator = page.getByRole("separator", { name: "Inspector" });
    if (isPhone(projectName)) await separator.press("End");
    const choice = page.getByRole("radiogroup", { name: "Colour the strings by" }).filter({ visible: true }).getByRole("radio", { name });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-checked", "true");
    await choice.blur();
    if (isPhone(projectName)) await separator.press("Home");
  }

  // Option A coloured by string (the board "Strings on the roof"): the six colours in turn, the legend on its own line.
  test("studio, the Strings lens by string", async ({ page }, testInfo) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("on-the-roof-strings")).toContainText("coloured by MPPT", { timeout: RUN });
    await colourTheStringsBy(page, testInfo.project.name, "String");
    await expect(page.getByTestId("on-the-roof-strings")).toContainText("coloured by string");
    await page.mouse.move(0, 0);
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-by-string");
  });

  // Option D coloured by inverter, its two inverters on the roof with their chips (the board "Strings on the roof").
  test("studio, the Strings lens by inverter, option D", async ({ page }, testInfo) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    if (isPhone(testInfo.project.name)) await page.getByRole("separator", { name: "Inspector" }).press("End");
    const d = page.getByTestId("option-card").filter({ visible: true }).filter({ has: page.getByText("D", { exact: true }) });
    await d.click();
    await expect(d).toHaveAttribute("aria-checked", "true");
    await d.blur();
    await colourTheStringsBy(page, testInfo.project.name, "Inverter");
    await expect(page.getByTestId("inverter-chip")).toHaveCount(2, { timeout: RUN });
    await page.mouse.move(0, 0);
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-by-inverter");
  });

  // String 12 of option A selected, white with its line and its callout (the board "Strings on the roof"), pressed in
  // the plan at the middle of its modules as the run places them, then seen in 3D.
  test("studio, the Strings lens, a string selected", async ({ page }, testInfo) => {
    const answered = page.waitForResponse((response) => response.url().endsWith("/api/design"), { timeout: RUN });
    await page.goto("/studio/strings");
    const events = (await (await answered).text()).split("\n").filter((line) => line.startsWith("data:"));
    type Answer = { layout: { modules: { idx: number; outline: [number, number][] }[] }; chosen_option: string; options: { key: string; system: { strings: { label: string; modules: number[] }[] } }[] };
    const answer = events.map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer }).find((event) => event.type === "result")!.result!;
    const s12 = answer.options.find((option) => option.key === answer.chosen_option)!.system.strings.find((string) => string.label === "S12")!;
    const position = answer.layout.modules.find((one) => one.idx === s12.modules[Math.floor(s12.modules.length / 2)])!;
    await sceneSettled(page);
    if (isPhone(testInfo.project.name)) await page.getByRole("separator", { name: "Inspector" }).press("Home");
    const point = await inThePlan(page);
    const [x, y] = position.outline.reduce(([sx, sy], [px, py]) => [sx + px / 4, sy + py / 4], [0, 0]);
    const at = point(x, y);
    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(at.x, at.y);
    else await page.mouse.click(at.x, at.y);
    await expect(page.getByTestId("stage-callout")).toContainText("String 12", { timeout: RUN });
    await page.getByRole("radio", { name: "3D view" }).filter({ visible: true }).click();
    await page.getByRole("radio", { name: "3D view" }).filter({ visible: true }).blur();
    await page.mouse.move(0, 0);
    await cameraSettled(page);
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-selected");
  });

  // Your own 26 × 24 × 1 added and chosen (the board "Options and your own").
  test("studio, the Strings lens, your own", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByRole("button", { name: "Add your own" }).filter({ visible: true }).click();
    const fields = page.getByTestId("custom-fields").filter({ visible: true });
    for (const [name, value] of [["Series", "26"], ["Strings", "24"]] as const) {
      await fields.getByRole("textbox", { name }).fill(value);
      await fields.getByRole("textbox", { name }).press("Tab");
    }
    await fields.getByRole("button", { name: "Add" }).click();
    await expect(page.getByTestId("option-card").filter({ visible: true })).toHaveCount(6, { timeout: RUN });
    await expect(vitals(page).getByText("607.7")).toBeVisible({ timeout: RUN });
    await page.getByRole("button", { name: "Change" }).filter({ visible: true }).blur();
    await page.mouse.move(0, 0);
    // The focus on the way scrolled what holds the inspector, also where the overflow is hidden: all back but the sheet.
    await page.evaluate(() =>
      document.querySelectorAll("*").forEach((node) => {
        if (node.closest("[data-sheet]")) return;
        if (node.scrollTop !== 0) node.scrollTop = 0;
        if (node.scrollLeft !== 0) node.scrollLeft = 0;
      }),
    );
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-your-own");
  });

  // At 600 V no string length fits (the board "Options and your own").
  test("studio, the Strings lens, no string length fits", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "600 V" }).click();
    await expect(page.getByTestId("nothing-fits").filter({ visible: true })).toBeVisible({ timeout: RUN });
    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "600 V" }).blur();
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-nothing-fits");
  });

  // The MPPT loading of option A under the options (the board "Inverter and sizing").
  test("studio, the Strings lens, the MPPT loading", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const table = page.getByTestId("mppt-table").filter({ visible: true });
    await expect(table).toContainText("of option A");
    await table.scrollIntoViewIfNeeded();
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-mppt");
  });

  // The demo's OND without IMaxDC: every limit not known, the API's note under the table (the board "Inverter and sizing").
  test("studio, the Strings lens, the current limit not known", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByTestId("inverter-card").filter({ visible: true }).getByRole("button", { name: "Replace" }).click();
    const dialog = page.getByRole("dialog", { name: "Replace the inverter" });
    await dialog.locator("input[type=file]").setInputFiles(path.resolve(__dirname, "../fixtures/wattpower-without-imaxdc.OND"));
    await expect(dialog).toBeHidden();
    const note = page.getByTestId("mppt-note").filter({ visible: true });
    await expect(note).toBeVisible({ timeout: RUN });
    await note.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-limit-not-known");
  });

  // A PAN given as the inverter, refused in the engine's words (the board "Inverter and sizing").
  test("studio, the Strings lens, an inverter file refused", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByTestId("inverter-card").filter({ visible: true }).getByRole("button", { name: "Replace" }).click();
    const dialog = page.getByRole("dialog", { name: "Replace the inverter" });
    await dialog.locator("input[type=file]").setInputFiles(path.resolve(__dirname, "../fixtures/test-module.PAN"));
    await expect(dialog.getByRole("status")).toContainText("This file was not loaded", { timeout: RUN });
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-inverter-refused");
  });

  // Inverter limits and cabling opened, every value the file's and the document's (the board "Inverter and sizing").
  test("studio, the Strings lens, the inverter limits opened", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const limits = page.getByRole("region", { name: "Inverter limits and cabling" }).filter({ visible: true });
    await limits.getByRole("button", { name: /Inverter limits and cabling/ }).click();
    await expect(limits.getByTestId("current-note")).toBeVisible();
    await limits.scrollIntoViewIfNeeded();
    await limits.getByRole("button", { name: /Inverter limits and cabling/ }).blur();
    await page.mouse.move(0, 0);
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-inverter-limits");
  });

  // A run on its way after a change of voltage: what it will replace stands dimmed with a ring (plan/phase-07-plan.md, step 21).
  test("studio, the Strings lens, a run on its way", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.route("**/api/design", () => {
      // Held: the run stays on its way for the picture.
    });
    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).click();
    await expect(page.getByTestId("series-range").filter({ visible: true })).toHaveAttribute("data-state", "updating", { timeout: RUN });
    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).blur();
    await sceneSettled(page);
    await expectWholeScreen(page, "studio-strings-updating");
  });

  test("studio, before a system voltage", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("442.40")).toBeVisible({ timeout: RUN });
    await expect(page.getByText("Shading for every module").filter({ visible: true })).toBeVisible();

    await sceneSettled(page);
    await expectWholeScreen(page, "studio-before-a-voltage");
  });

  test("studio, the notes to review", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    const opener = isPhone(testInfo.project.name) ? page.getByRole("banner") : vitals(page);

    await opener.getByRole("button", { name: "1 note to review" }).click();
    await expect(page.getByRole("dialog", { name: "Notes to review" })).toBeVisible();

    await sceneSettled(page);
    await expectScreen(page, "studio-notes");
  });

  test("studio, the project switcher", async ({ page }) => {
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

    await design(page).click();
    await expect(page.getByRole("menu", { name: "Project" })).toBeVisible();

    await sceneSettled(page);
    await expectScreen(page, "studio-project-switcher");
  });

  // A design kept on this device, open: the state of saving in the top bar, the dot (the board "Home, designs on this device",
  // the states of saving). Tablet and phone say it in the switcher, pictured below.
  test("shell, saved on this device", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "On tablet and phone the state of saving is in the project switcher.");
    await withDesignsOnTheDevice(page, TWO_DESIGNS, TWO_DESIGNS[0]!.id);
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByRole("banner").getByTestId("save-state").and(page.locator('[data-look="bar"]'))).toHaveText("Saved on this device");

    await sceneSettled(page);
    await expectScreen(page, "shell-saved-on-this-device");
  });

  // The switcher over two designs kept on this device: the open one with the tick and its capacity, the other by its roof.
  test("studio, the project switcher, designs on this device", async ({ page }) => {
    await withDesignsOnTheDevice(page, TWO_DESIGNS, TWO_DESIGNS[0]!.id);
    await page.goto("/studio/array");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });

    await design(page).click();
    await expect(page.getByRole("menu", { name: "On this device" }).getByRole("menuitem")).toHaveCount(2);
    await expect(page.getByTestId("this-design")).toContainText("Saved on this device");

    await sceneSettled(page);
    await expectScreen(page, "studio-project-switcher-designs");
  });

  // On phone the top bar says the notes once the run is over: the picture is taken after that, not before.
  const settled = async (page: Page, projectName: string) => {
    await expect(design(page)).toBeVisible({ timeout: RUN });
    if (isPhone(projectName)) await expect(page.getByRole("banner").getByRole("button", { name: "1 note to review" })).toBeVisible({ timeout: RUN });
  };

  // Import a drawing with a DXF held: its units and its place asked, as the board draws them.
  test("import a drawing, a DXF held", async ({ page }) => {
    test.setTimeout(RUN + 30_000);
    await page.goto("/studio/roof");
    // The picture holds the vitals behind the dialog: the run is waited for, as the baseline has it.
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await sceneSettled(page);
    await page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ }).click();
    await page.getByRole("menu", { name: "Project" }).getByRole("menuitem", { name: "Import a drawing" }).click();
    const dialog = page.getByRole("dialog", { name: "Import a drawing" });
    await dialog.locator("input[type=file]").setInputFiles(path.resolve(__dirname, "../fixtures/roof-with-tank.dxf"));
    await expect(dialog.getByTestId("import-place")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Open the roof" })).toHaveAttribute("aria-disabled", "true");
    // The focus leaves the dialog's field, so that no ring is in the picture; on phone the sheet's heading may be scrolled away.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectScreen(page, "import-dxf");
  });

  // Performance with the demo (the board "Performance" on three sizes): the header, the KPIs and the summary of option A.
  test("performance", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "performance");
  });

  // Soiling 3 % landed (the board "Loss chain, edited"): the chain of the new run, the field holding 3.0.
  test("performance, the chain with soiling 3 % landed", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    const ran = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().losses.soiling_pct === 3, { timeout: RUN });
    const soiling = page.getByTestId("loss-chain").getByRole("textbox", { name: "Soiling" });
    await soiling.fill("3");
    await soiling.press("Enter");
    const events = (await (await (await ran).response())!.text()).split("\n").filter((line) => line.startsWith("data:"));
    const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { options: { energy: { energy_mwh: number } }[] } };
    await expect(page.getByTestId("kpi-energy").getByText(`${result.options[0]!.energy.energy_mwh.toFixed(1)} MWh`)).toBeVisible({ timeout: RUN });
    // No focus ring and no readout in the picture.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.mouse.move(0, 0);

    await expectWholeScreen(page, "performance-chain-edited");
  });

  // The Table tab of the months (the board "Charts, tooltip and table"): twelve rows and the year, beside the 25 years.
  test("performance, the months as a table", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    const chart = page.getByTestId("monthly-chart");
    await chart.getByRole("tab", { name: "Table" }).click();
    await expect(chart.getByRole("tabpanel", { name: "Table" })).toBeVisible();
    // No focus ring in the picture.
    await chart.getByRole("tab", { name: "Table" }).blur();

    await expectWholeScreen(page, "performance-month-table");
  });

  // Degradation 0.70 %/yr entered and landed (the same board): year 1 unchanged, the other years and the total of that run,
  // the field with the focus still inside it.
  test("performance, the degradation entered", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    const field = page.getByTestId("years-chart").getByRole("textbox", { name: "Degradation" });
    const next = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });
    await field.fill("0.70");
    await field.press("Enter");
    await next;
    await expect(page.getByTestId("years-chart").getByTestId("year-value").last()).toHaveText("522.0", { timeout: RUN });
    await expect(page.getByTestId("run-step")).toHaveCount(0);

    await expectWholeScreen(page, "performance-years-degraded");
  });

  // Before a system voltage (the board "Performance, states"): the API's words in place of the KPIs, no energy.
  test("performance, before a system voltage", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto("/performance");
    await expect(page.getByTestId("energy-waits")).toContainText("Choose a system voltage to size the strings", { timeout: RUN });

    await expectWholeScreen(page, "performance-no-voltage");
  });

  /**
   * A system voltage of 1000 V chosen in the Strings lens with the run that follows answered by `design`, then
   * Performance reached through the workspaces, so that the design that is open stays open.
   */
  const aVoltageChangedThenPerformance = async (page: Page, design: (route: Route) => void) => {
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("option-card").filter({ visible: true }).first()).toBeVisible({ timeout: RUN });
    await page.route("**/api/design", design);
    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).click();
    await page.getByRole("navigation", { name: "Workspaces" }).filter({ visible: true }).getByRole("link", { name: "Performance" }).click();
    await expect(page).toHaveURL(/\/performance$/);
    // No focus ring in the picture.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  };

  // A run on its way (the same board): the values of before dimmed, the ring beside the energy, the step under the title.
  test("performance, a run on its way", async ({ page }) => {
    await aVoltageChangedThenPerformance(page, () => {
      // Held: the run stays on its way for the picture.
    });
    await expect(page.getByTestId("run-step")).toContainText("Updating energy", { timeout: RUN });

    await expectWholeScreen(page, "performance-updating");
  });

  // A run that failed (the same board): the values of before, not dimmed, the note with Try again and the API's words.
  test("performance, the run failed", async ({ page }) => {
    const NO_WEATHER = { error: { code: "weather_not_loaded", message: "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first.", field: "weather_json" } };
    await aVoltageChangedThenPerformance(page, (route) => route.fulfill({ status: 422, json: NO_WEATHER }));
    await expect(page.getByTestId("run-failed")).toContainText("Energy was not updated", { timeout: RUN });

    await expectWholeScreen(page, "performance-failed");
  });

  // NASA POWER 2023 landed (the board "Weather and assumptions"): the line says no horizon, the KPIs are of the run on it.
  test("performance, NASA POWER landed", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    const ran = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().weather_source === "nasa", { timeout: RUN });
    await page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ }).click();
    await page.getByRole("listbox", { name: "Weather" }).getByRole("option", { name: /^NASA POWER 2023/ }).click();
    const events = (await (await (await ran).response())!.text()).split("\n").filter((line) => line.startsWith("data:"));
    const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { options: { energy: { energy_mwh: number } }[] } };
    await expect(page.getByTestId("kpi-energy").getByText(`${result.options[0]!.energy.energy_mwh.toFixed(1)} MWh`)).toBeVisible({ timeout: RUN * 2 });
    await expect(page.getByTestId("run-step")).toHaveCount(0);
    // No focus ring in the picture.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectWholeScreen(page, "performance-weather-nasa");
  });

  // The CSV dialog with a file of GHI alone read (the same board): the file's card with the API's summary and its three notes.
  test("performance, the CSV dialog with a file read", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    const fixture = JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/weather-pvgis-pune.json"), "utf8")) as { weather: { time: string[]; ghi: number[] } };
    const csv = ["time,ghi", ...fixture.weather.time.map((time, hour) => `${time},${fixture.weather.ghi[hour]}`)].join("\n");
    await page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ }).click();
    await page.getByRole("listbox", { name: "Weather" }).getByRole("option", { name: /^CSV file/ }).click();
    const dialog = page.getByRole("dialog", { name: "Load weather from a CSV" });
    await dialog.locator("input[type=file]").setInputFiles({ name: "pune-ghi.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await expect(dialog.getByTestId("csv-note")).toHaveCount(3, { timeout: RUN });
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectScreen(page, "performance-csv-dialog");
  });

  // A download that failed (the same board): the API's words under the select, PVGIS TMY still the source.
  test("performance, a weather that was not loaded", async ({ page }, testInfo) => {
    const OVER_THE_SEA = {
      error: {
        code: "no_weather_for_site",
        message: "PVGIS TMY has no weather for 10.0000, 65.0000: Location over the sea. Please, select another location. Check the site, or choose another weather source.",
        field: null,
      },
    };
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    await page.route("**/api/weather", (route) => route.fulfill({ status: 422, json: OVER_THE_SEA }));
    await page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ }).click();
    await page.getByRole("listbox", { name: "Weather" }).getByRole("option", { name: /^NASA POWER 2023/ }).click();
    await expect(page.getByTestId("weather-failed")).toContainText("The weather was not loaded");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectWholeScreen(page, "performance-weather-failed");
  });

  // Uc 25 and the levels 50, 90, 99 landed (the same board): the lead tile with P50 · P90 · P99, the field holding 25 with "Use the roof type's".
  test("performance, the assumptions entered", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    const assumptions = page.getByTestId("assumptions");
    const withUc = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().losses.uc === 25, { timeout: RUN });
    const uc = assumptions.getByRole("textbox", { name: "Thermal Uc" });
    await uc.fill("25");
    await uc.press("Enter");
    await withUc;
    const withLevels = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().losses.p_levels.join() === "50,90,99", { timeout: RUN });
    const level = assumptions.getByRole("textbox", { name: "Exceedance level 2" });
    await level.fill("99");
    await level.press("Enter");
    const events = (await (await (await withLevels).response())!.text()).split("\n").filter((line) => line.startsWith("data:"));
    const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { options: { energy: { energy_mwh: number } }[] } };
    await expect(page.getByTestId("kpi-energy").getByText(`${result.options[0]!.energy.energy_mwh.toFixed(1)} MWh`)).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("p-value").last()).toContainText("P99");
    await expect(page.getByTestId("run-step")).toHaveCount(0);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectWholeScreen(page, "performance-assumptions-entered");
  });

  // Handover with the demo (the boards "Handover" on three sizes): the list with its facts, the first item beside it on desktop and tablet.
  const factsLanded = async (page: Page) => {
    await expect(page.getByTestId("deliverables").getByTestId("deliverable-facts").nth(1)).toContainText("strings of", { timeout: RUN });
  };
  // The report's page 1 prints the day of the report, which is the browser's (plan/phase-09-plan.md, decision 2): the page's
  // clock is fixed before the page is opened, so that the picture does not move with the calendar.
  const DAY_OF_THE_REPORT = new Date("2026-10-03T09:00:00");
  const dayFixed = (page: Page) => page.clock.install({ time: DAY_OF_THE_REPORT });
  // The paper with its page and every thumbnail drawn: the images are decoded before the picture is taken.
  const reportLanded = async (page: Page) => {
    await expect(page.getByTestId("page-image")).toBeVisible({ timeout: RUN });
    await expect
      .poll(() => page.getByTestId("preview").locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)), { timeout: RUN })
      .toBe(true);
  };

  test("handover", async ({ page }, testInfo) => {
    await dayFixed(page);
    await page.goto("/handover");
    await factsLanded(page);
    if (!isPhone(testInfo.project.name)) await reportLanded(page);
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover");
  });

  // The report pushed over the list on phone (the board "Handover, tablet and phone"): the back row, the head, the paper, previous and next, the row of thumbnails.
  test("handover, the report pushed", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The pushed screen is of the phone.");
    await dayFixed(page);
    await page.goto("/handover/report");
    await reportLanded(page);
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-report-pushed");
  });

  // Page 2 of the report after Next (the board "Handover"): the words of the head, the second thumbnail current.
  test("handover, the report at page 2", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The pages turned are pictured on desktop.");
    await dayFixed(page);
    await page.goto("/handover");
    await factsLanded(page);
    await reportLanded(page);
    await settled(page, testInfo.project.name);
    await page.getByRole("button", { name: "Next page" }).filter({ visible: true }).click();
    await expect(page.getByTestId("page-words").filter({ visible: true })).toContainText("Page 2 of");
    await reportLanded(page);
    await page.mouse.move(0, 0);

    await expectWholeScreen(page, "handover-report-page-2");
  });

  // The pages on their way (the board "Handover, states", "The first load"): the paper as a block of the page's shape and six thumbnail skeletons; the route is held.
  test("handover, the report loading", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The skeletons of the paper are pictured on desktop.");
    await page.route("**/api/export/report-pages**", () => {
      // Held: the pages stay on their way for the picture.
    });
    await dayFixed(page);
    await page.goto("/handover");
    await factsLanded(page);
    await expect(page.getByTestId("report-skeleton")).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-report-loading");
  });

  // Before a system voltage (the board "Handover, states"): every row but the project file dim with the API's title, the decision card in the preview.
  test("handover, before a voltage", async ({ page }, testInfo) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto(isPhone(testInfo.project.name) ? "/handover/report" : "/handover");
    await expect(page.getByTestId("files-wait")).toContainText("Choose a system voltage to size the strings", { timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-no-voltage");
  });

  // The project file's item once the run has landed: its size is there, and what is in it says the weather and the option.
  const projectFileLanded = async (page: Page) => {
    await expect(page.getByTestId("project-file").getByTestId("file-size")).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("in-the-file").filter({ hasText: "Weather" })).toContainText("hours", { timeout: RUN });
  };

  // The project file (the board "Handover, previews", last part): the name as a field, the file's name and size, what is in it.
  test("handover, the project file", async ({ page }, testInfo) => {
    await page.goto("/handover/project-file");
    await projectFileLanded(page);
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-project-file");
  });

  // The name edited (the board "Handover, states"): the field with the focus and the draft, the file's name following it before the commit.
  test("handover, the name edited", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "tablet", "The board draws the edited name on desktop and phone.");
    await page.goto("/handover/project-file");
    await projectFileLanded(page);
    await settled(page, testInfo.project.name);
    const field = page.getByTestId("project-file").getByRole("textbox", { name: "Name" });
    await field.fill("Pune demo roof, block B");
    await expect(page.getByTestId("file-name")).toHaveText("Pune-demo-roof,-block-B.rtd");

    await expectWholeScreen(page, "handover-name-edited");
  });

  // The single-line diagram (the board "Handover, previews", first part): the SVG in the Dusk palette at the panel's width;
  // on phone and tablet the AC side runs down from the inverter.
  const drawing = (page: Page) => page.getByTestId("sld-drawing");
  const blockOf = (page: Page, mppt: number) => drawing(page).locator(`[data-testid="mppt-block"][data-mppt="${mppt}"]`);

  test("handover, the single-line diagram", async ({ page }, testInfo) => {
    await page.goto("/handover/single-line-diagram");
    await expect(blockOf(page, 1)).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-sld");
  });

  // The block of MPPT 2 under the pointer: lifted, its tooltip at its right (the board draws this state on desktop).
  test("handover, the single-line diagram, a block under the pointer", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name) || testInfo.project.name === "tablet", "The board draws the block under the pointer on desktop.");
    await page.goto("/handover/single-line-diagram");
    await expect(blockOf(page, 1)).toBeVisible({ timeout: RUN });
    await settled(page, testInfo.project.name);
    await blockOf(page, 2).hover();
    await expect(page.getByTestId("value-tooltip").filter({ visible: true })).toBeVisible();

    await expectScreen(page, "handover-sld-hover");
  });

  // The bill of materials (the board "Handover, previews", second part): the Table, "In the report, page 5" and Copy as table in the head; cards on phone.
  test("handover, the bill of materials", async ({ page }, testInfo) => {
    await page.goto("/handover/bill-of-materials");
    await expect(page.getByTestId("bom")).toContainText("PV module", { timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-bom");
  });

  // The DC cable schedule (the board "Handover, previews", third part), in the engine's order, the total row last.
  const scheduleLanded = async (page: Page) => {
    await page.goto("/handover/cable-schedule");
    await expect(page.getByTestId("cable-schedule")).toContainText("22 strings", { timeout: RUN });
  };

  test("handover, the cable schedule", async ({ page }, testInfo) => {
    await scheduleLanded(page);
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-schedule");
  });

  // Sorted by DC cable m downwards, as the board draws it: the active head in text with its arrow, the longest string first.
  test("handover, the cable schedule sorted", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The board draws the sorted schedule on desktop.");
    await scheduleLanded(page);
    await settled(page, testInfo.project.name);
    const head = page.getByTestId("cable-schedule").getByRole("columnheader", { name: "DC cable (m)" });
    await head.getByRole("button").click();
    await head.getByRole("button").click();
    await expect(head).toHaveAttribute("aria-sort", "descending");
    // The press was by the mouse: no focus ring in the picture.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectWholeScreen(page, "handover-schedule-sorted");
  });

  // Copy as table pressed (the board "Handover, states"): the toast of something done at the bottom of the screen.
  test("handover, a table copied", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "The board draws the toast of the copy on desktop.");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/handover/bill-of-materials");
    await expect(page.getByTestId("bom")).toContainText("PV module", { timeout: RUN });
    await settled(page, testInfo.project.name);
    await page.getByTestId("preview-action").getByRole("button", { name: "Copy as table" }).filter({ visible: true }).click();
    await expect(page.getByTestId("toast")).toContainText("Bill of materials copied as a table");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    await expectScreen(page, "handover-table-copied");
  });

  // The CAD layout (the board "Handover, previews"): the engine's plan in its paper frame, the layers beside it on desktop and under it below that.
  test("handover, the CAD layout", async ({ page }, testInfo) => {
    await dayFixed(page);
    await page.goto("/handover/cad-layout");
    await expect(page.getByTestId("layer")).toHaveCount(8, { timeout: RUN });
    await expect(page.getByTestId("plan-image")).toBeVisible({ timeout: RUN });
    await expect.poll(() => page.getByTestId("plan-image").evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0), { timeout: RUN }).toBe(true);
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-cad-layout");
  });

  // The Google Earth model (the same board): what is in the file and what is not, two columns on desktop.
  test("handover, the Google Earth model", async ({ page }, testInfo) => {
    await page.goto("/handover/earth-model");
    await expect(page.getByTestId("kml-inside")).toHaveCount(8, { timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-earth-model");
  });

  // The hourly data (the same board): the header and the first eight rows in their card, the columns under it.
  test("handover, the hourly data", async ({ page }, testInfo) => {
    await page.goto("/handover/hourly-data");
    await expect(page.getByTestId("csv-row")).toHaveCount(8, { timeout: RUN });
    await settled(page, testInfo.project.name);

    await expectWholeScreen(page, "handover-hourly-data");
  });

  // Download all on its way (the board "Handover, states", "A download on its way"): the ring in the button, dim without its shadow; the route is held.
  test("handover, Download all on its way", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The board draws Download all on its way on desktop.");
    await page.route("**/api/export/zip**", () => {
      // Held: the zip stays on its way for the picture.
    });
    await dayFixed(page);
    await page.goto("/handover");
    await factsLanded(page);
    await reportLanded(page);
    await settled(page, testInfo.project.name);
    await page.getByRole("button", { name: "Download all" }).click();
    await expect(page.getByRole("button", { name: "Download all" })).toHaveAttribute("aria-disabled", "true");
    await page.mouse.move(0, 0);

    await expectWholeScreen(page, "handover-download-all");
  });
});
