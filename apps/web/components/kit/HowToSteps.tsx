import { Key, Mark, Picture, Pointer, Step, Steps, Touch } from "@/components/shell/help/help-steps";
import { Example, Row, Section } from "./Example";

/** A how-to's steps and pictures (components.md, "How-to steps and pictures"; D81), as the help sheet shows them. */
export function HowToSteps() {
  return (
    <Section title="How-to steps and pictures">
      <Row label="Numbered steps, a picture of the app with its callouts, the words of the hand in use; the width of the help sheet">
        <Example name="how-to-steps" caption="Two steps; a ring round what to act on, a callout beside it; the second plays a clip">
          <div className="w-95">
            <Steps>
              <Step title="It is picked">
                Its outline brightens, and the round handle appears above it.
                <Picture src="/help/find/move-the-roof/2.jpg" alt="The roof picked: a brighter outline, and a round handle above its top edge" width={1038} height={544}>
                  <Mark n={1} x={42.2} y={10.7} ring>
                    The round handle, to turn it
                  </Mark>
                </Picture>
              </Step>
              <Step title="Drag it into place">
                <Pointer>
                  Drag inside the roof. The arrow keys nudge it, further with <Key>Shift</Key>.
                </Pointer>
                <Touch>Drag with one finger inside the roof.</Touch>
                <Picture clip="/help/find/move-the-roof/3.mp4" length="0:06" src="/help/find/move-the-roof/3.jpg" alt="The roof dragged to the right and down, a dashed outline where it was" width={1038} height={544}>
                  <Mark n={1} x={33.7} y={52.8}>
                    How far it has moved
                  </Mark>
                  <Mark n={2} x={11.6} y={27.2}>
                    Where it was
                  </Mark>
                </Picture>
              </Step>
            </Steps>
          </div>
        </Example>
      </Row>
    </Section>
  );
}
