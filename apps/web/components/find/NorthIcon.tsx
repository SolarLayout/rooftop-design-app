/** The north arrow of the map's north button: the arrowhead in accent, the letter in text. */
export function NorthIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5.5 shrink-0">
      <path d="M12 2.5 15 9H9z" className="fill-accent" />
      <path d="M9.5 19v-7l5 7v-7" className="fill-none stroke-text stroke-icon-light" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
