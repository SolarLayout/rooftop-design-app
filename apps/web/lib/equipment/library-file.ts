// A file of the app's library (D75), fetched from beside the catalog, or of the user's, given to the API as the reader
// takes it: its bytes in base64, so that a file written in a code page reaches the engine as it is. A file of the user's
// over what the API reads is refused in the app's words before it is sent (#179, item 8).
import type { EquipmentFile } from "../api";
import { fileUrlOf, type Kind } from "./catalog";

const CHUNK = 0x8000;

/** The bytes in base64, a chunk at a time: a whole file at once would be too many arguments for one call. */
export function base64Of(bytes: Uint8Array): string {
  let binary = "";
  for (let at = 0; at < bytes.length; at += CHUNK) binary += String.fromCharCode(...bytes.subarray(at, at + CHUNK));
  return btoa(binary);
}

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** The file of the library as the API's /equipment/module and /equipment/inverter take it. */
export async function libraryFileOf(kind: Kind, file: string, fetcher: Fetch, signal?: AbortSignal): Promise<EquipmentFile> {
  const response = await fetcher(fileUrlOf(kind, file), { signal });
  if (!response.ok) throw new Error(`${file} could not be loaded from the app's library (HTTP ${response.status}). Try again.`);
  return { name: file, base64: base64Of(new Uint8Array(await response.arrayBuffer())) };
}

/** The largest PAN or OND file the API reads (MAX_EQUIPMENT_TEXT, #162); the 507 of the library are 3.7 KB at the most. */
export const MAX_EQUIPMENT_BYTES = 256_000;

/** A file of the user's as the API takes it; one over MAX_EQUIPMENT_BYTES is refused, unread, in the app's words. */
export async function ownFileOf(file: Pick<File, "name" | "size" | "arrayBuffer">): Promise<EquipmentFile> {
  if (file.size > MAX_EQUIPMENT_BYTES) throw new Error(`${file.name} is over 256 KB, larger than any PAN or OND file. Choose another.`);
  return { name: file.name, base64: base64Of(new Uint8Array(await file.arrayBuffer())) };
}
