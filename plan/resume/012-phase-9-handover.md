# 012: Phase 9, Handover and exports

Written: 2026-10-03, by session 12, at the owner's request. Status: open. After 011 (Phase 8).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 9: the Handover workspace:
every deliverable of the desktop app, previewed before download: the report (PDF, 6 pages, rendered by the
engine), the single-line diagram (drawn in the browser, PNG from the engine), the bill of materials and the DC cable
schedule as tables, the CAD layout (DXF), the Google Earth model (KMZ), the hourly data (CSV), the project file
(.rtd format 2), "Download all" as one zip, and the project's name editable. The plan of the phase comes first, then
the boards the phase lacks, then the build in pull requests, several in one session.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md (where the work stands, the open items,
the facts of the machine), plan/SESSIONS.md (every pull request carries its screenshots beside the approved board,
at three sizes), plan/README.md (every decision; D5 no database, D7 the .rtd format 2 with the embedded files,
D24 the equipment's names, D25 the DC cable's label, D26 documents to main), plan/phase-09-handover.md (the goal,
the scope's table of eight items, the acceptance: each export downloads and opens, the PDF has 6 pages, the DXF
loads in ezdxf with its layers, the KMZ re-imports with heights intact, the CSV has 8,760 rows and five columns;
downloads captured on desktop, the preview's navigation on three sizes), plan/phase-08-plan.md (how a phase is
planned here), plan/phase-08-performance.md ("As built", "Deviations", "Found on the way": the traps of the browser
tests), plan/reference/functional-inventory.md (2.7 the SLD, the BOM and the cable schedule; 3 Exports; 5 the gaps:
the project name, the cable schedule stopping at 28 strings, the PDF's date), plan/reference/demo-numbers.md (option
A's BOM), and plan/sessions/012/record.md ("Why things are the way they are").
Then docs/design: README.md, information-architecture.md ("Handover": the list at the left, the preview at the
right, the project file at the bottom of the list; on phone the list is the screen and a preview opens as a pushed
screen), guidelines.md ("States", "Writing"), components.md ("Deliverable row (Handover)", "Paper preview", "Table",
"Dialog", "Toast", "Project switcher, open", "State of saving"), design-tokens.md; the preview handover-desktop.png
with its source mockups/Handover.dc.html (desktop only); and build_phase8_performance_boards.py,
build_phase8_part_boards.py with mockups/performance_data.json as the examples for boards drawn from the engine's
own numbers. The previews are rendered by a scratch Playwright script outside the repo (docs/design/README.md,
"About the mockups", says how).
Read the code before you add to it:
  - apps/api/src/rooftop_api/services/export.py (/export/{pdf,dxf,kmz,csv,sld}: the kinds, the file's name from
    the project's, the matplotlib lock, require_option), rooftop_core/export/files.py and what it calls (the PDF's
    six pages, the SLD, the DXF's layers, the KMZ's names, the CSV's columns), rooftop_core/bom.py and readouts.py
    (bill_of_materials, cables: the BOM and the cable schedule the API already answers in every Option),
    schemas/design.py (Option.bom, cable_schedule, system.strings and inverters: what the SLD is drawn from);
    find what the API lacks: a zip of everything, the .rtd as a download, the PDF's pages as images for the
    preview (the engine draws them with matplotlib: one call for every page, or one PDF rendered to images),
    the project's name in the document (Project.name is there; nothing edits it);
  - apps/web/lib/api/client.ts (exportDesign exists and is unused; how a file comes back, ExportedFile),
    lib/routes.ts (HANDOVER_ITEMS, pathOfItem, FIRST_ITEM), app/(workspaces)/handover/[item]/page.tsx (the
    placeholder), components/shell/ProjectSwitcher.tsx and SaveState.tsx (where the name is shown; "Save a copy"
    and "Open a project" are for Phase 10), components/ui/Table.tsx (words, total, cards on phone), Tabs.tsx,
    Dialog.tsx, Toast.tsx and Toaster.tsx (the shell has no toaster yet: a download that failed is the first thing
    with something to say), components/performance/Performance.tsx (how a workspace reads the stores and shows its
    states: before options the API's words, decision 15 of Phase 8);
  - e2e/tests/performance-weather.e2e.ts (a file read by the API before Use; routes that unroute their own handler;
    a press forced on an aria-disabled button), e2e/fixtures.ts (what leaves the machine is stopped; /api/weather
    answered from fixtures), e2e/screens.ts (expectWholeScreen), apps/api/tests/api/test_export.py and
    tests/engine/test_export_bytes.py (how the exports are checked today: page counts, layers, re-import).
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests, the running
stacks and a green `bun check`.

Then write the plan of the phase as plan/phase-09-plan.md, the way phase-08-plan.md was written: what you found in
the code and the API (what every Option already carries for the BOM, the cable schedule and the SLD; what /export
gives and what it lacks: the zip, the .rtd, the pages as images, the name); how a download is made in the browser
and captured in a test (a blob from the API's bytes, the name from Content-Disposition); how the SLD is drawn in the
browser from system.strings, inverters and mppt_loads and how it is held equal to the engine's PNG (the same
numbers, not the same pixels); how the report's pages are previewed (images from the engine, their size on each
screen size); the project's name edited here and in the switcher (one field, the document's name, undo); what
"Download all" costs (every export after a run: 0.2 to 0.9 s each; the PDF and the SLD under the matplotlib lock);
the pull requests (expect three to five: the list and the preview frame with the states and the name; the report's
pages and the PDF; the SLD, the BOM and the cable schedule; the DXF, the KMZ, the CSV, the .rtd and the zip; the
boards first); the steps, each with what is tested without a browser and what in the browser; the decisions you
take unless overruled, each with its why; the risks; what done means, against the acceptance. The boards the phase
lacks are drawn and approved before they are built: Handover on tablet and phone (the list as the screen, a preview
pushed); each deliverable's preview (the report's pages, the SLD, the two tables, the DXF's layers with its plan,
the KMZ's words, the CSV's first rows, the project file); the states (before a chosen option each item says what is
missing and links to it; a download on its way; a download that failed, as a toast; the name edited). Commit the
plan to main, show the owner, wait for the yes; draw the boards, show them (from the previews in the repo; publish
to the canvas only if the session has the Artifact tool), wait for the yes; then build.

Things to know at handover:
  - Every option of the run already carries its BOM, its cable schedule, its strings, its inverters and its MPPT
    loads: the tables and the SLD need no new request. The exports need a chosen option; the API refuses without
    one (require_option) and /design before a voltage answers no_options in words (D37, Phase 8 decision 15).
  - The test stack's API starts with downloads of weather off; a design built on the map gets its weather through
    the flow and the browser tests' fixture of /api/weather (Phase 8, decisions 11 and 13). Nothing of this phase
    needs the network either: the exports are the engine's.
  - The equipment is named as the PAN and OND files state it (D24 and the open item): the BOM and the SLD say what
    the engine says. The DC cable is labelled by the system voltage (D25). "bankable" is never used.
  - The engine's words are not reworded; every number on the screen is the engine's. A table on phone is cards
    (components/ui/Table.tsx); a column of words (words) lies in Geist, figures in mono.
  - Baselines: `--update-snapshots` leaves a picture whose difference is under the 50 pixels allowed; a picture that
    must change is deleted first and written afresh. On tablet and phone the workspaces scroll inside their frame:
    pictures use expectWholeScreen; a tap at something below the window lands nowhere, and a focus that scrolls the
    frame hides a tooltip by design. The kit and the Studio's screens are run before the full check when a component
    in components/ui changed: an agent's extension of a shared component moved 55 screens in Phase 8.
  - The whole bun check takes about 29 minutes (1,680 browser tests on three sizes). Gate a commit on its exit code,
    never on a grep of its words. Run the check as a job of its own, not in one shell line with a git command: the
    owner watches the harness's shells. Two tests fail under its load now and then and pass alone (STATE.md, the
    watch items): if one fails again, look before you rerun.
  - The permission system refuses an agent the test stack (bun dev:bg): agents write code and unit tests in
    worktrees under $TMPDIR with a written brief; you run the browser for them, make the baselines in the main
    working tree, and review what comes back before merging (an agent's report is a claim). Branches built on an
    open pull request are rebased as it moves; git worktree remove before checking a branch out here.
  - The design canvas at claude.ai is behind the repo by nineteen boards; on Bedrock there is no Artifact tool. If
    you have it, publish the repo's boards first (STATE.md, "Facts", says how); if not, say so upfront.
  - Never edit apps/web or apps/api while bun check runs; never git stash while the test stack runs. Documents go to
    main from a worktree of their own when a branch is open (git worktree add --detach under $TMPDIR).
  - Domain questions: read the desktop app (/Users/arunkpatra/codebase/rooftop-design: rooftop_core/export, the
    report's pages, the SLD), PVsyst's help and the handbook (/Users/arunkpatra/codebase/solar-pv-plant-handbook/
    book/chapters, markdown only) first, and cite them; keep the desktop app's behaviour unless a source shows it
    wrong. Ask the owner only what no source settles. The two outside folders are read only after the owner adds
    them with /add-dir.
  - System voltage is never chosen for the user. No red, no cross: a result that does not fit is a tick or an
    exclamation mark with the engine's words.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the mockup, never
read or commit apps/web/.env.local, use the test stack only (bun dev:bg --profile test), bun and uv only, versions
pinned exactly (D4). You may commit, push and merge once the check is green; a change to documents only goes to main
directly (D26). Every pull request shows each screen it changed at three sizes beside its approved board. Be brief,
decide small things yourself, ask me only for major decisions, one at a time, and show me each finished part. Update
plan/STATE.md before you stop; write plan/sessions/013 (or the next number). Past two thirds of your context, finish
the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session, then the plan.
```

## Notes for the owner

- Expect three waits for your yes: the plan with its decisions, the boards, then each merged pull request.
- The Handover board in the repo is desktop only; the session draws tablet, phone, each preview and the states from
  the engine's own files and numbers, and asks for approval before building.
- Likely to need your word: the report's look on screen (the engine's pages as images, or a page view drawn in the
  browser), a convention for the project's name in the file names, and whether "Download all" waits for every export
  or hands them out one by one.
- Two open items touch this phase: the PDF prints the server's date, and the desktop's cable schedule stopped at 28
  strings; the session reads the engine's export before it decides.
- The session reads the desktop app and the handbook for domain questions: add them with `/add-dir` if it asks.
