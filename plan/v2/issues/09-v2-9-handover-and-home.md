# V2 · 9 · Handover and Home: files by who they are for; Home a start screen

Part of the epic **V2** (#207). Board set 9 of the approved V2 design (D105 in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: 9 of 12. Needs first: #209.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219.

## Goal

Handover lists the files by who they are for, each with what it is and its size, the preview the rest of the width, Download all the one primary. Home is a start screen: one title, one line, the search the largest thing, the other ways in, the designs on this device first.

## The board

The canvas page **V2**, row 9: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2HandoverHome.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2HandoverHome.dc.html), [`V2HandoverHomeTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2HandoverHomeTablet.dc.html), [`V2HandoverHomePhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2HandoverHomePhone.dc.html), [`build_v2_handover_home.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_handover_home.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 9 · Handover and Home: files by who they are for; Home a start screen · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2HandoverHome.jpg?raw=true)

Tablet: [V2HandoverHomeTablet](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2HandoverHomeTablet.jpg?raw=true) · Phone: [V2HandoverHomePhone](https://github.com/SolarLayout/rooftop-design-app/blob/24c7fd7a3e3614e826d5a6e4b9fcbe627987d0a6/v2-boards/V2HandoverHomePhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-03** (P0) · Home: The headline "Find your roof.
- **V2-05** (P1) · Home, search: The placeholder "Search an address or paste coordinates" is cut to "Search an address or p…" at 1440 because the button sits in the field.
- **V2-09** (P2) · Home, demo card: The demo card says "Capacity and energy come with the run in the Studio" until the demo has run once.
- **V2-14** (P1) · Home with designs: With one design on the device the page is 1,409 px; the Find my roof button is scrolled out when the user looks at their designs, and the designs are under the demo.
- **V2-36** (P2) · The project menu: "This design · Pune demo roof · Saved on this device" with a pencil; "On this device · Pune demo roof · 439.04 kWp"; then New design, Open a project, Import a drawing, Save a copy, Home, Docs.
- **V2-60** (P2) · Home and the project menu both list the device's designs: , with different cards and menus (Home has Rename, Duplicate, Save a copy, Delete; the menu has none).
- **V2-62** (P2) · Handover's "Save a copy" is in four places: (the top bar's Export, the project menu, the Project file card, Home's card menu) with "Export" meaning the same zip as "Download all".
- **V2-90** (P1) · Handover's list and preview: The list's facts are specs ("28 strings of 28 × 560 Wp · 2 inverters, 6 MPPT"; "Metres · one layer per string"; "8,760 rows · irradiance, temperature, power"); the badges are formats (PDF, PNG, BOM, DC, DXF, KMZ, CSV, RTD) where BOM and DC are not formats.
- **V2-91** (P2) · The bill of materials' caption: "The bill of materials of option D, as the engine lists it" and the schedule's "in the engine's order, by string".
- **V2-92** (P2) · The CAD layout's layer list: (ROOF, SETBACK, KEEPOUT, MODULES_UNUSED, STRING_S01 to STRING_S28, "R2010 · metres · x east, y north") is the DXF's internals shown as the preview's facts.
- **V2-93** (P2) · The Google Earth model's "Not in the file": list ("Heights as shapes · everything lies flat, the heights are in the names, as the import reads them").
- **V2-94** (P2) · The hourly data's columns: (time_utc_hour_start, ghi_w_m2, poa_eff_w_m2, t_cell_c, p_dc_kw, p_ac_kw) as the preview's first thing.
- **V2-98** (P3) · "Copy as table": copies HTML with a toast "Bill of materials copied as a table".
- **V2-108** (P1) · Density, by region: Characters per 1,000 px² in view: the Roof inspector 1.4, the Array 2.5, the Strings 4.6 (desktop); the phone's Studio main region 8.8 to 10.8, the Find sheet 4.2 at the half stop.
- **V2-115** (P2) · The hero scale on Home: 72 px display over 18 px lead over 16 px cards: a ratio of 4.5 between the first two steps, a marketing page's scale, for a screen whose job is a search field (A · V2-03).

## Scope in

1. Handover's list (`DeliverableList.tsx`, `DeliverableRow.tsx`, `lib/handover`): groups For the client (Design report), For the utility (Single-line diagram), For the installer (Bill of materials, Cable schedule, CAD layout), For you (Project file, Hourly data, Google Earth model); each row its name, what it is and its size, a badge of its format alone (PDF, PNG, CSV, DXF, RTD, KMZ), its Download.
2. Handover's head: `Handover`, its line (D96), Present, `Download all · <size>` the one primary. Export and Save a copy leave; the project file is a file of the list (Download in the design card's menu too).
3. The preview the rest of the width (`Preview.tsx` and each preview): the item's name, who it is for and its facts, its own Download; the report at the width with its page thumbnails; the hourly data's columns by plain name with the file's column under each (Hour · UTC · `time_utc_hour_start`, Sunlight on the ground · W/m² · `ghi_w_m2`, Sunlight on the modules · `poa_eff_w_m2`, Cell temperature · `t_cell_c`, DC power · `p_dc_kw`, AC power · `p_ac_kw`); the CAD layout's layers behind `What is in the file`; the Google Earth model's one line `Heights are in the names; Google Earth draws the shapes flat.`; no "engine" in any caption; Copy and Copied.
4. D93's failed first run kept, in the voice (`Not made: the run failed`).
5. Home (`components/home/*`): `Rooftop PV design` at `title` (26; 20 on phone), `Outline a roof on the map. The app lays out the modules, the shade, the strings and the energy of a year.`, the search 56 high (`Address or coordinates`) with `Find the roof` beside the field (under it on phone), the ways in as links: Use my location, Enter the roof by hand, Import a drawing, Open a project file; with designs on the device, `Your designs · on this device` first, under the search, which stays at the top as the page scrolls; `Try the demo` after (`A finished design on a 90 × 40 m roof in Pune, to look around before you start your own.`, Open the demo; no figures); Docs at the header's right.
6. One design card and one menu (Open, Rename, Duplicate, Download the project file, Delete) on Home and in the project switcher (`DesignCard.tsx`, `ProjectSwitcher.tsx`); the open design listed once in the switcher.

## Scope out

- The exports' content and the report's pages (V2-95).
- Present itself (its captions are the vocabulary's, issue 11).

## Where the code is

- `apps/web/components/handover/*`, `apps/web/lib/handover/*`, `lib/flow/deliverables`
- `apps/web/components/home/*`, `apps/web/lib/home/*`
- `apps/web/components/shell/ProjectSwitcher.tsx`, `switcher-view.ts`, `OpenProject.tsx`, `ImportDrawing.tsx`

## Words

As in Scope in; the vocabulary's rows of "The places" and "Getting started".

## Help to keep true

Topics that name Export, Save a copy, Home's words or the deliverables (search `Export`, `Save a copy`, `Download all`, `deliverable`).

## Tests, written first

- The groups and each row's line from the deliverables.
- The hourly columns' plain names.
- Home's order with and without designs.
- The design card's menu.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Handover lists the files in four groups by who they are for, the preview filling the rest of the width.
- [ ] Download all is the one primary; no Export or Save a copy anywhere.
- [ ] Home opens on the title, one line and the search; with designs, they come before the demo.
- [ ] The search's placeholder is never cut.

## Rules that hold for this work

- Build to the board; tokens only (hard rule 9, the V2 tokens of D94). A missing value becomes a token first.
- Test first: the pure logic of every behaviour in "Scope in" in a `*.test.ts` that fails before the change. No new
  browser suites and none run (the owner, 2026-10-11); the screens are checked by hand at three sizes.
- Every word the user meets follows `plan/v2/voice.md`; the app's own words are explained once, as D96 says (`EXPLAIN` in
  `docs/design/mockups/build_v2_parts.py` holds the approved lines; the app keeps them in one module).
- Never a red cross, never "bankable" (hard rules 4, 5); the system voltage rules of D87 and D88 hold.
- `bun check --skip=e2e` green before every commit; `bun gen:api` after a change to the API's routes or models.

## The pull request

One pull request for this issue, from a branch reset to `origin/main`, never stacked (`plan/v2/build.md`, "The loop").

- Title `V2 · 9 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #216`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md)
