import type { Clock } from "./clock";

/** A clock for tests: it goes on only when it is told to. */
export function clockOfTheTest() {
  let now = 0;
  let waiting: Array<{ at: number; run: () => void }> = [];
  const clock: Clock = {
    after(milliseconds, run) {
      const entry = { at: now + milliseconds, run };
      waiting.push(entry);
      return () => {
        waiting = waiting.filter((one) => one !== entry);
      };
    },
  };
  function pass(milliseconds: number) {
    now += milliseconds;
    const due = waiting.filter((one) => one.at <= now).sort((a, b) => a.at - b.at);
    waiting = waiting.filter((one) => one.at > now);
    due.forEach((one) => one.run());
  }
  return { clock, pass, waiting: () => waiting.length };
}
