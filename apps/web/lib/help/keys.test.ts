import { describe, expect, test } from "bun:test";
import { isHelpKey, keyFromPath, placeOf } from "./keys";

// A topic's key is its path under content/help (D80, after solarlayout's packages/help): place.kind.name, lowercase.

describe("the key of a topic", () => {
  test("is its path, dots for slashes, without the ending", () => {
    expect(keyFromPath("studio/section/system-voltage.mdx")).toBe("studio.section.system-voltage");
    expect(keyFromPath("find/section/edges.mdx")).toBe("find.section.edges");
  });

  test("a place and a kind of the app, a name of lowercase letters, digits and dashes", () => {
    expect(isHelpKey("studio.section.system-voltage")).toBe(true);
    expect(isHelpKey("app.concept.solar-time")).toBe(true);
    expect(isHelpKey("studio.section.System-voltage")).toBe(false);
    expect(isHelpKey("moon.section.edges")).toBe(false);
    expect(isHelpKey("studio.param.edges")).toBe(false);
    expect(isHelpKey("studio.section")).toBe(false);
    expect(isHelpKey("studio.section.a_b")).toBe(false);
  });

  test("a file that is not a topic, or a path that makes no key, is refused with what it is", () => {
    expect(() => keyFromPath("studio/section/edges.md")).toThrow("studio/section/edges.md is not a .mdx topic");
    expect(() => keyFromPath("studio/edges.mdx")).toThrow('"studio.edges" (studio/edges.mdx) is no key: place.kind.name');
  });

  test("the place of a key", () => {
    expect(placeOf("find.section.edges")).toBe("find");
  });
});
