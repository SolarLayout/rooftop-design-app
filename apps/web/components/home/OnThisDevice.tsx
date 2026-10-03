import { classNames } from "@/components/ui/class-names";
import { onThisDeviceWordsOf } from "@/lib/home/home-view";

type Props = {
  /** How many designs are kept on this device. */
  count: number;
  className?: string;
};

export const ON_THIS_DEVICE = "On this device";

/** The section "On this device" of the approved board: its label and its words; the cards come with step 12. */
export function OnThisDevice({ count, className }: Props) {
  return (
    <section aria-label={ON_THIS_DEVICE} className={classNames("flex flex-col gap-1.5", className)}>
      <h2 className="type-section text-text-3">{ON_THIS_DEVICE}</h2>
      <p className="text-text-2">{onThisDeviceWordsOf(count)}</p>
    </section>
  );
}
