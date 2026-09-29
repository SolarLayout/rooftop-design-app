"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/Sheet";
import type { Stop } from "@/components/ui/sheet-stops";
import { Example, Row, Section } from "./Example";

const ROWS = ["Module", "Tilt", "Orientation", "Row pitch", "Azimuth", "Shade-free window", "Design day"];

/** A room as the Studio has it on phone, between the top bar and the tab bar: the stage, and the sheet over it. */
function Room({ children }: { children: ReactNode }) {
  return (
    <div data-testid="room" className="relative h-120 w-full overflow-hidden rounded-row border border-line bg-ground">
      <p className="p-4 type-small text-text-3">The stage</p>
      {children}
    </div>
  );
}

function Inspector() {
  return (
    <ul className="px-4">
      {ROWS.map((row) => (
        <li key={row} className="flex h-16 items-center border-b border-line-subtle text-text-2">
          {row}
        </li>
      ))}
    </ul>
  );
}

export function Sheets() {
  const [stop, setStop] = useState<Stop>("half");

  return (
    <Section title="Bottom sheet">
      <Row label="On phone. Drag the handle, press it, or move it with the arrows">
        <div className="grid w-full max-w-97.5 gap-3">
          <Example name="sheet" caption="Half: half the room">
            <Room>
              <Sheet label="Inspector" stop={stop} onStop={setStop}>
                <Inspector />
              </Sheet>
            </Room>
            <p role="status" className="type-small text-text-2">
              The sheet is at <span data-testid="stop">{stop}</span>
            </p>
          </Example>
          <Example name="sheet-peek" caption="Peek: the handle and what is first">
            <Room>
              <Sheet label="Inspector" stop="peek" onStop={() => undefined}>
                <Inspector />
              </Sheet>
            </Room>
          </Example>
          <Example name="sheet-full" caption="Full: all of the room">
            <Room>
              <Sheet label="Inspector" stop="full" onStop={() => undefined}>
                <Inspector />
              </Sheet>
            </Room>
          </Example>
        </div>
      </Row>
    </Section>
  );
}
