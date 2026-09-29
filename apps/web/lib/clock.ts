// What waits for a time to pass. A store or a flow without React is given its clock, so that a test can
// give its own and let the time pass when it says so.

export type Clock = {
  /** Runs `run` after the time has passed. What comes back gives the waiting up. */
  after: (milliseconds: number, run: () => void) => () => void;
};

export const CLOCK_OF_THE_BROWSER: Clock = {
  after(milliseconds, run) {
    const timer = setTimeout(run, milliseconds);
    return () => clearTimeout(timer);
  },
};
