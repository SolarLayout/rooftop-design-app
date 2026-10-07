// The gate of a how-to's pictures (D81, docs/help-content.md, "Pictures"): each picture a topic shows is in
// apps/web/public, the size written is its own, it has words for a screen reader, and its callouts are at most three,
// numbered 1, 2, 3 in order, each inside it and with its words. A topic writes a picture so:
//   <Picture src="/help/find/move-the-roof/1.jpg" alt="…" width={1038} height={544}>
//     <Mark n={1} x={22} y={38.1} ring>Inside the roof, on a clear spot</Mark>
//   </Picture>
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FPS, lengthOf } from "./clips";
import type { Topic } from "./generate";

export type Mark = { n: number; x: number; y: number; ring: boolean; words: string };
/** A picture as written, with its clip (Phase 15) when it has one: the clip's file and its length as the step shows it. */
export type PictureIn = { src: string; alt: string; width: number; height: number; marks: Mark[]; clip?: string; length?: string };

const MOST_MARKS = 3;
const PICTURE = /<Picture\b([^>]*?)(?:\/>|>([\s\S]*?)<\/Picture>)/g;
const MARK = /<Mark\b([^>]*)>([\s\S]*?)<\/Mark>/g;

const text = (attributes: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1] ?? "";
const number = (attributes: string, name: string) => Number(new RegExp(`\\b${name}=\\{([^}]*)\\}`).exec(attributes)?.[1] ?? Number.NaN);

/** The pictures of a topic's body, with their callouts, as written. */
export function picturesOf(body: string): PictureIn[] {
  return [...body.matchAll(PICTURE)].map(([, attributes = "", inside = ""]) => ({
    src: text(attributes, "src"),
    alt: text(attributes, "alt"),
    width: number(attributes, "width"),
    height: number(attributes, "height"),
    ...(text(attributes, "clip") ? { clip: text(attributes, "clip") } : {}),
    ...(text(attributes, "length") ? { length: text(attributes, "length") } : {}),
    marks: [...inside.matchAll(MARK)].map(([, markAttributes = "", words = ""]) => ({
      n: number(markAttributes, "n"),
      x: number(markAttributes, "x"),
      y: number(markAttributes, "y"),
      ring: /\bring\b/.test(markAttributes),
      words: words.trim(),
    })),
  }));
}

/** A JPEG's size, from its frame header (SOF0 to SOF15 but DHT, JPG and DAC); null for what is not a JPEG. */
export function jpegSizeOf(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let at = 2;
  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return null;
    const marker = bytes[at + 1] ?? 0;
    const length = ((bytes[at + 2] ?? 0) << 8) | (bytes[at + 3] ?? 0);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: ((bytes[at + 5] ?? 0) << 8) | (bytes[at + 6] ?? 0), width: ((bytes[at + 7] ?? 0) << 8) | (bytes[at + 8] ?? 0) };
    }
    at += 2 + length;
  }
  return null;
}

function problemsOf(path: string, picture: PictureIn, publicDir: string): string[] {
  const { src, alt, width, height, marks } = picture;
  const file = join(publicDir, src);
  if (!src.startsWith("/help/") || !existsSync(file)) return [`${path}: ${src} is not in apps/web/public; take it with bun help:pictures`];
  const problems: string[] = [];
  const size = jpegSizeOf(readFileSync(file));
  if (!size) problems.push(`${path}: ${src} is not a JPEG`);
  else if (size.width !== width || size.height !== height) problems.push(`${path}: ${src} is ${size.width} × ${size.height}, not ${width} × ${height} as written`);
  if (alt.trim() === "") problems.push(`${path}: ${src} has no alt: say what it shows`);
  if (marks.length > MOST_MARKS) return [...problems, `${path}: ${src} has ${marks.length} callouts; three at most`];
  if (marks.some(({ n }, index) => n !== index + 1)) problems.push(`${path}: ${src}'s callouts are numbered ${marks.map(({ n }) => n).join(", ")}; they go 1, 2, 3 in order`);
  for (const { n, x, y, words } of marks) {
    if (!(x >= 0 && x <= 100 && y >= 0 && y <= 100)) problems.push(`${path}: ${src}'s callout ${n} is outside it (x and y are per cent, 0 to 100)`);
    if (words === "") problems.push(`${path}: ${src}'s callout ${n} has no words`);
  }
  return problems;
}

/** Every picture of the topics that is not as it should be, in words. */
export function badPictures(topics: readonly Topic[], publicDir: string): string[] {
  return topics.flatMap(({ path, body }) => picturesOf(body).flatMap((picture) => problemsOf(path, picture, publicDir)));
}

/** An MP4's length in seconds, from its movie header (mvhd: its time scale and duration); null for what is not an MP4. */
export function mp4SecondsOf(bytes: Uint8Array): number | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let at = 4; at + 32 <= bytes.length; at++) {
    if (bytes[at] !== 0x6d || bytes[at + 1] !== 0x76 || bytes[at + 2] !== 0x68 || bytes[at + 3] !== 0x64) continue;
    const version = bytes[at + 4];
    const scale = view.getUint32(at + (version === 1 ? 24 : 16));
    const duration = version === 1 ? Number(view.getBigUint64(at + 28)) : view.getUint32(at + 20);
    return scale > 0 ? duration / scale : null;
  }
  return null;
}

/** What the clips may weigh (D82): each, and all of them. */
export type ClipBudget = { each: number; all: number };
export const CLIP_BUDGET: ClipBudget = { each: 500 * 1024, all: 6 * 1024 * 1024 };

const kB = (bytes: number) => `${Math.round(bytes / 1024)} kB`;

/** Every clip of the topics that is not as it should be: there, of the length written, within the budget, in words. */
export function badClips(topics: readonly Topic[], publicDir: string, budget: ClipBudget = CLIP_BUDGET): string[] {
  let all = 0;
  const problems = topics.flatMap(({ path, body }) =>
    picturesOf(body).flatMap(({ src, clip, length }): string[] => {
      if (!clip) return length ? [`${path}: ${src} has a length but no clip`] : [];
      const file = join(publicDir, clip);
      if (!clip.startsWith("/help/") || !clip.endsWith(".mp4") || !existsSync(file)) return [`${path}: ${clip} is not in apps/web/public; record it with bun help:clips`];
      const bytes = readFileSync(file);
      all += bytes.length;
      const seconds = mp4SecondsOf(bytes);
      if (seconds === null) return [`${path}: ${clip} is not an MP4`];
      const runs = lengthOf(Math.round(seconds * FPS));
      const found: string[] = [];
      if (!length) found.push(`${path}: ${clip} has no length: write it as the step shows it, ${runs}`);
      else if (length !== runs) found.push(`${path}: ${clip} runs ${runs}, not ${length} as written`);
      if (bytes.length > budget.each) found.push(`${path}: ${clip} is ${kB(bytes.length)}, over ${kB(budget.each)} a clip (D82): record it shorter or calmer`);
      return found;
    }),
  );
  return all > budget.all ? [...problems, `the clips are ${kB(all)} in all, over ${kB(budget.all)} (D82): fewer or shorter clips, or a place of their own`] : problems;
}
