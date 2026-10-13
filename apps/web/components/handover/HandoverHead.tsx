import { FirstMeeting } from "@/components/shell/FirstMeeting";
import { Present } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { classNames } from "@/components/ui/class-names";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { sizeOf } from "@/lib/flow/deliverables/items";

type Props = {
  /** The zip of every file can be made: there is a chosen option. */
  canDownload: boolean;
  /** The zip is on its way. */
  isOnItsWay: boolean;
  /** The zip's size in bytes, once it came; null before. */
  bytes: number | null;
  onDownloadAll: () => void;
};

const DOWNLOAD_ALL = "Download all";

/** "Download all · 373 KB" once the zip's size is known; the words alone before. */
const wordsOf = (bytes: number | null) => (bytes === null ? DOWNLOAD_ALL : `${DOWNLOAD_ALL} · ${sizeOf(bytes)}`);

function DownloadAll({ canDownload, isOnItsWay, bytes, onDownloadAll, className }: Props & { className?: string }) {
  const can = canDownload && !isOnItsWay;
  return (
    <Button
      kind="primary"
      size="xl"
      icon={isOnItsWay ? undefined : "download"}
      aria-disabled={can ? undefined : "true"}
      onClick={can ? onDownloadAll : undefined}
      data-testid="download-all"
      className={className}
    >
      {isOnItsWay ? <ProgressRing size={16} /> : null}
      {wordsOf(bytes)}
    </Button>
  );
}

/**
 * The head of Handover (V2 · 9, D105; D95): the title with its line the first time the word is met (D96), Present, and
 * Download all with the zip's size, the page's one primary. Export and Save a copy are gone: the project file is a file of
 * the list. On touch Download all is pinned at the page's foot (`PinnedDownloadAll`).
 */
export function HandoverHead(props: Props) {
  return (
    <header className="flex items-start justify-between gap-4 px-page-x-phone pt-6 tablet:px-page-x-tablet desktop:px-0 desktop:pt-0">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="type-title-touch desktop:type-title">Handover</h1>
        <FirstMeeting word="Handover" />
      </div>
      <div className="hidden shrink-0 items-center gap-3 desktop:flex">
        <Present />
        <DownloadAll {...props} />
      </div>
    </header>
  );
}

/** On touch, Download all across the foot of the list, over the tab bar on phone; on tablet with Present before it. */
export function PinnedDownloadAll(props: Props) {
  return (
    <div className={classNames("sticky bottom-0 mt-auto flex items-center justify-end gap-3 border-t border-line-subtle bg-chrome px-page-x-phone py-3", "tablet:px-page-x-tablet desktop:hidden")}>
      {/* Present on tablet alone: the phone's room is Download all's (Present hides itself there). */}
      <Present />
      <DownloadAll {...props} className="w-full tablet:w-auto" />
    </div>
  );
}
