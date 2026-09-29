"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Toast } from "@/components/ui/Toast";
import { Toaster } from "@/components/ui/Toaster";
import { createToasts } from "@/components/ui/toast-queue";
import { Tooltip, TooltipShown } from "@/components/ui/Tooltip";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const MAP_NOT_LOADED = "The map was not loaded. Enter the dimensions by hand.";

export function TooltipsAndToasts({ onPress }: Props) {
  const [toasts] = useState(() => createToasts());

  return (
    <Section title="Tooltip and toast">
      <Row label="Tooltip: the name of a control that shows an icon or one word">
        <Example name="tooltip-shown" caption="As it looks, with a key">
          <span className="flex flex-col items-center gap-2">
            <TooltipShown shortcut="F">Fit the roof to the view</TooltipShown>
            <Button size="s" shownAs="hover">
              Fit
            </Button>
          </span>
        </Example>
        <Example name="tooltip" caption="Bring the pointer or the focus here">
          <Tooltip words="North is up in the view">
            <IconButton label="North up" icon="arrow-up" />
          </Tooltip>
        </Example>
        <Example name="tooltip-with-key" caption="With a key">
          <Tooltip words="Fit the roof to the view" shortcut="F">
            <Button size="s">Fit</Button>
          </Tooltip>
        </Example>
      </Row>
      <Row label="Toast">
        <div className="grid w-full max-w-115 gap-3">
          <Example name="toast-done" caption="Done. It leaves after 5 s">
            <Toast kind="done" words="pune-demo-roof.rtd was saved" />
          </Example>
          <Example name="toast-action" caption="Done, and it can be undone">
            <Toast kind="done" words="Stair room was removed" action={{ label: "Undo", onPress: () => undefined }} />
          </Example>
          <Example name="toast-note" caption="A note. It stays until it is closed">
            <Toast kind="note" words={MAP_NOT_LOADED} onClose={() => undefined} />
          </Example>
        </div>
      </Row>
      <Row label="Where toasts are shown: at the bottom of the screen">
        <Button onClick={() => toasts.show({ kind: "done", words: "pune-demo-roof.rtd was saved" })}>Save the project</Button>
        <Button
          onClick={() =>
            toasts.show({
              kind: "done",
              words: "Stair room was removed",
              action: { label: "Undo", run: () => onPress("Undo, the stair room is back") },
            })
          }
        >
          Remove the stair room
        </Button>
        <Button onClick={() => toasts.show({ kind: "note", words: MAP_NOT_LOADED })}>Load the map</Button>
      </Row>
      <Toaster toasts={toasts} />
    </Section>
  );
}
