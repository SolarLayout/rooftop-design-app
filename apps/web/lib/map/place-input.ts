// What was typed into the search: coordinates, a maps link that holds them, or words for the geocoder
// (the board "Find and outline, states and tools", "Search").

export type PlaceInput =
  | { kind: "nothing" }
  | { kind: "coordinates"; lat: number; lon: number }
  | { kind: "link"; lat: number; lon: number }
  | { kind: "words"; query: string };

const NUMBER = String.raw`[-+]?\d+(?:\.\d+)?`;
// A number, then a degree sign or not, then a letter of the compass or not.
const PART = String.raw`(${NUMBER})\s*°?\s*([NSEW])?`;
const COORDINATES = new RegExp(String.raw`^\s*${PART}\s*[,;\s]\s*${PART}\s*$`, "i");

// Where maps links keep their coordinates: Google (@lat,lon,zoom; q=; query=; ll=), OpenStreetMap
// (#map=zoom/lat/lon; mlat= and mlon=), Apple (ll=), Bing (cp=lat~lon).
const IN_A_LINK = [
  new RegExp(String.raw`@(${NUMBER}),(${NUMBER})`),
  new RegExp(String.raw`[?&](?:q|query|ll|destination|center)=(${NUMBER})(?:,|%2C)(${NUMBER})`, "i"),
  new RegExp(String.raw`#map=\d+(?:\.\d+)?/(${NUMBER})/(${NUMBER})`),
  new RegExp(String.raw`[?&]cp=(${NUMBER})~(${NUMBER})`, "i"),
];
const OSM_MARKER = new RegExp(String.raw`[?&]mlat=(${NUMBER}).*[?&]mlon=(${NUMBER})`, "i");

const isLatitude = (value: number) => Math.abs(value) <= 90;
const isLongitude = (value: number) => Math.abs(value) <= 180;

/** A number with the sign its letter of the compass gives it. */
function signed(number: string, letter: string | undefined): number {
  const value = Number(number);
  return letter && /[SW]/i.test(letter) ? -Math.abs(value) : value;
}

function coordinatesOf(text: string): { lat: number; lon: number } | null {
  const found = COORDINATES.exec(text);
  if (!found) return null;
  const [, first, firstLetter, second, secondLetter] = found;
  const a = signed(first, firstLetter);
  const b = signed(second, secondLetter);
  // The letters say which is which; without them the latitude comes first.
  const isSwapped = /[EW]/i.test(firstLetter ?? "") || /[NS]/i.test(secondLetter ?? "");
  const [lat, lon] = isSwapped ? [b, a] : [a, b];
  return isLatitude(lat) && isLongitude(lon) ? { lat, lon } : null;
}

function inALink(text: string): { lat: number; lon: number } | null {
  if (!/^https?:\/\//i.test(text.trim())) return null;
  for (const pattern of [...IN_A_LINK, OSM_MARKER]) {
    const found = pattern.exec(text);
    if (!found) continue;
    const lat = Number(found[1]);
    const lon = Number(found[2]);
    if (isLatitude(lat) && isLongitude(lon)) return { lat, lon };
  }
  return null;
}

/** What the text typed into the search is. */
export function placeInputOf(text: string): PlaceInput {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "nothing" };
  const coordinates = coordinatesOf(trimmed);
  if (coordinates) return { kind: "coordinates", ...coordinates };
  const link = inALink(trimmed);
  if (link) return { kind: "link", ...link };
  return { kind: "words", query: trimmed };
}
