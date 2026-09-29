import { Button } from "@/components/ui/Button";
import type { ButtonKind, ButtonSize } from "@/components/ui/button-look";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { IconButton } from "@/components/ui/IconButton";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const KINDS: Array<{ kind: ButtonKind; title: string; label: string }> = [
  { kind: "primary", title: "Primary", label: "Export" },
  { kind: "secondary", title: "Secondary", label: "Replace" },
  { kind: "quiet", title: "Quiet", label: "Undo" },
];

const SIZES: Array<{ size: ButtonSize; caption: string }> = [
  { size: "s", caption: "s: 36, in bars" },
  { size: "m", caption: "m: 40" },
  { size: "l", caption: "l: 44, in toolbars" },
  { size: "xl", caption: "xl: 56, the action of a panel" },
];

export function Buttons({ onPress }: Props) {
  return (
    <Section title="Raised: buttons">
      {KINDS.map(({ kind, title, label }) => (
        <Row key={kind} label={title}>
          <Example name={`button-${kind}-rest`} caption="Rest">
            <Button kind={kind} onClick={() => onPress(`${label}, ${kind}`)}>
              {label}
            </Button>
          </Example>
          <Example name={`button-${kind}-hover`} caption="Hover">
            <Button kind={kind} shownAs="hover" tabIndex={-1}>
              {label}
            </Button>
          </Example>
          <Example name={`button-${kind}-pressed`} caption="Pressed">
            <Button kind={kind} shownAs="pressed" tabIndex={-1}>
              {label}
            </Button>
          </Example>
          <Example name={`button-${kind}-focus`} caption="Focus">
            <Button kind={kind} shownAs="focus" tabIndex={-1}>
              {label}
            </Button>
          </Example>
          <Example name={`button-${kind}-disabled`} caption="Disabled">
            <Button kind={kind} disabled onClick={() => onPress(`${label}, ${kind}, disabled`)}>
              {label}
            </Button>
          </Example>
        </Row>
      ))}

      <Row label="Sizes">
        {SIZES.map(({ size, caption }) => (
          <Example key={size} name={`button-size-${size}`} caption={caption}>
            <Button kind="primary" size={size} onClick={() => onPress(`Build this roof, ${size}`)}>
              Build this roof
            </Button>
          </Example>
        ))}
      </Row>

      <Row label="With an icon, and as a link">
        <Example name="button-with-icon" caption="Icon before the label">
          <Button kind="primary" icon="download" onClick={() => onPress("Export, with an icon")}>
            Export
          </Button>
        </Example>
        <Example name="button-secondary-with-icon" caption="Secondary">
          <Button icon="play" onClick={() => onPress("Present")}>
            Present
          </Button>
        </Example>
        <Example name="button-link" caption="A link">
          <ButtonLink kind="primary" href="/">
            Open the demo
          </ButtonLink>
        </Example>
      </Row>

      <Row label="Icon only">
        <Example name="icon-button-secondary" caption="Secondary">
          <IconButton label="Next page" icon="chevron-right" onClick={() => onPress("Next page")} />
        </Example>
        <Example name="icon-button-primary" caption="Primary">
          <IconButton label="Export" icon="download" iconSize={18} kind="primary" size="l" onClick={() => onPress("Export, icon only")} />
        </Example>
        <Example name="icon-button-quiet" caption="Quiet">
          <IconButton label="Undo" icon="undo" iconSize={18} kind="quiet" size="m" onClick={() => onPress("Undo, icon only")} />
        </Example>
        <Example name="icon-button-round" caption="Round">
          <IconButton label="Play the day" icon="play" iconSize={14} kind="primary" size="xs" shape="round" onClick={() => onPress("Play the day")} />
        </Example>
        <Example name="icon-button-disabled" caption="Disabled">
          <IconButton label="Previous page" icon="chevron-left" disabled />
        </Example>
      </Row>
    </Section>
  );
}
