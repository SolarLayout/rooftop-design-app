// Where the web app forwards /api/*, decided when it is built (next.config.ts): the rewrite's destination is fixed in
// the build, so a build belongs to one environment (plan/phase-12-plan.md, decision 5).
//   ROOFTOP_API_ORIGIN   the deployed API's https origin (a Lambda Function URL), set per Vercel environment
//   ROOFTOP_API_PORT     here, the port of the API on this machine; tools/dev.ts sets it for each stack
// Vercel sets VERCEL=1 in its builds: there an address is required, so a build without one fails instead of shipping a
// site that forwards to 127.0.0.1.

type Environment = Readonly<Record<string, string | undefined>>;

const DEFAULT_PORT = "4701";

export function apiOrigin(env: Environment): string {
  const origin = env.ROOFTOP_API_ORIGIN?.trim();
  if (origin) return httpsOrigin(origin);
  if (env.VERCEL) {
    throw new Error("ROOFTOP_API_ORIGIN is not set: a build on Vercel needs the API's https origin for its environment.");
  }
  // 127.0.0.1 and not localhost: uvicorn listens on IPv4 only.
  return `http://127.0.0.1:${port(env.ROOFTOP_API_PORT ?? DEFAULT_PORT)}`;
}

function httpsOrigin(text: string): string {
  const refusal = `ROOFTOP_API_ORIGIN must be an https origin like "https://abc.lambda-url.ap-south-1.on.aws", got "${text}".`;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new Error(refusal);
  }
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search !== "" || url.hash !== "") throw new Error(refusal);
  return url.origin;
}

function port(text: string): number {
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`ROOFTOP_API_PORT must be a port number, got "${text}".`);
  }
  return value;
}
