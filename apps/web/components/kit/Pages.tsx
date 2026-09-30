import Link from "next/link";
import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";

/** The pages of the kit, in their order. The browser tests have the same list (e2e/tests/kit.e2e.ts). */
export const PAGES = [
  { path: "/kit", heading: "Controls, depth and motion", lead: "Light comes from above. What you press is raised. What you type into is recessed." },
  { path: "/kit/part-2", heading: "Controls, part 2", lead: "What opens, what waits and what answers." },
  { path: "/kit/shell", heading: "Shell", lead: "What the three workspaces share, in every state." },
] as const;

type Props = {
  path: (typeof PAGES)[number]["path"];
  /** Says what was pressed last, for the tests. */
  lastPressed: string | null;
  children: ReactNode;
};

const LINK = "flex h-touch items-center rounded-row px-3.5 focus-ring desktop:h-9 desktop:rounded-control";

/** A page of the kit: its title, the way to the other pages, what was pressed last, and its sections. */
export function KitPage({ path, lastPressed, children }: Props) {
  const page = PAGES.find((one) => one.path === path) ?? PAGES[0];

  return (
    <main className="flex flex-col gap-7 px-page-x-phone py-page-y tablet:px-page-x-tablet desktop:px-page-x-desktop">
      <header className="flex flex-col gap-2">
        <h1 className="type-page">{page.heading}</h1>
        <p className="max-w-130 text-text-2">{page.lead}</p>
        <nav aria-label="Pages of the kit" className="flex flex-wrap gap-1">
          {PAGES.map((one) => (
            <Link
              key={one.path}
              href={one.path}
              aria-current={one.path === path ? "page" : undefined}
              className={classNames(
                LINK,
                one.path === path ? "bg-control-active font-medium text-text" : "text-text-2 hovered:text-text",
              )}
            >
              {one.heading}
            </Link>
          ))}
        </nav>
        <p data-testid="kit-last-pressed" role="status" className="type-small text-text-2">
          Last pressed: {lastPressed ?? "nothing yet"}
        </p>
      </header>
      {children}
    </main>
  );
}
