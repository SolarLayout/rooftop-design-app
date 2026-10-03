# Phase 9: Handover and exports

**Status:** done (session 13: #62, #64, #65, #66; #63 the split of the browser step on the way). **Depends on:** phases 2, 7 and 8.

## Goal
Every deliverable of the desktop app, previewed before download.

## Scope
| Item | Preview | Download |
|---|---|---|
| Design report | Page thumbnails and a live page view | PDF, A4 landscape, 6 pages, from `/export/pdf` |
| Single-line diagram | Interactive SVG drawn in the browser from the system data | PNG from `/export/sld` |
| Bill of materials | Table (item, specification, quantity, unit) | In the PDF; copy as table |
| DC cable schedule | Table, all strings, sortable | In the PDF; copy as table |
| CAD layout | Layer list and a plan thumbnail | DXF |
| Google Earth model | What is included and what is not | KMZ |
| Hourly data | First rows and column meanings | CSV, 8,760 rows |
| Project file | Name, size, what is embedded | `.rtd` format 2 |

- Project name is editable here and in the project switcher (desktop had no way to edit it).
- Exports need a chosen option. Until then each item says what is missing and links to it.
- "Download all" makes one zip.
- Report pages are rendered by the engine (matplotlib) so the PDF equals the desktop output; the on-screen
  preview shows those pages as images.

## Acceptance
- Each export downloads and opens: PDF page count 6, DXF loads in ezdxf with the expected layers,
  KMZ re-imports through `/roof/import` with heights intact, CSV has 8,760 rows and the five columns.
- Playwright: download events captured and files checked, on desktop; preview navigation on three viewports.

## As built

Built in session 13 (2026-10-03): the plan (`phase-09-plan.md`), four boards, four pull requests: #62 (the frame: the routes, the list and its
facts, the preview frame and its states, the downloads and the shell's toaster, `TextField`, the name, Save a copy; the `.rtd` download and the
report's day in the API), #64 (the report previewed as the engine's own pages, the PDF of the same day), #65 (the single-line diagram drawn in the
browser, the bill of materials, the DC cable schedule with sorting and Copy as table), #66 (the zip, the CAD layout, the Google Earth model and
the hourly data previewed, Download all). Between #62 and #64 the browser step of `bun check` was split into groups and the fast check made the
gate (#63, D54, D55, `docs/checks.md`). Every part was built by an agent in a worktree from a written brief; the session reviewed each, ran the
groups it reaches and made the baselines, looking at every picture beside its board.

### What exists

| Part | Where | Pull request |
|---|---|---|
| `POST /export/rtd`: the project file as the engine writes it (`Project.to_text`, format 2), without a chosen option, a voltage, weather or a run; `?day=YYYY-MM-DD` on every export, printed on page 1 of the report (the server's today without it); `KINDS` says what each kind needs (`needs_design`, `drawn`, `dated`) | `rooftop_api/services/export.py`, `routers/export.py`, `rooftop_core/project.py` | #62 |
| `/handover` the list (on desktop and tablet with the first item beside it), `/handover/[item]` the item (pushed over the list on phone, with a back row); the eight items with their facts from the run's chosen option, the weather and the document; the preview frame with its head and its states (before options the API's words leading to the Strings lens, the project file alone live; the first load; a run that failed) | `components/handover/Handover.tsx`, `DeliverableList.tsx`, `DeliverableRow.tsx`, `Preview.tsx`; `lib/handover/items.ts`, `page-view.ts`; `lib/routes.ts` | #62 |
| The downloads: a blob of the API's bytes saved by an anchor under the name of `Content-Disposition`; a store without React with each item's state, a file kept per edit of the document, one retry from a toast; the shell's `Toaster`, above the tab bar on phone; a file of the design asked for the option the run shows when the document names none | `lib/handover/downloads-store.ts`, `save-file.ts`, `day.ts`; `components/shell/Shell.tsx`, `stores.tsx` | #62, #64 |
| `TextField`, the number field's well for words; the project file's preview with the name as a field, the file's name as the API writes it (`fileStemOf` mirrors `file_stem`), its size and what is in it; the switcher's "This design" row renaming; the name a committed edit that asks neither the layout nor the run; Save a copy live in the switcher, the card and the preview | `components/ui/TextField.tsx`, `text-entry.ts`; `components/handover/ProjectFilePreview.tsx`; `lib/handover/file-name.ts`, `lib/flow/name-field.ts`; `components/shell/ProjectSwitcher.tsx` | #62 |
| The report's pages drawn one by one in the engine (`report_pages`, each with its title), the PDF made of them and unchanged page for page; `POST /export/report-pages?day=` answering every page as a PNG at 150 dpi (1753 × 1240) with its title and size, in one JSON answer under the drawing lock | `rooftop_core/export/report.py`, `files.py`; `rooftop_api/services/export.py`, `schemas/report.py` | #64 |
| The paper preview: the engine's page in the paper frame, the thumbnails as buttons (a column of 132 on desktop, a row of 72 on tablet, of 56 on phone with the number alone), previous and next, the keys, skeletons, a failure in the API's words with Try again; the pages asked once per edit and kept; Download PDF with the browser's day; the token `--text-caption-s` (11 px) and `--aspect-paper` | `components/handover/ReportPreview.tsx`; `lib/handover/report-view.ts`; `lib/api/client.ts` (`reportPages`) | #64 |
| The single-line diagram as an SVG from the option's system, its MPPT loads and the equipment, in the engine's geometry and words, the blocks in the series colours by MPPT, across on desktop and with the AC chain running down on tablet and phone; a block under the pointer, a finger or the focus shows its strings and its load; the drawing as a list for screen readers; Download PNG the engine's drawing | `components/handover/SingleLineDiagram.tsx`; `lib/handover/sld.ts`, `sld-layout.ts` | #65 |
| The bill of materials and the DC cable schedule as tables (cards on phone), the schedule with every string, a total row and sorting heads (`Table` gains `sort`, `onSort`, `aria-sort`; the parent sorts its rows); Copy as table, tab-separated with a header line, said in a toast; `ValueTooltip` takes a `side`; tooltips write their place by name (every chart tooltip since Phase 8 had stood at the screen's top-left corner) | `components/handover/BillOfMaterials.tsx`, `CableSchedule.tsx`, `CopyAsTable.tsx`; `lib/handover/bom-view.ts`, `schedule-view.ts`, `copy-table.ts`; `components/ui/Table.tsx`, `table-sort.ts`, `ValueTooltip.tsx` | #65 |
| `POST /export/zip?day=`: the five files and the `.rtd` in one archive, each named as its own download; the CAD layout's preview (the engine's plan, the DXF's layers from the run), the Google Earth model's (what is in the file in the KML's names, what is not), the hourly data's (the CSV asked once and kept, its first 8 rows and the columns' meanings, Download CSV the same bytes); Download all | `rooftop_api/services/export.py`; `components/handover/CadPreview.tsx`, `EarthPreview.tsx`, `HourlyPreview.tsx`, `FactRows.tsx`; `lib/handover/cad-view.ts`, `earth-view.ts`, `csv-head.ts`, `csv-columns.ts` | #66 |

### Acceptance

| Asked | Met by |
|---|---|
| Each export downloads and opens: the PDF's 6 pages, the DXF in ezdxf with its layers, the KMZ through `/roof/import` with its heights, the CSV's 8,760 rows and five columns | pytest as before (`tests/api/test_export.py`, `tests/engine/test_export_bytes.py`), the pages and the zip added (`test_report_pages.py`, the zip's entries equal to their own exports); in the browser on desktop the `.rtd`, the PDF (six page objects), the PNG (2338 × 1654), the DXF (`STRING_S22`), the KMZ (`doc.kml` with the six names), the CSV (8,761 lines) and the zip (six entries) captured and read (`handover*.e2e.ts`) |
| Playwright: downloads captured on desktop; the preview's navigation on three sizes | `handover.e2e.ts`, `handover-report.e2e.ts`, `handover-sld-tables.e2e.ts`, `handover-files.e2e.ts`: 48 and more tests on three sizes, every number read from the run's answer and the files; axe on every item and state |

### Deviations from the plan as written

| Plan | As built | Why |
|---|---|---|
| Decision 5: pages of 1754 × 1240 | 1753 × 1240 | matplotlib rounds the A4 inches down |
| Decision 5: about 550 KB and 0.8 s for the pages | 940 KB and about 1 s on the demo | the schedule page is dense text; measured |
| Decision 10: the zip about 1.1 s and 370 KB | 1.5 to 1.7 s and 373 KB | measured |
| Decision 11: before options the rows dim | the download icon alone is dim; the words and the badge stay readable | a dimmed word falls under the contrast asked (axe), and the row is a link that works |
| Decision 14: the head of an item says its facts | on tablet and desktop the report's head says the page's words alone, as the board; the facts stay in the row | the board |
| Decision 16: the clipboard on desktop alone | granted on every size; Copy as table checked on three | it works under Playwright's touch emulation |
| The brief's "Strings lens" link | "Open the Strings lens", Performance's words | one decision card for both workspaces |
| The SLD across on tablet | down, as the phone's | the preview column of 466 would not hold the inverter's words |
| The gate: the full `bun check` | the fast check and the groups the change reaches (D55) | four full runs of 31 minutes lost to one load timeout each |

### Found on the way

- The API refuses a file of the design without a chosen option, and the document names one only once the user picks: the run's recommended
  option is what every screen shows, so a file of the design is asked for it (`documentFor`); the project file stays the document as it is.
- The web app's rewrite in `next dev` drops a request now and then with a bare "Internal Server Error" (socket hang up, ECONNRESET on its side)
  while the API answered 200: 47 of 48 such drops were the report's pages (940 KB); none happened from the shell, sequential, four at a time or
  with compression accepted. uvicorn keeps a connection alive 75 s now, an export is asked up to three times, and a test waits for the good
  answer; the cause is open (Phase 11: a production build and a proxy in front of the API).
- Under the load of a full check (ten workers, the Studio in software WebGL on three sizes, the machine's twenty cores saturated) a 5 s wait
  ran out on a different test in each of four full runs, each green alone: an expectation waits 15 s now, Edit's test waits with the run's time,
  the charts' tooltips leave only when their anchor moved (`isStill`), and a test is run once more and listed as flaky.
- Hardware WebGL for the tests draws a Studio picture five to six times faster, but the satellite ground went missing in later runs; not adopted.
- `Object.assign(element.style, { "--x": ... })` does not set a custom property: every chart tooltip since Phase 8 had stood at the top-left
  corner; `style.setProperty` does, and the chart test holds the place now.
- A `getByRole("columnheader", { name: "Cable" })` matched "DC cable (m)" too: the heads' locators are exact.
- Playwright cannot read a response's body once the page has taken it as a blob: a test that wants the file asks the API itself.
- A scrolling card must take the focus (axe, `scrollable-region-focusable`).
- The dimmed facts beside a dim button fall under the contrast asked: a word is never dimmed, a control is.
- Agents wrote a document change into a code commit twice (`components.md`, `design-tokens.md`); the briefs say "a commit of its own" now.
