/** Joins class names and leaves out what is not one. */
export function classNames(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
