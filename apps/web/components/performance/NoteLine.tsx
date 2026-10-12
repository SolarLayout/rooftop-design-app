import { Icon } from "@/components/ui/Icon";

/** A note of the engine on the weather, in its words (guidelines.md, "States": the exclamation mark and the reason): the mark of 18, then the words. */
export function NoteLine({ words, testId }: { words: string; testId: string }) {
  return (
    <li data-testid={testId} className="flex items-start gap-2.5 type-body-touch desktop:type-body text-text-2">
      <Icon name="note" size={18} className="mt-px shrink-0 text-accent" />
      <span>{words}</span>
    </li>
  );
}
