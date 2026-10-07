// Every section heading of an input panel has its help (D80): drawn by SectionHeading, which needs a topic, and never as
// a bare heading in the SECTION look. The few that may stand without a disc are named, each with its reason.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

export const COMPONENTS_DIR = resolve(import.meta.dir, "../../apps/web/components");

/** Headings in the SECTION look without a disc of their own, by file and the words of the line: why each is so. */
export const WITHOUT_A_DISC: Readonly<Record<string, string>> = {
  "shell/help/SectionHeading.tsx": "the heading that carries the disc",
  "studio/SystemVoltage.tsx · done": "\"Already done\" is in the System voltage decision card, whose disc is on \"Waiting for your choice\"",
  "kit/HelpDiscs.tsx": "the kit's example of a heading beside the disc",
  "shell/help/HelpSheet.tsx": "Related, in the help sheet itself: no input panel's section",
  "find/FirstStep.tsx": "Find's first step is itself the guide, with no input to explain; its ? stands beside the panel's title (D85)",
};

/** Lines drawing a heading in the SECTION look, from one file's text: the line's number and words. */
export function bareHeadingsIn(text: string): { line: number; words: string }[] {
  return text.split("\n").flatMap((words, index) => (/className=\{SECTION\}|,\s*SECTION\)\}/.test(words) ? [{ line: index + 1, words: words.trim() }] : []));
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : full.endsWith(".tsx") ? [full] : [];
  });
}

/** Every bare heading of the components that is not named in WITHOUT_A_DISC. */
export function headingsWithoutHelp(dir: string = COMPONENTS_DIR): string[] {
  return filesUnder(dir).flatMap((file) => {
    const path = relative(dir, file).split(sep).join("/");
    return bareHeadingsIn(readFileSync(file, "utf8"))
      .filter(({ words }) => !Object.keys(WITHOUT_A_DISC).some((named) => named === path || (named.startsWith(`${path} · `) && words.includes(named.slice(path.length + 3)))))
      .map(({ line, words }) => `${path}:${line} ${words}: draw it with SectionHeading and a topic, or name it in WITHOUT_A_DISC with why`);
  });
}
