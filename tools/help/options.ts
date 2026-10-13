// The options a one-choice section offers, as the code keeps them: a topic's `values` must name exactly these (the gate's
// option drift), and the manifest takes their labels from here, never from the topic.
import { ANY_DATE, DAY_CHOICES } from "../../apps/web/lib/flow/day-choices";
import { ROOF_TYPES } from "../../apps/web/lib/geometry/roof-types";
import { SHAPES } from "../../apps/web/lib/outline/shapes";
import { VOLTAGES } from "../../apps/web/lib/studio/voltages";

export type Option = { id: string; label: string };

export const OPTIONS_OF: Readonly<Record<string, () => readonly Option[]>> = {
  "studio.section.system-voltage": () => VOLTAGES.map((volts) => ({ id: String(volts), label: `${volts} V` })),
  "app.section.roof-type": () => ROOF_TYPES.map(({ id, name }) => ({ id, label: name })),
  "find.section.shape": () => SHAPES.map(({ value, label }) => ({ id: value, label })),
  "studio.section.the-sun-at-the-time": () => [...DAY_CHOICES.map(({ dayOfYear, label }) => ({ id: String(dayOfYear), label })), ANY_DATE],
};
