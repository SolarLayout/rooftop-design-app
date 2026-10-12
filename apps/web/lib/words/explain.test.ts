import { describe, expect, test } from "bun:test";
import { EXPLAIN, lineOf, nextLineOf } from "./explain";

// The app's own words, each explained in one line where the user first meets it (D96; plan/v2/voice.md §12).

describe("the app's own words", () => {
  test("every word has one line, a sentence without its full stop, under 20 words", () => {
    for (const [word, line] of Object.entries(EXPLAIN)) {
      expect(line.split(" ").length, word).toBeLessThan(20);
      expect(line.endsWith("."), word).toBe(false);
      expect(/[;!]/.test(line), word).toBe(false);
    }
  });

  test("the words of the board, as approved", () => {
    expect(Object.keys(EXPLAIN)).toEqual(["Roof", "Array", "Strings", "Performance", "Handover", "Sun", "Options", "Your own option", "To review", "Project file", "Design day", "Present"]);
    expect(EXPLAIN.Strings).toBe("How the modules are wired to the inverter");
  });

  test("a line is said as a sentence; the line under a primary names the next step", () => {
    expect(lineOf("Handover")).toBe("The files for the client, the installer and the utility.");
    expect(nextLineOf("Strings")).toBe("Next: Strings, how the modules are wired to the inverter.");
  });
});
