// The files of a tree that a list of turbo input globs names: the positive patterns scanned, the files any
// negative pattern matches taken out. Dotfiles count, as they do for turbo. For the tests of the groups.

export function filesMatching(patterns: string[], root: string): Set<string> {
  const positive = patterns.filter((pattern) => !pattern.startsWith("!"));
  const negative = patterns.filter((pattern) => pattern.startsWith("!")).map((pattern) => new Bun.Glob(pattern.slice(1)));
  const files = new Set<string>();
  for (const pattern of positive) {
    for (const file of new Bun.Glob(pattern).scanSync({ cwd: root, dot: true, onlyFiles: true })) {
      if (!negative.some((glob) => glob.match(file))) files.add(file);
    }
  }
  return files;
}
