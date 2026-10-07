import { describe, expect, test } from "bun:test";
import { markdownOf, problemsOfFolder, publishedPathOf, rawUrlOf, repoOf } from "./pr-shots";

// The screenshots of a pull request (docs/screenshots.md): kept on the orphan branch pr-shots, linked by the commit.

describe("the repository of the remote", () => {
  test("from an SSH or an HTTPS address, with or without .git", () => {
    expect(repoOf("git@github.com:SolarLayout/rooftop-design-app.git")).toBe("SolarLayout/rooftop-design-app");
    expect(repoOf("https://github.com/SolarLayout/rooftop-design-app")).toBe("SolarLayout/rooftop-design-app");
  });

  test("none from an address that is not GitHub's", () => {
    expect(repoOf("https://example.com/a/b.git")).toBeNull();
  });
});

describe("where a screenshot goes", () => {
  test("a folder is lower-case words joined by hyphens, one per pull request", () => {
    expect(problemsOfFolder("help-pictures")).toEqual([]);
    expect(problemsOfFolder("Help Pictures")).toEqual(['"Help Pictures": a folder is lower-case words and numbers joined by -, such as help-topics-roof']);
  });

  test("under its folder by its own name, and read back by the commit", () => {
    expect(publishedPathOf("help-pictures", ".playwright-mcp/help/1.jpg")).toBe("help-pictures/1.jpg");
    expect(rawUrlOf("SolarLayout/rooftop-design-app", "abc123", "help-pictures/1.jpg")).toBe("https://raw.githubusercontent.com/SolarLayout/rooftop-design-app/abc123/help-pictures/1.jpg");
  });

  test("the links ready for the pull request's description", () => {
    expect(markdownOf(["https://x/a/desktop-1.png"])).toBe("| desktop-1 | ![](https://x/a/desktop-1.png) |");
  });
});
