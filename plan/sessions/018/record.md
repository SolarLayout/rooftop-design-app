# Session 18: UI polish driven by the owner (2026-10-06 to 2026-10-07)

The owner brought issues one at a time; each was designed on the canvas when it needed a design (page "UI fixes", three
sizes every time), approved, built on a branch, checked in the browser with Playwright on the test stack, and opened as a
pull request with screenshots (on the orphan branch `pr-shots`) for the owner to merge himself. The owner's words are in
`owner-messages.md`.

## Standing instructions given in this session

- No browser test suites are run ("we will not run browser tests at all since they run for ages"); every change is checked
  by hand in the browser with Playwright, and its screenshots are attached to the pull request as proof.
- No new UI tests are written for now ("its serving us no value at the moment"); logic keeps its unit tests, test first.
- Every board for approval comes in three sizes, desktop, tablet and phone, on the canvas.
- From PR #108 on, the owner reviews and merges the pull requests himself.

## What was done, by pull request

| PR | What | Decisions |
|---|---|---|
| #107 | The ring in Home's search on focus; coordinates as Google Earth copies them (DMS, DDM, letters, decimal commas) read back under the field, the unreadable said why | D68, D69 |
| #108 | Modules in tilt defaults to 1 (the demo keeps 2); the Layers panel has a close and starts on the plain ground | D70 |
| #109 | Present: the figures of each scene in a panel with the stage seen through it, steady widths; the sun path in the day scene; the dome framed all tour; shadows darker (0.45); the brand mark leads Home; the state of saving a mark before the name | D71 (taken back), D72, D73, D74 |
| #110 | Scrollbars in the theme | |
| #111 | Main's check fixed (a crossing import in Present's test) and the tools' tests keyed on the web app and e2e | |
| #112 | The engine read an OND whose UnitAffEnum is W as a thousandth of its power (30 of the library's files; any such file a user drops) | |
| #113 | The equipment library: 119 PAN and 388 OND files in `apps/web/public/equipment`, a catalog written by the engine's readers (`bun equipment:catalog`), Change on the cards opens a picker (search, range sliders, sorting, the file of one's own); makers named as people know them; section headings in the heading orange with a soft glow; Module, Inverter and Location headings | D75, D76 |
| #115 | A choice of stringing an edit took away gives way to the option shown (the document amended, nothing to undo), a note says so in plain words; Handover names the option shown; a toast's action under its words on phone | D77 |
| #116 | Use my location on every size and in Home's well; Search beside Find's field once something is typed | D78 |

Approved, not built: **D79**, move and turn the roof and its obstacles on Find's map, the grab cursor, the tips (the boards
"UI fixes · Move and turn the roof and its obstacles").

## What was found

- The owner's IKEA design: Handover refused "This design has no option 18x84x7": the document kept a choice its new
  equipment took away; the engine shows its first option in silence. Fixed at the root in #115 (D77).
- The equipment READMEs said "do not circulate"; the owner: "that statement is stale", publishing is fine.
- 17 `-old` OND files of the owner's library are out of date and left out; superseded files too.
- A Production deploy waited about ten minutes in "waiting" with no rule asking for it (no reviewers, no timer); it then
  ran and succeeded. GitHub, as on 2026-10-05.
- The Strings legend runs under the inspector with many MPPT on desktop: issue #114 (needs a design first).

## Left, for the next session

- Build D79 (move and turn, the cursor, the tips): resume prompt `plan/resume/017-move-and-turn.md`.
- The e2e suites that use the old words (Replace, the dialogs' names, the top bar's words, the geocoder's words, the
  Layers default, `present-energy`) need updating when browser tests come back.
- The picker boards were not redrawn for Max DC, the removed tag and the headings: `components.md` holds them.

## The full log

`~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/c51da1f0-6ee5-4cb3-9f91-9bfb4a2e4a13.jsonl` (one JSON
object per line; the owner's messages are `type: "user"` with text content).
