import { describe, expect, test } from "bun:test";
import { resolvedKey, whereOf } from "./where";

// Over the sheet's title, what the topic is and where it was opened (D80): "Section · Strings step".

describe("where the help was opened", () => {
  test("the topic's kind, then the screen", () => {
    expect(whereOf("section", "/studio/strings")).toBe("Section · Strings step");
    expect(whereOf("section", "/studio/roof")).toBe("Section · Roof step");
    expect(whereOf("section", "/find")).toBe("Section · Find");
    expect(whereOf("metric", "/performance")).toBe("Metric · Performance");
    expect(whereOf("deliverable", "/handover/report")).toBe("Deliverable · Handover");
    expect(whereOf("concept", "/")).toBe("Concept · Home");
  });
});

describe("a key from the address", () => {
  const registry = { entries: { "studio.section.system-voltage": {} }, aliases: { "studio.section.voltage": "studio.section.system-voltage" } };

  test("a key, an alias, or nothing", () => {
    expect(resolvedKey("studio.section.system-voltage", registry)).toBe("studio.section.system-voltage");
    expect(resolvedKey("studio.section.voltage", registry)).toBe("studio.section.system-voltage");
    expect(resolvedKey("studio.section.nowhere", registry)).toBeNull();
    expect(resolvedKey("constructor", registry)).toBeNull();
  });
});
