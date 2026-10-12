# 023: V2, the build on the owner's Mac, from #215 (Performance) to the end of the epic
Written: 2026-10-12, by the session that built #212 to #214 on the owner's Mac (merged in #225, #226, #228) and fixed the
engine's shade loss (#227). Status: open.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo, on the owner's Mac (not a cloud session). Read CLAUDE.md,
then plan/STATE.md (check it against git, the open pull requests and the code), then plan/SESSIONS.md. The owner's standing
instructions are in plan/STATE.md ("In flight"). His decision of 2026-10-11 holds: the browser tests are set aside, run no
browser group, write no new *.e2e.ts, `bun check --skip=e2e` is the check before every commit. A documents-only change goes
to main directly (D26); code goes through a pull request. Decisions closed in plan/STATE.md are not reopened. Never print or
commit NEXT_PUBLIC_ESRI_API_KEY; never read apps/web/.env.local. bun only. The test stack only (`bun dev:bg --profile test`,
the web's port in .dev/test/pids.json); never start or stop the owner's dev stack.

The owner's words of 2026-10-12, for pace: move fast without lowering the quality of the work. Prioritise the work over test
infrastructure. Once `bun check --skip=e2e` is green locally (everything GitHub's check runs), open the pull request and merge
it (`gh pr merge --squash --delete-branch`) without waiting long for GitHub's check. Tell the owner in a line after each part;
never go silent for a long stretch.

The work: build V2, the epic #207, issue after issue in the order of plan/v2/build.md and the epic's checklist (#208 to #214
are ticked), one issue, one branch from origin/main (`v2-NNN-<slug>`), one pull request, then the next. After each merge:
plan/STATE.md and the epic's checklist on main, and one message to the owner with the pull request's link. plan/v2/build.md
is the procedure; each issue on GitHub holds everything it needs: read it whole with its board (docs/design/mockups, or the
pictures linked in the issue: `gh api -H "Accept: application/vnd.github.raw" "repos/SolarLayout/rooftop-design-app/contents/
v2-boards/<Board>.jpg?ref=<sha in the issue>"`, cut into pieces of 1100 px to read).

Next: #215 (V2 · 8 · Performance), then #216, #217, #218, in that order. Two issues wait on the owner first: Present (#220):
show him today's Present beside board 13 at three sizes and build it only once he approves (D110); the help's topic list on
board 11 ("The topics"): approved or changed before #219. Ask for each when the build reaches it, and go on with the others
meanwhile. The hosted canvas is never stale: a board changed is published the same day and read back (plan/v2/build.md).

For each issue: test first (the pure logic in lib/ or a *-view.ts beside the component, a *.test.ts that fails first), build to
the board with tokens only, keep the help true (docs/help-upkeep.md; then `bun help:gen`), keep components.md and
guidelines.md true, `bun check --skip=e2e`, screenshots at 1440 × 900, 834 × 1194 and 390 × 844 from the test stack,
`bun tools/pr-shots.ts v2-NNN-<slug> <files>`, the pull request (What it does · How it was checked · Screenshots beside the
board's links · Not done · Closes #NNN), merge.

Traps learned in #208 to #214:
- A new folder of apps/web is placed in tools/check/e2e-groups.ts, then `bun tools/check/write-e2e-inputs.ts` writes
  turbo.json, and docs/checks.md names it. An import from components/shell (the base) into a group's own folder
  (lib/studio, components/studio, …) is refused by tools/check/e2e-group-imports.test.ts: keep what the shell needs in the
  shell or in lib/ parts of the base.
- A heading in the section's look needs its help or a line in tools/help/coverage.ts (WITHOUT_A_DISC) saying why.
- tools/help refuses a number typed with its unit in a topic ("1.5 m", "15°"): say it from the code, or in words.
- components/tokens-only.test.ts reads "#212" in a comment as a colour: write "issue 5" or "V2 · 5" in comments.
- On phone the result chip shows "1 to review" without the figure (and "No energy" when the run failed): a screenshot
  script that waits for "MWh" on phone waits forever; wait for /MWh|to review/.
- Screenshots: a Node script with @playwright/test from e2e/node_modules against the test stack, Chromium with
  `--use-gl=swiftshader`, the imagery routed to e2e/fixtures/imagery-tile.png and everything else off the machine aborted.
  Keep the scripts in a scratch folder outside the repo. Look at every picture before the pull request.
- This Mac: BSD sed (`sed -i ''`), no `timeout`; a push or fetch over ssh is refused now and then: try again.
- Python lines are at most 110 characters (ruff E501), docstrings included.

Near two thirds of your context: finish the issue in hand, update plan/STATE.md, and stop; ask the owner for the next prompt.
```

## Notes for the owner

- #212, #213 and #214 are merged (#225, #226, #228), and the engine's shade test that failed on your Mac only is fixed (#227).
- The session goes on with Performance (#215), Handover and Home (#216), phone and tablet (#217) and the vocabulary (#218).
- You are asked twice on the way: Present (#220), and the help's 31 topics before #219.
