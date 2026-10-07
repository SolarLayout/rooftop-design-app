import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";
import { SECTION } from "@/components/ui/section-look";
import type { HelpKey } from "@/lib/help/manifest.gen";
import { HelpDisc } from "./HelpDisc";

type Props = {
  /** The topic of the section (D80): its disc stands 6 after the words. */
  help: HelpKey;
  /** The section's own value, marked among the topic's options in the sheet. */
  value?: string;
  id?: string;
  className?: string;
  children: ReactNode;
};

/** The heading of a section of an input panel, in the heading's orange, with the ? of its help beside it. */
export function SectionHeading({ help, value, id, className, children }: Props) {
  return (
    <div className={classNames("flex items-center gap-1.5", className)}>
      <h2 id={id} className={SECTION}>
        {children}
      </h2>
      <HelpDisc topic={help} {...(value === undefined ? {} : { value })} />
    </div>
  );
}
