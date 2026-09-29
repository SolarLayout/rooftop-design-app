import type { Locator, Page } from "@playwright/test";

/** One example on the /kit page, by the name the page gives it. */
export function example(page: Page, name: string): Locator {
  return page.getByTestId(`kit-${name}`);
}

/** The control inside an example. */
export function control(page: Page, name: string, role: "button" | "link" = "button"): Locator {
  return example(page, name).getByRole(role);
}

export const COLOUR = {
  accent: "rgb(255, 176, 32)",
  accentHover: "rgb(255, 190, 71)",
  accentPressed: "rgb(233, 156, 18)",
  accentInk: "rgb(26, 18, 4)",
  control: "rgb(21, 26, 34)",
  controlHover: "rgb(27, 33, 43)",
  controlPressed: "rgb(16, 20, 26)",
  lineStrong: "rgb(47, 56, 71)",
  lineHover: "rgb(59, 70, 88)",
  line: "rgb(35, 42, 54)",
  surface1: "rgb(18, 22, 29)",
  surface2: "rgb(24, 29, 38)",
  noteSurface: "rgb(30, 26, 16)",
  ok: "rgb(61, 214, 160)",
  text: "rgb(242, 244, 247)",
  text2: "rgb(169, 178, 192)",
  transparent: "rgba(0, 0, 0, 0)",
} as const;

export const isDesktop = (projectName: string) => projectName === "desktop";
