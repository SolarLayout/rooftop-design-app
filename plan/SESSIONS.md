# Working across sessions

This project is built over many sessions, by more than one developer or agent. No session may depend on what a
previous one remembers. Everything a session needs is in the repo.

## What carries the context

| File | Holds | Changes |
|---|---|---|
| `CLAUDE.md` (root) and `apps/web/CLAUDE.md` | Rules that always apply; how to work with the owner | Rarely |
| `plan/STATE.md` | Where the work stands today: done, in flight, next, open items | Every session |
| `plan/resume/*` | Resume prompts: one work order per resumption, specific to the work | When the owner asks for one |
| `plan/README.md` | Phases and their status; every decision, numbered | When a decision is taken or a phase changes status |
| `plan/phase-NN-*.md` | Scope and acceptance of a phase; "As built" with deviations | While the phase is worked on |
| `plan/reference/*` | The functional inventory, demo numbers, 3D notes, map providers | When facts change |
| `docs/design/*` | The approved design: IA, tokens, components, guidelines, mockups | When the design changes, with approval |
| Git history and pull requests | What changed and why | Always |

## One session, one slice

- A session takes one phase, or one part of a large phase. It ends at a merged pull request.
- Start a new session at each boundary. Do not carry a session until its context is full: past about two
  thirds, finish the slice in hand, update the state, and hand over.
- Large work is given to agents with a written brief. The brief names the files to read, the constraints, the
  tests to write first, and what to report. The session reviews what comes back before merging; an agent's
  report is a claim, not a proof.

## Start of a session

1. Read `CLAUDE.md`, then `plan/STATE.md`, then `plan/README.md`.
2. Read the phase file of the slice you are taking, and the references it names.
3. For UI work read `docs/design/README.md` and the documents it names; open the mockup of the screen.
4. Check reality against the state file:
   ```
   git fetch origin && git status && git branch -a && git log --oneline -5 origin/main
   gh pr list --state open
   bun status
   ```
   If they disagree with `STATE.md`, reality wins: fix `STATE.md` first and say so to the owner.
5. Run `bun install`, `uv sync` in `apps/api`, then `bun check`. Start only from green.
6. Tell the owner in a few lines what you found and what you will do. Then do it.

## During a session

- Branch from `main`. One change per pull request. Test first.
- Use the test stack only (`bun dev:bg --profile test`); the dev stack is the owner's.
- `bun check` before every commit. Push, open a pull request with `gh`, merge when the check is green.
- A new decision gets a number in `plan/README.md` in the same pull request that acts on it.
- Show the owner each finished part with what was built, what was decided, and what needs approval.

## End of a session

1. Nothing uncommitted that matters; no branch left unexplained. Nothing running on ports 4700 to 4719.
2. Update the phase file ("As built", deviations, what remains) and the status in `plan/README.md`.
3. Rewrite `plan/STATE.md`: last updated, where we are, in flight, next, open items.
4. Merge that update through a pull request.
5. If the owner asks for a resume prompt, write it as the next file in `plan/resume/` (rules in
   `plan/resume/README.md`), add it to the index, and merge it with the state update.

## If something is unclear

Ask the owner one question at a time, and only for decisions that are his. For everything else decide, write the
decision down, and carry on.
