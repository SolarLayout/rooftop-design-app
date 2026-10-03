# Phase 9: plan

Written 2026-10-03 by session 13, before anything of the phase is built, as the work order asks
(`plan/resume/012-phase-9-handover.md`). Scope and acceptance: `plan/phase-09-handover.md`. This file says how the
phase is built, in which order, what is decided unless the owner says otherwise, what was found in the code and the API,
what needs the owner, and what done means.

## What was found at the start of the session

- `main` is clean at `c0459c1` and matches `plan/STATE.md`: no open pull request, no stack running, no local branch, no
  worktree. `bun check` on `main`: green, every step skipped from the cache.
- **The Artifact tool is not available in this session** (Bedrock). The boards are shown from the previews in the repo, as
  in sessions 9 to 12; the canvas at claude.ai stays behind the repo.
- **Every option of the run carries what the tables and the SLD need.** `Option.bom` (7 lines: item, spec, qty, unit),
  `Option.cable_schedule` (one row per string: string, inverter, mppt, modules, voc_cold_v, isc_a, length_m, size),
  `Option.system` (`n_series`, `n_strings`, `n_inverters`, `n_modules`, `strings[]` each with `label`, `inverter`, `mppt`
  from 1, `inverters[]` with `label` and `position`), `Option.mppt_loads` (per MPPT with strings: `label`, `strings`,
  `imp_a`, `imp_limit_a`, `isc_a`, `isc_limit_a`, `kwp`, `ok`); `DesignResult.equipment` has the module (manufacturer,
  model, pnom_w) and the inverter (manufacturer, model, pnom_kw, n_mppt); `DesignResult.weather.hours` is the CSV's row
  count. The demo's option A: 638 modules, 1 inverter, 27 tables, 1,681 m DC cable, 44 connector pairs, 30 m AC cable, 1
  ACDB; 22 strings on MPPT 1 to 6 with 4, 4, 4, 4, 3, 3; Voc cold 1,480 V; the cable "4 mm² Cu, 1500 V DC" (D25). The BOM
  names the equipment as the files state it (D24, the open item): "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560,
  560 Wp, bifacial 0.80" and "WattPower Systems Pvt.Ltd WP-330KTL-H1, 275 kW, 6 MPPT".
- **`/export/{pdf,dxf,kmz,csv,sld}` exists and is tested** (`tests/api/test_export.py`, `tests/engine/test_export_bytes.py`):
  the file is named after the project (`file_stem`: "Pune demo" gives `Pune-demo-report.pdf`, `-layout.dxf`, `.kmz`,
  `-hourly.csv`, `-single-line-diagram.png`; a name outside ASCII goes as `filename*`); the PDF and the SLD are drawn
  under one lock (`DRAWING`), since matplotlib keeps one current figure per process; `require_option` refuses without a
  chosen option in the API's words (`system_voltage_missing`, `no_option_chosen`, `option_not_in_design`), and a project
  without weather as the run does (`weather_not_loaded`). Every export call prepares the design from the memo and runs its
  options again (0.2 s warm), then writes. The cable schedule of more than 28 strings continues on pages of its own
  (inventory gap 6 is closed in the engine already: 40 strings give 7 pages).
- **What the API lacks.** A zip of everything; the `.rtd` as a download (the engine's `Project.to_json` writes format 2
  with the PAN, OND, CSV and weather embedded; nothing serves it); the report's pages as images (the PDF is one function of
  six figures saved into `PdfPages`; no page can be drawn alone); the day of the report (page 1 prints `date.today()`, the
  server's day, the open item); nothing edits `Project.name` (the switcher shows it; the desktop app had no way, gap 1).
- **What each export costs and weighs** on this machine, the memo warm, the demo (scratch probe):

  | File | Bytes | Time, after the 0.2 s of the prepare |
  |---|---|---|
  | PDF, 6 pages | 98 KB | 0.6 s |
  | DXF | 254 KB | 0.05 to 0.18 s |
  | KMZ | 19 KB | 0.1 s |
  | CSV, 8,760 rows | 482 KB | 0.03 s |
  | SLD PNG, 2338 × 1654 | 63 KB | 0.05 s |
  | `.rtd`, format 2, the weather embedded | 675 KB | no run needed |
  | Zip of the six | 370 KB | 0.03 s to zip, after the six |

  A page of the report as a PNG: at 150 dpi 1754 × 1240 px, 73 to 113 KB, 0.06 s for a table page and 0.2 s for the plan;
  six pages about 0.8 s and 550 KB. WebP would save a tenth: not worth a format.
- **How a file comes back today.** `api.exportDesign(kind, project)` is in the client and unused: it asks with
  `accept */*`, reads the name from `Content-Disposition` (`fileNameOf`, tested) and gives `{name, blob}`. Nothing in the
  web saves a blob yet; the shell has no `Toaster` (the open item), though `Toast`, `Toaster` and `toast-queue.ts` exist and
  are in the kit.
- **The routes.** `HANDOVER_ITEMS` has the eight items in the board's order, `pathOfItem`, `FIRST_ITEM`;
  `pathOfWorkspace("handover")` and the top bar's Export lead to `/handover/report`; `app/(workspaces)/handover/[item]/page.tsx`
  is `NotBuiltYet`. The shell scrolls a workspace inside `data-workspace-frame` (long pictures use `expectWholeScreen`).
- **The name.** `Project.name` (max 200, default "Untitled roof") is shown by `ProjectTrigger` in the top bar and by
  `ProjectMenu` under "This design"; `nameOf` reads it. The run does not read it; the exports do (page 1, the KML's
  document name, the file names). `edit-parts.ts` would ask a run for a change of it. There is no text field component:
  the fields are `NumberField` and the search combobox of Find. "Save a copy" and "Open a project" are shown and cannot be
  used (`aria-disabled`) in the switcher; the switcher is drawn in the kit (`/kit/shell`) and in every screen with the
  top bar.
- **The approved board** (`Handover.dc.html`, desktop 1440 × 900): the list at the left (title, "Everything the installer,
  the client and the utility need", eight rows of 64 with a badge, a title, a line of facts, a download icon or a chevron;
  the project file at the bottom as a card with "Save a copy"); the preview at the right (head "Design report · Page 1 of
  6 · Summary", previous and next, "Download PDF"; the paper with a redrawn page 1; six thumbnails with "1 · Summary" to "6 ·
  SLD"). It draws **no "Download all", no tablet or phone, no other preview, no state**, and its page 1 is a hand-drawn
  paper, not the engine's page; its file name is the desktop's `pune-demo-roof.rtd`, where the API writes `Pune-demo-roof`.
- **The desktop app** (`rooftop_ui/main_window.py`) offers the five exports from a menu, each to a file dialog named
  `<name lowercased, spaces to dashes>.<ext>`, refuses without a chosen option ("Generate the layout and choose a system
  voltage first, so there is a stringing option to export."), and saves the `.rtd` by "Save" and "Save as". It previews
  nothing. The SLD is `plots.draw_sld`: a box per inverter with its label and the inverter's words; per MPPT a block
  "{n} × {series} mod" and a line "MPPT j · DC", or "MPPT j · not used"; a line "AC" to the ACDB; "Net meter" with "kWh";
  "Grid / LT panel"; the title "Single-line diagram · 22 strings of 29 × 560 Wp".
- **The tests.** Playwright 1.52 captures downloads (`page.waitForEvent("download")`, `suggestedFilename`, `path`) and can
  fix the page's clock (`page.clock`, used by the toast tests). The kit's clipboard is untested so far; Chromium grants
  `clipboard-read` and `clipboard-write` to a context on request.

## How the work goes

- **Step 0, the boards**, drawn and approved before anything is built (below). Then **four pull requests**, split where
  nothing of the earlier depends on the later; each builds its part on three sizes, with its states, and carries its
  pictures beside the boards:
  1. `feat/phase-9-handover-frame`: the API's `.rtd` download and the day of the report; the routes (`/handover` the
     list, the preview pushed on phone); the list, its facts and its states; the preview frame; the download mechanism
     with the toaster in the shell and a failure as a toast; the project file item with its name field and Save a copy,
     here and in the switcher; the name as an edit. Steps 1 to 8.
  2. `feat/phase-9-report`: the report's pages drawn one by one in the engine, the PDF made of them, the pages as images
     with their titles; the paper preview with its thumbnails and navigation on three sizes; Download PDF with the browser's
     day. Steps 9 to 12.
  3. `feat/phase-9-sld-tables`: the SLD drawn in the browser from the system, held equal to the engine's PNG; the BOM and
     the cable schedule as tables, sortable, copied as a table; the PNG download. Steps 13 to 17.
  4. `feat/phase-9-files`: the zip; the previews of the DXF, the KMZ and the CSV with their downloads; Download all; axe;
     the close of the phase. Steps 18 to 22.
- Pull requests 2, 3 and 4 depend on 1 alone and are built in parallel by agents once 1 is merged; the API parts of 2 and
  4 (the pages, the zip) can start beside 1.
- Every step is one commit (two when a token is new: the document first). A draft pull request after its first step,
  merged after its last, on a green check at its head (`bun check`, gated on its exit code, as a job of its own).
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`; the engine and
  the API with pytest; what is seen with Playwright on 390, 834 and 1440, with baselines. Numbers and words in browser
  tests are read from the run's answer and from the downloaded files, never written into the test; the acceptance's page
  count, layers, heights and columns are checked in pytest already and checked again on the files the browser downloaded.
- Agents build in worktrees under `$TMPDIR` with written briefs; every result is reviewed and run before it is merged. The
  session runs the browser for them. Baselines are made in the main working tree. The kit and the Studio's screens run
  before the full check when a component in `components/ui` or the switcher changed.
- `plan/STATE.md` is brought up to date on `main` after each pull request, from a worktree when a branch is open.

## Step 0: the boards

Drawn with two builders, `docs/design/mockups/build_phase9_handover_boards.py` (the screen on three sizes) and
`build_phase9_part_boards.py` (the previews and the states), from the helpers of the earlier builders; every number and
every word from the engine's answer for the demo, kept in `mockups/handover_data.json` (option A's BOM, cable schedule,
strings and MPPT loads, equipment, weather hours, the API's file names and their sizes, the API's words for a design before
a voltage, for a failed export; the first rows of the CSV; the KMZ's names), so that the boards can be written again
without the engine. The report's pages are the engine's own images for the demo, drawn once into `mockups/handover_pages/`
(six PNG files at 150 dpi, about 450 KB in all) and shown by the boards as they will be on the screen. Rendered as before,
listed in `docs/design/README.md`. Approval before step 1.

| Board | What it draws |
|---|---|
| **Handover** (replaces `Handover.dc.html`; the list and the preview as approved) | Desktop 1440 × 900: the approved list and head, with "Download all" as a secondary button beside the title (decision 10), the engine's page 1 in the paper frame in place of the hand-drawn page (decision 4), the thumbnails with the engine's titles (decision 5), the file name as the API writes it (`Pune-demo-roof.rtd`) |
| **Handover, tablet and phone** | Tablet 834: two columns, the list 300 wide, the preview beside it with the thumbnails as a row under the page (decision 3). Phone 390: the list as the screen, the project file card at its end; the report pushed: a back row "Handover", the title and the facts with the download as an icon button of 44, the page across the width, previous and next with "Page 1 of 6 · Summary" between, the thumbnails as a row that scrolls sideways |
| **Handover, previews** (desktop, phone in parts) | The SLD in the palette of the Dusk theme with an MPPT block under the pointer and its tooltip (decision 6); the bill of materials as a table with "Copy as table" and "In the report, page 5"; the DC cable schedule sorted by DC cable m with its total row (decision 7); the CAD layout with its layers and the engine's plan (decision 8); the Google Earth model with what is in it and what is not; the hourly data with its first rows and the meaning of each column; the project file with the name field, the file's name and size, and what is embedded (decision 9) |
| **Handover, states** (desktop, phone in parts) | Before a chosen option: the rows with the API's title as their facts and their icons dim, the project file alone downloadable, the preview the API's title and message leading to the Strings lens (D37, decision 11); the first load (skeletons in the facts and the preview); a download on its way (the ring in place of the row's icon and in the button); a download that failed (a toast with the API's words and "Try again", decision 12); "Download all" on its way; the name edited in the project file preview and in the switcher, and an empty name refused (decision 13); the toast "Bill of materials copied as a table" (decision 7) |

Two agents draw them in parallel (the first two boards; the last two), from a brief that names the helpers, the tokens,
the data file, the page images and the engine's words.

## Steps

| # | Step | What is built | Tested without a browser | In the browser |
|---|---|---|---|---|
| 1 | The `.rtd` and the day | `/export/rtd`: the engine's `Project.to_json` of the request, `application/json`, named `<stem>.rtd`, without a chosen option or a run (decision 1); `/export/pdf?day=YYYY-MM-DD`: the day printed on page 1, the server's day when none is given (decision 2); `bun gen:api` | pytest: the `.rtd` opens with `Project.from_json` equal to the request field for field, before a voltage too; a wrong day refused in words; the day printed; the KINDS table says which kinds need an option | |
| 2 | The routes | `/handover` is the list, on desktop and tablet with the first item's preview beside it; `/handover/[item]` the item, on phone a pushed screen with a back row; `pathOfWorkspace` and Export lead to `/handover` (decision 3) | `routes.test.ts` | The tab bar's Handover opens the list on phone; the Export button opens `/handover` |
| 3 | The list and its facts | `components/handover/Handover.tsx`, `DeliverableList.tsx`, `DeliverableRow.tsx` (the board's row of 64: badge, title, facts, icon); `lib/handover/items.ts`: the eight items with their facts from the run's chosen option, the weather and the document (decision 14); the row that is open says so (`aria-current`) | `items.test.ts`: the facts of the demo's option A from a recorded answer, word for word with the board | The facts equal the run's answer on three sizes; a press on a row opens its preview |
| 4 | The preview frame and the states | `Preview.tsx`: head (title, facts, the actions), body; the states of the page: before options the API's title and message with a link to the Strings lens, the rows dim with the API's title as their facts, the project file alone live; the first load skeletons; a run that failed the API's words with Try again (decision 11) | `lib/handover/page-view.test.ts`: each state from the results and their status | A design built by hand (no voltage): the API's words, every row dim but the project file; a run held by a route: skeletons |
| 5 | A download | `lib/handover/save-file.ts` (a blob saved by an anchor with `download`, the URL given back); `lib/handover/downloads-store.ts`, a store without React: `download(item)` asks the API with the document and the day, saves the file, says on its way or failed per item (decision 12); the shell's `Toaster` in `Shell.tsx` above the tab bar on phone; a failure is a toast with the API's words and Try again | `downloads-store.test.ts` with a fake API: on its way, done, failed with the words; two downloads of one item at once are one; `toast-queue` already tested | On desktop: the project file's download captured, its name the API's, its content JSON of format 2 with the document's name; a failure held by a route shows the toast with the API's words, Try again downloads |
| 6 | `TextField` | `components/ui/TextField.tsx`: the number field's well for words, 40 high (44 on touch), commit on Enter and on blur, Escape gives back; a `maxLength`; in the kit with its states; `components.md` "Text field" and the tokens it needs | `text-field.test.ts` for the logic of the draft (as `NumberField` has) | Kit: the field types, commits, gives back on Escape; axe |
| 7 | The name | The project file preview: the name as a `TextField`, the file's name under it as the API will write it (`lib/handover/file-name.ts` mirrors `file_stem`, the pytest's seven cases its cases), the size and what is embedded (decision 9); the switcher's "This design" row edits the name the same way; `edit-parts.ts`: a change of `name` asks neither the layout nor the run; an empty or blank name is not committed and the field says so (decision 13) | `edit-parts.test.ts`; `file-name.test.ts`; `name-field.test.ts`: trimmed, empty refused, 200 at most | The name typed in Handover shows in the top bar and the switcher at once, and in the downloaded file's name and content; undo by key gives the old name back; the same from the switcher on three sizes |
| 8 | Save a copy; close of pull request 1 | "Save a copy" in the switcher and the project file card download the `.rtd` (the switcher's action becomes live, its `aria-disabled` goes); baselines; the state | | The switcher's Save a copy captured on desktop |
| 9 | The pages of the report | `rooftop_core/export/report.py`: `report_pages(design, day) -> list[Page]`, each with a `title` and a `draw() -> Figure`, cut from `export_pdf_bytes`, which saves them one after the other into `PdfPages` and gives the same six pages (seven and more with a long schedule); `report_page_png(page, dpi)` (decision 4) | pytest: the PDF's pages' texts unchanged against the ones of today for the demo and for the 40-string design; the titles; a page as a PNG of 1754 × 1240 at 150 dpi | |
| 10 | The pages as images | `/export/report-pages?day=`: `{day, pages: [{number, title, width, height, png}]}` with `png` as base64 at 150 dpi, under the drawing lock, requiring the option as the PDF does (decision 5); `bun gen:api`; `api.reportPages` | pytest: six pages for the demo, each a PNG of the size said, the titles in order; the first page bears the day asked | |
| 11 | The paper preview | `ReportPreview.tsx`: the paper frame (`color-paper`, `radius-panel`, `shadow-panel`) with the page's image at the width of the frame; the thumbnails at the right on desktop (132 wide, the current one with an accent border) and as a row under the page on tablet and phone; previous and next, the keys Left and Right; "Page n of N · Title"; skeletons while the pages come; `lib/handover/report-view.ts` (the page kept per run, the first on a new run) | `report-view.test.ts`: the page, the bounds, the words of the head | The six thumbnails and the page equal the API's answer (the image's size, the titles); next and previous on three sizes; the keys on desktop |
| 12 | Download PDF; close of pull request 2 | The button asks `/export/pdf` with the browser's day; the facts "A4 landscape · 6 pages" once the pages are known; baselines (the clock of the page fixed in the screens test, decision 2) | | The PDF captured on desktop: `%PDF-`, six pages, the name the API's |
| 13 | The SLD's model | `lib/handover/sld.ts`: from the chosen option and the equipment, the title, the inverters each with its label and words, its MPPTs each with its strings (count, the strings' labels, "n × s mod" or "not used") and its load from `mppt_loads`, the ACDB, the meter and the grid, in the engine's words (decision 6) | `sld.test.ts`: the demo's option A from a recorded answer: 1 inverter, 6 MPPTs with 4, 4, 4, 4, 3, 3, the title "Single-line diagram · 22 strings of 29 × 560 Wp"; option 26x27x2: two inverters | |
| 14 | The SLD drawn | `SingleLineDiagram.tsx`: an SVG laid out by `lib/handover/sld-layout.ts` (the engine's geometry: a box per inverter, a block per MPPT, the lines, the ACDB, the meter, the grid), the blocks in the series colours by MPPT as the Strings lens colours them, text in Geist; the viewBox scales to the width; an MPPT block under the pointer, the finger or the focus shows its strings and its load in a tooltip; a text equivalent (a list) for screen readers | `sld-layout.test.ts`: the places from the engine's constants | Every count and word of the SVG equals the run's answer; the tooltip on hover, on a tap, with the focus; the PNG captured on desktop: a PNG of 2338 × 1654 |
| 15 | The bill of materials | `BillOfMaterials.tsx`: `Table` with Item (name), Specification (`words`), Qty (mono), Unit (`words`); cards on phone; "In the report, page 5"; "Copy as table" writes the rows as tab-separated text with a header line to the clipboard and says so in a toast (decision 7) | `lib/handover/copy-table.ts` tested: the text of the demo's BOM; `bom-view.test.ts` | The rows equal the run's; Copy as table: the clipboard holds the text (desktop), the toast is shown and leaves after its time |
| 16 | The DC cable schedule | `CableSchedule.tsx`: every string, the eight columns of the engine, the total row (the DC cable's sum); `Table` gains sortable heads (`sort`: a button in the head, `aria-sort`, the arrow; the engine's order by default); `components.md` "Table", sorting; the kit | `table-sort.test.ts`: by string, inverter, MPPT, DC cable m, up and down, stable; `schedule-view.test.ts` | The 22 rows equal the run's; sorted by DC cable m the first row is the longest; cards on phone; Copy as table |
| 17 | Close of pull request 3 | Baselines; axe on the SLD and the tables | | |
| 18 | The zip | `/export/zip?day=`: the five files and the `.rtd`, each named as its own download, `application/zip`, named `<stem>.zip`, the drawn ones under the lock (decision 10); `bun gen:api` | pytest: the six names in the archive, each entry equal to its own export (the PDF by its pages' texts, the DXF by what it draws, the KMZ by its KML); refused without an option as the others | |
| 19 | The CAD layout and the Google Earth model | `CadPreview.tsx`: the layers (the seven fixed, then `STRING_S01` to `STRING_Snn` from the strings; "one outline per module, the unused on MODULES_UNUSED"), the engine's plan (page 2 of the report, decision 8), "R2010 · metres"; `EarthPreview.tsx`: what is in it (the roof, each obstacle as "{name} h={height}", the used modules by count) and what is not (positions not used, the inverter, the wiring), from the document and the run (decision 8) | `cad-view.test.ts`, `earth-view.test.ts`: the words of the demo | The layers and the names equal the run's and the document's; the DXF captured on desktop opens as text with `STRING_S22` and no `STRING_S23`; the KMZ captured is a zip holding `doc.kml` with the six names |
| 20 | The hourly data | `HourlyPreview.tsx`: the CSV asked once per run (`/export/csv`, kept in the downloads store for the download too), its first 8 rows as a table with the column meanings under it (`lib/handover/csv-columns.ts`, the words mine, approved on the board); the download saves the same bytes (decision 8) | `csv-head.test.ts`: the rows and the header parsed from the CSV's first lines | The rows equal the file's; the CSV captured on desktop has 8,761 lines and the five columns after the time |
| 21 | Download all | The button beside the title: `/export/zip` with the day, on its way in the button, a failure as a toast; its facts "6 files · one zip" | | The zip captured on desktop holds the six names |
| 22 | Axe, the sizes; close of pull request 4 and the phase | Axe on every item and state on three sizes; baselines; "As built" with the deviations and what was found; the status; the state | | Axe clean |
| C | Close | "As built" in the phase file, status in `README.md`, `STATE.md`, the record of session 13, resume 012 set to used | | |

## Decisions I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | The `.rtd` is written by the API (`/export/rtd`) with the engine's `Project.to_json`, format 2, and needs no chosen option, no voltage and no run: it is the one item that is always there. The web never writes the file itself | One writer of the format (D7); a design before a voltage can be saved; the desktop app reads what the engine writes |
| 2 | The report's day is the browser's: the web sends its local day as `?day=` to `/export/pdf`, `/export/report-pages` and `/export/zip`; without it the API prints the server's day as today. The preview and the PDF agree to the day. In the screens test the page's clock is fixed, so the picture of page 1 does not change with the calendar | The open item; the API is a function of its request (D6); a baseline must not move daily |
| 3 | `/handover` is the list: on desktop and tablet with the first item's preview beside it, on phone the list alone; `/handover/[item]` is the item, on phone a pushed screen with a back row "Handover". The tab bar's Handover and the top bar's Export lead to `/handover`. On tablet the list is 300 wide and the thumbnails are a row under the page | `information-architecture.md`: "on phone the list is the screen and a preview opens as a pushed screen"; phase 0: tablet "two columns where content allows" |
| 4 | The preview of the report is the engine's page as an image, in the paper frame: the PDF and the preview are the same drawing. The approved board's hand-drawn page 1 is not built; the board is redrawn with the engine's page | The phase file: "the on-screen preview shows those pages as images"; the PDF equals the desktop's output; the mockup is redrawn where the phase file is explicit, as Phase 8 redrew the chain |
| 5 | The pages come in one answer, `/export/report-pages`: each page's title, size and PNG at 150 dpi (1754 × 1240) as base64, about 550 KB for six, drawn in about 0.8 s under the lock; the thumbnails are the same images scaled by CSS. Each page has a short title given by the engine: Summary, Layout, Shadows, Energy, Schedule, Schedule (continued), SLD | One request, one skeleton, typed through OpenAPI; six requests would race an option change; 150 dpi is sharp at the frame's 780 px on a 2× screen; the words are the board's |
| 6 | The SLD is drawn in the browser as an SVG from `system.strings`, `inverters`, `mppt_loads` and the equipment, with the engine's geometry and words ("INV-1", "4 × 29 mod", "MPPT 1 · DC", "MPPT 6 · not used", "AC", "ACDB", "Net meter", "kWh", "Grid / LT panel", the title), in the Dusk palette: the blocks in the series colours by MPPT as the Strings lens colours them. It is held equal to the engine's PNG by the same numbers (the counts, the labels, the structure), never by pixels; the PNG download is the engine's on A4. An MPPT block under the pointer, the finger or the focus shows its strings and its load (`mppt_loads`) | The phase file: "Interactive SVG drawn in the browser from the system data"; the engine's words are not reworded; one palette for the strings across the app |
| 7 | The BOM and the cable schedule are `Table`s of the engine's rows and words; the schedule has every string and a total row for the DC cable, and its heads sort (string, inverter, MPPT, modules, Voc cold, Isc, DC cable m), the engine's order by default; `Table` gains `sort` with `aria-sort`, drawn in the kit and written in `components.md`. "Copy as table" writes tab-separated text with a header line to the clipboard, pasteable into a spreadsheet, and says "Bill of materials copied as a table" in a toast of something done | The phase file: "sortable", "copy as table"; the Table's rules; the toast's rules (D32) |
| 8 | The CAD preview lists the DXF's layers from the run (the seven fixed, one `STRING_Snn` per string) and shows the engine's plan: page 2 of the report, already drawn. The KMZ preview says what is in the file in the engine's names ("Stair room h=3", "Modules (638)") and what is not. The CSV preview asks the CSV once per run and shows its first 8 rows with the meaning of each column in words of mine; the download saves the same bytes | The previews say what the file holds, from the file or from what makes it; no second drawing of the plan; the hours are not in the run's answer and the CSV is 482 KB once |
| 9 | The project file preview shows the name as a field, the file's name as the API will write it (`fileStemOf` in TS mirrors `file_stem`, the same seven cases tested on both sides, and the browser test compares the row's words with the download's name), the size (the `.rtd` is asked once per edit when the item opens), the format and what is embedded (the module file or the bundled sample, the inverter file, the weather and its hours, the system voltage, the chosen option) | The phase file: "Name, size, what is embedded"; the name shown before download must be the API's |
| 10 | "Download all" is a secondary button beside the title of the list, with the facts "6 files · one zip"; the API makes the zip (`/export/zip`): the five files and the `.rtd`, each named as its own download, about 1.1 s and 370 KB on the demo; the drawn ones under the lock. It needs a chosen option like the five | One request and one file; the names agree with the single downloads; the board gets the button |
| 11 | Before options (no voltage, no positions, no length fits, too few positions) the rows show the API's `no_options` title as their facts and are dim, the project file alone is live, and the preview shows the API's title and message with a link to the Strings lens (D37); the first load shows skeletons; a run that failed shows the API's words with Try again. The web judges nothing itself: `require_option` would refuse the same way | D10, D37; Phase 8, decision 15; "each item says what is missing and links to it" |
| 12 | A download is a blob of the API's bytes saved by an anchor with `download` and the name from `Content-Disposition`; a store without React holds each item's state (idle, on its way, failed with the API's words), shown as a ring in the row's icon and in the button; two presses on one item while it is on its way are one download. A failure is a toast with a note (stays until closed) in the API's words with "Try again"; the shell gets its `Toaster`, above the tab bar on phone. A download done says nothing: the browser shows the file | The browser's own download UI is the confirmation; `guidelines.md` "Failure"; the open item of the toaster |
| 13 | The name is a committed edit of the document's `name`, trimmed, 200 characters at most, undone by key like any edit; it asks neither the layout nor the run. An empty name is not committed: the field gives back the name of before and says "A name is needed". It is edited in two places, the project file preview and the switcher's "This design" row, by one `TextField`; the top bar shows it at once. The desktop's `.rtd` reads it on open | Gap 1 of the inventory; the run does not read the name; D32: an edit that cannot stand is not committed |
| 14 | The facts of the rows are the board's words from the run's chosen option: "A4 landscape · 6 pages" (the count once the pages are known, "A4 landscape" before), "22 strings of 29 × 560 Wp · 1 inverter, 6 MPPT", "638 modules · 27 tables · 1,681 m DC cable" (the BOM's quantities), "22 strings · Voc cold 1,480 V", "Metres · one layer per string", "Roof, obstacles with heights, 638 modules", "8,760 rows · irradiance, temperature, power" (the weather's hours), "Pune-demo-roof.rtd · opens offline" | The board; every number the engine's |
| 15 | The downloads are captured in the browser tests on desktop alone, as the acceptance asks; the preview's navigation runs on three sizes. The files are checked as bytes in the test: the PDF's header and its page count by its page objects, the CSV's lines and header, the DXF's layers as text, the KMZ's and the zip's entries by their names, the `.rtd` parsed, the PNG's header and size | The acceptance; the deeper checks (ezdxf, the KMZ's re-import, pypdf) are pytest's and stay there |
| 16 | The clipboard test runs on desktop with the context's permission; on touch sizes the toast alone is checked | Chromium's emulation of touch has no clipboard permission in the test runner |

## What was found in the code and the API, for the steps

| Step | Fact |
|---|---|
| 1 | `services/export.export` prepares and runs options for every kind; `KINDS` is a table of `Kind(media_type, ending, write, drawn)`; `convert.project_to_engine` makes the engine's `Project` of the request |
| 2 | `pathOfWorkspace("handover")` gives `pathOfItem(FIRST_ITEM)`; `TopBar.Export` uses it; `Shell.Frame` opens the demo when no design is open |
| 3 | `option-cards.ts` and `mppt-table.ts` read the option's fields the same way; `format/performance.ts` has `fixed` |
| 4 | `page-view.ts` of Performance gives the states from `designStatus`, `progress`, `failure` and `no_options`; `NoOptionsCard` draws the API's words with the link |
| 5 | `fileNameOf` reads `Content-Disposition` with `filename*`; `Toaster` takes `className` and `toasts`; `TOAST_STAYS` in `design-numbers.ts` |
| 7 | `ProjectMenu` draws "This design" with the name and the saving; `ACTIONS` marks later actions by having neither `href` nor `opens` |
| 9 | `export_pdf_bytes` makes six figures in one `with PdfPages`; `schedule_pages` cuts the schedule at 28 then 40; `d.coeffs.warning` is the note of page 1 |
| 13 | `plots.draw_sld` counts the strings per MPPT from `inverter_of` and `mppt_of`; the API's `PVString.inverter` and `mppt` are from 1 |
| 14 | `string-colours.ts`: `categoryOf(string, "mppt")`, `seriesColourOf`; `ValueTooltip` is the tooltip of a value |
| 16 | `Table` has `total`, `words`, `dense`, `cardColumns`; no sort |
| 18 | `export_kmz_bytes` zips with `zipfile.ZIP_DEFLATED`; the pytest helpers `_pages`, `_drawn`, `_kml` compare files |
| 20 | `export_csv_bytes` is `hourly.round(3).to_csv`, the index named `time_utc_hour_start` |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| A yes or no to each decision above | Before step 0 | Everything |
| The four boards of step 0, with the words of decisions 5, 8 and 13 | Before step 1 | Pull request 1 |

## Risks

| Risk | What I do |
|---|---|
| The report's page 1 changes with the calendar, so its picture would move daily | The day comes from the browser and the screens test fixes the page's clock (decision 2) |
| Cutting the PDF into pages changes the PDF | The pages' texts are compared with today's for the demo and the 40-string design before and after (step 9) |
| The pages' JSON is 740 KB as base64 | Asked once per run, kept in the store; 150 dpi is the lowest that is sharp at the frame's width on a 2× screen; "As built" says the time |
| Download all holds the drawing lock for a second while another export waits | The lock is per process and the wait is under a second; the button shows its ring |
| The switcher's new field moves every screen with the top bar | The kit's and the Studio's screens run before the full check (Phase 8's lesson); the field is closed until pressed, so a closed switcher is unchanged |
| Downloads under Playwright's touch emulation | Captured on desktop alone (decision 15); the previews run on three sizes |
| The clipboard under Playwright | The context's permissions on desktop; touch sizes check the toast alone (decision 16) |
| `fileStemOf` in TS drifts from `file_stem` | The same seven cases on both sides, and the browser test compares the row's words with the download's name |
| Four pull requests and step 0 are more than one session | The state is written after each pull request; each session ends at a merge |

## Done means

The acceptance of `plan/phase-09-handover.md`, point by point:

- Each export downloads and opens: the PDF's page count 6 (pytest, and the browser's file), the DXF in ezdxf with its
  layers (pytest; the browser's file names them), the KMZ re-imported through `/roof/import` with its heights (pytest; the
  browser's file holds `doc.kml`), the CSV's 8,760 rows and five columns (pytest and the browser's file).
- Playwright: download events captured and the files checked on desktop (steps 5, 8, 12, 14, 19, 20, 21); the preview's
  navigation on three sizes (steps 3, 11); baselines beside the boards; axe clean (step 22).

And beyond it: the boards of step 0 approved and in the repo; the project's name edited here and in the switcher and
written into every file; "Download all" as one zip; the `.rtd` saved before a voltage too; the report's day the user's;
"As built" written.
