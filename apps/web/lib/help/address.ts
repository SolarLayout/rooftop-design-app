// The topic shown is in the address as ?help=<key> (D80): read on load, so that a shared link opens it; written beside
// whatever else the address holds, which is never touched.

export const HELP_PARAMETER = "help";

/** The key in a query string ("?help=…"); null when there is none. */
export function helpOfAddress(search: string): string | null {
  return new URLSearchParams(search).get(HELP_PARAMETER);
}

/** The address with the help set to `key`, or taken away for null; the rest as it was. */
export function withHelp(href: string, key: string | null): string {
  const url = new URL(href);
  if (key === null) url.searchParams.delete(HELP_PARAMETER);
  else url.searchParams.set(HELP_PARAMETER, key);
  return url.toString();
}
