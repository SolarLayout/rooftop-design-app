import { describe, expect, test } from "bun:test";
import { fileStemOf } from "./file-name";

// The seven cases of apps/api/tests/api/test_export.py::test_the_file_is_named_after_the_project, so that the name the row
// shows before the download is the one the API writes (plan/phase-09-plan.md, decision 9).
describe("the beginning of a file's name, as the API makes it of the project's name", () => {
  test.each([
    ["Pune demo", "Pune-demo"],
    ["  Warehouse 7 / Block B  ", "Warehouse-7-Block-B"],
    ["roof_v2.final", "roof_v2.final"],
    ["../../etc/passwd", "etc-passwd"],
    ['say "hello"', "say-hello"],
    ["...", "rooftop-design"],
    ["", "rooftop-design"],
  ])("'%s' gives %s", (name, stem) => {
    expect(fileStemOf(name)).toBe(stem);
  });

  test("the comma stays, as the API keeps it (the board \"Handover, states\")", () => {
    expect(fileStemOf("Pune demo roof, block B")).toBe("Pune-demo-roof,-block-B");
  });

  test("a long name is cut to 80, and does not end in a dash or a dot", () => {
    expect(fileStemOf("a".repeat(100))).toBe("a".repeat(80));
    expect(fileStemOf(`${"a".repeat(79)} b`)).toBe("a".repeat(79));
    expect(fileStemOf(`${"a".repeat(79)}.b`)).toBe("a".repeat(79));
  });

  test("the characters a file system refuses and the control characters split the name", () => {
    expect(fileStemOf("a\\b:c*d?e<f>g|h\u0000i\u001fj\u007fk")).toBe("a-b-c-d-e-f-g-h-i-j-k");
  });
});
