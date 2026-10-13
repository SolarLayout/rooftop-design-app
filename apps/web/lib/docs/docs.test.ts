import { describe, expect, test } from "bun:test";
import { anchorOf, DOCS_PAGES, docsHomeOf, docsLinkOf, inTheDocsOf, problemsOfPlace } from "./docs";

describe("the docs' address follows the app's (issue 193, D91)", () => {
  test("production's app opens production's docs, staging's staging's", () => {
    expect(docsHomeOf("rooftop.solarlayout.app")).toBe("https://solarlayout.app/docs/rooftop");
    expect(docsHomeOf("rooftop.staging.solarlayout.app")).toBe("https://staging.solarlayout.app/docs/rooftop");
  });

  test("anywhere else, on this machine or a preview, opens production's", () => {
    expect(docsHomeOf("localhost:4710")).toBe("https://solarlayout.app/docs/rooftop");
    expect(docsHomeOf("rooftop-web-git-feature.vercel.app")).toBe("https://solarlayout.app/docs/rooftop");
    expect(docsHomeOf("")).toBe("https://solarlayout.app/docs/rooftop");
  });
});

describe("a section of a docs page", () => {
  test("is linked by its heading's anchor, as the docs make it", () => {
    expect(anchorOf("Shading over the year")).toBe("shading-over-the-year");
    expect(anchorOf("P50, P75 and P90")).toBe("p50-p75-and-p90");
    expect(anchorOf("The Studio: roof, array and module")).toBe("the-studio-roof-array-and-module");
    expect(anchorOf("Shade-free window")).toBe("shade-free-window");
  });

  test("the link is the page at its section", () => {
    expect(docsLinkOf("https://solarlayout.app/docs/rooftop", { page: "sun", section: "Shade over the year" })).toBe(
      "https://solarlayout.app/docs/rooftop/sun#shade-over-the-year",
    );
  });

  test("a place is a page the docs have and one of its sections; otherwise it says what is wrong", () => {
    expect(DOCS_PAGES.sun?.title).toBe("The Sun view");
    expect(problemsOfPlace({ page: "sun", section: "On the roof" })).toEqual([]);
    expect(problemsOfPlace({ page: "moon", section: "On the roof" })).toEqual(['"moon" is no page of the docs']);
    expect(problemsOfPlace({ page: "sun", section: "Moonlight" })).toEqual(['"Moonlight" is no section of The Sun view']);
  });
});

describe("In the docs, the help sheet's last row (the board \"UI fixes · The docs from the app\")", () => {
  test("the page's title, the section under it, and the link to the section", () => {
    expect(inTheDocsOf({ page: "sun", section: "Shade over the year" }, "https://staging.solarlayout.app/docs/rooftop")).toEqual({
      title: "The Sun view",
      section: "Shade over the year",
      href: "https://staging.solarlayout.app/docs/rooftop/sun#shade-over-the-year",
    });
  });

  test("none for a topic that names no place, or a page the docs do not have", () => {
    expect(inTheDocsOf(undefined, "https://solarlayout.app/docs/rooftop")).toBeNull();
    expect(inTheDocsOf({ page: "moon", section: "Craters" }, "https://solarlayout.app/docs/rooftop")).toBeNull();
  });
});
