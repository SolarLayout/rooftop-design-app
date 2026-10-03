// The words of a text field: what Enter or leaving the field makes of the draft (docs/design/components.md, "Text field").

export type TextRules = {
  /** The most characters the value may have; what is longer is cut. The input takes no more either. */
  maxLength: number;
  /** What the field says when the entry is empty or blank, which is refused: "A name is needed". */
  needed: string;
};

export type CommittedText = { value: string; said: string | null };

/** The draft trimmed and cut; empty, the value of before with the words of why. */
export function committedText(draft: string, before: string, { maxLength, needed }: TextRules): CommittedText {
  const trimmed = draft.trim();
  if (trimmed === "") return { value: before, said: needed };
  return { value: trimmed.slice(0, maxLength), said: null };
}
