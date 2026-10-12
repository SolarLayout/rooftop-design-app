import { hintOf, type SetBy } from "@/lib/studio/set-by";

type Props = {
  setBy: SetBy;
  /** Gives the default back, as one edit that can be undone; only for the user's value. */
  onReset?: () => void;
};

/** Who set a field, under its label (V2 · 3): "Default", "From the weather", or "Yours · default 0.90 m · Reset". */
export function SetByHint({ setBy, onReset }: Props) {
  const canReset = setBy.kind === "yours" && onReset !== undefined;
  return (
    <span data-testid="set-by">
      {hintOf(setBy)}
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
