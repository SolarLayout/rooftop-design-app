import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { DEMO } from "@/lib/home/home-view";

type Props = {
  /** Open the demo was pressed: it opens in the Studio. */
  onOpen: () => void;
  className?: string;
};

/**
 * Try the demo (V2 · 9, D105; audit V2-09): its title, one line of what it is, Open the demo; no figures, which the
 * Studio shows once it runs. On phone the line wraps beside the press, as the board draws it.
 */
export function DemoCard({ onOpen, className }: Props) {
  return (
    <section aria-label={DEMO.title} data-testid="demo-card" className={classNames("flex items-center gap-6 rounded-card border border-line bg-surface-1 p-5", className)}>
      <div className="flex min-w-0 grow flex-col gap-1">
        <h2 className="type-section">{DEMO.title}</h2>
        <p className="type-body-touch desktop:type-body text-text-2">{DEMO.line}</p>
      </div>
      <Button onClick={onOpen} className="shrink-0">
        {DEMO.action}
      </Button>
    </section>
  );
}
