// The gate of a how-to's pictures (D81, docs/help-content.md, "Pictures"): each picture a topic shows is in
// apps/web/public, the size written is its own, it has words for a screen reader, and its callouts are at most three,
// numbered 1, 2, 3 in order, each inside it and with its words. A topic writes a picture so:
//   <Picture src="/help/find/move-the-roof/1.jpg" alt="…" width={1038} height={544}>
//     <Mark n={1} x={22} y={38.1} ring>Inside the roof, on a clear spot</Mark>
//   </Picture>
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Topic } from "./generate";

export type Mark = { n: number; x: number; y: number; ring: boolean; words: string };
export type PictureIn = { src: string; alt: string; width: number; height: number; marks: Mark[] };

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
