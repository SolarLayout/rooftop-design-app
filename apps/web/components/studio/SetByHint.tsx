import { hintOf, type SetBy } from "@/lib/studio/set-by";

type Props = {
  setBy: SetBy;
  /** The words in place of the plain hint: "Default · measure it on site" (V2 · 7). */
  words?: string;
  /** Gives the default back, as one edit that can be undone; only for the user's value. */
  onReset?: () => void;
};

/** Who set a field, under its label (V2 · 3): "Default", "From the weather", or "Yours · default 0.90 m · Reset". */
export function SetByHint({ setBy, words, onReset }: Props) {
  const canReset = setBy.kind === "yours" && onReset !== undefined;
  return (
    <span data-testid="set-by">
      {words ?? hintOf(setBy)}
      {canReset ? (
        <>
          {" · "}
          <button type="button" onClick={onReset} className="cursor-pointer text-text-2 underline-offset-2 focus-ring hovered:text-text hovered:underline">
            Reset
          </button>
        </>
      ) : null}
    </span>
  );
}
