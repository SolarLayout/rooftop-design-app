import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";

// The soak of Present (plan/phase-10-plan.md, step 21, decision 11; the acceptance of the phase file): the tour runs for
// thirty minutes on the real clock; every minute the frame times of the minute and the heap of the page are read and a
// row is printed; at the end the whole is judged by the acceptance: no frame over 50 ms, the heap not grown by more than
// a quarter. Run once by the session with `bun tools/present-soak.ts`; its numbers go into "As built".

const MINUTES = Number(process.env.ROOFTOP_SOAK_MINUTES ?? 30);
const A_MINUTE = 60_000;
const RUN = 90_000;
const BUDGET_MS = 50;
const HEAP_GROWTH_ALLOWED = 1.25;

type Minute = { frames: number; mean: number; p99: number; longest: number; over: number; heap: number | null };

/** The frames of one minute, sampled with requestAnimationFrame in the page, and the heap at its end. */
async function minuteOf(page: Page): Promise<Minute> {
  return page.evaluate(
    (length) =>
      new Promise<Minute>((resolve) => {
        const heap = () => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null;
        const took: number[] = [];
        const began = performance.now();
        let last = began;
        function frame(now: number) {
          took.push(now - last);
          last = now;
          if (now - began < length) return requestAnimationFrame(frame);
          const sorted = [...took].sort((a, b) => a - b);
          resolve({
            frames: took.length,
            mean: took.reduce((sum, one) => sum + one, 0) / took.length,
            p99: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))]!,
            longest: sorted[sorted.length - 1]!,
            over: took.filter((one) => one > 50).length,
            heap: heap(),
          });
        }
        requestAnimationFrame(frame);
      }),
    A_MINUTE,
  );
}

const mb = (bytes: number | null) => (bytes === null ? "n/a" : (bytes / 1_048_576).toFixed(1));
const cell = (value: string | number, width: number) => String(value).padStart(width);

test("Present runs for thirty minutes within the frame budget, the memory level", async ({ page }) => {
  test.setTimeout(MINUTES * A_MINUTE + 5 * A_MINUTE);
  await page.goto("/present");
  await expect(page.getByTestId("present")).toHaveAttribute("data-state", "touring", { timeout: RUN });
  await expect(page.getByTestId("present-modules")).toContainText("modules", { timeout: RUN });

  console.log(`\nPresent soak: ${MINUTES} minutes on ${page.url()}, ${process.env.ROOFTOP_SOAK_GPU === "1" ? "the machine's graphics" : "software WebGL"}.`);
  console.log(`${cell("min", 4)} ${cell("frames", 7)} ${cell("mean ms", 8)} ${cell("p99 ms", 7)} ${cell("max ms", 7)} ${cell(">50", 4)} ${cell("heap MB", 8)}`);
  const minutes: Minute[] = [];
  for (let minute = 1; minute <= MINUTES; minute += 1) {
    const read = await minuteOf(page);
    minutes.push(read);
    console.log(`${cell(minute, 4)} ${cell(read.frames, 7)} ${cell(read.mean.toFixed(1), 8)} ${cell(read.p99.toFixed(1), 7)} ${cell(read.longest.toFixed(1), 7)} ${cell(read.over, 4)} ${cell(mb(read.heap), 8)}`);
  }

  const longest = Math.max(...minutes.map((minute) => minute.longest));
  const over = minutes.reduce((sum, minute) => sum + minute.over, 0);
  const first = minutes[0]!.heap;
  const last = minutes[minutes.length - 1]!.heap;
  console.log(`\nLongest frame ${longest.toFixed(1)} ms; ${over} frames over ${BUDGET_MS} ms; heap ${mb(first)} MB at the first minute, ${mb(last)} MB at the last.\n`);

  await expect(page.getByTestId("present")).toHaveAttribute("data-state", "touring");
  expect(over, `${over} frames over ${BUDGET_MS} ms, the longest ${longest.toFixed(1)} ms`).toBe(0);
  if (first !== null && last !== null) expect(last, `the heap grew from ${mb(first)} MB to ${mb(last)} MB`).toBeLessThanOrEqual(first * HEAP_GROWTH_ALLOWED);
});
