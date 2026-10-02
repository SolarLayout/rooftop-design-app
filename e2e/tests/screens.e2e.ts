import type { Page, Route } from "@playwright/test";
import path from "node:path";
import { expect, test } from "../fixtures";
import { expectScreen } from "../screens";
import { A_MAP, findOpened, roofMap, scaleLabel, searchField } from "../find";
import { boxFrameOf, handlesSettled, inThePlan, metresFrom, sceneSettled, zoomedInAt, cameraSettled } from "../stage";

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

// The shell, with the demo from the API of the test stack. A picture is taken once the result is there.
test.describe("the shell", () => {
  const RUN = 90_000;
  test.describe.configure({ timeout: RUN + 30_000 });

  const isPhone = (projectName: string) => projectName === "phone";
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
      // Scrolling to the switch moved what holds it, sideways too, also where the overflow is hidden: all back.
      await page.evaluate(() =>
        document.querySelectorAll("*").forEach((node) => {
          if (node.scrollLeft !== 0) node.scrollLeft = 0;
          if (node.scrollTop !== 0 && node.closest("[data-sheet]")) node.scrollTop = 0;
        }),
      );
    } else await page.getByRole("switch", { name: "Calculated shadow outlines" }).blur();

    await cameraSettled(page);
    await expectScreen(page, "studio-sun-outlines");
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
    await expect(page.getByTestId("stage-callout")).toContainText("Stair room · selected", { timeout: RUN });
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
    await expect(page.getByTestId("stage-callout")).toContainText("Stair room · selected", { timeout: RUN });
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

  test("studio, before a system voltage", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    await page.goto("/studio/strings");
    await expect(vitals(page).getByText("442.40")).toBeVisible({ timeout: RUN });

    await sceneSettled(page);
    await expectScreen(page, "studio-before-a-voltage");
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

  // On phone the top bar says the notes once the run is over: the picture is taken after that, not before.
  const settled = async (page: Page, projectName: string) => {
    await expect(design(page)).toBeVisible({ timeout: RUN });
    if (isPhone(projectName)) await expect(page.getByRole("banner").getByRole("button", { name: "1 note to review" })).toBeVisible({ timeout: RUN });
  };

  // Import a drawing with a DXF held: its units and its place asked, as the board draws them.
  test("import a drawing, a DXF held", async ({ page }) => {
    test.setTimeout(RUN + 30_000);
    await page.goto("/studio/roof");
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

  test("performance", async ({ page }, testInfo) => {
    await page.goto("/performance");
    await settled(page, testInfo.project.name);

    await expectScreen(page, "performance");
  });

  test("handover", async ({ page }, testInfo) => {
    await page.goto("/handover/report");
    await settled(page, testInfo.project.name);

    await expectScreen(page, "handover");
  });
});
