// The day of the report is the reader's, as the browser's clock has it, sent to the API as YYYY-MM-DD (plan/phase-09-plan.md,
// decision 2). Pure.

const twoDigits = (value: number) => String(value).padStart(2, "0");

/** The day of *date* in local time, as the API's query parameter `day` takes it. */
export function localDayOf(date: Date): string {
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}

/** Today, as the browser has it. */
export const todayOfTheBrowser = () => localDayOf(new Date());
