import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { BRAND, MARK } from "./brand";

// The installed app's name, colours and mark (issue 147). The colours are those of the tokens: the browser paints the
// splash, the status bar and the icon before the stylesheet is read, so they are written here once more and held equal.

const WEB = path.resolve(import.meta.dir, "../..");
const css = readFileSync(path.join(WEB, "app/globals.css"), "utf8");
const svg = readFileSync(path.join(WEB, "app/icon.svg"), "utf8");

const tokenOf = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(css)?.[1];

describe("the brand of the installed app", () => {
  test("its ground and its mark are the colours of the ground and of the text", () => {
    expect(tokenOf("--color-ground")).toBe(BRAND.ground);
    expect(tokenOf("--color-text")).toBe(BRAND.mark);
  });

  test("its name, and the short one under the icon on a Home Screen", () => {
    expect(BRAND.name).toBe("SolarLayout Rooftop");
    expect(BRAND.shortName).toBe("Rooftop");
  });

  test("the icon of the tab is drawn from the same mark", () => {
    expect(svg).toContain(`viewBox="0 0 ${MARK.box} ${MARK.box}"`);
    expect(svg).toContain(`rx="${MARK.corner}" fill="${BRAND.ground}"`);
    expect(svg).toContain(`d="${MARK.path}" fill="none" stroke="${BRAND.mark}" stroke-width="${MARK.stroke}"`);
  });
});
