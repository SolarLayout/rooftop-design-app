"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LensNav } from "@/components/shell/LensNav";
import { NotesDrawer, NotesPanel } from "@/components/shell/NotesDrawer";
import { ProjectMenu, ProjectSwitcher, ProjectTrigger } from "@/components/shell/ProjectSwitcher";
import { SaveState } from "@/components/shell/SaveState";
import { Export, Present, TopBar } from "@/components/shell/TopBar";
import { Vitals } from "@/components/shell/Vitals";
import { TabBar, WorkspaceNav } from "@/components/shell/WorkspaceNav";
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
      <span className="type-caption text-text-2">{caption}</span>
    </div>
  );
}

// The vitals stand on the ground of the stage, which the bar floats over.
const STAGE = "-mx-4 rounded-row bg-ground py-4 tablet:mx-0 desktop:p-5";

export function TopBars({ onPress }: Props) {
  return (
    <Section title="Top bar and navigation">
      <Wide name="topbar" caption="The top bar: 56 on desktop and phone, 60 on tablet">
        {/* As wide as the screen, as the top bar is: out of the card and of the page around it. */}
        <div className="-mx-10.25 bg-ground tablet:-mx-11.25 desktop:-mx-16.25">
          <TopBar
            {...DESIGN}
            workspace="studio"
            lens="array"
            saving="not-kept"
            notes={1}
            onOpenNotes={() => onPress(OPEN_THE_NOTES)}
            onImport={() => onPress("Import a drawing")}
            onOpenProject={() => onPress("Open a project")}
            onRename={(name) => onPress(`Rename, ${name}`)}
            onSaveACopy={() => onPress("Save a copy")}
          />
        </div>
      </Wide>
      <Row label="The workspaces: in the top bar on desktop and tablet, a tab bar at the bottom of the phone">
        <Example name="workspaces" caption="In the top bar">
          <WorkspaceNav current="studio" lens="array" />
        </Example>
        <Wide name="tabbar" caption="The tab bar of the phone">
          <div className="-mx-4 tablet:mx-0">
            <TabBar current="studio" lens="array" />
          </div>
        </Wide>
      </Row>
      <Row label="The lenses of the Studio: a rail on desktop, a row on tablet, a switch in the sheet of the phone">
        <Wide name="lenses" caption="The lens that is open is in the accent">
          <LensNav current="array" look="rail" className="hidden self-start rounded-row py-3.5 desktop:flex" />
          <LensNav current="array" look="row" className="hidden self-start tablet:flex desktop:hidden" />
          <LensNav current="array" look="switch" className="grid tablet:hidden" />
        </Wide>
      </Row>
      <Row label="Present, which comes with a later phase, and Export">
        <Example name="present" caption="Shown, and cannot be used yet">
          <Present />
        </Example>
        <Example name="export" caption="Leads to Handover">
          <Export />
        </Example>
      </Row>
    </Section>
  );
}

export function VitalsStates({ onPress }: Props) {
  const openNotes = () => onPress(OPEN_THE_NOTES);

  return (
    <Section title="Vitals">
      <Wide name="vitals-design" caption="The design: seven values, and the notes to review">
        <div className={STAGE}>
          <Vitals view={VITALS.design} onOpenNotes={openNotes} />
        </div>
      </Wide>
      <Wide name="vitals-updating" caption="Updating: the values of before stay, dimmed; the last cell says the step and how far">
        <div className={STAGE}>
          <Vitals view={VITALS.updating} onOpenNotes={openNotes} />
        </div>
      </Wide>
      <Wide name="vitals-loading" caption="First load: no value was ever there">
        <div className={STAGE}>
          <Vitals view={VITALS.loading} onOpenNotes={openNotes} />
        </div>
      </Wide>
      <Wide name="vitals-failed" caption="The run failed: the last good values stay, not dimmed">
        <div className={STAGE}>
          <Vitals view={VITALS.failed} onOpenNotes={openNotes} />
        </div>
      </Wide>
      <Wide name="vitals-waiting" caption="Before a system voltage: the roof and the positions, and what is waited for">
        <div className={STAGE}>
          <Vitals view={VITALS.waiting} onOpenNotes={openNotes} />
        </div>
      </Wide>
      <Wide name="vitals-nothing-to-review" caption="Nothing to review">
        <div className={STAGE}>
          <Vitals view={VITALS.nothingToReview} onOpenNotes={openNotes} />
        </div>
      </Wide>
      <Wide name="vitals-outside-target" caption="DC/AC outside the target: an exclamation mark, never a cross">
        <div className={STAGE}>
          <Vitals view={VITALS.outsideTarget} onOpenNotes={openNotes} />
        </div>
      </Wide>
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
            <NotesPanel notes={NOTES} onClose={() => undefined} onTryAgain={() => onPress(TRY_AGAIN)} titleId="kit-notes-title" />
          </div>
        </Wide>
        <Wide name="notes-none" caption="Nothing to review">
          <div className="-mx-4 flex justify-end rounded-row bg-ground tablet:mx-0 tablet:h-50">
            <NotesPanel notes={NO_NOTES} onClose={() => undefined} onTryAgain={() => undefined} titleId="kit-no-notes-title" />
          </div>
        </Wide>
      </Row>
      <Row label="Open them: the focus goes in, stays in, and goes back">
        <Button onClick={() => setOpen(true)}>Open the notes</Button>
      </Row>
      <NotesDrawer open={open} notes={NOTES} onClose={() => setOpen(false)} onTryAgain={() => onPress(TRY_AGAIN)} />
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
