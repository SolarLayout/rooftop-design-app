# 021: V2, the build: the epic's issues one after the other, without stopping
Written: 2026-10-12, by the cloud session that drew V2's boards and filed the epic. Status: open.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo, in a Claude Code cloud session. Read CLAUDE.md, then
plan/STATE.md (check it against git, the open pull requests and the code), then plan/SESSIONS.md. The owner's standing
instructions are in plan/STATE.md ("In flight"); his decision of 2026-10-11 holds: the browser tests are set aside, run no
browser group, `bun check --skip=e2e` is the check before every commit. A documents-only change goes to main directly
(D26); code goes through a pull request. Decisions closed in plan/STATE.md are not reopened.

The cloud differs from the owner's Mac (resume 019 says it in full): no gh CLI (use the GitHub MCP tools), no Playwright
MCP (a Node script in the scratchpad with @playwright/test from e2e/node_modules, Chromium at /opt/pw-browsers), the test
stack only (`bun dev:bg --profile test`, web on the port in .dev/test/pids.json), never print or commit
NEXT_PUBLIC_ESRI_API_KEY, never read apps/web/.env.local.

The work: build V2, the epic #207 on GitHub, its thirteen sub-issues #208 to #220, in the order of plan/v2/build.md, one
issue, one branch reset to origin/main, one pull request, merged on a green check, then the next, without stopping. The
owner's words: "Set things up in such a way that you should be able to complete all the work autonomously till all the
issues are implemented without stopping. I will send you messages when I see something amiss, or you hit a problem which
absolutely needs my hands."
- plan/v2/build.md is the procedure: the loop of twelve steps for every issue, deciding alone, when to stop, done.
- Each issue holds everything it needs (its board, the audit lines, scope in and out, words, help, tests, done when); its
  copy is in plan/v2/issues/. Read the issue on GitHub whole before starting it, and its board on the canvas page "V2"
  (https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy) or in docs/design/mockups.
- Start with the first issue of the epic's checklist that is not ticked (#208 if none is). The epic's checklist and
  plan/STATE.md say where the build stands.
- Two issues wait on the owner first: Present (#220): show him today's Present beside board 13 and build only once he
  approves (D110); and the help's topic list on board 11 ("The topics"): approved or changed before #219. Go on with the
  other issues meanwhile.
- The hosted canvas is never stale (non-negotiable): any board you change is published the same day and read back
  (plan/v2/build.md, "The canvas is never stale").
- Each pull request: test first, tokens only, the help kept true (docs/help-upkeep.md), screenshots at 1440, 834 and 390
  beside the board through `bun tools/pr-shots.ts`, `Closes #<issue>`. After the merge: plan/STATE.md and the epic's
  checklist on main, and one message to the owner with the pull request's link.
- Near two thirds of your context: finish the issue in hand, update plan/STATE.md, and stop; the next session starts
  from this prompt.

Before stopping: plan/STATE.md ("In flight": the issues merged, the one in hand, what waits on the owner; "Next"), the
epic's checklist, and this prompt's status in plan/resume/README.md once V2 is done.
```

## Notes for the owner

- Thirteen issues; one pull request each, merged on a green check, a message to you after each with its link.
- You are asked twice on the way: Present (#220), with today's Present beside the proposal; and the help's 31 topics in
  V2 (board 11) before the help is rewritten.
- Send a message any time something looks wrong; the session reads it at its next step.
