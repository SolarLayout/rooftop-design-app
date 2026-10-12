import Link from "next/link";
import { classNames } from "@/components/ui/class-names";
import { Icon, type IconName } from "@/components/ui/Icon";
import { pathOfWorkspace, WORKSPACES, type Lens, type Workspace } from "@/lib/routes";

type Props = {
  /** The workspace that is open; null where none is. */
  current: Workspace | null;
  /** The lens that was opened last: the Studio is entered there. */
  lens: Lens;
};

const TRACK = classNames(
  "hidden shrink-0 gap-1 rounded-row border border-line-subtle bg-well p-1 shadow-well",
  "tablet:flex desktop:rounded-row",
);
const ITEM = classNames(
  "relative flex h-9 items-center rounded-control px-4.5 font-medium whitespace-nowrap select-none",
  "press-motion focus-ring desktop:h-8 desktop:rounded-control desktop:font-medium",
);
const TAKEN = "bg-control-active text-text shadow-segment";
const NOT_TAKEN = "text-text-2 hovered:text-text";

/** The three workspaces, in the top bar of desktop and tablet. On phone they are the tab bar. */
export function WorkspaceNav({ current, lens }: Props) {
  return (
    <nav aria-label="Workspaces" className={TRACK}>
      {WORKSPACES.map(({ id, name }) => (
        <Link
          key={id}
          href={pathOfWorkspace(id, lens)}
          aria-current={id === current ? "page" : undefined}
          className={classNames(ITEM, id === current ? TAKEN : NOT_TAKEN)}
        >
          {/* What takes the pointer is higher than what is seen: the height of the well. */}
          <span data-testid="target" className="absolute inset-x-0 -inset-y-1 desktop:hidden" />
          {name}
        </Link>
      ))}
    </nav>
  );
}

const ICON: Record<Workspace, IconName> = { studio: "studio", performance: "performance", handover: "handover" };

const TAB = classNames(
  "flex flex-col items-center justify-center gap-1 rounded-row type-body-touch desktop:type-body whitespace-nowrap select-none",
  "press-motion focus-ring",
);

/** The three workspaces, at the bottom of the phone. */
export function TabBar({ current, lens }: Props) {
  return (
    <nav
      aria-label="Workspaces"
      className="grid h-tabbar-on-screen shrink-0 grid-cols-3 border-t border-line-subtle bg-chrome px-3 pt-1.5 pb-tabbar-foot-on-screen tablet:hidden"
    >
      {WORKSPACES.map(({ id, name }) => (
        <Link
          key={id}
          href={pathOfWorkspace(id, lens)}
          aria-current={id === current ? "page" : undefined}
          className={classNames(TAB, id === current ? "font-medium text-accent" : "text-text-2 hovered:text-text")}
        >
          <Icon name={ICON[id]} size={22} stroke="light" />
          {name}
        </Link>
      ))}
    </nav>
  );
}
