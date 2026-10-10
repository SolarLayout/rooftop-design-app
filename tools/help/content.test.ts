import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { badDocsPlaces, brokenLinks, clashingAliases, driftedOptions, typedNumbers } from "./checks";
import { MANIFEST_PATH, manifestOf, readTopics } from "./generate";
import { OPTIONS_OF } from "./options";
import { badClips, badPictures } from "./pictures-in-topics";

// THE GATE of the in-app help (D80): the topics of apps/web/content/help as they are. A topic that leads nowhere, an
// option the code no longer offers, a number typed that will drift, or a manifest not written again fails here.

const topics = readTopics();
const optionsOf = (key: string) => OPTIONS_OF[key]?.();

describe("the topics of the help", () => {
  test("there are topics, each read with its frontmatter", () => {
    expect(topics.length).toBeGreaterThan(0);
  });

  test("every link and related topic leads to a topic", () => {
    expect(brokenLinks(topics)).toEqual([]);
  });

  test("every topic names its place in the docs, a page and a section they have (D91)", () => {
    expect(badDocsPlaces(topics)).toEqual([]);
  });

  test("aliases are keys of one topic each", () => {
    expect(clashingAliases(topics)).toEqual([]);
  });

  test("a one-choice section's options are the code's", () => {
    expect(driftedOptions(topics, optionsOf)).toEqual([]);
  });

  test("every picture is there, of the size written, with its words, its callouts three at most and in order", () => {
    expect(badPictures(topics, join(import.meta.dir, "../../apps/web/public"))).toEqual([]);
  });

  test("every clip is there, of the length written, within its budget and all of them within theirs (D82)", () => {
    expect(badClips(topics, join(import.meta.dir, "../../apps/web/public"))).toEqual([]);
  });

  test("no number is typed with its unit", () => {
    expect(typedNumbers(topics)).toEqual([]);
  });

  test("the manifest is written from them (bun help:gen)", () => {
    expect(readFileSync(MANIFEST_PATH, "utf8")).toBe(manifestOf(topics, optionsOf));
  });
});
