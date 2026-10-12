# V2 · The build: how every issue is worked, one after the other, without stopping

The design is approved (D94 to D108; the canvas page "V2"). The build is the epic "V2" on GitHub (#207) and its
thirteen sub-issues (#208 to #220), one per board set: one board, one issue, one pull request. This file is the procedure every session follows
for every issue, so that the work goes on from one issue to the next without the owner. The owner's words (2026-10-12):
"Set things up in such a way that you should be able to complete all the work autonomously till all the issues are
implemented without stopping. I will send you messages when I see something amiss, or you hit a problem which absolutely
needs my hands."

## The issues, in the order they are built

| Order | Issue | Board | Decision | Needs first |
|---|---|---|---|---|
| 1 | #208 V2 · 1 · Principles: the tokens and the base components | `V2Principles*` | D94 | none |
| 2 | #209 V2 · 2 · The progression: the shell, the steps, the result, the panel | `V2Progression*` | D95, D96, D99 | 1 |
| 3 | #210 V2 · 3 · The Studio's first open: the work column in three weights | `V2FirstOpen*` | D97 | 2 |
| 4 | #211 V2 · 4 · Find | `V2Find*` | D98 | 2 |
| 5 | #212 V2 · 5 · Problems | `V2Problems*` | D101 | 3 |
| 6 | #213 V2 · 6 · The Strings step | `V2Strings*` | D102 | 3, 5 |
| 7 | #214 V2 · 7 · The Roof and Array steps, and the Sun view, the sun's arc kept | `V2RoofArray*` | D103, D109 | 3 |
| 8 | #215 V2 · 8 · Performance | `V2Performance*` | D104 | 2, 5 |
| 9 | #216 V2 · 9 · Handover and Home | `V2HandoverHome*` | D105 | 2 |
| 9b | #220 V2 · 13 · Present: reviewed with the owner first, then built | `V2Present*` | D72; D110 on approval | 1, 2; the owner's approval |
| 10 | #217 V2 · 10 · Phone and tablet | `V2Touch*` | D106 | 3 to 9 |
| 11 | #218 V2 · 12 · The vocabulary | `V2Vocabulary*` | D108 | 3 to 10 |
| 12 | #219 V2 · 11 · Help | `V2Help*` | D100, D107 | 11 |

The vocabulary is built before the help, so that the help is written once, in the final words. Each issue applies the
voice to every word it touches; the vocabulary's issue sweeps what is left. Issues 4, 7, 8, 9 and Present do not depend on each
other and could run in parallel by several hands; one session builds them one after the other in this order.

## Present, and boards for approval

Present (#220) is a proposal (board 13). When the build reaches it, the session shows the owner today's Present (its
screens at three sizes, from the test stack) beside the board, and waits for his word: the board may change in that
review (his words, 2026-10-12: "The current Present mode needs to be reviewed and I need to see the proposed design update
if any before implementation on it; we can do that exercise at that time"). The issues after it go on meanwhile. The same
holds for the help's list of topics in V2 (board 11, "The topics"): approved or changed before #219 is built.

## The canvas is never stale

The hosted canvas (the artifact `Xv8m9Ara4qLMj57DdD1Rjy`) is kept equal to `docs/design/mockups` (the owner, 2026-10-12,
non-negotiable): every board changed in the repository is published the same day, `canvas.json` with it, and the live files
are read back and compared with `cmp` (and the index as JSON). Before a publish, read the live index first and merge
anything newer. Pictures a board uses (`present_scenes/`) are published with it.

## The loop, for each issue

1. **Start from green `main`.** `git fetch origin main`; the branch of the session (in the cloud the designated branch,
   e.g. `claude/<name>`; on the owner's Mac `v2/NN-<slug>`) reset to `origin/main`
   (`git checkout -B <branch> origin/main`). One branch, one issue, one pull request; never stacked.
2. **Read the issue whole**, then its board (the `.dc.html` files in `docs/design/mockups` and their pictures in the
   issue), its decisions in `plan/README.md`, the audit's issues it names (`plan/v2/audit.md`), `plan/v2/voice.md`, and the
   documents it names. The issue's "Scope in" is the work; "Scope out" is not touched.
3. **Test first** (CLAUDE.md, "Engineering standard"): for each behaviour in "Scope in", a failing unit test
   (`*.test.ts`, bun test) of the pure logic it rests on: what a component shows is worked out in a function apart from the
   component (`lib/...`), and that function is tested. Then make it pass, then tidy. The browser suites stay set aside
   (the owner, 2026-10-11): no browser group runs and no new `*.e2e.ts` is written.
4. **Build to the board**, with the tokens of D94 only (hard rule 9): no raw value in a component. A value the board needs
   that is not a token becomes one in `globals.css` and `docs/design/design-tokens.md` in the same pull request.
5. **Keep the help true** (`docs/help-upkeep.md`): the topics of the sections the change touches, read claim by claim and
   fixed in the same pull request, in the voice; `bun help:gen` and the manifest committed with them.
6. **Keep the documents true** in the same pull request where they describe the code: `docs/design/components.md`,
   `guidelines.md`, `information-architecture.md`, `design-tokens.md` (its test holds it to the CSS).
7. **The check:** `bun check --skip=e2e` green before every commit (the owner's decision of 2026-10-11).
8. **Look at it** on the test stack (`bun dev:bg --profile test`, web on the port in `.dev/test/pids.json`): a Node script
   with `@playwright/test` (from `e2e/node_modules`, Chromium at `/opt/pw-browsers/chromium-1169`), kept in the scratchpad,
   reaches each state the issue's "Done when" names at 1440 × 900, 834 × 1194 (touch) and 390 × 844 (touch), reads the
   screen's words back and takes the screenshots. Look at every picture against the board. What does not match is fixed
   or said in the pull request. Never print or commit `NEXT_PUBLIC_ESRI_API_KEY`.
9. **The pull request:** `bun tools/pr-shots.ts v2-NN-<slug> <pictures>`; the description has "What it does", "How it was
   checked" (the tests written, the check, what was pressed and read at each size, `Help: read …; changed …`, the voice's
   checklist of `plan/v2/voice.md` §10), "Screenshots" (the board beside what is built, at three sizes), "Not done" (what
   of the issue is left and why, if anything), and `Closes #<issue>`. The title: `V2 · N · <what it does>`, N the number in the issue's own title (the board's).
10. **Watch it to green** (GitHub MCP: the `check` workflow on the pull request). A red check is fixed and pushed; a
    failure that is not this change's is said in the pull request. Merge when green (squash, as every pull request of this
    repo), then delete nothing else.
11. **After the merge**, documents alone to `main` (D26): `plan/STATE.md` ("In flight": the issue done, the next one), the
    epic's checklist ticked, and, if the build went past the board where the code taught something, the board's builder
    and canvas copy brought in line (`docs/help-upkeep.md`, "The same goes for the boards").
12. **Tell the owner** in one message: the pull request's link, that its screenshots are in it, what was decided, then go
    on to the next issue at once.

## Deciding alone, and when to stop

- Small and medium decisions are the session's: decide, write the decision in the pull request, and go on. A decision
  that changes an approved board's look or a rule of `plan/README.md` is recorded as a new D-number in the same pull
  request.
- A closed decision (`plan/STATE.md`, "Closed, do not reopen") is never reopened. Where an issue's direction would reopen
  one (the demo's numbers, D64's parity), the issue says so in "Scope out".
- Stop and ask the owner only for what needs his hands: an account, a key, a deploy, a cost, a decision that changes the
  product beyond the boards. Ask one question, then carry on with what does not depend on the answer.
- A session that nears two thirds of its context finishes the issue in hand, updates `plan/STATE.md`, and the next session
  starts from `plan/resume/021-v2-build.md`.

## Done

V2 is done when the thirteen issues are closed, each by its merged pull request, the epic's checklist is full, and the
owner has looked at the app at three sizes. Deployment is the owner's (`docs/deployment.md`).
