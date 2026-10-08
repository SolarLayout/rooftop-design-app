// The user's country and the system voltage a new design starts with (D87, plan/phase-16-plan.md, step 2). Pure but for
// createCountry, which holds the answer of the visit's one request.
import { COUNTRY_OF_TIME_ZONE } from "./time-zones.gen";

/** The country when neither the request nor the time zone says (the owner, session 22). */
export const FALLBACK_COUNTRY = "IN";

/** Where the NEC limits homes to 600 V (690.7), and Canada, whose CE Code does the same (Section 64). */
const SIX_HUNDRED = new Set(["US", "PR", "GU", "VI", "AS", "MP", "CA"]);

/** The names that take "the" in a sentence ("Set for the United States"). */
const WITH_THE = new Set(["US", "GB", "NL", "PH", "AE", "BS", "GM", "DO", "CF", "MV", "KY", "MH", "SB", "FO", "FK", "VI", "VA", "TC", "CK"]);

export type DefaultVoltage = 600 | 1000;

/** The country Vercel puts in `x-vercel-ip-country`, or none when the header is missing or is not a country. */
export function countryInHeader(header: string | null): string | null {
  const code = header?.trim().toUpperCase() ?? "";
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/** The request's country, else the time zone's, else India. */
export function countryOf({ answered, timeZone }: { answered: string | null; timeZone: string | null }): string {
  return answered ?? (timeZone === null ? undefined : COUNTRY_OF_TIME_ZONE[timeZone]) ?? FALLBACK_COUNTRY;
}

export function defaultVoltageOf(country: string): DefaultVoltage {
  return SIX_HUNDRED.has(country) ? 600 : 1000;
}

/** The country's name as a sentence takes it: "the United States", "India". */
export function nameOfCountry(country: string, nameOf: (country: string) => string): string {
  return `${WITH_THE.has(country) ? "the " : ""}${nameOf(country)}`;
}

/** The browser's name of a country, in English; the code where the browser has none. */
export function displayNameOf(country: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(country) ?? country;
}

/** The path of the web app's route that answers the request's country (`app/country/route.ts`). */
export const COUNTRY_ROUTE = "/country";

/** Asks the web app for the request's country; none when the request carries none. Fails in words otherwise. */
export async function askCountry(fetcher: (path: string) => Promise<Response>): Promise<string | null> {
  const response = await fetcher(COUNTRY_ROUTE);
  if (!response.ok) throw new Error(`The country of the request could not be asked: ${response.status}.`);
  const body: unknown = await response.json();
  const country = typeof body === "object" && body !== null && "country" in body ? body.country : undefined;
  if (country !== null && typeof country !== "string") throw new Error("The country of the request came back in a shape it does not have.");
  return country;
}

type Sources = {
  /** Asks the web app for the request's country: `GET /country`. */
  ask: () => Promise<string | null>;
  /** The browser's time zone, or none (on the server). */
  timeZone: () => string | null;
};

export type Country = { current: () => string; learn: () => Promise<void> };

/**
 * The country of the visit: the time zone's until the request's answer comes, then the answer's. It asks once. A request
 * that fails leaves the time zone's, which is what a failure can act on: nothing else waits for it.
 */
export function createCountry({ ask, timeZone }: Sources): Country {
  let answered: string | null = null;
  let asking: Promise<void> | null = null;
  return {
    current: () => countryOf({ answered, timeZone: timeZone() }),
    learn() {
      asking ??= ask().then(
        (country) => void (answered = countryInHeader(country)),
        () => undefined,
      );
      return asking;
    },
  };
}
