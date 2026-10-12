// The key that hides and shows the work column (D99): ⌘ \ on a Mac, Ctrl \ elsewhere; never while a field takes the keys.

export type KeyFacts = { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean; isTyping: boolean };

export function isPanelKey({ key, metaKey, ctrlKey, altKey, shiftKey, isTyping }: KeyFacts): boolean {
  return key === "\\" && (metaKey || ctrlKey) && !altKey && !shiftKey && !isTyping;
}
