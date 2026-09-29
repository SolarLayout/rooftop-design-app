import { describe, expect, test } from "bun:test";
import { fileNameOf } from "./download";

describe("fileNameOf", () => {
  test.each([
    ['attachment; filename="Pune-demo-report.pdf"', "Pune-demo-report.pdf"],
    ["attachment; filename=Pune-demo.kmz", "Pune-demo.kmz"],
    ['attachment; filename="roof_v2.final-hourly.csv"', "roof_v2.final-hourly.csv"],
    [
      "attachment; filename=\"rooftop-design-hourly.csv\"; filename*=UTF-8''%E0%A4%AA%E0%A5%81%E0%A4%A3%E0%A5%87-%E0%A4%9B%E0%A4%A4-hourly.csv",
      "पुणे-छत-hourly.csv",
    ],
    ["ATTACHMENT; FILENAME=\"a.pdf\"", "a.pdf"],
  ])("%s", (header, name) => {
    expect(fileNameOf(header, "fallback.bin")).toBe(name);
  });

  test.each([
    ["no header", null],
    ["a header without a name", "attachment"],
    ["an empty name", 'attachment; filename=""'],
    ["a name that cannot be decoded, and no plain one", "attachment; filename*=UTF-8''%E0%A4"],
  ])("%s gives the name to fall back on", (_, header) => {
    expect(fileNameOf(header, "design.pdf")).toBe("design.pdf");
  });

  test("a name that cannot be decoded gives way to the plain one", () => {
    expect(fileNameOf("attachment; filename=\"plain.csv\"; filename*=UTF-8''%E0%A4", "x")).toBe("plain.csv");
  });

  test("a path in the name is cut to the name of the file", () => {
    expect(fileNameOf('attachment; filename="../../etc/passwd"', "x")).toBe("passwd");
    expect(fileNameOf('attachment; filename="C:\\\\Users\\\\a\\\\report.pdf"', "x")).toBe("report.pdf");
  });
});
