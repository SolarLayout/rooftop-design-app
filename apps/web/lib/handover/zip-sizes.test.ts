import { describe, expect, test } from "bun:test";
import { sizesOfZip, zipEntriesOf } from "./zip-sizes";

// The sizes of Handover's files (V2 · 9): read from the zip of them all, as its central directory lists them.

const encoder = new TextEncoder();

/** A zip as an archiver writes one, its entries stored: a local header and the bytes each, then the directory and its end. */
function zipOf(entries: { name: string; size: number }[], comment = ""): Uint8Array {
  const parts: number[] = [];
  const directory: number[] = [];
  const u16 = (out: number[], value: number) => out.push(value & 0xff, (value >> 8) & 0xff);
  const u32 = (out: number[], value: number) => out.push(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >>> 24) & 0xff);
  for (const { name, size } of entries) {
    const offset = parts.length;
    const bytes = encoder.encode(name);
    u32(parts, 0x04034b50);
    [20, 0, 0, 0, 0].forEach((value) => u16(parts, value));
    [0, size, size].forEach((value) => u32(parts, value));
    u16(parts, bytes.length);
    u16(parts, 0);
    parts.push(...bytes, ...new Array<number>(size).fill(120));
    u32(directory, 0x02014b50);
    [20, 20, 0, 0, 0, 0].forEach((value) => u16(directory, value));
    [0, size, size].forEach((value) => u32(directory, value));
    [bytes.length, 0, 0, 0, 0].forEach((value) => u16(directory, value));
    u32(directory, 0);
    u32(directory, offset);
    directory.push(...bytes);
  }
  const end: number[] = [];
  u32(end, 0x06054b50);
  [0, 0, entries.length, entries.length].forEach((value) => u16(end, value));
  u32(end, directory.length);
  u32(end, parts.length);
  const said = encoder.encode(comment);
  u16(end, said.length);
  return new Uint8Array([...parts, ...directory, ...end, ...said]);
}

const DEMO = [
  { name: "Pune-demo-roof-report.pdf", size: 900 },
  { name: "Pune-demo-roof-layout.dxf", size: 700 },
  { name: "Pune-demo-roof.kmz", size: 50 },
  { name: "Pune-demo-roof-hourly.csv", size: 600 },
  { name: "Pune-demo-roof-single-line-diagram.png", size: 300 },
  { name: "Pune-demo-roof-bill-of-materials.csv", size: 12 },
  { name: "Pune-demo-roof-cable-schedule.csv", size: 26 },
  { name: "Pune-demo-roof.rtd", size: 400 },
];

describe("the entries of a zip", () => {
  test("each by its name and its size once unpacked, in the order of the directory", () => {
    expect(zipEntriesOf(zipOf(DEMO))).toEqual(DEMO);
  });

  test("a comment after the directory is passed over", () => {
    expect(zipEntriesOf(zipOf(DEMO.slice(0, 2), "made by the API"))).toEqual(DEMO.slice(0, 2));
  });

  test("bytes that are no zip have no entries", () => {
    expect(zipEntriesOf(encoder.encode("not a zip at all"))).toEqual([]);
  });
});

describe("the sizes of the files, by the kind of each", () => {
  test("by the ending each file is named with, the zip's own size beside", () => {
    const zip = zipOf(DEMO);
    expect(sizesOfZip(zip)).toEqual({ pdf: 900, dxf: 700, kmz: 50, csv: 600, sld: 300, bom: 12, cables: 26, rtd: 400, zip: zip.length });
  });
});
