import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { badClips, badPictures, jpegSizeOf, mp4SecondsOf, picturesOf } from "./pictures-in-topics";
import type { Topic } from "./generate";

// The gate of a how-to's pictures (D81): each is there, the size written is its own, it has words for a screen reader, and
// its callouts are at most three, numbered from 1, each inside it.

const PUBLIC = join(import.meta.dir, "../../apps/web/public");
const ROOF = "/help/find/move-the-roof/1.jpg";

describe("a JPEG's size", () => {
  test("is read from its frame", () => {
    expect(jpegSizeOf(readFileSync(join(PUBLIC, ROOF)))).toEqual({ width: 1138, height: 578 });
  });

  test("is none for what is not a JPEG", () => {
    expect(jpegSizeOf(Buffer.from("not a picture"))).toBeNull();
  });
});

const picture = (attributes: string, marks = "") => `<Picture ${attributes}>\n${marks}\n</Picture>`;
const GOOD = `src="${ROOF}" alt="The roof" width={1138} height={578}`;

describe("a picture in a topic", () => {
  test("is read with its callouts", () => {
    expect(picturesOf(picture(GOOD, '<Mark n={1} x={22} y={38.1} ring>Inside the roof</Mark>\n<Mark n={2} x={50} y={5}>The handle</Mark>'))).toEqual([
      { src: ROOF, alt: "The roof", width: 1138, height: 578, marks: [{ n: 1, x: 22, y: 38.1, ring: true, words: "Inside the roof" }, { n: 2, x: 50, y: 5, ring: false, words: "The handle" }] },
    ]);
  });

  test("closed on itself, without callouts", () => {
    expect(picturesOf(`<Picture ${GOOD} />`)).toEqual([{ src: ROOF, alt: "The roof", width: 1138, height: 578, marks: [] }]);
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
    expect(badPictures([topic(`<Picture src="${ROOF}" alt="A" width={1000} height={578} />`)], PUBLIC)).toEqual([
      `find/tool/move-the-roof.mdx: ${ROOF} is 1138 × 578, not 1000 × 578 as written`,
    ]);
  });

  test("names a picture without words for a screen reader", () => {
    expect(badPictures([topic(`<Picture src="${ROOF}" alt="" width={1138} height={578} />`)], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF} has no alt: say what it shows`]);
  });

  test("names callouts past three, out of their order, outside the picture or without words", () => {
    const four = [1, 2, 3, 4].map((n) => `<Mark n={${n}} x={10} y={10}>W</Mark>`).join("\n");
    expect(badPictures([topic(picture(GOOD, four))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF} has 4 callouts; three at most`]);
    expect(badPictures([topic(picture(GOOD, "<Mark n={2} x={10} y={10}>W</Mark>"))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF}'s callouts are numbered 2; they go 1, 2, 3 in order`]);
    expect(badPictures([topic(picture(GOOD, "<Mark n={1} x={101} y={10}>W</Mark>"))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF}'s callout 1 is outside it (x and y are per cent, 0 to 100)`]);
    expect(badPictures([topic(picture(GOOD, "<Mark n={1} x={10} y={10}></Mark>"))], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${ROOF}'s callout 1 has no words`]);
  });
});

const CLIP = "/help/find/move-the-roof/2.mp4";
/** The clip's own size, as the gate says it: the clip is taken again whenever its screen changes. */
const CLIP_KB = `${Math.round(readFileSync(join(PUBLIC, CLIP)).length / 1024)} kB`;

describe("an MP4's length", () => {
  test("is read from its movie header, in seconds", () => {
    expect(mp4SecondsOf(readFileSync(join(PUBLIC, CLIP)))).toBeCloseTo(160 / 30, 2);
  });

  test("is none for what is not an MP4", () => {
    expect(mp4SecondsOf(Buffer.from("not a clip"))).toBeNull();
  });
});

describe("a clip in a topic (Phase 15)", () => {
  const withClip = (clip: string, length: string) => topic(`<Picture src="${ROOF}" alt="The roof" width={1138} height={578} clip="${clip}" length="${length}" />`);

  test("is read with its picture", () => {
    expect(picturesOf(`<Picture ${GOOD} clip="${CLIP}" length="0:06" />`)[0]).toMatchObject({ clip: CLIP, length: "0:06" });
  });

  test("passes when it is there, of the length written, within its budget", () => {
    expect(badClips([withClip(CLIP, "0:06")], PUBLIC)).toEqual([]);
  });

  test("names a clip that is not there, a length that is not its own, or one without the other", () => {
    expect(badClips([withClip("/help/none.mp4", "0:06")], PUBLIC)).toEqual(["find/tool/move-the-roof.mdx: /help/none.mp4 is not in apps/web/public; record it with bun help:clips"]);
    expect(badClips([withClip(CLIP, "0:09")], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${CLIP} runs 0:06, not 0:09 as written`]);
    expect(badClips([topic(`<Picture ${GOOD} clip="${CLIP}" />`)], PUBLIC)).toEqual([`find/tool/move-the-roof.mdx: ${CLIP} has no length: write it as the step shows it, 0:06`]);
  });

  test("names a clip over 500 kB, and all of them over 6 MB", () => {
    expect(badClips([withClip(CLIP, "0:06")], PUBLIC, { each: 100 * 1024, all: 6 * 1024 * 1024 })).toEqual([
      `find/tool/move-the-roof.mdx: ${CLIP} is ${CLIP_KB}, over 100 kB a clip (D82): record it shorter or calmer`,
    ]);
    expect(badClips([withClip(CLIP, "0:06")], PUBLIC, { each: 500 * 1024, all: 50 * 1024 })[0]).toContain(`the clips are ${CLIP_KB} in all, over 50 kB (D82)`);
  });
});
