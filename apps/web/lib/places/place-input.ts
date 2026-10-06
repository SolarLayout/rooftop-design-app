// What was typed into the search: coordinates, a maps link that holds them, or words for the geocoder
// (the boards "Find and outline, states and tools", "Search", and "UI fixes · Coordinates in the search").

export type LatLon = { lat: number; lon: number };

export type PlaceInput =
  | { kind: "nothing" }
  | { kind: "coordinates"; lat: number; lon: number }
  | { kind: "link"; lat: number; lon: number }
  // It looks like coordinates and cannot be read: why, and the place it may mean when there is one.
  | { kind: "unreadable"; why: string; offer: LatLon | null }
  | { kind: "words"; query: string };

const NUMBER = String.raw`[-+]?\d+(?:\.\d+)?`;

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

function inALink(text: string): LatLon | null {
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

// --- Coordinates as people write them -----------------------------------------------------------------------

const EXAMPLE = "12°54′50.74″N 77°29′31.16″E";
const CANNOT_BE_READ = (what: string) =>
  `These look like coordinates, but ${what} cannot be read. Write them as ${EXAMPLE}, or 12.91409, 77.49199.`;
const CHECK = "Check where it was copied from.";

/** The marks as they arrive from Google Earth, a word processor or a chat, made one each. */
function plainMarks(text: string): string {
  return text
    .replace(/[   ]/g, " ")
    .replace(/[−‒–]/g, "-")
    .replace(/[º˚]/g, "°")
    .replace(/[″”“]/g, '"')
    .replace(/[′’‘`´]/g, "'")
    .replace(/''/g, '"');
}

/** Two numbers written with decimal commas and nothing else ("12,914094 77,491989") get decimal points. */
function decimalPoints(text: string): string {
  if (text.includes(".")) return text;
  const commas = text.match(/,/g)?.length ?? 0;
  const between = text.match(/\d,\d/g)?.length ?? 0;
  return commas === 2 && between === 2 ? text.replace(/(\d),(\d)/g, "$1.$2") : text;
}

/**
 * Whether the text is meant as coordinates: numbers with their marks, letters of the compass, signs and
 * separators only. Whole numbers with spaces alone between them are a postcode, and are words.
 */
function looksLikeCoordinates(text: string): boolean {
  if (!/^[\d\s.,;°'"+\-NSEW]+$/i.test(text) || !/\d/.test(text) || /[NSEW]{2}/i.test(text)) return false;
  return /[.°'"+\-NSEW]/i.test(text) || /[,;]/.test(text);
}

type Letter = "N" | "S" | "E" | "W";
type Token =
  | { kind: "number"; text: string }
  | { kind: "mark"; mark: "°" | "'" | '"' }
  | { kind: "letter"; letter: Letter }
  | { kind: "sign"; minus: boolean }
  | { kind: "separator" };

function tokensOf(text: string): Token[] | null {
  const token = /\s*(?:(\d+(?:\.\d+)?)|([°'"])|([NSEW])|([+-])|([,;]))\s*/iy;
  const tokens: Token[] = [];
  while (token.lastIndex < text.length) {
    const found = token.exec(text);
    if (!found) return null;
    const [, number, mark, letter, sign] = found;
    if (number !== undefined) tokens.push({ kind: "number", text: number });
    else if (mark !== undefined) tokens.push({ kind: "mark", mark: mark as "°" | "'" | '"' });
    else if (letter !== undefined) tokens.push({ kind: "letter", letter: letter.toUpperCase() as Letter });
    else if (sign !== undefined) tokens.push({ kind: "sign", minus: sign === "-" });
    else tokens.push({ kind: "separator" });
  }
  return tokens;
}

const at = (tokens: Token[], from: number, to?: number) => tokens.slice(from, to);
const indicesOf = (tokens: Token[], isIt: (token: Token, index: number) => boolean) =>
  tokens.flatMap((token, index) => (isIt(token, index) ? [index] : []));

/** Split by a comma or a semicolon. */
function bySeparators(tokens: Token[]): Token[][] | null {
  if (!tokens.some((token) => token.kind === "separator")) return null;
  const halves: Token[][] = [[]];
  for (const token of tokens) {
    if (token.kind === "separator") halves.push([]);
    else halves[halves.length - 1].push(token);
  }
  return halves.filter((half) => half.length > 0);
}

/** Split by the letters: before the second when they lead, after the first when they follow. */
function byLetters(tokens: Token[]): Token[][] | null {
  const letters = indicesOf(tokens, (token) => token.kind === "letter");
  if (letters.length === 0) return null;
  const cut = tokens[0].kind === "letter" ? letters[1] : letters[0] + 1;
  return cut === undefined || cut >= tokens.length ? null : [at(tokens, 0, cut), at(tokens, cut)];
}

/** Split before the second number that carries a degree sign, with its own sign. */
function byDegrees(tokens: Token[]): Token[][] | null {
  const degrees = indicesOf(tokens, (token, index) => token.kind === "number" && tokens[index + 1]?.kind === "mark" && (tokens[index + 1] as { mark: string }).mark === "°");
  if (degrees.length < 2) return null;
  const cut = tokens[degrees[1] - 1]?.kind === "sign" ? degrees[1] - 1 : degrees[1];
  return [at(tokens, 0, cut), at(tokens, cut)];
}

/** Without marks: half the numbers each ("12 54 50.74 77 29 31.16"). */
function byNumbers(tokens: Token[]): Token[][] | null {
  if (tokens.some((token) => token.kind === "mark")) return null;
  const numbers = indicesOf(tokens, (token) => token.kind === "number");
  if (numbers.length < 2 || numbers.length % 2 !== 0) return null;
  const cut = numbers[numbers.length / 2 - 1] + 1;
  return [at(tokens, 0, cut), at(tokens, cut)];
}

function halvesOf(tokens: Token[]): Token[][] {
  for (const split of [bySeparators, byLetters, byDegrees, byNumbers]) {
    const halves = split(tokens);
    if (halves) return halves;
  }
  return [tokens];
}

type Angle = { degrees: number; minutes: string | null; seconds: string | null; minus: boolean; letter: Letter | null };

const ORDER = ["°", "'", '"'] as const;

/** One angle: a letter before or after, a sign, then degrees, minutes and seconds with their marks in order. */
function angleOf(tokens: Token[]): Angle | null {
  let index = 0;
  let letter: Letter | null = null;
  let minus = false;
  const next = () => tokens[index];
  const first = next();
  if (first?.kind === "letter") {
    letter = first.letter;
    index += 1;
  }
  const sign = next();
  if (sign?.kind === "sign") {
    minus = sign.minus;
    index += 1;
  }
  const parts: string[] = [];
  for (let number = next(); number?.kind === "number"; number = next()) {
    index += 1;
    const mark = next();
    if (mark?.kind === "mark") {
      if (mark.mark !== ORDER[parts.length]) return null;
      index += 1;
    }
    parts.push(number.text);
  }
  const last = next();
  if (last?.kind === "letter") {
    if (letter !== null) return null;
    letter = last.letter;
    index += 1;
  }
  // Only the last part may have a fraction: 12°54.8456′ is read, 12.5°30′ is not.
  if (index !== tokens.length || parts.length === 0 || parts.length > 3 || parts.slice(0, -1).some((part) => part.includes("."))) {
    return null;
  }
  return { degrees: Number(parts[0]), minutes: parts[1] ?? null, seconds: parts[2] ?? null, minus, letter };
}

type Axis = "latitude" | "longitude";
const axisOf = (letter: Letter | null): Axis | null => (letter === null ? null : letter === "N" || letter === "S" ? "latitude" : "longitude");
const fraction = (value: number) => value.toFixed(5);
const asTyped = (value: number) => (Number.isInteger(value) ? String(value) : fraction(value));

const valueOf = (angle: Angle) => {
  const size = angle.degrees + Number(angle.minutes ?? 0) / 60 + Number(angle.seconds ?? 0) / 3600;
  return angle.minus || angle.letter === "S" || angle.letter === "W" ? -size : size;
};

/** What is wrong with an angle on its own: a minus that its letter contradicts, or minutes and seconds past 59. */
function faultOf(angle: Angle, axis: Axis): string | null {
  if (angle.minus && (angle.letter === "N" || angle.letter === "E")) {
    const size = angle.degrees + Number(angle.minutes ?? 0) / 60 + Number(angle.seconds ?? 0) / 3600;
    const means = angle.letter === "N" ? "south" : "west";
    return `−${fraction(size)} is marked ${angle.letter}, and a minus means ${means}. Keep the minus or the letter, not both.`;
  }
  const minutes = angle.minutes !== null && Number(angle.minutes) >= 60 ? `${angle.minutes}′` : null;
  const seconds = angle.seconds !== null && Number(angle.seconds) >= 60 ? `${angle.seconds}″` : null;
  const past = minutes ?? seconds;
  return past ? `Minutes and seconds go up to 59. The ${axis} has ${past}: check where it was copied from.` : null;
}

const refused = (why: string, offer: LatLon | null = null): PlaceInput => ({ kind: "unreadable", why, offer });

/** Coordinates in any of the forms of the board, or why they cannot be read. */
function coordinatesOf(text: string): PlaceInput {
  const tokens = tokensOf(text);
  if (!tokens) return refused(CANNOT_BE_READ("they"));
  const halves = halvesOf(tokens);
  if (halves.length > 2) return refused(CANNOT_BE_READ("they"));
  const angles = halves.map(angleOf);

  if (angles.length === 1) {
    const [angle] = angles;
    if (!angle) return refused(CANNOT_BE_READ("they"));
    return axisOf(angle.letter) === "longitude"
      ? refused(`Only the longitude is here. Add the latitude before it: ${EXAMPLE}.`)
      : refused(`Only the latitude is here. Add the longitude after it: ${EXAMPLE}.`);
  }

  const [a, b] = angles;
  if (!a && !b) return refused(CANNOT_BE_READ("they"));
  if (!a || !b) {
    const known = a ?? b;
    const knownAxis = axisOf(known?.letter ?? null);
    const unread: Axis = knownAxis ? (knownAxis === "latitude" ? "longitude" : "latitude") : a ? "longitude" : "latitude";
    return refused(CANNOT_BE_READ(`the ${unread}`));
  }

  const axisA = axisOf(a.letter);
  const axisB = axisOf(b.letter);
  if (axisA !== null && axisA === axisB) {
    const marked = a.letter === b.letter ? a.letter : axisA === "latitude" ? "N or S" : "E or W";
    return refused(`Both are marked ${marked}. The latitude takes N or S, the longitude E or W.`);
  }
  const isSwapped = axisA === "longitude" || axisB === "latitude";
  const [latitude, longitude] = isSwapped ? [b, a] : [a, b];
  const fault = faultOf(latitude, "latitude") ?? faultOf(longitude, "longitude");
  if (fault) return refused(fault);

  const lat = valueOf(latitude);
  const lon = valueOf(longitude);
  if (!isLatitude(lat)) {
    const hasLetters = axisA !== null || axisB !== null;
    if (!hasLetters && isLongitude(lat) && isLatitude(lon)) {
      return refused(`The latitude comes first, and ${fraction(Math.abs(lat))} is more than 90°. Did you mean this?`, { lat: lon, lon: lat });
    }
    return refused(`A latitude goes up to 90°, and this one is ${asTyped(Math.abs(lat))}°. ${CHECK}`);
  }
  if (!isLongitude(lon)) return refused(`A longitude goes up to 180°, and this one is ${asTyped(Math.abs(lon))}°. ${CHECK}`);
  return { kind: "coordinates", lat, lon };
}

/** Whether what was typed is a place to go to as it stands: coordinates, or a maps link that holds them. */
export function isAPlace(input: PlaceInput): input is Extract<PlaceInput, { kind: "coordinates" | "link" }> {
  return input.kind === "coordinates" || input.kind === "link";
}

/** What the text typed into the search is. */
export function placeInputOf(text: string): PlaceInput {
  const trimmed = text.trim();
  if (trimmed === "") return { kind: "nothing" };
  const link = inALink(trimmed);
  if (link) return { kind: "link", ...link };
  const plain = decimalPoints(plainMarks(trimmed));
  if (looksLikeCoordinates(plain)) return coordinatesOf(plain);
  return { kind: "words", query: trimmed };
}
