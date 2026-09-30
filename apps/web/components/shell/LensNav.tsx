import Link from "next/link";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LENSES, pathOfLens, type Lens } from "@/lib/routes";

/** Rail: at the left of the desktop. Row: floating over the stage of the tablet. Switch: in the sheet of the phone. */
export type LensLook = "rail" | "row" | "switch";

type Props = {
  current: Lens;
  look: LensLook;
  className?: string;
};

const ICON: Record<Lens, IconName> = { roof: "roof", array: "array", sun: "sun", strings: "strings" };

const WELL = "gap-1 rounded-card-s border border-line bg-well p-1 shadow-well";

const FRAME: Record<LensLook, string> = {
  rail: "w-rail shrink-0 flex-col items-center gap-1.5 border-r border-line-subtle bg-chrome py-3.5",
  row: WELL,
  switch: classNames("grid-cols-4", WELL),
};

const ITEM: Record<LensLook, string> = {
  rail: "size-14 flex-col justify-center gap-1 rounded-row type-label-s",
  row: "h-touch gap-2 rounded-control px-3.5",
  switch: "h-touch justify-center rounded-control type-body",
};

const TAKEN = "bg-control-active text-accent shadow-segment";
const NOT_TAKEN = "text-text-2 hovered:text-text";

/** The four lenses of the Studio. Each is a place of its own, so each is a link. */
export function LensNav({ current, look, className }: Props) {
  return (
    <nav aria-label="Lenses" className={classNames(FRAME[look], className)}>
      {LENSES.map(({ id, name }) => (
        <Link
          key={id}
          href={pathOfLens(id)}
          aria-current={id === current ? "page" : undefined}
          className={classNames(
            "flex items-center whitespace-nowrap select-none press-motion focus-ring",
            ITEM[look],
            id === current ? TAKEN : NOT_TAKEN,
            // The type style sets a weight; the one of the lens that is taken is said after it.
            id === current && (look === "row" ? "font-medium desktop:font-medium" : "font-medium"),
          )}
        >
          {look === "rail" ? <Icon name={ICON[id]} size={20} stroke="light" /> : null}
          {look === "row" ? <Icon name={ICON[id]} size={18} stroke="light" /> : null}
          {name}
        </Link>
      ))}
    </nav>
  );
}
