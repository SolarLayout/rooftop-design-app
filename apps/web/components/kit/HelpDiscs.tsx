"use client";

import { HelpDisc } from "@/components/shell/help/HelpDisc";
import { HelpProvider } from "@/components/shell/help/HelpProvider";
import type { ShownAs } from "@/components/ui/shown-as";
import { SECTION } from "@/components/ui/section-look";
import { Example, Row, Section } from "./Example";

const STATES: readonly { name: string; caption: string; shownAs?: ShownAs }[] = [
  { name: "help-disc", caption: "At rest; press it for the sheet" },
  { name: "help-disc-hover", caption: "Hover: lifted, its summary in the tooltip", shownAs: "hover" },
  { name: "help-disc-focus", caption: "Focus", shownAs: "focus" },
  { name: "help-disc-pressed", caption: "Pressed", shownAs: "pressed" },
];

/** The help's disc beside a section heading (components.md, "Help disc and help sheet"), in its states; it opens the sheet. */
export function HelpDiscs() {
  return (
    <HelpProvider>
      <Section title="Help disc">
        <Row label="Beside a section heading: the primary action's orange, a ? in its ink; it opens the help sheet">
          {STATES.map(({ name, caption, shownAs }) => (
            <Example key={name} name={name} caption={caption}>
              <span className="flex items-center gap-1.5">
                <span className={SECTION}>System voltage</span>
                <HelpDisc topic="studio.section.system-voltage" value="1500" {...(shownAs ? { shownAs } : {})} />
              </span>
            </Example>
          ))}
        </Row>
      </Section>
    </HelpProvider>
  );
}
