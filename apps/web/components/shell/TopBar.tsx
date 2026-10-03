import { Button } from "@/components/ui/Button";
import { iconButtonLook } from "@/components/ui/button-look";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { classNames } from "@/components/ui/class-names";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { HANDOVER, type Lens, type Workspace } from "@/lib/routes";
import { Logo } from "./Logo";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { SaveState, type Saving } from "./SaveState";
import type { DeviceRow } from "./switcher-view";
import { WorkspaceNav } from "./WorkspaceNav";

type Props = {
  /** The name of the design that is open; null while none is. */
  name: string | null;
  place: string | null;
  workspace: Workspace | null;
  /** The lens that was opened last. */
  lens: Lens;
  saving: Saving;
  /** How many notes there are to review. */
  notes: number;
  onOpenNotes: () => void;
  /** Import a drawing was taken in the project switcher. */
  onImport: () => void;
  /** The name was edited in the project switcher (plan/phase-09-plan.md, decision 13). */
  onRename?: (name: string) => void;
  /** Save a copy was taken in the project switcher (plan/phase-09-plan.md, step 8). */
  onSaveACopy?: () => void;
  /** The designs kept on this device, for the project switcher (plan/phase-10-plan.md, step 5). */
  designs?: readonly DeviceRow[];
  /** A design of the device was taken in the project switcher. */
  onOpenDesign?: (id: string) => void;
};

const BAR = classNames(
  "flex h-topbar shrink-0 items-center gap-2 pr-2 pl-4",
  "tablet:h-topbar-tablet tablet:gap-3.5 tablet:border-b tablet:border-line-subtle tablet:bg-chrome tablet:px-5",
  "desktop:h-topbar desktop:gap-5",
);

// The word of a button that shows its icon alone where there is no room for it.
const WORD_WHERE_THERE_IS_ROOM = "sr-only tablet-wide:not-sr-only";
const WORD_FROM_DESKTOP = "sr-only desktop:not-sr-only";

export const WHY_NOT_PRESENT = "Comes with Home and projects";

/** Present comes with Home and the projects on the device: until then it is shown and cannot be used. */
export function Present({ className }: { className?: string }) {
  return (
    <Tooltip words={WHY_NOT_PRESENT}>
      <Button size="s" icon="play" aria-disabled="true" className={classNames("w-touch px-0 desktop:w-auto desktop:px-3.5", className)}>
        <span className={WORD_FROM_DESKTOP}>Present</span>
      </Button>
    </Tooltip>
  );
}

/** Export leads to Handover, where every file of the design is. */
export function Export() {
  return (
    <ButtonLink
      kind="primary"
      size="s"
      icon="download"
      href={HANDOVER}
      className="w-touch px-0 tablet-wide:w-auto tablet-wide:px-4"
    >
      <span className={WORD_WHERE_THERE_IS_ROOM}>Export</span>
    </ButtonLink>
  );
}

const countOf = (notes: number) => (notes === 0 ? "Nothing to review" : notes === 1 ? "1 note to review" : `${notes} notes to review`);

/** The bar at the top of the three workspaces. */
export function TopBar({ name, place, workspace, lens, saving, notes, onOpenNotes, onImport, onRename, onSaveACopy, designs, onOpenDesign }: Props) {
  return (
    <header className={BAR}>
      <Logo />
      <span className="hidden h-6 w-px shrink-0 bg-line desktop:block" />
      <ProjectSwitcher
        name={name}
        place={place}
        saving={saving}
        onOpenNotes={onOpenNotes}
        onImport={onImport}
        onSaveACopy={onSaveACopy}
        onRename={onRename}
        designs={designs}
        onOpenDesign={onOpenDesign}
      />
      <span className="grow" />
      <WorkspaceNav current={workspace} lens={lens} />
      <span className="hidden grow tablet:block" />
      <div className="flex shrink-0 items-center gap-2 tablet:gap-3.5 desktop:gap-3">
        {/* Where the bar is short of room, what the project switcher says too goes first. */}
        <SaveState state={saving} onOpenNotes={onOpenNotes} className="hidden desktop-wide:flex" />
        <span className="flex tablet:hidden">
          <button type="button" aria-label={countOf(notes)} onClick={onOpenNotes} className={iconButtonLook("quiet", "l", "square")}>
            {notes === 0 ? (
              <Icon name="tick" stroke="tick" size={22} className="text-ok" />
            ) : (
              <Icon name="note" size={22} className="text-accent" />
            )}
          </button>
        </span>
        <span className="hidden tablet-wide:flex">
          <Present />
        </span>
        <Export />
      </div>
    </header>
  );
}
