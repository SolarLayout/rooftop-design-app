// Vercel Analytics, on Vercel's production builds alone: Vercel sets VERCEL and VERCEL_ENV at build and at run time, and
// staging, a custom environment, is VERCEL_ENV "preview". Off Vercel, in `next dev`, the package loads its script from
// Vercel's CDN, a request that leaves this machine (hard rule 6).
export function analyticsOn(env: Readonly<Record<string, string | undefined>>): boolean {
  return env.VERCEL === "1" && env.VERCEL_ENV === "production";
}
