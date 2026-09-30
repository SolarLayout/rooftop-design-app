# Resume prompts

A resume prompt is a work order for one session: specific to the work being resumed, written when the owner
asks for one. Paste the block inside the file into a new session started in this repo.

## Rules

1. One file per resumption, numbered in order: `NNN-short-name.md`. A file is a record: once used, it is not
   rewritten. A change of plan gets a new file.
2. Specific, and thin. The prompt names the slice, the branch, the first actions, what to read, what done
   means, and the traps known at handover. It does not copy the state of the project: that is in
   `plan/STATE.md`, which the prompt tells the session to read and to check against reality.
3. Every prompt carries the standing instructions (read `CLAUDE.md`, follow `plan/SESSIONS.md`, test first,
   update `plan/STATE.md` before stopping), so it works even for a session that knows nothing.
4. The session that uses a prompt sets its status in the table below when it closes its work.

## Index

| # | File | For | Written | Status |
|---|---|---|---|---|
| 001 | `001-phase-2-engine-api.md` | Phase 2: review and merge part 1, then build part 2 | 2026-09-29 | used by session 2, 2026-09-29 |
| 002 | `002-phase-3-design-system-shell.md` | Phase 3: the design system as code and the app shell | 2026-09-29 | used by session 3, 2026-09-29. The phase is not complete: `STATE.md` says what remains |
| 003 | `003-phase-3-components-stores-shell.md` | Phase 3, the rest: the components of round 4, stores, data flow, shell | 2026-09-29 | used by session 4, 2026-09-29. It built parts 1 to 9 and Tabs; parts 10 to 16 are the work of 004 |
| 004 | `004-phase-3-stores-data-flow-shell.md` | Phase 3, the second half: stores, data flow, formats, routes, shell, and the close of the phase | 2026-09-29 | used by session 5, 2026-09-29 and 2026-09-30. The phase is closed |
| 005 | `005-phase-4-find-and-outline.md` | Phase 4: the plan first, then find the roof on the map and outline it | 2026-09-30 | used by session 6, 2026-09-30. The plan, the boards and steps 1 to 11 (pull requests #35 and #36) are done; steps 13 to 15 remain, in 006 |
| 006 | `006-shading-memo-and-phase-4-rest.md` | The shading memo (the check passed 6 min 30 s), then Phase 4's third pull request and its close | 2026-09-30 | open |

## Shape of a prompt file

```
# NNN: title
Written: date, by which session. Status: open | used | superseded by NNN.

## Paste this
(the prompt, in a code block)

## Notes for the owner
(what to expect, how long, what may need a decision)
```
