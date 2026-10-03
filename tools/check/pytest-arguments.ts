// The arguments the check gives pytest before the hand's own (tools/check/pytest-selected.ts). Apart, so that they can
// be tested without running pytest.

/** How many workers pytest-xdist starts when the suite runs whole: one per core of the machine. */
export const EVERY_CORE = "auto";

/**
 * Selecting (the usual run here): pytest-testmon runs the tests whose code changed, in one process, since testmon's
 * tracing is of one process. Not selecting (GitHub, `ROOFTOP_CHECK_SELECT=0`): the suite runs whole, untraced, and
 * spread over every core by pytest-xdist, so that the runner's few cores finish it inside the job's time.
 */
export function pytestArguments(selecting: boolean): string[] {
  return selecting ? ["--testmon"] : ["-p", "no:testmon", "-n", EVERY_CORE];
}
