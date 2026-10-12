import { classNames } from "@/components/ui/class-names";

type Props = {
  /** Where the name stands beside the mark: on desktop alone (the top bar), or from tablet up (Home, V2 · 9). */
  wordmark?: "desktop" | "from-tablet";
};

/** The mark of the product, and its name. */
export function Logo({ wordmark = "desktop" }: Props) {
  return (
    <span className="flex shrink-0 items-center gap-2.5">
      <svg viewBox="0 0 26 26" role="img" aria-label="SolarLayout Rooftop" className="size-7 shrink-0 fill-none desktop:size-6.5">
        <rect x="1" y="1" width="24" height="24" rx="7" className="fill-accent" />
        <path d="M6 17.5 13 8l7 9.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent-ink stroke-icon" />
        <path d="M9.5 17.5h7" strokeLinecap="round" className="stroke-accent-ink stroke-icon" />
      </svg>
      {/* The mark says the name already. */}
      <span aria-hidden="true" className={classNames("type-section", wordmark === "desktop" ? "hidden desktop:block" : "hidden tablet:block")}>
        SolarLayout <span className="font-medium text-text-2">Rooftop</span>
      </span>
    </span>
  );
}
