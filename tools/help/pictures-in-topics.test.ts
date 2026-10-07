import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { badPictures, jpegSizeOf, picturesOf } from "./pictures-in-topics";
import type { Topic } from "./generate";

// The gate of a how-to's pictures (D81): each is there, the size written is its own, it has words for a screen reader, and
// its callouts are at most three, numbered from 1, each inside it.

const PUBLIC = join(import.meta.dir, "../../apps/web/public");
const ROOF = "/help/find/move-the-roof/1.jpg";

describe("a JPEG's size", () => {
  test("is read from its frame", () => {
    expect(jpegSizeOf(readFileSync(join(PUBLIC, ROOF)))).toEqual({ width: 1038, height: 544 });
  });

  test("is none for what is not a JPEG", () => {
    expect(jpegSizeOf(Buffer.from("not a picture"))).toBeNull();
  });
});

const picture = (attributes: string, marks = "") => `<Picture ${attributes}>\n${marks}\n</Picture>`;
const GOOD = `src="${ROOF}" alt="The roof" width={1038} height={544}`;

describe("a picture in a topic", () => {
  test("is read with its callouts", () => {
    expect(picturesOf(picture(GOOD, '<Mark n={1} x={22} y={38.1} ring>Inside the roof</Mark>\n<Mark n={2} x={50} y={5}>The handle</Mark>'))).toEqual([
      { src: ROOF, alt: "The roof", width: 1038, height: 544, marks: [{ n: 1, x: 22, y: 38.1, ring: true, words: "Inside the roof" }, { n: 2, x: 50, y: 5, ring: false, words: "The handle" }] },
    ]);
  });

  test("closed on itself, without callouts", () => {
    expect(picturesOf(`<Picture ${GOOD} />`)).toEqual([{ src: ROOF, alt: "The roof", width: 1038, height: 544, marks: [] }]);
  });
});

const topic = (body: string): Topic => ({ key: "find.tool.move-the-roof", path: "find/tool/move-the-roof.mdx", frontmatter: { title: "T", summary: "S", kind: "tool", related: [], aliases: [] }, body });

describe("the gate", () => {
  test("passes a picture as it should be", () => {
    expect(badPictures([topic(picture(GOOD, "<Mark n={1} x={22} y={38} ring>Here</Mark>"))], PUBLIC)).toEqual([]);
  });

  test("names a picture that is not there, or a size that is not its own", () => {
    expect(badPictures([topic(`<Picture src="/help/none.jpg" alt="A" width={10} height={10} />`)], PUBLIC)).toEqual([
      "find/tool/move-the-roof.mdx: /help/none.jpg is not in apps/web/public; take it with bun help:pictures",
    ]);
    expect(badPictures([topic(`<Picture src="${ROOF}" alt="A" width={1000} height={544} />`)], PUBLIC)).toEqual([
      `find/tool/move-the-roof.mdx: ${ROOF} is 1038 × 544, not 1000 × 544 as written`,
    ]);
  });

  test("names a picture without words for a screen reader", () => {
    expect(badPictures([topic(`<Picture src="${ROOF}" alt="" width={1038} height={544} />`)], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF} has no alt: say what it shows`]);
  });

  test("names callouts past three, out of their order, outside the picture or without words", () => {
    const four = [1, 2, 3, 4].map((n) => `<Mark n={${n}} x={10} y={10}>W</Mark>`).join("\n");
    expect(badPictures([topic(picture(GOOD, four))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF} has 4 callouts; three at most`]);
    expect(badPictures([topic(picture(GOOD, "<Mark n={2} x={10} y={10}>W</Mark>"))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF}'s callouts are numbered 2; they go 1, 2, 3 in order`]);
    expect(badPictures([topic(picture(GOOD, "<Mark n={1} x={101} y={10}>W</Mark>"))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF}'s callout 1 is outside it (x and y are per cent, 0 to 100)`]);
    expect(badPictures([topic(picture(GOOD, "<Mark n={1} x={10} y={10}></Mark>"))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF}'s callout 1 has no words`]);
  });
});
