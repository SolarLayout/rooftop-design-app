import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { binFile, E2E_DIR, REPO_ROOT } from "./paths.ts";

describe("binFile", () => {
  test("finds a tool in node_modules/.bin of the directory or of a parent, as Node would", () => {
    expect(binFile("turbo", REPO_ROOT)).toBe(join(REPO_ROOT, "node_modules", ".bin", "turbo"));
    expect(binFile("playwright", E2E_DIR)).toMatch(/node_modules\/\.bin\/playwright$/);
  });

  test("the nearest wins; null when the tool is installed nowhere above", () => {
    const root = mkdtempSync(join(tmpdir(), "rooftop-paths-"));
    try {
      const nearest = join(root, "pkg", "node_modules", ".bin");
      mkdirSync(nearest, { recursive: true });
      writeFileSync(join(nearest, "tool"), "");
      expect(binFile("tool", join(root, "pkg", "deep"))).toBe(join(nearest, "tool"));
      expect(binFile("no-such-tool-anywhere", root)).toBeNull();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
