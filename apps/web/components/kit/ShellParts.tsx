"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { NotesDrawer, NotesPanel } from "@/components/shell/NotesDrawer";
import { ProjectMenu, ProjectSwitcher, ProjectTrigger } from "@/components/shell/ProjectSwitcher";
import { SaveState } from "@/components/shell/SaveState";
import { ResultChip } from "@/components/shell/ResultChip";
import { resultChipOf, summaryOf } from "@/components/shell/result-view";
import { StepNav, StepTabBar } from "@/components/shell/StepNav";
import { Present, TopBar } from "@/components/shell/TopBar";
import type { Step, StepState } from "@/lib/flow/steps";
import { Example, Row, Section } from "./Example";
import { DESIGN, NO_NOTES, NOTES, ON_THIS_DEVICE, VITALS } from "./shell-examples";

type Props = { onPress: (what: string) => void };

const OPEN_THE_NOTES = "Open the notes";
const TRY_AGAIN = "Try again";

/** An example that takes the width it is given: a bar, a row of cards. */
function Wide({ name, caption, children }: { name: string; caption: string; children: React.ReactNode }) {
  return (
    <div data-testid={`kit-${name}`} className="flex w-full min-w-0 flex-col gap-1.5">
      {children}
      <span className="type-body-touch desktop:type-body text-text-2">{caption}</span>
    </div>
  );
}

// The order of work in a few of its states (D95): on Find before Build, half way with a step that waits, near the end.
const ON_FIND: Record<Step, StepState> = { roof: "to-do", array: "closed", strings: "closed", performance: "closed", handover: "closed" };
const HALF_WAY: Record<Step, StepState> = { roof: "done", array: "done", strings: "needs-you", performance: "to-do", handover: "to-do" };
const NEAR_THE_END: Record<Step, StepState> = { roof: "done", array: "done", strings: "done", performance: "done", handover: "to-do" };

export function TopBars({ onPress }: Props) {
  return (
    <Section title="Top bar and the order of work">
      <Wide name="topbar" caption="The top bar: the mark, the design, the five steps, the result, Docs; 56 on desktop and phone, 60 on tablet">
        {/* As wide as the screen, as the top bar is: out of the card and of the page around it. */}
        <div className="-mx-10.25 bg-ground tablet:-mx-11.25 desktop:-mx-16.25">
          <TopBar
            {...DESIGN}
            saving="not-kept"
            step="array"
            states={HALF_WAY}
            result={resultChipOf(VITALS.design)}
            summary={summaryOf(VITALS.design)}
            onOpenNotes={() => onPress(OPEN_THE_NOTES)}
            onTryAgain={() => onPress("Try again")}
            onImport={() => onPress("Import a drawing")}
            onOpenProject={() => onPress("Open a project")}
            onRename={(name) => onPress(`Rename, ${name}`)}
            onSaveACopy={() => onPress("Save a copy")}
          />
        </div>
      </Wide>
      <Row label="The steps in the top bar of desktop and tablet: a tick when done, the note mark when it needs you, else the number">
        <Example name="steps-find" caption="On Find, before Build: the steps after Roof cannot be gone to">
          <StepNav current="roof" states={ON_FIND} />
        </Example>
        <Example name="steps-half-way" caption="On Array: Roof done, Strings needs you">
          <StepNav current="array" states={HALF_WAY} />
        </Example>
        <Example name="steps-near-the-end" caption="On Handover">
          <StepNav current="handover" states={NEAR_THE_END} />
        </Example>
      </Row>
      <Wide name="tabbar" caption="The steps at the foot of the phone">
        <div className="-mx-4 tablet:mx-0">
          <StepTabBar current="array" states={HALF_WAY} />
        </div>
      </Wide>
      <Row label="Present, at the head of Performance and Handover">
        <Example name="present" caption="Leads to Present, the tour on the whole screen">
          <Present />
        </Example>
      </Row>
    </Section>
  );
}

export function ResultStates({ onPress }: Props) {
  const openNotes = () => onPress(OPEN_THE_NOTES);
  const examples = [
    { name: "result", caption: "The result: the energy of year 1; pressed, the summary", view: VITALS.nothingToReview },
    { name: "result-review", caption: "With a note to review", view: VITALS.design },
    { name: "result-updating", caption: "A new result on its way: the last one dimmed, the ring", view: VITALS.updating },
    { name: "result-computing", caption: "The first result on its way", view: VITALS.loading },
    { name: "result-stale", caption: "The run failed after a result: the last one stays, dimmed and marked", view: VITALS.failed },
    { name: "result-problem", caption: "The run failed with no result before it", view: VITALS.notComputed },
  ];

  return (
    <Section title="The result">
      <Row label="At the top bar's right, on every step (D95)">
        {examples.map(({ name, caption, view }) => (
          <Example key={name} name={name} caption={caption}>
            <ResultChip chip={resultChipOf(view)} summary={summaryOf(view)} onOpenNotes={openNotes} onTryAgain={() => onPress("Try again")} />
          </Example>
        ))}
      </Row>
    </Section>
  );
}

export function NotesToReview({ onPress }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Section title="Notes to review">
      <Row label="As they look: a drawer from the right on desktop and tablet, a bottom sheet on phone">
        <Wide name="notes" caption="Two notes">
          <div className="-mx-4 flex justify-end rounded-row bg-ground tablet:mx-0 tablet:h-105">
            <NotesPanel notes={NOTES} onClose={() => undefined} onTryAgain={() => onPress(TRY_AGAIN)} onEnterValue={(id, value) => onPress(`Enter ${id} ${value}`)} titleId="kit-notes-title" />
          </div>
        </Wide>
        <Wide name="notes-none" caption="Nothing to review">
          <div className="-mx-4 flex justify-end rounded-row bg-ground tablet:mx-0 tablet:h-50">
            <NotesPanel notes={NO_NOTES} onClose={() => undefined} onTryAgain={() => undefined} onEnterValue={() => undefined} titleId="kit-no-notes-title" />
          </div>
        </Wide>
      </Row>
      <Row label="Open them: the focus goes in, stays in, and goes back">
        <Button onClick={() => setOpen(true)}>Open the notes</Button>
      </Row>
      <NotesDrawer open={open} notes={NOTES} onClose={() => setOpen(false)} onTryAgain={() => onPress(TRY_AGAIN)} onEnterValue={(id, value) => onPress(`Enter ${id} ${value}`)} />
    </Section>
  );
}

export function ProjectAndSaving({ onPress }: Props) {
  const openNotes = () => onPress(OPEN_THE_NOTES);

  return (
    <Section title="Project switcher and state of saving">
      <Row label="The project switcher. On phone and tablet it opens as a bottom sheet">
        <Example name="switcher" caption="Closed; press it">
          <ProjectSwitcher {...DESIGN} saving="not-kept" onOpenNotes={openNotes} onImport={() => onPress("Import a drawing")} onOpenProject={() => onPress("Open a project")} onSaveACopy={() => onPress("Save a copy")} onRename={(name) => onPress(`Rename, ${name}`)} />
        </Example>
      </Row>
      <Row label="Open, as it looks">
        <Wide name="switcher-open" caption="This design, the designs on this device, what can be done">
          <ProjectTrigger {...DESIGN} open className="self-start" />
          <div className="desktop:w-85">
            <ProjectMenu name={DESIGN.name} saving="not-kept" onOpenNotes={openNotes} onImport={() => onPress("Import a drawing")} onOpenProject={() => onPress("Open a project")} onTake={() => undefined} onSaveACopy={() => onPress("Save a copy")} onRename={(name) => onPress(`Rename, ${name}`)} />
          </div>
        </Wide>
        <Wide name="switcher-designs" caption="Designs on this device: the newest edited first, the open one with the tick, the capacity or the roof under the name (plan phase 10, step 5)">
          <div className="desktop:w-85">
            <ProjectMenu
              name={DESIGN.name}
              saving="saved"
              onOpenNotes={openNotes}
              onImport={() => onPress("Import a drawing")}
              onOpenProject={() => onPress("Open a project")}
              onTake={() => undefined}
              onSaveACopy={() => onPress("Save a copy")}
              onRename={(name) => onPress(`Rename, ${name}`)}
              designs={ON_THIS_DEVICE}
              onOpenDesign={(id) => onPress(`Open, ${id}`)}
            />
          </div>
        </Wide>
        <Wide name="switcher-rename" caption="The name edited: Rename turns the row into the text field (plan phase 9, decision 13)">
          <div className="desktop:w-85">
            <ProjectMenu name={DESIGN.name} saving="not-kept" onOpenNotes={openNotes} onImport={() => onPress("Import a drawing")} onOpenProject={() => onPress("Open a project")} onTake={() => undefined} onSaveACopy={() => onPress("Save a copy")} onRename={(name) => onPress(`Rename, ${name}`)} shownAs="renaming" />
          </div>
        </Wide>
      </Row>
      <Row label="The state of saving: in the top bar on desktop, in the project switcher on tablet and phone">
        <Example name="saving-saved" caption="Saved">
          <SaveState state="saved" onOpenNotes={openNotes} />
        </Example>
        <Example name="saving-saving" caption="Saving">
          <SaveState state="saving" onOpenNotes={openNotes} />
        </Example>
        <Example name="saving-not-kept" caption="The demo, and every design before designs are kept">
          <SaveState state="not-kept" onOpenNotes={openNotes} />
        </Example>
        <Example name="saving-not-saved" caption="Could not be saved: it opens the notes">
          <SaveState state="not-saved" onOpenNotes={openNotes} />
        </Example>
      </Row>
    </Section>
  );
}
