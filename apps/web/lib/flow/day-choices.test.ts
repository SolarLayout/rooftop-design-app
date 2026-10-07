import { expect, test } from "bun:test";
import { dateOf } from "./sun-time";
import { DAY_CHOICES } from "./day-choices";

test("each day's label is its date as the Sun lens writes it", () => {
  for (const { dayOfYear, label } of DAY_CHOICES) expect(dateOf(dayOfYear).short).toBe(label);
});
