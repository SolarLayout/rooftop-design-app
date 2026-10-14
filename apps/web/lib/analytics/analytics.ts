// Vercel Analytics, on a build made by Vercel alone (`vercel build` sets VERCEL). Off it, in `next dev`, the package loads
// its script from Vercel's CDN, a request that leaves this machine (hard rule 6).
export function analyticsOn(env: Readonly<Record<string, string | undefined>>): boolean {
  return env.VERCEL === "1";
}
