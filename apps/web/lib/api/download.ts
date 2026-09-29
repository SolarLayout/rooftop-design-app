// The name of a file that the API hands out, from the header that names it.

const ENCODED = /filename\*\s*=\s*UTF-8''([^;]+)/i;
const PLAIN = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i;

/** The file name in a Content-Disposition header; *fallback* when it names none. */
export function fileNameOf(header: string | null, fallback: string): string {
  if (!header) return fallback;
  return nameOnly(encodedName(header)) || nameOnly(plainName(header)) || fallback;
}

function encodedName(header: string): string {
  const found = ENCODED.exec(header);
  if (!found?.[1]) return "";
  try {
    return decodeURIComponent(found[1].trim());
  } catch {
    // Not valid percent-encoding: the plain name beside it is used.
    return "";
  }
}

function plainName(header: string): string {
  const found = PLAIN.exec(header.replace(ENCODED, ""));
  return (found?.[1] ?? found?.[2] ?? "").trim();
}

/** A name is never a path: what stands before the last slash is dropped. */
function nameOnly(name: string): string {
  return name.split(/[\\/]/).pop() ?? "";
}
