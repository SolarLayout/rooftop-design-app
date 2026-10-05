// The smoke of a deployed site (plan/phase-12-plan.md, decision 10): the page, the API's health and the commit it was
// built from, the demo, the demo's design run streamed to its result, and the report's pages for the first option.
// Every request goes through the site's own origin, as the browser's do, so the rewrite to the API is proved with it.
// Run by the deploy workflows after each deploy, and by hand: bun tools/smoke.ts <base URL> [--commit <sha>].

import { readEvents } from "../../apps/web/lib/api/events";

export type Fetch = (url: string | URL, init?: RequestInit) => Promise<Response>;

export type Check = { name: string; ok: boolean; detail: string; ms: number };

type Options = { fetch?: Fetch; commit?: string };

type Project = Record<string, unknown>;

class Failed extends Error {}

export async function smoke(base: string, options: Options = {}): Promise<Check[]> {
  const ask = options.fetch ?? fetch;
  const url = (path: string) => new URL(path, base);
  const checks: Check[] = [];

  async function step<T>(name: string, run: () => Promise<{ value: T; detail: string }>): Promise<T | undefined> {
    const started = performance.now();
    try {
      const { value, detail } = await run();
      checks.push({ name, ok: true, detail, ms: performance.now() - started });
      return value;
    } catch (error) {
      checks.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error), ms: performance.now() - started });
      return undefined;
    }
  }

  const notRun = (name: string, reason: string) => checks.push({ name, ok: false, detail: `not run: ${reason}`, ms: 0 });

  await step("the page", async () => {
    const response = await expectOk(await ask(url("/")));
    const type = response.headers.get("content-type") ?? "";
    if (!type.startsWith("text/html")) throw new Failed(`the page came as ${type || "nothing named"}, not HTML`);
    return { value: undefined, detail: "HTML" };
  });

  await step("the API's health", async () => {
    const health = (await (await expectOk(await ask(url("/api/health")))).json()) as { status: string; commit: string | null };
    if (health.status !== "ok") throw new Failed(`the API says ${health.status}`);
    if (options.commit && health.commit !== options.commit) {
      throw new Failed(`the API was built from ${health.commit ?? "an unnamed commit"}, not ${options.commit}`);
    }
    return { value: undefined, detail: `ok, built from ${health.commit ?? "an unnamed commit"}` };
  });

  const demo = await step("the demo", async () => {
    const project = (await (await expectOk(await ask(url("/api/demo")))).json()) as Project;
    return { value: project, detail: String(project.name ?? "a project") };
  });
  if (!demo) {
    notRun("the design run, streamed", "the demo did not come");
    notRun("the report's pages", "the demo did not come");
    return checks;
  }

  const option = await step("the design run, streamed", async () => {
    const response = await expectOk(await ask(url("/api/design"), post(demo)));
    if (!response.body) throw new Failed("the answer has no body");
    let last = "";
    let events = 0;
    for await (const event of readEvents(response.body)) {
      events += 1;
      last = event.event;
      if (event.event === "error") throw new Failed(`the run failed: ${event.data}`);
      if (event.event === "result") {
        const result = (JSON.parse(event.data) as { result: { options: Array<{ key: string }> } }).result;
        const first = result.options[0]?.key;
        if (!first) throw new Failed("the run found no option");
        return { value: first, detail: `${events} events, ${result.options.length} options, first ${first}` };
      }
    }
    throw new Failed(last ? `the stream ended after "${last}", without a result` : "the stream ended without an event");
  });
  if (!option) {
    notRun("the report's pages", "the design run did not finish");
    return checks;
  }

  await step("the report's pages", async () => {
    const response = await expectOk(await ask(url("/api/export/report-pages"), post({ ...demo, chosen_option: option })));
    const bytes = (await response.arrayBuffer()).byteLength;
    return { value: undefined, detail: `${bytes.toLocaleString("en")} bytes for ${option}` };
  });

  return checks;
}

function post(body: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

async function expectOk(response: Response): Promise<Response> {
  if (!response.ok) throw new Failed(`${response.status}: ${(await response.text()).slice(0, 200)}`);
  return response;
}
