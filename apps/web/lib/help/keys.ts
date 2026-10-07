// A topic's key is its path under content/help: place.kind.name (D80). The file system makes keys unique.
import { HELP_KINDS, HELP_PLACES, type HelpPlace } from "./types";

const KEY = new RegExp(`^(${HELP_PLACES.join("|")})\\.(${HELP_KINDS.join("|")})\\.[a-z0-9]+(-[a-z0-9]+)*$`);

export const isHelpKey = (key: string): boolean => KEY.test(key);

/** "studio/section/system-voltage.mdx" → "studio.section.system-voltage"; a path that makes no key is refused. */
export function keyFromPath(path: string): string {
  if (!path.endsWith(".mdx")) throw new Error(`${path} is not a .mdx topic`);
  const key = path.slice(0, -".mdx".length).split("/").join(".");
  if (!isHelpKey(key)) throw new Error(`"${key}" (${path}) is no key: place.kind.name, each part of lowercase letters, digits and dashes`);
  return key;
}

export const placeOf = (key: string): HelpPlace => key.split(".")[0] as HelpPlace;
