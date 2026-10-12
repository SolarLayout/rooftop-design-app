import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { RunStep } from "@/components/ui/RunStep";
import { Skeleton } from "@/components/ui/Skeleton";
import { Example, Row, Section } from "./Example";

const STEP = "Computing hourly shading for every module";

// The widths of a label and of its value, for three cells of the vitals.
const CELLS = [
  { label: "w-18.5", value: "w-28" },
  { label: "w-16", value: "w-23" },
  { label: "w-13", value: "w-17.5" },
];

export function Waiting() {
  return (
    <Section title="Progress ring and skeleton">
      <Row label="Turning: how far is not known">
        <Example name="ring-turning" caption="16, beside a value">
          <ProgressRing label="Updating energy" />
        </Example>
        <Example name="ring-saving" caption="12, the state of saving">
          <ProgressRing size={12} label="Saving" />
        </Example>
        <Example name="ring-beside-words" caption="Beside its words">
          <span className="inline-flex items-center gap-inline">
            <ProgressRing />
            Updating energy
          </span>
        </Example>
      </Row>
      <Row label="With an arc: how far, from the engine">
        <Example name="ring-arc" caption="20, how far">
          <ProgressRing size={20} share={0.62} label={STEP} />
        </Example>
        <Example name="ring-number" caption="44, on the stage">
          <ProgressRing size={44} share={0.62} label={STEP} numberShown />
        </Example>
      </Row>
      <Row label="A run, with the step of the engine">
        <div data-testid="kit-run" className="w-full max-w-97.5">
          <RunStep step={STEP} share={0.62} />
        </div>
      </Row>
      <Row label="Skeleton: in the place of values that were never there">
        <div className="w-full max-w-97.5">
          <Example name="skeleton-values" caption="A label over its value">
            <div className="grid h-vitals w-full grid-cols-3 rounded-card border border-line bg-surface-1">
              {CELLS.map((cell, index) => (
                <div
                  key={cell.value}
                  className={classNames("flex min-w-0 flex-col justify-center gap-2.5 px-4.5", index > 0 && "border-l border-line")}
                >
                  <Skeleton kind="label" className={cell.label} />
                  <Skeleton kind="value" className={cell.value} />
                </div>
              ))}
            </div>
          </Example>
        </div>
        <Example name="skeleton-lead" caption="The lead value">
          <div className="flex flex-col gap-2.5">
            <Skeleton kind="label" className="w-18.5" />
            <Skeleton kind="lead" className="w-30" />
          </div>
        </Example>
      </Row>
      <Row label="In the place of text">
        <Example name="skeleton-text" caption="Lines of different lengths">
          <div className="flex w-75 max-w-full flex-col gap-2.5">
            <Skeleton kind="text" className="w-55" />
            <Skeleton kind="text" className="w-75" />
            <Skeleton kind="text" className="w-40" />
          </div>
        </Example>
      </Row>
    </Section>
  );
}
