# 020: V2, the design: the boards of the new version on the canvas, then the epic
Written: 2026-10-12, by the cloud session that wrote the V2 audit and voice. Status: open.

## Paste this

```
You are resuming work on SolarLayout Rooftop (web) in this repo, in a Claude Code cloud session. Read CLAUDE.md, then
plan/STATE.md (check it against git, the open pull requests and the code), then plan/SESSIONS.md. The owner's standing
instructions are in plan/STATE.md ("In flight"); his decision of 2026-10-11 holds: the browser tests are set aside, run no
browser group, `bun check --skip=e2e` is the check before every commit. A documents-only change goes to main directly
(D26); code goes through a pull request. Decisions closed in plan/STATE.md are not reopened.

The cloud differs from the owner's Mac (resume 019 says it in full): no gh CLI (use the GitHub MCP tools), no Playwright
MCP (a Node script in the scratchpad, copied into e2e/ to run, deleted after), the test stack only (`bun dev:bg --profile
test`, web on localhost:4710), screenshots to the scratchpad and sent to the owner, never print or commit
NEXT_PUBLIC_ESRI_API_KEY.

The work: V2. Read plan/v2/README.md, then plan/v2/audit.md whole, then plan/v2/voice.md whole; plan/v2/strings-inventory.md
as you need it. V2 is the version that fixes every issue of the audit and applies the voice to every word. Nothing of V2
is built in this session. This session has two parts, in order, and the second starts only when the owner says the
first is approved.

Part 1: the V2 design, as boards on a new page of the design canvas, for the owner to approve or tweak.
- Act as the designer the owner asked for on 2026-10-12: twenty years of visual design, UX, UI, IA and human-interface
  work on modern web products; the bar of Stripe and Vercel; a new user must "just get it" alone. Propose, do not ask:
  decide the small and medium things and say what you decided; one question at a time for the major ones.
- Read docs/design/README.md (how a board is made, previewed and published; the mockups' builder scripts in
  docs/design/mockups/, canvas.json, the pages) and docs/design/guidelines.md, design-tokens.md, components.md and
  information-architecture.md, so that V2 changes what the audit says and keeps the rest (the audit's "What already
  works and should be kept"). Where V2 changes a rule of those documents, the board says which and why.
- The canvas is https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (a Design artifact; its index is project/canvas.json;
  boards are uploaded as assets from a folder in your scratchpad, never from the repo's path; re-read the index
  immediately before every publish, or it is refused; uploads need the artifact private, so if one is refused as
  live-shared, ask the owner to make it private). Add a page "V2" and put every V2 board on it, in the order below,
  each with a row title (a note) that names the audit's issues it answers (V2-nn). Keep docs/design/mockups/canvas.json
  in step with the canvas (its page list, the boards' frames, the notes), as every design session has.
- Each board is drawn by a builder script in docs/design/mockups/ (build_v2_*.py, after the existing ones), in three
  sizes (desktop 1440, tablet 834, phone 390), with real numbers of the Pune demo (plan/reference/demo-numbers.md) and
  the real equipment names (D24). Where a board is best drawn by the app itself, build the proposal on a local branch of
  this container, never merged, and screenshot it, as #114's boards were (build_ui_fixes_strings_legend.py).
- Every word on a board follows plan/v2/voice.md. Every board carries, beside the screens, the few lines that say what
  changed and which rule or issue it serves; no more words than that.
- The boards, in this order (the audit's "ten that matter most" first; each one a board set of three sizes):
  1. Principles of V2: the type scale, the spacing scale, the control heights, the accent's use, the density budget
     (audit L: V2-106 to V2-112, V2-120), as a specimen, not a screen. This board is the base every other follows.
  2. The progression: one order of work from Find to Handover, how the shell shows where the user is and what is next,
     the primary action per step, Export and Present out of the top bar's primary place (F: V2-55 to V2-58; B: V2-105;
     L: V2-104).
  3. The Studio's first open: status and the one next action; sections as summaries that open; defaults told apart
     from choices; the vitals reduced; the time pill on the Sun lens alone (A: V2-01; D: V2-25, V2-26, V2-31, V2-32;
     G: V2-64 to V2-66; L: V2-118).
  4. Find: the first step as a search first; the outline's lead by step; roof type and Build with the closed outline;
     Build pinned at every size; no tips card; by hand (A: V2-02, V2-04 to V2-07; B: V2-10, V2-11; H: V2-77, V2-82).
  5. Problems: the run failed, no option fits, a note to review with its fix in one step, the stale result, errors with
     their detail behind a disclosure (C: V2-16 to V2-24; voice §5).
  6. The Strings lens re-layered: options first, the result as the lead and the proof behind "Why", the rules paragraph
     and MPPT loading as disclosures, Add your own in view (D: V2-28, V2-29; B: V2-12).
  7. The Roof and Array lenses: Edges and access in plain words and groups, the module card reduced, Spacing's lines
     (D: V2-27, V2-30, V2-33, V2-34; L: V2-107, V2-113).
  8. Performance: the lead with its option and weather, three KPIs a buyer reads, the chain as "Where the energy goes",
     likely and conservative in place of P50 and P90 (J: V2-88, V2-89; B: V2-13; L: V2-114, V2-119).
  9. Handover and Home: items that say who they are for; Home as a start screen with the designs first when there are
     any (J: V2-90 to V2-94; A: V2-03, V2-05, V2-09; B: V2-14; L: V2-115).
  10. Phone and tablet: the sheet opening on the step's question with its action at the foot, the stage not under 40 %
      of the height, the legend in the sheet, targets 44 × 44 (H: V2-75, V2-76, V2-78 to V2-81; L: V2-116).
  The help's shape (I: V2-83 to V2-87) and the vocabulary's renames (voice §6) are a short board each, after these, if
  the session has room; otherwise named as left for the next.
- Show the boards to the owner one set at a time, in that order, with the links and the pictures; take his tweaks on
  each before drawing the next, and record every decision he makes in plan/README.md as a numbered decision (D94 on).
  Each approved set is marked approved in canvas.json's note and in docs/design/README.md's table of screens.

Part 2, once the owner says the design is approved: the epic and its issues on GitHub (SolarLayout/rooftop-design-app),
with the GitHub MCP tools.
- One epic issue "V2" that says the goal in the owner's words, links plan/v2/, the canvas page, and lists the child
  issues in build order.
- One child issue per board set (or per part of one where a set is too large for one pull request), each with: what
  changes (the board's link and its pictures), the audit's issues it closes (V2-nn), the voice's rules it applies, the
  help topics it must keep true (docs/help-upkeep.md), the tests it needs (test first), and "done" as the owner would
  check it at three sizes. Use the repository's labels as they are; create none.
- The vocabulary's renames as one issue of their own, the strings' inventory as its worklist, split by screen if large.
- Order the issues as the boards were ordered; say in the epic which can run in parallel.
- No code in this session. The build is the work of later sessions, one pull request per issue, each with its
  screenshots and its help kept true.

Before stopping: plan/STATE.md ("In flight": V2's state, what is approved, what is filed; "Next"), docs/design/README.md
(the V2 page and its boards), plan/README.md (the decisions), and this prompt's status in plan/resume/README.md.
```

## Notes for the owner

- Part 1 is long: ten board sets, each at three sizes, drawn one at a time for your approval. Expect several sittings;
  the session says where it stopped in STATE.md so the next one continues at the next set.
- The first board (the principles) is the one to spend time on: every other board follows it, and a change there after
  the fourth board means redrawing the first three.
- The owner's decisions on the way become D94 onward in plan/README.md; the vocabulary's renames are decisions too.
- Part 2 is quick once Part 1 is approved: about an hour for the epic and ten to fifteen issues.
- If the canvas refuses uploads, make the artifact private for the session (it was shared by link); the session will
  ask.
