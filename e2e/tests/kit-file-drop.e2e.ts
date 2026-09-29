import type { Locator, Page } from "@playwright/test";
import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// FileDrop as docs/design/components.md ("File drop") and the board "Controls, part 2" have it.

const WELL = "rgb(9, 12, 16)";
const NOTE_LINE = "rgb(58, 50, 32)";

const last = (page: Page) => page.getByTestId("kit-last-pressed");
const field = (page: Page, name: string) => example(page, name).getByTestId("file-drop");

/** Holds a file over the field, or lets it go there, as a drag from the device does. */
async function drag(target: Locator, what: "dragenter" | "dragleave" | "drop", kind: "file" | "text" = "file") {
  await target.evaluate(
    (element, { what, kind }) => {
      const carried = new DataTransfer();
      if (kind === "file") carried.items.add(new File(["PVObject_=pvModule"], "insolation-ina-144mhc-tf-560.PAN"));
      else carried.setData("text/plain", "not a file");
      element.dispatchEvent(new DragEvent(what, { bubbles: true, cancelable: true, dataTransfer: carried }));
    },
    { what, kind },
  );
}

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
});

test.describe("FileDrop, the look", () => {
  test("rest: a dashed line, an icon, a title, one line, and a button", async ({ page }, testInfo) => {
    const drop = field(page, "file-drop");

    await expect(drop).toHaveCSS("border-top-style", "dashed");
    await expect(drop).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(drop).toHaveCSS("background-color", COLOUR.transparent);
    await expect(drop).toHaveCSS("border-radius", "12px");
    await expect(drop).toHaveCSS("padding-left", "18px");
    await expect(drop.getByTestId("file-drop-icon").locator("..")).toHaveCSS("column-gap", "14px");
    expect((await drop.boundingBox())!.height).toBeGreaterThanOrEqual(88);

    await expect(drop.getByText("Drop the module file here")).toHaveCSS("font-weight", "500");
    await expect(drop.getByText("A PAN file of PVsyst")).toHaveCSS("font-size", "12px");
    await expect(drop.getByText("A PAN file of PVsyst")).toHaveCSS("color", COLOUR.text2);
    await expect(drop.getByTestId("file-drop-icon")).toHaveCSS("color", COLOUR.text2);
    expect(await drop.getByTestId("file-drop-icon").boundingBox()).toMatchObject({ width: 20, height: 20 });
    expect((await drop.getByRole("button", { name: "Choose a file" }).boundingBox())!.height).toBe(isDesktop(testInfo.project.name) ? 36 : 44);
  });

  test("on phone the button stands under the words, as wide as the field; from tablet on at their right", async ({ page }, testInfo) => {
    const drop = field(page, "file-drop");
    const [words, button, all] = await Promise.all(
      [drop.getByText("Drop the module file here"), drop.getByRole("button", { name: "Choose a file" }), drop].map(async (one) => (await one.boundingBox())!),
    );

    if (testInfo.project.name === "phone") {
      expect(button.y).toBeGreaterThan(words.y + words.height);
      expect(Math.round(button.width)).toBe(Math.round(all.width) - 38);
    } else {
      expect(button.x).toBeGreaterThan(words.x + words.width);
      expect(Math.abs(button.y + button.height / 2 - (all.y + all.height / 2))).toBeLessThanOrEqual(1);
    }
  });

  test("a file is held over it: the surface of a note, a dashed line in accent, a halo", async ({ page }) => {
    const drop = field(page, "file-drop-over");

    await expect(drop).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(drop).toHaveCSS("border-top-style", "dashed");
    await expect(drop).toHaveCSS("border-top-color", COLOUR.accent);
    await expect(drop).toHaveCSS("box-shadow", /rgba\(255, 176, 32, 0\.14\) 0px 0px 0px 3px/);
    await expect(drop.getByTestId("file-drop-icon")).toHaveCSS("color", COLOUR.accent);
    await expect(drop.getByText("Let go to load the file")).toBeVisible();
    await expect(drop.getByText("It replaces the module of before")).toBeVisible();
    await expect(drop.getByRole("button")).toHaveCount(0);
  });

  test("reading: recessed, a ring, the name of the file in mono", async ({ page }) => {
    const drop = field(page, "file-drop-reading");

    await expect(drop).toHaveCSS("background-color", WELL);
    await expect(drop).toHaveCSS("border-top-style", "solid");
    await expect(drop).toHaveCSS("border-top-color", COLOUR.line);
    await expect(drop).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.65\) 0px 1px 3px 0px inset/);
    await expect(drop.getByText("Reading the file")).toHaveCSS("font-weight", "500");
    await expect(drop.getByText("insolation-ina-144mhc-tf-560.PAN")).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(drop.getByText("insolation-ina-144mhc-tf-560.PAN")).toHaveCSS("font-size", "12px");
    await expect(drop.getByRole("button")).toHaveCount(0);
    await expect(drop.getByRole("status")).toHaveText("Reading the fileinsolation-ina-144mhc-tf-560.PAN");
  });

  test("refused: a note with the reason, and a button to choose another", async ({ page }) => {
    const drop = field(page, "file-drop-refused");

    await expect(drop).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(drop).toHaveCSS("border-top-style", "solid");
    await expect(drop).toHaveCSS("border-top-color", NOTE_LINE);
    await expect(drop.getByRole("img", { name: "Note" })).toHaveCSS("color", COLOUR.accent);
    await expect(drop.getByRole("status")).toHaveText(
      "This file was not loadeddatasheet.PAN: not a PVsyst module file (PNom, Voc or Isc missing)",
    );
    await expect(drop.getByRole("button", { name: "Choose another" })).toBeVisible();
  });

  test("there is no red, in any state", async ({ page }) => {
    for (const name of ["file-drop", "file-drop-over", "file-drop-reading", "file-drop-refused"]) {
      const colours = await field(page, name).evaluate((element) =>
        [element, ...Array.from(element.querySelectorAll("*"))].flatMap((one) => {
          const style = getComputedStyle(one);
          return [style.color, style.backgroundColor, style.borderTopColor];
        }),
      );
      const red = colours.filter((colour) => {
        const [r = 0, g = 0, b = 0] = (colour.match(/\d+(\.\d+)?/g) ?? []).map(Number);
        return r > 180 && g < 110 && b < 110;
      });
      expect(red, name).toEqual([]);
    }
  });
});

test.describe("FileDrop", () => {
  test("the button opens the file chooser, and the file goes to who uses the field", async ({ page }) => {
    const drop = field(page, "file-drop");
    await drop.scrollIntoViewIfNeeded();

    const chooser = page.waitForEvent("filechooser");
    await drop.getByRole("button", { name: "Choose a file" }).click();
    await (await chooser).setFiles({ name: "datasheet.PAN", mimeType: "text/plain", buffer: Buffer.from("PVObject_=pvModule") });

    await expect(last(page)).toHaveText("Last pressed: File, datasheet.PAN, 18 bytes, file 1");
  });

  test("the file chooser offers the files that are asked for", async ({ page }) => {
    const chooser = page.waitForEvent("filechooser");
    await field(page, "file-drop").getByRole("button", { name: "Choose a file" }).click();

    expect(await (await chooser).element().getAttribute("accept")).toBe(".pan");
    expect((await chooser).isMultiple()).toBe(false);
  });

  test("the same file can be chosen again", async ({ page }) => {
    const drop = field(page, "file-drop");
    const file = { name: "datasheet.PAN", mimeType: "text/plain", buffer: Buffer.from("PVObject_=pvModule") };

    for (const time of [1, 2]) {
      const chooser = page.waitForEvent("filechooser");
      await drop.getByRole("button", { name: "Choose a file" }).click();
      await (await chooser).setFiles(file);
      await expect(last(page)).toHaveText(`Last pressed: File, datasheet.PAN, 18 bytes, file ${time}`);
    }
  });

  test("it works by keyboard", async ({ page }) => {
    const button = field(page, "file-drop").getByRole("button", { name: "Choose a file" });

    await button.focus();
    const chooser = page.waitForEvent("filechooser");
    await page.keyboard.press("Enter");

    expect(await chooser).toBeTruthy();
  });

  test("a file held over it shows where to let go; taken away again, the field is as before", async ({ page }) => {
    const drop = field(page, "file-drop");

    await drag(drop, "dragenter");
    await expect(drop.getByText("Let go to load the file")).toBeVisible();
    await expect(drop).toHaveCSS("border-top-color", COLOUR.accent);

    await drag(drop, "dragleave");
    await expect(drop.getByText("Drop the module file here")).toBeVisible();
    await expect(drop).toHaveCSS("border-top-color", COLOUR.lineStrong);
  });

  test("a file that is let go over it goes to who uses the field", async ({ page }) => {
    const drop = field(page, "file-drop");

    await drag(drop, "dragenter");
    await drag(drop, "drop");

    await expect(last(page)).toHaveText("Last pressed: File, insolation-ina-144mhc-tf-560.PAN, 18 bytes, file 1");
    await expect(drop.getByText("Drop the module file here")).toBeVisible();
  });

  test("what is no file is not taken", async ({ page }) => {
    const drop = field(page, "file-drop");

    await drag(drop, "dragenter", "text");
    await expect(drop.getByText("Drop the module file here")).toBeVisible();
    await drag(drop, "drop", "text");

    await expect(last(page)).toHaveText("Last pressed: nothing yet");
  });

  test("while a file is read no other is taken", async ({ page }) => {
    const drop = field(page, "file-drop-reading");

    await drag(drop, "dragenter");
    await expect(drop.getByText("Reading the file")).toBeVisible();
    await drag(drop, "drop");

    await expect(last(page)).toHaveText("Last pressed: nothing yet");
  });
});
