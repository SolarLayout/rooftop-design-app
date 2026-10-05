// Whether a change reaches what is deployed: anything but documents does. Documents go to main directly (decision D26)
// and must not redeploy staging (plan/phase-12-plan.md, decision 7).

const DOCUMENTS = [new Bun.Glob("plan/**"), new Bun.Glob("docs/**"), new Bun.Glob("**/*.md")];

export function isDocument(path: string): boolean {
  return DOCUMENTS.some((glob) => glob.match(path));
}

export function codeChanged(paths: string[]): boolean {
  return paths.map((path) => path.trim()).some((path) => path !== "" && !isDocument(path));
}
