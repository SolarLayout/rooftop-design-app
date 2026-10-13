// The design's place name (D114), set by Find when it builds a roof (issue 238). The place's own name is the first part
// of the label of a place found by words ("Pune" of "Pune, Maharashtra, India"); a place found by its coordinates (typed,
// a maps link, Use my location) has none, and neither has a file. Pure; Find puts it into the design it opens.

/** The most characters the project takes (D114, the API's `place_name`). */
export const PLACE_NAME_MOST = 200;

/** A place found, as the search gives it. */
export type Found = { lat: number; lon: number; label: string; byWords: boolean };

/** The place's own name: the label before its first comma, trimmed, at most 200 characters. */
export function placeNameOf(label: string): string {
  const [first = ""] = label.split(",");
  return Array.from(first.trim()).slice(0, PLACE_NAME_MOST).join("");
}

/**
 * The name a roof is built with: that of the place found by words; none for one found by its coordinates, or none found.
 * By hand (`handAt` the Place's fields), the name holds while the fields hold the place found: another place typed there
 * is not the place of that name.
 */
export function placeNameOfBuild(found: Found | null, handAt: { lat: number | null; lon: number | null } | null): string {
  if (!found?.byWords) return "";
  if (handAt && (handAt.lat !== found.lat || handAt.lon !== found.lon)) return "";
  return placeNameOf(found.label);
}

/** A design's roof edited again: it keeps its name while no place is found; a place found gives the name of the build. */
export function editedPlaceNameOf(kept: string, found: Found | null, handAt: { lat: number | null; lon: number | null } | null): string {
  return found === null ? kept : placeNameOfBuild(found, handAt);
}
