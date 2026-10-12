// The sizes of Handover's files (V2 · 9, D105): read from the zip of them all, which the API names each file in as its own
// download, from the zip's central directory, without unpacking anything. One request gives every size and the zip's own,
// for Download all. Pure.
import type { ExportKind } from "../api";

export type ZipEntry = { name: string; size: number };

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
/** The end of the directory is 22 bytes and a comment of at most 65,535. */
const END_SIZE = 22;
const LONGEST_COMMENT = 0xffff;

const decoder = new TextDecoder();

/** The entries of the zip's central directory, in its order; none for bytes that are no zip. */
export function zipEntriesOf(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const lowest = Math.max(0, bytes.length - END_SIZE - LONGEST_COMMENT);
  let end = -1;
  for (let at = bytes.length - END_SIZE; at >= lowest; at--) {
    if (view.getUint32(at, true) === END_OF_DIRECTORY) {
      end = at;
      break;
    }
  }
  if (end < 0) return [];
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const entries: ZipEntry[] = [];
  for (let index = 0; index < count; index++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== DIRECTORY_ENTRY) return [];
    const size = view.getUint32(at + 24, true);
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    entries.push({ name: decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength)), size });
    at += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

/** Each file's ending, as the API names it (services/export.py); the longer first, so that no ending stands for another. */
const ENDINGS: ReadonlyArray<[string, ExportKind]> = [
  ["-single-line-diagram.png", "sld"],
  ["-bill-of-materials.csv", "bom"],
  ["-cable-schedule.csv", "cables"],
  ["-report.pdf", "pdf"],
  ["-layout.dxf", "dxf"],
  ["-hourly.csv", "csv"],
  [".kmz", "kmz"],
  [".rtd", "rtd"],
];

export type Sizes = Partial<Record<ExportKind, number>>;

/** The size of each file in the zip by its kind, and the zip's own. */
export function sizesOfZip(bytes: Uint8Array): Sizes {
  const sizes: Sizes = {};
  for (const { name, size } of zipEntriesOf(bytes)) {
    const kind = ENDINGS.find(([ending]) => name.endsWith(ending))?.[1];
    if (kind) sizes[kind] = size;
  }
  return { ...sizes, zip: bytes.length };
}
