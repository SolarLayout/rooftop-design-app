// The screenshots of a pull request (docs/screenshots.md): kept on the orphan branch pr-shots, never on main, one folder a
// pull request, and linked from its description by the commit that holds them, so a link never changes. Pure; the git of
// it is tools/pr-shots.ts.

/** "Owner/repo" of a GitHub remote's address, SSH or HTTPS; null for another host. */
export function repoOf(remote: string): string | null {
  const found = /github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/.exec(remote.trim());
  return found?.[1] ?? null;
}

/** What is wrong with a folder's name, in words; none when it is right. */
export function problemsOfFolder(folder: string): string[] {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(folder) ? [] : [`"${folder}": a folder is lower-case words and numbers joined by -, such as help-topics-roof`];
}

/** Where a file is kept on pr-shots: its own name, under the pull request's folder. */
export function publishedPathOf(folder: string, file: string): string {
  return `${folder}/${file.split("/").pop() ?? file}`;
}

/**
 * The link of a screenshot as GitHub shows it in a pull request of a private repository: the file at the commit, by
 * github.com with ?raw=true, which GitHub serves to those who can read the repository. Never raw.githubusercontent.com:
 * without a token it answers 404, and the picture does not show.
 */
export function linkOf(repo: string, commit: string, published: string): string {
  return `https://github.com/${repo}/blob/${commit}/${published}?raw=true`;
}

/** A row of a table per screenshot, its name beside it: to paste into the description and fill in. */
export function markdownOf(urls: readonly string[]): string {
  return urls.map((url) => `| ${(url.split("/").pop() ?? url).replace(/\.[a-z]+$/, "")} | ![](${url}) |`).join("\n");
}
