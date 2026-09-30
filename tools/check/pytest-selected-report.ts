// What tools/check/pytest-selected.ts and tools/check.ts agree on: the variable of --fresh and the prefix
// of the line the runner prints for the check's summary. Apart, so that importing them runs nothing.

export const FRESH_VARIABLE = "ROOFTOP_CHECK_FRESH";
/** "0": pytest runs whole and untraced, without pytest-testmon (GitHub, decision 4). */
export const SELECT_VARIABLE = "ROOFTOP_CHECK_SELECT";
export const REPORT_PREFIX = "check: pytest ";
