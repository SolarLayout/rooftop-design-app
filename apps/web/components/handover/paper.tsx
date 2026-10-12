// The paper frame of a page of the report (components.md, "Paper preview"): color-paper, radius 6, shadow-panel, as high as
// the page it shows. The report's preview and the CAD layout's plan share it.

import type { ComponentProps } from "react";

/** The paper: the page's image stands at its width with its own size, so that nothing jumps while it loads. */
export const PAPER = "block w-full min-w-0 overflow-hidden rounded-control bg-paper shadow-panel";
export const PAGE_IMAGE = "block h-auto w-full";

/** The engine's page as the browser's own img: a data URL the API answered, which next/image could neither fetch nor size better. */
export function PageImage({ alt, ...rest }: ComponentProps<"img"> & { alt: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- a data URL from the API; next/image adds nothing to it
  return <img alt={alt} {...rest} />;
}
