// What a drop or the file chooser gives to a field that takes one file (FileDrop).

/** The one file that was given, or null. Of several it is the first: the field takes one file. */
export function fileOf(files: ArrayLike<File> | null): File | null {
  return files?.[0] ?? null;
}

/** Whether what is held over the field is a file of the device, and not a piece of text or a link. */
export function carriesFiles(kinds: ArrayLike<string>): boolean {
  return Array.from(kinds).includes("Files");
}
