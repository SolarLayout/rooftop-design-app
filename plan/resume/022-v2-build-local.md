# 022: V2, the build, on the owner's Mac: finish #212 (Problems), then the rest of the epic
Written: 2026-10-12, by the cloud session that built #208 to #211 (merged in #221 to #224) and began #212. Status: open.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo, on the owner's Mac (not a cloud session). Read CLAUDE.md,
then plan/STATE.md (check it against git, the open pull requests and the code), then plan/SESSIONS.md. The owner's standing
instructions are in plan/STATE.md ("In flight"); his decision of 2026-10-11 holds: the browser tests are set aside, run no
browser group, write no new *.e2e.ts, `bun check --skip=e2e` is the check before every commit. A documents-only change goes
to main directly (D26); code goes through a pull request. Decisions closed in plan/STATE.md are not reopened. Never print or
commit NEXT_PUBLIC_ESRI_API_KEY; never read apps/web/.env.local. bun only. The test stack only (`bun dev:bg --profile test`,
the web's port in .dev/test/pids.json); never start or stop the owner's dev stack.

The work: build V2, the epic #207, issue after issue in the order of plan/v2/build.md and the epic's checklist (#208 to #211
are ticked), one issue, one branch from origin/main, one pull request, merged on a green check, then the next, without
stopping. After each merge: plan/STATE.md and the epic's checklist on main, and one message to the owner with the pull
request's link. plan/v2/build.md is the procedure; each issue on GitHub holds everything it needs, read it whole with its
board (canvas page "V2", https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy, or docs/design/mockups).

First: #212, V2 · 5 · Problems. Part of it is done and pushed, not merged:
- `git fetch origin && git checkout -b v2-212-problems origin/main && git cherry-pick 45944db` (the commit "V2 · 5 ·
  Problems, in progress" on origin/claude/upbeat-thompson-q3vu1y; ignore that branch's merge commits).
- Done in it: lib/errors/problem-of.ts and its test (a failure to title, cause, remedy, actions, details; no machine word
  in the first two lines; noStringsFitProblemOf with the voltage that fits as the step's primary; whenOf; the time in the
  details is optional, as voice §5's table has it); Failure carries `status` and `details` (optional), failureOf gives the
  app's fault as "The app could not finish this step." with the fault behind Details; the downloads' and the weather
  load's words follow; lib/errors placed in the base of the browser groups (tools/check/e2e-groups.ts, turbo.json,
  docs/checks.md).
- To build, each with its test first:
  1. A `Problem` component in components/ui (note mark 18, the title strong, cause and remedy in one paragraph text-2,
     a button per action, Details as a disclosure in mono, role="alert"), on note-surface as the board draws it.
  2. The result chip's six states in components/shell/result-view.ts: computing, the result, updating (dimmed, the ring),
     to review, failed ("Energy not computed", nothing before), stale ("Showing the last result", the value dimmed: today
     a failed run with a result before is drawn as the plain result, which is wrong); no options: "Energy not computed".
     Pressed, a failed or stale chip opens the Problem with Try again (the shell's flow.tryAgain()).
  3. No string length fits: the Problem at the Strings step's head (StepHead takes a problem), with Choose another
     inverter and Change the sizing temperatures; "Use 1000 V" (from the voltage words' offer, D87/D88) as the step's
     primary with "Allowed on most commercial roofs. Check the site's code first."; it replaces NothingFits' card there.
  4. Notes to review (NotesDrawer, notes-view): "Values outside the usual range. Each one says how to fix it."; each note
     its usual range, "Enter the datasheet's value.", the Voc coefficient's field in the note, and "Keep <value>", which
     enters the value (an entered coefficient ends the note).
  5. The stale state at the step's head: "Energy not updated · The server could not be reached after your last change.
     The result shown is from before the change." with Try again; "Showing the last result" elsewhere, in place of "Values
     are of the design before" (vitals-view, notes-view, Handover, the report preview).
  6. A choice that no longer fits (use-says-choice-gone, lib/flow/choice-gone.ts): "Your stringing no longer fits. Option
     A is used." with Undo and Choose another.
  7. The weather CSV's refusal in WeatherCsvDialog until the file changes: "This file cannot be used", the API's words,
     the detail behind Details (CSV_REFUSED_TITLE is in problem-of.ts).
  8. The Strings step while the strings are sized: the options' skeleton and "Sizing the strings · a few seconds".
  9. The search without its service: SEARCH_UNAVAILABLE in components/shell/Search.tsx; the API's "cannot be read"
     words in lib/api/errors.ts ("Try again; if it fails again, report it" is never said, voice §5).
  Then the help (system-voltage, modules-in-series, options, module), the docs (components.md, guidelines.md), the
  screenshots, the pull request (Closes #212), the merge, STATE and the epic.

Then #213, #214, #215, #216, #217, #218 in that order. Two issues wait on the owner first: Present (#220): show him today's
Present beside board 13 and build it only once he approves (D110); the help's topic list on board 11 ("The topics"): approved
or changed before #219. Go on with the others meanwhile. The hosted canvas is never stale: a board changed is published the
same day and read back (plan/v2/build.md).

Traps learned in #208 to #211:
- A new folder of apps/web is placed in tools/check/e2e-groups.ts (the base for a part every page sees), then
  `bun tools/check/write-e2e-inputs.ts` writes turbo.json, and docs/checks.md names it; the tools' tests say when it is not.
- A heading in the section's look needs its help or a line in tools/help/coverage.ts (WITHOUT_A_DISC) saying why.
- components/tokens-only.test.ts reads "#212" in a comment as a colour: write "issue 5" or "V2 · 5" in comments.
- A shared part of two workspaces lives in components/shell (SummaryRow, use-section-open, use-screen-size,
  use-share-under moved there): an import across groups is refused.
- Screenshots: a Node script with @playwright/test from e2e/node_modules against the test stack, the imagery routed to
  e2e/fixtures/imagery-tile.png and everything else off the machine aborted (the cloud's scripts were of this kind);
  `bun tools/pr-shots.ts <folder> <files>` prints the links for the description, beside the board's images at
  github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/<Board>.jpg?raw=true.
- Find's browser suites (find*.e2e.ts, by-hand.e2e.ts), e2e/help-pictures/on-find.ts and tools/help/pictures.ts still
  describe the Find of before V2 · 4: they are brought up to date when the browser tests run again and when #219 retakes
  the help's pictures.
- With the gh CLI here, `gh pr create`, `gh pr checks --watch` and `gh pr merge --squash` do what the cloud did by MCP.

Near two thirds of your context: finish the issue in hand, update plan/STATE.md, and stop; ask the owner for the next prompt.
```

## Notes for the owner

- #208 to #211 are merged (#221 to #224). #212 is a third done, its logic pushed as one commit; the session above finishes
  it from there, on a branch of its own.
- You are asked twice on the way, as before: Present (#220), and the help's 31 topics before #219.
