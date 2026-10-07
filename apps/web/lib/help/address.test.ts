import { describe, expect, test } from "bun:test";
import { helpOfAddress, withHelp } from "./address";

// The topic shown is in the address as ?help=<key> (D80): a link to it can be shared and opens it; nothing else of the
// address is touched.

describe("the help in the address", () => {
  test("read from the query", () => {
    expect(helpOfAddress("?help=studio.section.system-voltage")).toBe("studio.section.system-voltage");
    expect(helpOfAddress("?lens=strings")).toBeNull();
    expect(helpOfAddress("")).toBeNull();
  });

  test("written beside what is there, and taken away", () => {
    expect(withHelp("https://x.app/studio/strings?edit=roof#a", "studio.section.inverter")).toBe("https://x.app/studio/strings?edit=roof&help=studio.section.inverter#a");
    expect(withHelp("https://x.app/studio/strings?edit=roof&help=studio.section.inverter", null)).toBe("https://x.app/studio/strings?edit=roof");
    expect(withHelp("https://x.app/find?help=a.section.b", "a.section.c")).toBe("https://x.app/find?help=a.section.c");
  });
});
