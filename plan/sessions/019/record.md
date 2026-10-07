# Session 19: D79 built, Phase 14 (in-app help) and Phase 15 (help clips) done (2026-10-07)

The session began from the resume prompt of session 18 (build D79) and went on, at the owner's word, to the in-app help
(Phase 14: D80, D81) and its clips (Phase 15: D82 to D84), then a deploy to production. The owner's words are in
`owner-messages.md`. The log: `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/3c27e944-19e7-4a73-9310-3877843068eb.jsonl`.

## Standing instructions given or kept in this session

- Run solo: open the pull requests, merge each on a green check, go on to the next (from #123 on; before that the owner
  merged). No stacked branches (#119 merged into a branch already merged and was re-landed as #120).
- No browser test suites, no new UI tests; logic tested first with `bun test`; each change checked by hand in the browser
  on the test stack at 1440, 834 and 390.
- **Screenshots in every pull request that changes what is seen, and seen to show** (the owner, after #133: links to
  raw.githubusercontent.com never showed in the private repository). Now in both `CLAUDE.md` files, `docs/screenshots.md`,
  `bun tools/pr-shots.ts`, and the session's memory.
- **Process aids committed with the work** (the owner, three times): READMEs beside the runs, guides linked from
  `CLAUDE.md`, the scripts as tools (`bun help:pictures`, `bun help:clips`, `bun tools/pr-shots.ts`,
  `bun tools/check/write-e2e-inputs.ts`).
- Every board for approval in three sizes on the canvas; documents to `main` alone (D26).

## What was done, by pull request

| PR | What | Decisions |
|---|---|---|
| #117, #118, #120 | Find: the roof picked up whole, moved, turned; corner drags finer (a snap reaching 4 px); obstacles moved and turned (a tank moves only) | D79 |
| #121, #122 | The cursor and the tips; on phone the tip in the sheet, not over the map | D79 |
| #123 to #125 | The help's registry, generator and gate (`tools/help`), MDX topics; the ? disc and the sheet at the edge; the topics of the Strings and Array lenses | D80 |
| #126 | The topics of the Roof and Sun lenses and Find (21); the coverage gate; options in the code's order | D80 |
| #127 | Keys pressed in an open dialog stay there (`keys-held.ts`) | |
| #128 | The sheet's headings in the section headings' light | |
| #129 to #137 | How-tos with pictures (D81): `bun help:pictures`; steps, pictures and callouts; the ways in (the ? beside Find's title, Show me how); a picture opened large; the how-tos of every tool of Find (30 topics); the mark's digit centred (#135) | D81 |
| #130, #134 | `docs/screenshots.md`, `bun tools/pr-shots.ts`; links that show in a private repository | |
| #138 to #141 | Clips (Phase 15): `bun help:clips` with the pinned encoder; the player in a step's frame; seven clips; a clip opened large on touch | D82, D83, D84 |

Issue #142 filed: on Find, an obstacle turned back to exactly nothing and let go picks the roof.

## Why things are as they are

- The help follows solarlayout's `packages/help` in its core (one MDX topic per key, a generated typed manifest, the gate as
  tests, `?help=` in the address) and is this app's in look and places (D80). The sheet stands at the edge, the whole height,
  at the owner's word, not beside the inspector.
- Pictures and clips are made by scripts from the app on a plain ground (no imagery to license), never by hand; a gate holds
  each to its file. Clips are H.264 MP4 in the repository (D82, D83) because the spike measured about 100 to 250 kB a clip.
- Production deploys what Staging runs when no commit is named: the owner's first deploy of the day re-deployed `6f7be3c`;
  Staging then Production brought both to `f13375c`, smoked by hand (help, how-tos, clips on desktop and phone).

## Tried and dropped

- The help sheet beside the inspector (the first board): the owner wanted it at the edge.
- Prettier on `Find.tsx`: the repository does not use it; the file was restored and edited by hand.
- Chrome's screencast for clips (irregular frames at CSS pixels): frame by frame instead. VP8 WebM (no new dependency) was 3
  to 5 times larger than H.264.
- `raw.githubusercontent.com` links for screenshots: 404 in a private repository.

## Left

- The owner plays the clips in Safari on an iPhone or iPad (Phase 15's last check); Firefox untried.
- When the browser suites run again: `kit-part-2.png` and Find's screens are renewed.
- Local branches never merged, by design: `design/in-app-help`, `design/find-tools-help`, `design/help-clips` (prototypes of
  the boards), `spike/help-clips` (the spike); `feat/move-turn-obstacles`, #119's branch, its work re-landed as #120.
- Next, as the owner said at the end: new UX, CX and UI work on Find (`/find`), in a new session.
