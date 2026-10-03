// The beginning of a file's name, as the API makes it of the project's name (apps/api/src/rooftop_api/services/export.py,
// file_stem): the row shows the name before the download, so it must be the one the API writes (plan/phase-09-plan.md,
// decision 9). The seven cases of the API's test are this file's test.

/** What a file system refuses, and whitespace: each run of them splits the name. */
const NOT_IN_A_FILE_NAME = /[\\/:*?"<>|\s\u0000-\u001f\u007f]+/;
const LONGEST_NAME = 80;
const NAMELESS = "rooftop-design";

/** Strips dots from both ends of a word, as Python's str.strip(".") does. */
const withoutDotsAtTheEnds = (word: string) => word.replace(/^\.+|\.+$/g, "");

/** The name of a project as the beginning of a file name: no path, nothing a file system refuses. */
export function fileStemOf(name: string): string {
  const words = name.split(NOT_IN_A_FILE_NAME).map(withoutDotsAtTheEnds);
  const joined = words.filter((word) => word !== "").join("-");
  return joined.slice(0, LONGEST_NAME).replace(/[-.]+$/, "") || NAMELESS;
}

/** The project file's name, `<stem>.rtd`. */
export const projectFileNameOf = (name: string) => `${fileStemOf(name)}.rtd`;
