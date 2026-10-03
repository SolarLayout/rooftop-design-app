import { describe, expect, test } from "bun:test";
import { notOpenedWordsOf, openWhatBelongs } from "./opening";

// What a workspace without a design opens (plan/phase-10-plan.md, step 4, decision 2): the design remembered as open,
// from the device, else the demo; a kept design that cannot be read opens the demo and says so with the device's words.

const COULD_NOT_READ = "The design on this device could not be read: the browser gave no reason.";

function ways(parts: { remembered: string | null; onTheDevice?: string[]; refuse?: boolean }) {
  const opened: string[] = [];
  const said: string[] = [];
  return {
    opened,
    said,
    ways: {
      remembered: parts.remembered,
      async openFromDevice(id: string) {
        if (parts.refuse) throw new Error(COULD_NOT_READ);
        const found = (parts.onTheDevice ?? []).includes(id);
        if (found) opened.push(`kept ${id}`);
        return found;
      },
      openDemo: () => void opened.push("demo"),
      say: (words: string) => void said.push(words),
    },
  };
}

describe("what a workspace without a design opens", () => {
  test("nothing remembered: the demo", async () => {
    const { ways: w, opened, said } = ways({ remembered: null });

    expect(await openWhatBelongs(w)).toBe("demo");
    expect(opened).toEqual(["demo"]);
    expect(said).toEqual([]);
  });

  test("a design remembered and on the device: that design, not the demo", async () => {
    const { ways: w, opened, said } = ways({ remembered: "a1", onTheDevice: ["a1"] });

    expect(await openWhatBelongs(w)).toBe("kept");
    expect(opened).toEqual(["kept a1"]);
    expect(said).toEqual([]);
  });

  test("a design remembered that the device no longer has: the demo, and nothing said (it was removed on purpose)", async () => {
    const { ways: w, opened, said } = ways({ remembered: "gone", onTheDevice: ["a1"] });

    expect(await openWhatBelongs(w)).toBe("demo");
    expect(opened).toEqual(["demo"]);
    expect(said).toEqual([]);
  });

  test("a design remembered that cannot be read: the demo, and the device's words said with what was done instead", async () => {
    const { ways: w, opened, said } = ways({ remembered: "a1", refuse: true });

    expect(await openWhatBelongs(w)).toBe("demo");
    expect(opened).toEqual(["demo"]);
    expect(said).toEqual([`${COULD_NOT_READ} The demo is open instead.`]);
  });
});

describe("the words of a design not opened", () => {
  test("the device's words, then what was done instead", () => {
    expect(notOpenedWordsOf(new Error(COULD_NOT_READ))).toBe(`${COULD_NOT_READ} The demo is open instead.`);
  });

  test("a fault that is no Error is said as it is", () => {
    expect(notOpenedWordsOf("odd")).toBe("The design kept on this device could not be opened: odd. The demo is open instead.");
  });
});
