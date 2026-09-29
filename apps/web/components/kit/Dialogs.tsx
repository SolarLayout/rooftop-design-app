"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogPanel, type DialogAction } from "@/components/ui/Dialog";
import { Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const TITLE = "Open another project?";
const TEXT = "Pune demo roof has changes that are not saved on this device. Save a copy first, or they are lost.";

export function Dialogs({ onPress }: Props) {
  const [open, setOpen] = useState(false);

  function close(what: string) {
    setOpen(false);
    onPress(`Dialog, ${what}`);
  }

  const actions: DialogAction[] = [
    { label: "Cancel", kind: "quiet", onPress: () => close("Cancel") },
    { label: "Save a copy", kind: "secondary", onPress: () => close("Save a copy") },
    { label: "Open", kind: "primary", onPress: () => close("Open") },
  ];
  const still: DialogAction[] = actions.map((action) => ({ ...action, onPress: () => undefined }));

  return (
    <Section title="Dialog">
      <Row label="As it looks: in the middle of a dimmed screen; on phone a bottom sheet">
        <div data-testid="kit-dialog" className="flex w-full justify-center rounded-row border border-line-subtle bg-dim pt-10 tablet:p-10">
          <DialogPanel title={TITLE} actions={still} onClose={() => undefined} names={{ title: "kit-dialog-title", text: "kit-dialog-text" }}>
            {TEXT}
          </DialogPanel>
        </div>
      </Row>
      <Row label="Open it: the focus goes in, stays in, and goes back">
        <Button onClick={() => setOpen(true)}>Open a project</Button>
      </Row>
      <Dialog open={open} title={TITLE} actions={actions} onClose={() => close("closed")}>
        {TEXT}
      </Dialog>
    </Section>
  );
}
