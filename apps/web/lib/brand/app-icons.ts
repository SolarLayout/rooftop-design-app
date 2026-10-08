/** An icon of the installed app: its file under `/app-icons/`, its side, and whether its corners are its own. */
export type AppIcon = {
  file: string;
  size: number;
  /** `maskable`: drawn to the edges, for a launcher that cuts its own shape out of it. */
  purpose: "any" | "maskable";
  rounded: boolean;
};

/** The icons of the manifest (issue 147). */
export const APP_ICONS: readonly AppIcon[] = [
  { file: "192.png", size: 192, purpose: "any", rounded: true },
  { file: "512.png", size: 512, purpose: "any", rounded: true },
  { file: "maskable-512.png", size: 512, purpose: "maskable", rounded: false },
];

/** The Apple touch icon: to the edges, as iOS rounds it itself. */
export const APPLE_ICON: AppIcon = { file: "apple-icon.png", size: 180, purpose: "any", rounded: false };

export const APP_ICONS_PATH = "/app-icons";

export function appIconNamed(file: string): AppIcon | null {
  return APP_ICONS.find((icon) => icon.file === file) ?? null;
}
