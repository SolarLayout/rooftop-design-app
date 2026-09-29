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
4. The session that uses a prompt sets its status in the table below in its last pull request.

## Index

| # | File | For | Written | Status |
|---|---|---|---|---|
| 001 | `001-phase-2-engine-api.md` | Phase 2: review and merge part 1, then build part 2 | 2026-09-29 | used by session 2, 2026-09-29 |

## Shape of a prompt file

```
# NNN: title
Written: date, by which session. Status: open | used | superseded by NNN.

## Paste this
(the prompt, in a code block)

## Notes for the owner
(what to expect, how long, what may need a decision)
```
