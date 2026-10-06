// A file of the app's library (D75), fetched from beside the catalog and given to the API as the reader takes it: its
// bytes in base64, so that a file written in a code page reaches the engine as it is.
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
