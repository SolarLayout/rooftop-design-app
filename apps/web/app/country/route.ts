import { countryInHeader } from "@/lib/country/country";

// The request's country as Vercel sees it (x-vercel-ip-country), for the system voltage a new design starts with (D87).
// Kept nowhere; none under next dev and on the test stacks, where the browser's time zone stands in.
export const dynamic = "force-dynamic";

export function GET(request: Request): Response {
  return Response.json({ country: countryInHeader(request.headers.get("x-vercel-ip-country")) }, { headers: { "Cache-Control": "no-store" } });
}
