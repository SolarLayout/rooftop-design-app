import { describe, expect, test } from "bun:test";
import { carriesFiles, fileOf } from "./dropped-file";

const pan = new File(["PVObject_=pvModule"], "insolation-ina-144mhc-tf-560.PAN");
const ond = new File(["PVObject_=pvGInverter"], "wattpower-wp-330ktl-h1.OND");

describe("fileOf: the one file of a drop or of the file chooser", () => {
  test("the file that was given", () => {
    expect(fileOf([pan])).toBe(pan);
  });

  test("of several, the first: the field takes one file", () => {
    expect(fileOf([ond, pan])).toBe(ond);
  });

  test("nothing, where no file was given", () => {
    expect(fileOf([])).toBeNull();
    expect(fileOf(null)).toBeNull();
  });
});

describe("carriesFiles: what is held over the field", () => {
  test("files of the device", () => {
    expect(carriesFiles(["Files"])).toBe(true);
    expect(carriesFiles(["text/plain", "Files"])).toBe(true);
  });

  test("a piece of text or a link is no file", () => {
    expect(carriesFiles(["text/plain"])).toBe(false);
    expect(carriesFiles(["text/uri-list", "text/html"])).toBe(false);
    expect(carriesFiles([])).toBe(false);
  });
});
