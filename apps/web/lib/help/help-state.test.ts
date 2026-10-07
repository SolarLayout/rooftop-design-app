import { describe, expect, test } from "bun:test";
import { CLOSED, helpAfter, type HelpState } from "./help-state";

// The help open on the screen (D80): the topic shown, the topics behind it for Back, and the value of the section it was
// opened from, so that the sheet marks the user's own option.

const after = (state: HelpState, ...events: Parameters<typeof helpAfter>[1][]) => events.reduce(helpAfter, state);

describe("the help shown", () => {
  test("a disc opens its topic, with the section's value; nothing behind it", () => {
    expect(after(CLOSED, { type: "opened", key: "studio.section.system-voltage", value: "1500" })).toEqual({
      key: "studio.section.system-voltage",
      behind: [],
      from: { key: "studio.section.system-voltage", value: "1500" },
    });
  });

  test("a link followed goes on, Back returns, as many steps as were taken", () => {
    const state = after(CLOSED, { type: "opened", key: "a.section.one" }, { type: "followed", key: "a.section.two" }, { type: "followed", key: "a.section.three" });
    expect(state.key).toBe("a.section.three");
    expect(state.behind).toEqual(["a.section.one", "a.section.two"]);
    expect(after(state, { type: "back" }, { type: "back" }).key).toBe("a.section.one");
    expect(after(state, { type: "back" }, { type: "back" }, { type: "back" }).key).toBe("a.section.one");
  });

  test("a link to the topic shown is no step", () => {
    const state = after(CLOSED, { type: "opened", key: "a.section.one" });
    expect(helpAfter(state, { type: "followed", key: "a.section.one" })).toBe(state);
  });

  test("a disc pressed starts afresh; closed is nothing", () => {
    const state = after(CLOSED, { type: "opened", key: "a.section.one" }, { type: "followed", key: "a.section.two" }, { type: "opened", key: "a.section.three" });
    expect(state.behind).toEqual([]);
    expect(helpAfter(state, { type: "closed" })).toEqual(CLOSED);
  });

  test("the value is the section's only while its own topic is shown", () => {
    const opened = after(CLOSED, { type: "opened", key: "a.section.one", value: "x" });
    expect(after(opened, { type: "followed", key: "a.section.two" }).from).toEqual({ key: "a.section.one", value: "x" });
  });
});
