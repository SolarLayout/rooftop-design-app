import { describe, expect, test } from "bun:test";
import { relatedRowsOf } from "./related";

// The one list at the foot of a topic (V2 · 11, V2-87): its related topics by their titles, then its place in the docs.

const registry = {
  entries: { "app.section.roof-type": { title: "Roof type" }, "app.section.obstacles": { title: "Obstacles" } },
  aliases: { "studio.section.old-obstacles": "app.section.obstacles" },
};
const docs = { title: "The roof", section: "Edges and access", href: "https://solarlayout.app/docs/rooftop/roof#edges-and-access" };

describe("the topic's Related", () => {
  test("its topics by their titles, an alias as its topic, then the docs' section, in the docs", () => {
    expect(relatedRowsOf(["app.section.roof-type", "studio.section.old-obstacles"], registry, docs)).toEqual([
      { kind: "topic", key: "app.section.roof-type", title: "Roof type" },
      { kind: "topic", key: "app.section.obstacles", title: "Obstacles" },
      { kind: "docs", href: docs.href, words: "Edges and access, in the docs" },
    ]);
  });

  test("a key that leads nowhere is left out, a topic named twice is listed once", () => {
    expect(relatedRowsOf(["app.section.obstacles", "studio.section.gone", "studio.section.old-obstacles"], registry, null)).toEqual([
      { kind: "topic", key: "app.section.obstacles", title: "Obstacles" },
    ]);
  });

  test("nothing related and no docs: no list", () => {
    expect(relatedRowsOf([], registry, null)).toEqual([]);
  });
});
