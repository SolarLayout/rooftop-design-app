import { Card } from "@/components/ui/Card";
import { Stat, Stats } from "@/components/ui/Stat";
import { StatusMark } from "@/components/ui/StatusMark";
import { Example, Row, Section } from "./Example";

export function StatusMarks() {
  return (
    <Section title="Status marks">
      <Row label="With their words">
        <Example name="status-fits" caption="Fits">
          <StatusMark kind="fits" label="Fits" />
        </Example>
        <Example name="status-note" caption="Note">
          <StatusMark kind="note" label="Does not fit, with the reason" />
        </Example>
      </Row>
      <Row label="Alone, where there is no room for words">
        <Example name="status-fits-alone" caption="Fits, 16">
          <StatusMark kind="fits" label="In target" wordsShown={false} size={16} />
        </Example>
        <Example name="status-note-alone" caption="Note, 16">
          <StatusMark kind="note" label="Below the DC/AC target" wordsShown={false} size={16} />
        </Example>
        <Example name="status-note-large" caption="Note, 22">
          <StatusMark kind="note" label="1 note to review" wordsShown={false} size={22} />
        </Example>
      </Row>
    </Section>
  );
}

export function Cards() {
  return (
    <Section title="Raised: cards">
      <Row label="Card">
        <Example name="card" caption="Card">
          <Card data-testid="card">
            <p className="type-section">Assumptions</p>
            <p className="text-text-2">Radius 18, padding 24</p>
          </Card>
        </Example>
        <Example name="card-compact" caption="Compact">
          <Card compact data-testid="card">
            <p className="type-section">Demo project</p>
            <p className="text-text-2">Radius 14, padding 14</p>
          </Card>
        </Example>
        <Example name="card-selected" caption="Selected">
          <Card compact selected data-testid="card">
            <p className="type-section">Option A</p>
            <p className="text-text-2">The one that is chosen</p>
          </Card>
        </Example>
      </Row>
    </Section>
  );
}

export function StatExamples() {
  return (
    <Section title="Stats">
      <Row label="Vitals">
        <Example name="stat-lead" caption="Lead">
          <Stats>
            <Stat look="lead" label="Energy, year 1" value="617.8" unit="MWh" />
          </Stats>
        </Example>
        <Example name="stat-cell" caption="Cell">
          <Stats>
            <Stat label="DC capacity" value="357.28" unit="kWp" />
          </Stats>
        </Example>
        <Example name="stat-with-mark" caption="With a mark">
          <Stats>
            <Stat
              label="DC/AC"
              value="1.30"
              mark={<StatusMark kind="fits" label="In target" wordsShown={false} size={16} />}
            />
          </Stats>
        </Example>
        <Example name="stat-of" caption="With words for a unit">
          <Stats>
            <Stat label="Modules" value="638" unit="of 790" />
          </Stats>
        </Example>
      </Row>
      <Row label="Tiles inside a card">
        <Example name="stat-tile" caption="Tile">
          <Card compact>
            <Stats className="grid grid-cols-3 gap-2">
              <Stat look="tile" label="P50" value="617.8" />
              <Stat look="tile" label="P75" value="600.2" />
              <Stat look="tile" label="P90" value="584.2" />
            </Stats>
          </Card>
        </Example>
      </Row>
    </Section>
  );
}
