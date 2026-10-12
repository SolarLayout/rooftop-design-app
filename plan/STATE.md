# State of the work

The single place that says where the project stands. Every session reads it first and updates it last.
Keep it short and true. History belongs in git and in the phase files, not here.

**Last updated:** 2026-10-12 (V2's build on the owner's Mac: #216, Handover and Home, merged in #230 and #232 (#231 the export kinds' test); #217 next. Before it #215, Performance, merged in #229. Before it #212 merged in #225, #213 in #226, #214 in #228, and the engine's shade loss held at zero or more in #227; #215 next, resume prompt 023. Before it, the cloud paused #212 a third done, resume prompt 022. Before it #211, Find, merged in #224; Before it #210 in #223, #209 in #222, #208 in #221. Before it: V2's design approved, D94 to D109; the epic #207 and its sub-issues #208 to #220 filed, label v2, resume 021). Before it, 2026-10-12 (V2 opened: the audit and the voice in `plan/v2/`). Before it, 2026-10-11 (#179's rest, #200 to #205, and D93, #206: merged and deployed to staging and production at dc34cf4; before it #114: the strings' legend, one entry per colour, D92, #199; before it the map seen working from the cloud, resume 019). Before it, 2026-10-11 (Claude Code cloud sessions set up, #198). Before it, 2026-10-10 (the skill product-video reviewed, #197; the Sun lens video, #196; the launch video and the skill product-video, #195; #187 to #192 deployed; see the end of the paragraph below). Earlier, 2026-10-08, session 22: **Phase 16 built**, the system voltage set by the user's country (D87: 600 V
in the US and Canada, 1000 V elsewhere; the request's country, else the time zone, else India; D88: the equipment never
moves the voltage, the app never raises it). #153 (who set it, engine and API), #154 (`/country`, `lib/country`, the store),
#155 (the Strings lens and the picker to the boards), #156 (the help), #157 (the browser suites, changed by reading); then
#158 (the bundled files named by their names, not their path on the server) and #159 (the help sheet's mark says who set
the voltage), both found while building. The
boards "System voltage · Set by the user's country" approved and on the canvas, their third state from the build. Hard rule
3, D10 replaced. Before it, the voltage questions: the analysis of F7 (no rationale found in either repository; the v1
spec's artifact cannot be read), the codes (NEC 690.7 and 690.31(G), AS/NZS 5033 and 4777.1, IEC 60364-7-712, CE Code
Section 64, MNRE) in `plan/phase-16-system-voltage.md`. Record: `plan/sessions/022/`. **Deployed:** the owner deployed `main` with #153 to #159 and checked it (2026-10-08).
**Then, session 23 (2026-10-08):** a tester's report, "no more than 13 strings although the inverters have MPPTs free":
the engine cut a string along one row only, so short rows left their ends unused. #160: each row gives its whole strings,
then what the rows leave at their ends runs on into the next rows of the same orientation; strings in a row are used first,
so the demo's option A is unchanged, D and E grow (28 × 28, 29 × 27). The parity snapshots renewed by `tools.parity renew`
(only what moved past D64's bar). Time and memory measured in the API's Linux image, one thread (D67): the roof at the
limit about +0.08 s and +45 MB (664 to 709 MB; on Lambda about 970 MB of 1,769), the demo unchanged; the cost is the
modules the options now place, not the forming; numbers in #160. Not deployed. The owner: there is no desktop app at
all; the desktop version was a proof of concept, this repository is the product.
Then #161, in two: #163, the options within the DC/AC target add inverters when the target needs them (a small
inverter had dropped strings: a 10 kW roof's recommended placed 105 of 160, now 152); #164, the third length tried is
the one from the nominal up that places the most modules (160 of 160 there), not below the nominal (short strings win
positions on what the run does not price: cable, current, connectors); strings counted without forming them
(`strings_held`), the API's answer about 0.45 s faster on the roof at the limit. Both measured in the Lambda image, one
thread: no added time or memory. The demo unchanged. **Deployed:** the owner deployed `main` at e44a471 (#160, #163,
#164) to staging (version 19) and production (version 16), 2026-10-08; the image smoked on staging, both at 1,769 MB.
Then #162 (#165, D89): a project the app accepts can always be run and opened (a weather CSV 3 MB, a PAN or OND
256 KB, a project file 5 MB; the largest project is a request of 4.53 MB to run, 5.36 MB to open, of AWS's 6.29 MB);
the CSV dialog refuses a larger file before sending it; no words of a desktop app, no remedy for a file the app never
writes; Handover's project file "opens again here". The boards changed with it (`OpenProject`, `Handover*`): sources,
previews (rendered as `docs/design/README.md` says, checked against the old ones first) and the canvas (version 45, the six
files only). **Deployed:** the owner deployed `main` at 1a20137 (#165) to staging (version 20) and production (version
17), 2026-10-08; the image smoked on staging.
Then the help read against #160 to #165: Options and Inverter made true again (#166; not deployed). The process
written so it is not missed: `docs/help-upkeep.md` (every pull request that changes what the user meets keeps the help
true in the same pull request), linked from the root `CLAUDE.md`, `apps/web/CLAUDE.md` and a new `apps/api/CLAUDE.md`
(which also says how an engine change is measured for time and memory as Lambda runs it).
Then the phone's tab bar, installed on an iPhone (#167, D90): its foot is the larger of its own padding and the home bar's
zone, never both: 96 px with 41 px under the labels (was 106 and 51), 72 px without a home bar; the toasts on the same
height. Measured at insets of 34, 24 and 0 px. **Deployed:** the owner deployed #166 and #167 to staging and production and
checked the tab bar on his iPhone, installed (2026-10-09): "all good".
The launch on the website and the docs, filed 2026-10-09 (the other repos' work, design first on a canvas):
SolarLayout/solarlayout#1310 (the site re-imagined for three products, Rooftop's page; the cloud stays gated dark) and
SolarLayout/solarlayout_desktop_docs#19 (Rooftop's docs, a new landing for three products). Revised the same day: no
rebranding, the logo unchanged; the website's scope is Rooftop's product page(s) and a header for three products, in the
site's existing look; the docs keep their look (the "Drawn to scale" boards on canvas
https://claude.ai/artifact/7idR7mgtEdJQLxiNmYjosL withdrawn).
The website's designs approved on that canvas (page "Rooftop page and header", 2026-10-09) and built in
SolarLayout/solarlayout#1311: `/products/rooftop`; the header Home · Products ▾ · Downloads ▾ · Docs; the home and footer
in the order of weight (utility-scale PV, BESS, Rooftop); "rooftop solar", the industry's wording, never a bare
"rooftops". Open Rooftop goes to the app of the same environment through `NEXT_PUBLIC_ROOFTOP_URL`, set in the
`solarlayout-web` Vercel project (Production and staging); a deploy build without it refuses to start. **Deployed** to
staging and production (2026-10-09), checked live at 1440, 834 and 390. Still to come: the docs (solarlayout_desktop_docs#19) and the Rooftop legal pages.
The docs: `solarlayout.app/docs` is the company-level index (solarlayout_desktop_docs#20, #21, live 2026-10-09; search
fixed through the website's proxy); each app opens its own docs and skips it, so Rooftop's Docs link and help topics will
open `/docs/rooftop`. The writing standards for three products and the Rooftop tree are in that repo's
`docs/WRITING_GUIDE.md`. Rooftop joins the index with its first pages, fact sheet first (`PRODUCT_FACTS.rooftop.md`).
SolarLayout Desktop's Docs button moves to `/docs/solarlayout`: PVlayout_Advance#400.
Then the four issues found while writing Rooftop's fact sheet (filed 2026-10-09), closed the same day: #168, Home says "Your designs are kept on this device." (#172; where data goes said in plain words, no technical inventory); #169, a roof built as Sloped on Find is the roof Sloped makes in the Roof lens (#173, one rule in `lib/geometry/roof-type-rule.ts`); #170, PVGIS weather without its horizon says so and is not kept (#174); #171, nine help claims the code contradicted: the help made true (#175), the east-west ridge line says the ridges run square to the edge closest to the equator and the hints never shown removed (#176), and where the roof holds too few positions for the options yet a string fits, Add your own stands under the words, set to that string, the API saying which (`no_options.fits`; #177, its boards approved on the canvas, page "UI fixes", version 49), and a stale comment (#178). Not deployed.
Then #179 (filed 2026-10-09 from the docs' fact sheet: 29 product issues, one more found while writing the docs), the six that could give wrong numbers fixed, each with its test first and the help kept true: #180 a CSV weather that is not a whole year is refused (item 20); #181 flush modules face the slope, whatever azimuth the array kept (12); #182 the Voc coefficient beside the field is the one the strings are sized with, the one-diode model's unless entered (15); #183 a module rating taken for want of one in its file is said to be taken (14); #184 a row pitch entered under a table's depth is raised and says so (10); #185 a CSV's irradiance with no value is refused, below zero and temperature gaps noted (19). The owner's waiver (2026-10-09): run solo, merge and deploy. **Deployed:** `main` at 960c4b1 to staging and production (2026-10-09), both smoked. The rest of #179 waits, five items marked (decide) for the owner. The docs (solarlayout_desktop_docs#19): Rooftop's tree whole and live (17 pages, #20 to #28; the fact sheet verified at 960c4b1), deployed to staging and production. Then #186: the Location help says a roof made Sloped on Find again loses its parapet (found by the docs' review); deployed to staging and production at f0f5ea7. Left of #19: the app's Docs link and the help topics' links to their pages (a board first), the Rooftop Terms and Privacy draft. Then the owner's decisions on #179's five (2026-10-09) and item 30, each its own pull request, merged on a green check: #187 a new obstacle in the Roof lens joins by Add the <kind> or Enter, not by leaving its height (30); #188 Find's detected footprint has one button, Use this outline (3); #189 the On the roof help says the view's sun and the year's differ by a fraction of a degree (18, both suns left); #190 far shading takes the sky the horizon hides, near shading the rest, the energy unchanged (24; the demo 0.35 → 0.33 % near, 0.01 → 0.04 % far); #191 each string's DC cable sized, the smallest of 4, 6, 10 mm² Cu carrying 1.25 × Isc within EN 50618 ratings with at most 1 % drop at Vmp, the schedule's Drop (%) with a mark over 1 %, one BOM line per size (27); #192 the DXF draws the inverter at its OND's width and depth, else a 2 × 1.2 m block named a symbol, not to scale (28). **Deployed:** `main` at 5d710ae to staging and production (2026-10-10), both smoked. The docs brought to 5d710ae (solarlayout_desktop_docs#29: the fact sheet, six pages, four pictures retaken, a 10 October entry), deployed to staging and production. #179's rest (the items not marked for a fix) stays open. Then #193, the docs from the app (D91, its boards approved 2026-10-10): Docs on Home and in the project menu, In the docs in the help sheet, every topic's `docs` place checked by the gate, the address following the app's (#194, merged at c315538). Not deployed.
Then the launch campaign's video (2026-10-10, no issue): a real 5,058 m² roof in Hadapsar, Pune, designed from the map to the
handover in the app, recorded a frame at a time as the help's clips are, in a wide and a square cut with captions, an email
GIF, thumbnails, the LinkedIn post, and an ElevenLabs narration in plain full sentences (the owner's rule for all copy: plain,
direct, natural sentences, nothing flowery or clipped; captions short). The approved files are in the website's repository,
`solarlayout/output/rooftop-launch-2026-10-10/` (ignored there). The tooling is the skill `product-video` of this repository
(#195: `.claude/skills/product-video`, let into git beside the ignored `.claude/`; its work in `.product-video/`, ignored),
script-driven so that feature clips and long walkthroughs come the same way. `bun check` on that branch failed only in the
browser group `e2e:shell`, 40 failures of the screens' pictures, the device's saving states and the mobile layout tests that
predate the change (the suites waiting for the owner's run); the GitHub check was green.
Then the first feature video from the skill (2026-10-10, no issue): the Sun lens for LinkedIn, 47.8 s, the lens opened on the
launch's roof over the imagery, the day played, the engine's shadow outlines, 21 June, the shade map, six narrated lines; its
assets `assets/videos/sun-lens` (#196), the cuts and thumbnails in `solarlayout/output/rooftop-sun-lens-2026-10-10/` (ignored
there). The owner's rule, same day: every video is delivered with its thumbnails. `bun check` on that branch failed only in the
browser group `e2e:kit`, 25 of 545 (a phone dialog 421 wide on a 390 screen, the project switcher, toasts, the kit pictures
shifted page-wide); `main` at 758cd6f fails the same 25, so it predates the change and waits for the owner's run with the rest.
Then the skill reviewed on the owner's three rules of the day (#197): every video is delivered with its thumbnails, made by
the pipeline from the frame `plan.json` names (the overlay step refuses to run without it, `compose.py` writes them beside
each cut); a video for LinkedIn, Twitter or an email is delivered with its post, tweet or email (`post-<channel>.md`,
`references/posts.md`, the launch's post the model, the Sun lens post written); and the skill stays self-contained for
other people's machines, macOS or Windows (file URLs through `pathToFileURL`, both platforms' commands, no path of one
machine). The browser step of that check failed in the handover group's pictures while kit passed, so the kit failures
above are flaky on this machine; both wait for the owner's run.
Then Claude Code's cloud sessions (2026-10-11, #198): a SessionStart hook (`.claude/hooks/session-start.sh`, registered in
`.claude/settings.json`, both let into git; `settings.local.json` stays ignored) that in the cloud alone runs `bun install`
and `uv sync` and points the Chromium build `@playwright/test` 1.52.0 asks for (1169) at the container's (1194). Checked in a
cloud container (4 cores, Node 22.22, bun 1.4.2, uv's Python 3.12.13): the test stack up, the rewrite and the demo answer,
`bun check --skip=e2e` green (922 pytest, 2,184 bun tests). The cloud's address is `localhost:4710`, so the Esri key's
referrers now hold `http://localhost:4710` and `http://127.0.0.1:4710` beside 4700; the owner regenerated the key, in
`.env.local` and in the cloud environment's `NEXT_PUBLIC_ESRI_API_KEY`. Seen working in the first new cloud session
(2026-10-11, resume 019): Esri's suggest answers from both referrers of 4710, and in the app at 1440 Home's search gave
places, one picked opened Find at it with the imagery (findAddressCandidates and the World_Imagery tiles all 200). The screen pictures' baselines are darwin only, so their tests cannot pass on Linux.
The owner (2026-10-11): the browser tests are set aside; they are broken and will be fixed later. Until then no browser
group runs, here or in the cloud, and `bun check --skip=e2e` is the check.
**Next:** the V2 design session, resume prompt `plan/resume/020-v2-design.md`: the boards of V2 on a page of the canvas,
one set at a time for the owner's approval, then the epic and its issues on GitHub. Nothing of V2 is built before that. The map from the cloud works (search, Find and its imagery on `localhost:4710`). Later, the browser tests fixed (#157's suites, #151's mobile fixes, the Strings lens pictures whose options
D and E #160 changed, the kit and shell failures above).

## Where we are

| Phase | Status | Notes |
|---|---|---|
| 0 Design | Direction approved. 97 boards on the canvas: the approved design, and the page "UI fixes" of session 18 on (D68 to D79) | More screens to draw, listed in `phase-00-design.md`; the canvas and the repo in sync (`docs/design/README.md`, `mockups/canvas.json`) |
| UI polish | Session 18: #107 to #116; session 19: D79 built (#117 to #122); session 20: Find's first step (D85, #143 to #145) | Driven by the owner, issue by issue; the records: `plan/sessions/018/`, `019/`, `020/` |
| 1 Foundation | Done, merged (PR #1) | |
| 2 Engine and API | Done (PR #7, PRs #11 to #23) | What exists, what was decided, what was found: `phase-02-engine-api.md`, "As built" |
| 3 Design system and shell | Done (PRs #24 to #33) | What exists, what was decided, what was found: `phase-03-design-system-shell.md`, "As built". How its second half was built: `phase-03-rest-plan.md` |
| 4 Find and outline | Done (sessions 6 and 7: #35, #36, #38; the memo #37) | What exists, what was decided, what was found: `phase-04-find-and-outline.md`, "As built". How it was built: `phase-04-plan.md` |
| 4.5 Caching of the checks | Done (session 8: #39, #40, #41) | What exists, the numbers before and after, what was found: `phase-04b-test-caching.md`, "As built". How it was built: `phase-04b-plan.md` |
| 5 Studio, 3D roof, Roof and Array lenses | Done (session 9: #42 to #47) | What exists, what was decided, what was found: `phase-05-studio-roof-array.md`, "As built". How it was built: `phase-05-plan.md` |
| 6 Studio, Sun lens | Done (session 10: #48 to #52) | What exists, what was decided, what was found: `phase-06-studio-sun.md`, "As built". How it was built: `phase-06-plan.md` |
| 7 Studio, Strings lens | Done (session 11: #53 to #57) | What exists, what was decided, what was found: `phase-07-studio-strings.md`, "As built". How it was built: `phase-07-plan.md` |
| 8 Performance | Done (session 12: #58 to #61) | What exists, what was decided, what was found: `phase-08-performance.md`, "As built". How it was built: `phase-08-plan.md` |
| 9 Handover and exports | Done (session 13: #62, #64 to #66; #63 on the way) | What exists, what was decided, what was found: `phase-09-handover.md`, "As built". How it was built: `phase-09-plan.md` |
| 10 Home, projects on the device, Present | Done (session 13, unattended: #67, #69, #71, #72; #68 and #70 for the check) | What exists, what was decided, what was found: `phase-10-home-projects-present.md`, "As built". How it was built: `phase-10-plan.md` |
| 11 Hardening for the tradeshow | Done (session 14: #78 to #86; session 15: D56's run of the whole browser suite and the renewed pictures, #89) | What exists, what deviated, what was found: `phase-11-hardening.md`, "As built". How: `phase-11-plan.md`, scoped with the owner; issues #73 to #77 hold what was deferred |
| 12 Deployment: staging and production | In progress; both environments live (session 16: #90 to #95, #97); left: #99, #100 | `phase-12-plan.md`: what was found, 14 decisions, the owner's steps in order (1 to 4 done), the pull requests; `infra/aws/README.md`: what exists on AWS and how it was made |
| 13 Optimization | Done (session 17: #102 to #106) | What was found, the numbers before and after, what exists: `phase-13-optimization.md`, "As built". How: `phase-13-plan.md`, after the owner's interview (`reference/phase-13-interview.md`) |
| 14 In-app help | Done (session 19: #123 to #137; D80, D81) | `phase-14-in-app-help.md`, "As built"; how to write a topic: `docs/help-content.md`; screenshots: `docs/screenshots.md` |
| 15 Help clips | Done (session 19: #138 to #141; D82 to D84); checked by the owner on an iPhone and an iPad (2026-10-09) | `phase-15-help-clips.md`, "As built"; `e2e/help-clips/README.md` |
| 16 System voltage by country | Built (session 22: #153 to #157; D87, D88); its browser suites changed by reading, to be run | `phase-16-system-voltage.md`, "As built"; `phase-16-plan.md` |

## In flight

**V2** (opened 2026-10-12, `plan/v2/README.md`): the product made usable by a new user alone. The audit (`plan/v2/audit.md`, 121 issues) and the voice (`plan/v2/voice.md`, with §12, the app's own words, D96). **The design** (resume 020, used): thirteen board sets on the canvas page "V2" (version 67; the hosted canvas checked equal to `docs/design/mockups` file by file), each in three sizes by a `docs/design/mockups/build_v2_*.py`. 1 to 12 approved (D94 to D108); the sun's arc kept in the Sun view and its card closeable at the owner's word (D109, board 7). For approval: 13 Present (a proposal; the owner reviews today's Present with it when the build reaches #220, D110) the help's 31 topics in V2 approved (board 11, "The topics", D111, 2026-10-12). **The build:** the epic #207 and thirteen sub-issues #208 to #220 (label `v2`), each complete in itself (copies in `plan/v2/issues/`); the procedure `plan/v2/build.md`; resume prompt 021. Built: #208 Principles (#221: the V2 type, radii, spacing, heights, section headings without the glow, the quiet help disc, the kit's principles); #209 the progression (#222: the five steps in the top bar and the tab bar with their states, Find as Roof's first part, a primary per step with "Next:", Sun a view on every step with `/studio/sun` turning it on, the result chip and its summary in place of the vitals bar, Export and Present out of the top bar, the work column hidden with ⌘ \, the app's words explained once; `lib/words` in the base of the browser groups); #210 the Studio's first open (#223: the step's head with the first-open status, every section a summary row that opens in place and is remembered on the device, who set each value in four words with Reset, the defaults held to the API's, the time on the Sun view alone with the design day's noon elsewhere, tablet's stage 440 with the result row, phone's stage 40 % with the sheet meeting it). #211 Find (#224: the Studio's column and top bar on Find, its head by the step, the search first with its examples, the tools in the column with their words, the tree drawn on the map, the roof type a question with a default, Build pinned with the area, the line on the map in place of the tips card, the height asked beside the obstacle, the by-hand column with four facings and opening by itself without a map; `SummaryRow`, the size hooks and `useShareUnder` moved to the shell. Find's browser suites, `e2e/help-pictures/on-find.ts` and `tools/help/pictures.ts` still describe the old Find: to bring up to date when the browser tests run again and when #219 retakes the pictures). #212 Problems (#225): `Problem` (components/ui) and `lib/errors/problem-of.ts`; the result chip's six states (`result-view.ts`); no string length fits at the Strings step's head with `Use 1000 V` as the step's primary (`lib/studio/no-strings-fit.ts`); notes to review with the Voc field and Keep (`notes-view.ts`, `NotesDrawer`); the stale result at the step's head; the choice-gone toast with Undo and Choose another (a toast may carry `alsoAction`); a refused weather file kept in its dialog; the Strings step's skeleton while sized; the search and server words without the machine. The shade-summary test that failed on this Mac only (−2.2e-14 % by float32 rounding) is fixed in #227: `bun check --skip=e2e` is whole and green here again. #213 The Strings step (#226): options first with why each is there (`option-cards.ts`), the chosen one's fit line and Why (`fit-proof.ts`), How the options are made (`options-rules.ts`), Add your own option with its verdict, MPPT loading a row that opens, the legend a bar at the stage's foot (`--size-legend`) and the sheet's head on phone, the step opening in Plan (`view-store`), `lib/words/plural.ts` ("1 inverter(s)" by count). #214 The Roof and Array steps and the Sun view (#228): Edges and access in groups with usual-value hints (`roof-fields.ts`), the albedo's one home in Performance, obstacles in words (`obstacle-lines.ts`) with Add by kind, the outline edited in Plan by its corners (`lib/geometry/outline-edit.ts`, `OutlineHandles.tsx`), the roof's dimensions on the Roof step alone and once per pair of edges, the module card with Details, Spacing's sentence holding the shade-free hours and design day, the Sun view's card `Shade over the year` (`ShadeCard.tsx`, folds to a chip, remembered) with four switches and the sun's line on the timeline, Imagery one toggle. #215 Performance (#229): the energy of year 1 with Likely and Conservative (`lib/performance/kpis.ts`), Option and Weather as selects with their label above (`Select labelAbove`), three figures, four tabs remembered on the device (`lib/device/remembered-choice.ts`); Where the energy goes in eleven plain steps composed from the engine's (`energy-steps.ts`; fields Soiling, Mismatch, Downtime), All 21 steps with the engine's summary behind it, Uc on Temperature and the rear shading under the rear-gain switch there; the charts' axes labelled (`chart-axis.ts`); the assumptions as five summary rows (`assumption-rows.ts`); the weather's plain names (Typical year · 2023, measured · Your file). `e2e/tests/performance*.e2e.ts` still describe the old page (for when the browser tests run again); the assumption rows' ? discs come with #219. Seen in passing: on phone a Docs link of the top bar stands past the right edge (flagged as a task). #216 Handover and Home, in two: #230 Handover (the files by who they are for, each with what it is and its size read from the zip's directory, `lib/handover/zip-sizes.ts`; Download all with the zip's size the one primary; Export and Save a copy gone; the preview the rest of the width; the API's two new kinds `bom` and `cables`, CSV, in the zip; the hourly columns by plain name; the CAD layers behind What is in the file; Copy and Copied); #231 the API test that pins the export kinds (main went red: the local check's testmon did not select it; after an API change run `bun run test:all` in apps/api); #232 Home a start screen (the title, one line, the search a well of 56 with Find the roof beside it, the ways in as links, `/find?by=hand`; with designs on the device they come first under a sticky search, Try the demo after with no figures; the card's menu `CARD_MENU` with Download the project file; the switcher lists the open design once; the illustration, its tokens and the demo's remembered run removed). `e2e/tests/handover*.e2e.ts` and `home*.e2e.ts` describe the old screens. The owner's standing instructions (2026-10-12): move fast; merge on a green local `bun check --skip=e2e` without waiting for GitHub's check; watch every pull request's and main's GitHub check in the background (`gh run watch <id> --exit-status`, run in the background) and fix any failure in its own pull request, working on meanwhile. Board 11's topic list approved (D111). Next: #217, then #218, then #219 (the help, its topics approved); Present (#220) waits on the owner's review of today's Present beside board 13. The owner's words for it: build autonomously, issue after issue, without stopping; he writes when something is amiss. The hosted canvas is never stale (non-negotiable, 2026-10-12). Before it: #114 done (2026-10-11): the boards "UI fixes · The strings' legend with many MPPT" drawn
(`docs/design/mockups/build_ui_fixes_strings_legend.py`, its prototype a local branch of the cloud container, never merged),
approved (D92), built and merged (#199); the three boards on the canvas (version 52). Then #179's rest, in six pull
requests, each test-first with the help kept true: #200 (items 6, 7, 8: files too large refused in the app's words, the
import dialog's words), #201 (1: a roof built again on Find keeps its trees), #202 (9, 11, 13: the Array lens's lines read
the engine's shade-free pitch and roof edge, new readouts `shade_free_pitch_m` and `edge_azimuth_deg`; no unit gap noted at
0 m; no module fitting leads to the Roof lens), #203 (17, 26: "fits" only beside a tick; the AC cable's 415 V said to be
taken), #204 (21, 22, 23: the CSV's refusals by the file's column and line, no "hourly" alone; the rear-gain switch off on
a sloped roof with why), #205 (25: Handover after a first run that failed shows the note alone; the bill of materials'
duplicate key). Not changed, with reasons on the issue: 2 and 16 (as designed), 4 and 5 (the help says so), 29 (no path in
the app reaches it). The parity snapshots renewed in #202 and #203 (new readouts; verdict titles), every number unchanged.
The boards Import with missing heights and Weather and assumptions follow the new words (canvas version 53). Then D93:
after a first run that failed, each waiting row of Handover says "Not made · the run failed" and on phone the note stands
under the list's head (boards approved, canvas version 55; built in #206). **Deployed:** `dc34cf4` (#199 to #206) to staging
(run 45, smoke passed) and then to production (run 46), 2026-10-11; both answer `/api/health` with that commit and run the
demo to 617.8 MWh. The owner's standing instructions (sessions 18 to 20): run solo once a design is approved, open the pull
requests and merge them on a green check, one after the other; no stacked pull requests; no browser test suites run and no
new UI tests; each change checked by hand in the browser with Playwright at three sizes, its screenshots in the pull request
(the orphan branch `pr-shots`), and the owner told the link (the page is not opened to check them, session 20); every board
for approval in three sizes on the canvas. Prototypes of boards are local branches never merged (`design/in-app-help`,
`design/find-tools-help`, `design/help-clips`, `design/find-first-step`). Left of Phase 12: #99 and #100. Watch items: ECR's 8 high
CVEs in Debian's base; no lifecycle rule on ECR; the Esri keys expire about 2027-10; GitHub delays events now and then.

## What the web app has today

| Thing | Where |
|---|---|
| Fonts, from the repo | `apps/web/app/fonts` |
| Design tokens, and Tailwind made of them alone | `apps/web/app/globals.css`; the document is `docs/design/design-tokens.md` |
| Numbers of the design that code needs (times, gaps, the pause before a run) | `apps/web/components/ui/design-numbers.ts`; the document is the same, "Numbers in code" |
| Components: Button, ButtonLink, IconButton, Icon, StatusMark, Card, Stat, Segmented, Switch, NumberField, Stepper, Slider, RangeSlider, Sheet, SheetGrip, ProgressRing, RunStep, Skeleton, Tooltip, Toast, Toaster, Select, FloatingPanel, Dialog, FileDrop, Table, Tabs | `apps/web/components/ui` |
| The kit: every component and every part of the shell in every state, development only | `/kit`, `/kit/part-2`, `/kit/shell`; `apps/web/app/kit`, `apps/web/components/kit` |
| The typed client of the API | `apps/web/lib/api` |
| Stores without React: the project, the results, the view | `apps/web/lib/stores` |
| The data flow: what follows a committed edit; opening the demo | `apps/web/lib/flow/design-flow.ts` |
| Formats: the quantities of the vitals, the place of a design | `apps/web/lib/format` |
| The places that have an address: workspaces, lenses, items of Handover | `apps/web/lib/routes.ts` |
| The shell: top bar, navigation, project switcher, state of saving, vitals, notes; the frame of the Studio | `apps/web/components/shell`; around `apps/web/app/(workspaces)` |
| The stores for React, and the hooks that read them | `apps/web/components/shell/stores.tsx` |
| Routes | `/` (Home: the search leading to Find, Import a drawing, Open a project, the demo's card, the designs on this device), `/present` (Present mode, desktop and tablet), `/find` (the map, the search, the outline), `/studio/[lens]` (Roof, Array, Sun and Strings built), `/performance` (built), `/handover` (the list; on desktop and tablet with the first item beside it) and `/handover/[item]` (the item, pushed over the list on phone; every item built) |
| Handover: the list with its facts from the run, the preview frame and its states, the downloads (a blob saved by an anchor, a store without React, a file kept per edit, up to three tries, a failure as a toast), the shell's `Toaster`, the project file with the name as a `TextField` and Save a copy (here and in the switcher); the report as the engine's pages in the paper frame with thumbnails, keys and Download PDF of the same day; the SLD as an SVG from the system in the series colours with a tooltip per MPPT and the engine's PNG; the bill of materials and the cable schedule as tables with sorting and Copy as table; the CAD layout (the engine's plan, the DXF's layers), the Google Earth model (the KML's names, what is not in it), the hourly data (the CSV's first rows and its columns); Download all as one zip | `apps/web/components/handover`, `apps/web/lib/handover`; `components/ui/TextField.tsx`, `Table.tsx` (sorting), `ValueTooltip.tsx` (a side); `components/shell/ProjectSwitcher.tsx`, `NoOptionsCard.tsx`, `UnderTheTitle.tsx`, `use-history-keys.ts`; `lib/flow/name-field.ts`; the downloads store in `lib/stores/downloads-store.ts` and the deliverables' names, file names, day and saved blob in `lib/flow/deliverables` (the base: the shell creates the store and shows its failures on every page) |
| Home: the headline and the search in the look `hero`, the rows, the demo's card and its run remembered on this device, the cards of the kept designs (the plan as the thumbnail, the facts, a menu with Open, Rename, Duplicate, Save a copy, Delete), the board's illustration as an SVG; Open a project (an `.rtd` read at once by the API, the engine's notes as rows, kept and opened) | `apps/web/components/home`, `apps/web/lib/home`; `lib/device/demo-run.ts`, `thumbnail.ts`; the dialog Open a project in `components/shell/OpenProject.tsx` and `lib/flow/open-project.ts` (the switcher opens it on every page) |
| The designs kept on this device: IndexedDB through the browser's API, the saving store (the debounce, the demo kept at its first edit, the id remembered, Not saved as a note), what a workspace without a design opens, On this device in the switcher, the warning before leaving | `apps/web/lib/device`; `components/shell/use-opens-what-belongs.ts`, `SaveState.tsx`, `switcher-view.ts` |
| Present: the tour's script and its reduced-motion cuts, the tour on the app's clock, the reveal and the camera's move in the scene, the words and the hint, the energy and the chain, nothing asked of the API; the soak | `apps/web/components/present`, `apps/web/lib/present`; `lib/scene/reveal.ts`, `camera-move.ts`; `tools/present-soak.ts`, `e2e/soak` |
| The map: the scale bar, the states without a map | `apps/web/lib/map`; the provider, Esri and the search's reading of what is typed in `apps/web/lib/places` (the base: the search `components/shell/Search.tsx` is Find's, Home's and Import a drawing's) |
| The outline: the frame of metres, snapping, the rectangle, the history, the nudge, the obstacles, the roof by hand, the reducer | `apps/web/lib/outline`; the measures and the typed lengths in `apps/web/lib/geometry` |
| Find and outline: the screen, the map (MapLibre), the search, the outline drawn on the map, the panel, the tools (the ways to outline while the roof is open; the obstacles once it is closed), the height dialog, the obstacle list, the roof type, Build; the roof by hand and the plan drawn without a map | `apps/web/components/find` |
| The Layers button of the stage (the board "Stage, Layers", D57): fourth in the view controls on every size; its floating panel of 240 with the switch Satellite imagery; off, the plain grid under the roof and no attribution; the setting is the view's | `components/studio/ViewControls.tsx`; `lib/stores/view-store.ts` (`ground`, `groundDrawnOf`); `components/ui/FloatingPanel.tsx` (`onTouch="floating"`), `floating-panel-look.ts`; `components/studio/stage-view.ts` (`attributionOf`); `e2e/tests/studio-layers.e2e.ts` |
| The 3D scene: the canvas, the building, the obstacles, the ground of imagery, the camera and its presets, the modules instanced, the kept-clear areas, the sun light, the projector that places DOM over the canvas, the pointer (selection, hover, the drag) | `apps/web/components/scene`; the maths apart in `apps/web/lib/scene` (pick, handles, projection, the stage store); the adapter of the engine's metres, the obstacles, the kept-clear areas, the plan and the palette in `apps/web/lib/geometry`; the drag in `lib/stores/drag.ts` |
| The Studio: the stage (title, read-outs, text equivalent, the plan without WebGL, labels, callout, handles, the chip of a failed layout), the view controls, the Roof lens inspector (the roof, the obstacles, the heights to review), the Array lens inspector (the module card, mounting, spacing, the window), undo and redo by key | `apps/web/components/studio` (its frame `Studio.tsx` among them); the words and the fields in `apps/web/lib/studio`; the obstacle's fields and the roof's card in `apps/web/lib/geometry` |
| The Sun lens: the time on the stage of every lens (the pill) and the timeline, play, the keys, the day; the Sun at the time; shading over the year; the shade map and its legend; On the roof; the states | `components/studio/Time.tsx`, `SunInspector.tsx`, `SunShading.tsx`, `ShadeLegend.tsx`, `SunMarks.tsx`; `lib/flow/sun-time.ts`, `play.ts`; `lib/studio/sun-figures.ts` |
| The scene's sun: the day of `/sun` looked up at the view's hour; the light held to the engine's shadows (the bias) and to the palette (no tone mapping, the sun and the sky to π); the sun path; the engine's shadow outlines; the modules coloured per instance by the shade map | `components/scene/SunLight.tsx`, `SunPath.tsx`, `ShadowOutlines.tsx`, `use-sun.ts`, `use-shade-map.ts`; `lib/flow/sun-day.ts`; `lib/scene/sun-light.ts`, `sun-path.ts`, `sun-marks.ts`, `shadow-outlines.ts`, `shade-map.ts` |
| The Strings lens: the inverter (Replace from an OND, its limits and cabling), the system voltage (a decision card before one), modules in series, the options and your own, the MPPT loading, the sizing temperatures and the Voc coefficient; its states | `components/studio/StringsInspector.tsx`, `InverterCard.tsx`, `SystemVoltage.tsx`, `SeriesRange.tsx`, `StringOptions.tsx`, `MpptTable.tsx`, `SizingTemperatures.tsx`, `InverterLimits.tsx`; `lib/studio/strings-view.ts`, `series-bar.ts`, `option-cards.ts`, `custom-fields.ts`, `sizing-fields.ts`, `inverter-fields.ts`, `mppt-table.ts` |
| The strings on the roof: the glass by string, MPPT or inverter, the legend, the inverters, a string traced and selected | `lib/stores/string-colours.ts`; `lib/scene/string-legend.ts`, `inverter-markers.ts`; `components/scene/InverterMarkers.tsx`; `components/studio/StringLegend.tsx`, `Labels.tsx` (the inverter chips, kept off the edge labels since #84) |
| What an edit asks for: the layout only for the roof, the array or the module (not its albedo); nothing for an option chosen | `lib/flow/edit-parts.ts` |
| Performance: the header (the line of the run, the option switch, the weather select), the KPIs with the P-values, the loss chain as a cascade with its editable steps and its readout, the energy by month and the 25 years with their tables and tooltips, the degradation, the assumptions, the summary; the states | `apps/web/components/performance`; the logic in `apps/web/lib/performance` |
| Weather for a design that has none, loaded by the flow once per edit into the document of that edit (`amend`); the weather source switched; a CSV read with its notes | `lib/flow/design-flow.ts`, `lib/stores/project-store.ts`, `lib/flow/weather-source.ts`, `components/performance/WeatherSelect.tsx`, `WeatherCsvDialog.tsx` |
| Charts: `ValueTooltip`, `Tabs` with a head, `Table` with a total row and a column of words, `Stat` looks `hero` and `figure`, `Segmented` and `Select` with marks, `NumberField` inside the chain and a chip | `apps/web/components/ui` |
| Import a drawing (KMZ, KML, DXF with its units and its place) from the project switcher | `apps/web/components/shell/ImportDrawing.tsx`; `apps/web/lib/flow/import-drawing.ts` |
| Overture's footprints: the pinned release, the ring of a footprint | `apps/web/lib/map/overture.ts`; the extract tool `tools/footprints.ts`; the fixture `e2e/fixtures/footprints-pune.pmtiles` |
| MapLibre's worker, served by the app | `apps/web/public/maplibre-gl`, copied by `tools/vendor-maplibre.ts` |

A workspace opens the demo when no design is open, runs it, and shows its numbers in the vitals of the
Studio. A roof found on the map and outlined, with its obstacles and their heights, or typed by its measurements
with or without a map, becomes the design that is open (Build), and the Studio opens on the Roof lens; its roof
type is the first committed edit of the app, and Edit leads back to the map with the outline and the obstacles
shown. Since #67 a design is kept on this device at its first committed edit (the demo too, D32), written 600 ms after the last edit, and
a reload opens the design remembered as open; the switcher lists the designs kept under On this device.

## What the API gives today

| Method and path | Client function (`apps/web/lib/api`) |
|---|---|
| `GET /health`, `GET /demo` | `getHealth`, `getDemo` |
| `POST /equipment/module`, `/equipment/inverter` | `parseModule`, `parseInverter` |
| `POST /roof/import` | `importRoof` |
| `POST /roof/from-map`, `POST /roof/on-map` | `roofFromMap`, `roofOnMap` |
| `POST /layout`, `POST /sun` | `computeLayout`, `computeSun` |
| `POST /weather` | `loadWeather` |
| `POST /design`, progress as events | `runDesign` |
| `POST /export/{pdf,dxf,kmz,csv,sld,rtd,zip}?day=` | `exportDesign` |
| `POST /export/report-pages?day=` | `reportPages` |

On the demo (Phase 13, the API's Linux image, one thread): a design run takes 2 s; about 0.9 s after a change of a loss (the
shading kept; the operating points kept too when the irradiance does not change); 0.14 s after a change of degradation, the
CO2 factor, the exceedance levels or a sigma; on Lambda at 1,769 MB about 3.4 s. The roof at the limit 4.1 s here, about 7.5 s
on Lambda, under 1 GB; an export 0.2 to 0.9 s after a
run; the report's six pages as images about 1 s and 940 KB; the zip of everything 1.5 to 1.7 s and 373 KB. The test stack's API starts with downloads of weather off (`ROOFTOP_WEATHER_DOWNLOADS=off`); the dev stack downloads.

## Next, in order

1. V2's build (resume prompt 021, `plan/v2/build.md`): the epic #207's issues in order from #215 (resume prompt 023; #208 merged in #221, #209 in #222, #210 in #223, #211 in #224, #212 in #225, #213 in #226, #214 in #228), one pull request each, merged on
   green, without stopping; Present (#220) and the help's topic list wait on the owner's review when the build reaches them. Alongside: the owner plays the help's clips in Safari on an iPhone or
   iPad (Phase 15's last check).
2. #99 and #100 when the owner needs them (advised: the budget alarm soon, the rate limit before the site is promoted).
3. When browser tests come back: update the suites that use the old words (Replace and its dialogs, the top bar's words,
   the geocoder's words, the Layers default, `present-energy`), and #74.
4. Issues #87, #88, #96 and #73 to #77 as the owner decides.

## Facts about this machine and setup

| Thing | Value |
|---|---|
| Repo | `/Users/arunkpatra/codebase/rooftop-design-app`, GitHub `SolarLayout/rooftop-design-app` (private) |
| Desktop app to copy from (read-only) | `/Users/arunkpatra/codebase/rooftop-design`, commit `bf2cb67`. GitHub `SolarLayout/rooftop-design` |
| 3D reference project (read-only) | `/Users/arunkpatra/codebase/solar-mms-modeller`. GitHub `SolarLayout/solar-mms-modeller` |
| Access to those two | They are outside this repo. A session can read them only after the owner adds them with `/add-dir`. Ask for that when the slice needs them |
| Node | 26.10.0 at `/opt/homebrew/bin/node` (`.nvmrc`) |
| bun, uv, Python | bun 1.3.14; uv; Python 3.12.13, the build that uv manages (`apps/api/.python-version`, `apps/api/pyproject.toml`) |
| Playwright | `@playwright/test` 1.52.0; its browser (chromium-1169) is already installed. `@axe-core/playwright` 4.13.0 |
| Baselines of the screens | `e2e/baselines/darwin`, made on this machine. Renew with `bun tools/with-node.ts playwright test <name> --update-snapshots` in `e2e/`, after looking at the new picture |
| `bun check` | Every step a turbo task, skipped when its inputs have not changed since it was last green (`.turbo/`); the summary says which and why. Unchanged tree: under 2 s. `bun check --skip=e2e` (the fast lane, the gate of Phase 11 by D56): about 5 minutes here when pytest runs whole. The browser step is eight groups keyed on what each can see (`docs/checks.md`); measured 2026-10-04 each alone: kit 1.7 min, find 2.4, handover 5.0 (3.6 after #80), home 3.7, present 4.6, performance 6.0, shell 6.7, studio 18.5; the whole suite runs only when the owner says (D55, D56). Inside pytest, testmon runs only the tests a change can have changed, plus the sentinel `test_demo_numbers.py`; a change to the check's own code runs everything. While the browser tests run, nothing of `apps/web` or `apps/api` may be edited; while the proofs run (the last step), nothing at all. Details: `phase-04b-test-caching.md`, "As built" |
| The check on GitHub | `.turbo/cache` restored from the most recent run of the branch or of `main`, saved by every run; a push to `main` runs `--fresh`; pytest runs whole and untraced there (`ROOFTOP_CHECK_SELECT=0`): 454 to 473 s for 745 to 787 tests, 0.6 s a test (session 14); a pull request's check 6 to 10 minutes. A push that changes a document alone: about 25 s in all |
| Esri key | In `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY`. Never read, print or commit the file. Referrers: `http://localhost:4700`, `http://127.0.0.1:4700`. Expires about 28 Sep 2027 |
| Design canvas | https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy. 21 boards, the same as `docs/design/mockups`. To add or change a board: read the canvas itself (not only a file of it), then publish from a folder shaped `project/<name>` in the scratchpad: `root` that folder, `file_path` its `project/canvas.json`, the boards in `files` by their `project/` paths. A `file_path` outside such a folder lands at the root of the artifact, not under `project/`. The publish is refused by the permission system while the canvas is shared with the link; the owner made it private for the publishes of 2026-09-30 and shares it again after |
| Design system | `docs/design/` |
| Deployed | Staging https://rooftop.staging.solarlayout.app, production https://rooftop.solarlayout.app; how: `docs/deployment.md`; AWS: `infra/aws/README.md` |
| AWS | Account 378240665051, region `ap-south-1`; CLI profile `journium-dev` (defaults to us-east-1: always name the region); AWS CLI 2.37.9 (arm64). The permission system refuses IAM-creating commands from a session: the owner runs those. The functions at 1,769 MB (D67), set by the session on the owner's word |
| Vercel CLI | `~/.bun/bin/vercel` (62.2.0, not on the shell's PATH), team `--scope solarlayout`, project `rooftop-design-app` (`prj_fIykVKBGCpvdVQZlJ7Xkfn9sg6u5`); the workflow pins 59.19.0 |
| Docker | Docker Desktop (29.8, linux/arm64); must be running to build the API's image here; actionlint runs from its image (`rhysd/actionlint:1.7.7`) |
| Esri keys, deployed | One per environment in Vercel (`NEXT_PUBLIC_ESRI_API_KEY`), each with its own address as referrer; expire about 2027-10-05 |

## Open items (not blocking)

| Item | Where it belongs |
|---|---|
| On Find, an obstacle turned back to exactly nothing and let go is taken for a press inside the roof, which picks the roof | Issue #142 |
| iPhone Safari's address bar cannot be hidden from a tab; the app made installable (manifest, icons, safe areas) opens without it from the Home Screen | Issue #147 |
| On phone at peek the Studio leaves the room under the vitals empty (the stage stays 252; #149 closed the band at half alone, by the owner's choice) | When the owner asks |
| The pictures `kit-part-2.png` and Find's screens are to be renewed when the browser suites run again (the help's disc, how-to steps, the ? beside Find's title, Show me how; Find's first step, D85) | When the owner runs the suites |
| Twelve findings of the help's writing (the shade-free line with a pitch entered, the PAN source of the coefficients, "fits" beside an exclamation mark, trees lost on Edit, …) | `plan/phase-14-in-app-help.md`, "As built"; for the owner to order |
| On phone the help sheet's grip has a press area over its ×; both close the sheet | When the owner asks |
| On Find's map at roof zoom the demo's obstacles are 8 to 17 px across, smaller than their handles' targets: they are picked and moved after zooming in; an obstacle's label can cover a roof corner (corner 1 of the demo) | When the owner asks |
| A very slow touch drag (about 1 px an event, emulated by Playwright) starts no marker drag on the map, MapLibre's corners included; real fingers move more per event | Watch |
| The obstacle list of Find shows each height and does not edit it (the Roof lens does); trees are not drawn on the map; the by-hand roof's corners are not dragged on the map | Phase 11, or when the owner asks |
| The Esri key is baked into the page at build time: the "no key" state is seen only on a build without it, and the tests reach the no-map states through "no WebGL" | Phase 11 |
| The frame rate with 1,068 modules on this machine's GPU: 56 fps while orbiting (the mark was 60), 60.1 while the timeline is dragged, 58.3 while the day plays; a mid laptop has not been measured | When the owner has one at hand |
| On Bedrock the session has no Artifact tool: the design canvas at claude.ai cannot be read or published from here. The boards are approved from the previews in `docs/design/previews`, and the canvas is behind the repo by ImportHeights with the DXF's place, the six boards of Phase 6 and the six of Phase 7 (the redrawn Sun and Strings lenses and ten new) | When a session has the tool again: publish the repo's boards |
| The plan drawn without WebGL shows no strings: the Strings lens there has its inspector alone | Phase 11 |
| Agents wrote a document change into a code commit twice in Phase 9 (`components.md`, `design-tokens.md`); the briefs say "a commit of its own" now | Known |
| The option captions follow the engine's rule of decision 11 (`phase-07-plan.md`); "Fills the inverter" and "Lower clipping" were the old board's words, kept | The owner may give others |
| A desktop `.rtd` whose chosen option was its custom one by "n×s×k" opens with the offered option of that key, its custom kept (the custom's key is "custom") | Known |
| `.github/workflows/e2e.yml` has never been run. It runs on Linux, and the screens have baselines for `darwin` only: its first run will write its own and fail | Phase 11, or when browser tests are wanted in CI |
| The Sun lens frames the sun path's dome (#84): near sunset on desktop the marker sits behind the timeline band, and the chip "sunset 17:27" stands half hidden between the timeline and the vitals; a wider zoom or a lower camera target would clear it. The pictures are renewed (#89): `e2e/baselines/darwin/desktop/studio-sun.png` shows it | The owner's eye |
| A black rectangle on the ground behind the building in the Studio on phone, in software WebGL; in the approved picture before #84, larger since its framing. Not yet looked at with the GPU | #88 |
| The scene's shadows read softer than the boards' at a low sun: a shadow is the sky's light alone, a third darker, as set (#51) | When the owner asks |
| The permission system refuses an agent `bun dev:bg --profile test` ("Interfere With Workloads"): agents write code and unit tests; the session runs the browser for them | Known |
| Esri's imagery tile host answers with the key from the test stack's port 4710 too, which is not among the key's referrers: the key is scoped, not secret. Watch usage on the Esri dashboard | Deployment |
| MapLibre counts its zoom on tiles of 512: its zoom 18 is the native zoom 19 of Esri's tiles of 256. A press on the map stops its flight: the map says `aria-busy` while it moves, and a test waits for it | Known; written in the plan |
| A colour token named like a width utility (`--color-handle` beside `border-handle`) makes Tailwind read the width as a colour: the colour is `--color-handle-fill` | Known; a trap for the next token |
| The key needs the production address added to its referrers when the app gets one | Deployment |
| Heights cannot come from a DXF: a layer name may hold neither `=` nor `:`. Every DXF obstacle gets 1.0 m and is listed to review in the Roof lens | Done in #44 as a list to review; a DXF convention for heights is the owner's call |
| The engine places the sun at the middle of the hour for every source. The bundled PVGIS hours agree with the sun at the time stamp itself (GHI, DNI and DHI close to 0.8 W/m2 there, 43.6 W/m2 half an hour later). Not changed; a question for Prasanta | Owner and domain expert |
| A CSV with GHI alone is split by Erbs: on the Pune year beam 1,435 and diffuse 823 kWh/m2, where PVGIS has 2,000 and 550. The API says so in a note when such a file is loaded, and Performance shows it (Phase 8); a CSV without air temperature takes 25 °C, and the note says to enter the site's ambient | Owner and domain expert |
| The names of the demo's equipment are shown as the files state them: "INSOLATION GREEN ENERGY PVT. LTD. INA-144MHC-TF-560", "WattPower Systems Pvt.Ltd WP-330KTL-H1". The mockups show "Insolation INA-144MHC-TF-560". The module card of the Array lens shows the PAN's names as they are (Phase 5, decision 14) | The owner gives the names to show; the Strings lens follows the files too (Phase 7, decision 15) |
| NASA POWER is asked for the year 2023 and the times of a CSV are read as UTC, as on the desktop; neither can be set in a request. The select says "NASA POWER 2023" and the CSV dialog says the times are read as UTC (Phase 8, decision 19) | Phase 11, or when the owner asks |
| The memo for the shading in the tests (#37, session 7). Measured before: pytest 151 s here; 66 hourly shadings for 15 distinct inputs and 208 simulations for 66; the repeats cost 76 s and 10 s, of which 48 s are the proofs of the memo, of progress reporting and of a fresh server, which must stay without a memo. Now one memo (`apps/api/tests/kept.py`) serves the whole pytest session, the engine tests and the API alike: pytest 122 s here, the demo's shading computed once. On GitHub the same code took 155 s in one run and 279 s in the next, and 274 s after the memo: the runners vary two-fold, so the mark of 6 min 30 s is a poor rule there; the checks of #37 and #38 took 5 min 38 s and 5 min 33 s. Four workers with pytest-xdist would give 66 s here (measured, not adopted: a dependency and a change of its own) | If a check passes the mark again: pytest-xdist, pinned, as a pull request of its own, after the owner's yes. Since Phase 4.5 the mark matters only when `apps/api` changed: a push that leaves it alone skips pytest |
| The web app's rewrite dropped a request to the API now and then (socket hang up, ECONNRESET; a bare "Internal Server Error" to the browser) while the API answered 200, mostly the report's pages, `/layout` too. **Found and fixed in session 14 (`feat/start`)**, two causes: Next's proxy (dev and production alike) frees the upstream socket of a streamed answer and tears it down under the request that took it (11 of 20 asks of the pages right after a design run, none straight at the API); and under a group's load the pages queued behind the drawing lock to 33 s at the median while the proxy gave up at 30 s. Now every answer of the API closes its connection, the drawn pages are kept per project and day, and the proxy waits 120 s. The handover group 204 s and 0 drops where it had been 325 s and 40; the shell group 642 s and 0 drops | Done; `docs/checks.md`, known limits, says how. Watch that the drops stay gone |
| Hardware WebGL for the browser tests was tried (2026-10-03): a Studio picture is drawn five to six times faster on the GPU than in software, but the satellite ground was missing in later runs and the cause was not found; software rendering stays. The GPU trial's configuration is a scratch file, not in the repo | Phase 11, or when the owner asks |
| Under the load of a full check (ten workers, the Studio in software WebGL on three sizes, the machine's twenty cores saturated) a 5 s wait ran out on a different test in each of four full runs of #62 (Edit's navigation in `build.e2e.ts`, the number field on phone, the years' keyboard, New design from the switcher), each green alone. Done in #62: Edit's test waits with the run's time, the charts' tooltips leave only when their anchor moved, every expectation waits 15 s. The split of the browser step and one retry per test come with `feat/check-e2e-groups`; hardware WebGL for the tests is to be measured (the owner's yes first) | Watch. The whole suite runs only when the owner says (D55, coming with the split) |
| The charts' keyboard tests run on desktop alone: on tablet the focus can scroll the frame and the moving page takes the tooltip away by design. Since #62 a tooltip leaves on a scroll only when its anchor moved (`isStill`) | Known; written in the phase file |
| The Performance line of the run says "PVGIS weather", not "PVGIS TMY weather" (decision 2 of the plan): the longer form wraps at 1440 | The owner may prefer the longer words and a two-line header |
| D56's run (session 15), first tries that failed and passed on the retry, the app's own fault not seen: `device.e2e.ts` "a reload" and "two designs" in every shell run (the vitals on "Opening" for 90 s, #87), `home.e2e.ts` "the demo edited in the Studio is kept" (the same), `handover-screens` "the report pushed" on phone (the pages' drawing), `kit-number-field.e2e.ts` "what is typed is a draft" on desktop once | Watch; #87 for the first three |
| The proofs of the caching copy the working tree's uncommitted changes as one binary patch, inside a hook of 5 s: 107 changed pictures (a patch of 105 MB) ran past it and the proof failed with "git diff --binary failed" and no words. Committed first, the patch is empty and the proofs pass | Watch; a longer hook time for `makeWorktree` if it bites again, as a pull request of its own (a change to the check's code runs everything) |
| One browser test failed once in a full run and passes alone, five times of five: `kit-sheet.e2e.ts`, "and by keyboard: the keyboard stops at what scrolls", on desktop. The key End was pressed and the sheet did not scroll. It did not fail again in the nine full runs after | Watch. If it fails again: make the test wait until the content can scroll before the key, as a pull request of its own |
| In session 6, with a load average above 50 from Chrome, Cursor and the desktop app, full runs of the browser tests took 310 to 340 s and one kit test failed at a time, a different one each run (the toast's place on tablet, the tabs' arrows on phone, the number field on phone); each passed alone, and the runs of the map's own suites passed | Watch. The tests are sound alone; the machine's load is the owner's. If a run on a quiet machine fails one, make that test wait for its result, as a pull request of its own |
| The browser tests of the shell run the design of the demo on the server of the tests, on three sizes at once. On 2026-09-30 eight phone tests waited more than 90 s on a cold server; since #34 the global setup runs the demo once before the tests begin | Done in #34. Watch that it stays steady |
| A push was refused once with "Permission denied (publickey)" and went through when tried again | Watch; nothing to do |
| On GitHub's runner (two cores) pytest whole took 7 min 44 s with pytest-xdist's two workers against 7 min 49 s in one process (#68): the cores are saturated by one process, or the workers thrash (numpy's BLAS threads per worker, untried: `OMP_NUM_THREADS=1`). The job is allowed fifteen minutes and takes 10 min 26 s cold, 5 min 29 s with the cache | Phase 11; the check |
| Present's first scene lies the roof plane on the ground as a slab while the building rises; the board's first frame shows the satellite with the accent outline alone. The ground under Present is the Studio's imagery, where the board draws the plain ground | Phase 11, with the owner's eye |
| The card's thumbnail draws the keep-out areas as the Studio's plan does (the accent dashes), which the board's small plan leaves out; the Studio's plan marks the modules as data where the thumbnail uses the module glass | Phase 11, or when the owner asks |
| The Present suite renders seconds of the tour frame by frame in software WebGL: 10 minutes for 30 tests, its tests one after the other in their worker; the frame budget is not measured there (the soak with the machine's graphics is) | Phase 11: the stage under software WebGL in the tests (hardware WebGL lost the satellite ground, session 13) |
| Under the shell group's load on phone, the first try of a few tests runs out: `device.e2e.ts` "two designs" (both tries: a landed run's facts are written 600 ms after it lands and nothing flushes a pending write when the page is left, so the test's hard navigation loses them; Phase 11, pull request 5), "a reload", the picture `home-designs`, "performance, NASA POWER landed", and the phone's report tests of the handover group (`waitForResponse` for the pages ran out at 90 s on the first try, passed on the retry; cause not yet seen). Session 14, with the drops gone | Watch; the device race is Phase 11's; the handover first tries to be looked at with their error contexts |
| Present's soak of 30 minutes with the machine's graphics (2026-10-03): no frame over 50 ms (the longest 33.4 ms), but the heap stepped once from 35.6 MB to 61.0 MB at minute 21 and stayed there; the soak's gate of a quarter is not met. A step of V8's size class or a slow leak: a longer run, or a heap snapshot at minute 10 and 30 compared, would tell | Phase 11; the acceptance of Phase 10 holds the frames, the memory is to be shown |
| The `/api` rewrite passes the events of a design run on as they come in `next dev`. A production build (`next start`) and a proxy in front of it have not been tried | Phase 11, deployment |

## Past sessions

| # | Date | Record |
|---|---|---|
| 1 | 2026-09-29 | `plan/sessions/001/record.md`, `plan/sessions/001/owner-messages.md` |
| 2 | 2026-09-29 | `plan/sessions/002/record.md`, `plan/sessions/002/owner-messages.md` |
| 3 | 2026-09-29 | `plan/sessions/003/record.md`, `plan/sessions/003/owner-messages.md` |
| 4 | 2026-09-29 | `plan/sessions/004/record.md`, `plan/sessions/004/owner-messages.md` |
| 5 | 2026-09-30 | `plan/sessions/005/record.md`, `plan/sessions/005/owner-messages.md` |
| 6 | 2026-09-30 | `plan/sessions/006/record.md`, `plan/sessions/006/owner-messages.md` |
| 7 | 2026-09-30 | `plan/sessions/007/record.md`, `plan/sessions/007/owner-messages.md` |
| 8 | 2026-09-30 | `plan/sessions/008/record.md`, `plan/sessions/008/owner-messages.md` |
| 9 | 2026-09-30 to 2026-10-02 | `plan/sessions/009/record.md`, `plan/sessions/009/owner-messages.md` |
| 10 | 2026-10-02 | `plan/sessions/010/record.md`, `plan/sessions/010/owner-messages.md` |
| 11 | 2026-10-02 | `plan/sessions/011/record.md`, `plan/sessions/011/owner-messages.md` |
| 12 | 2026-10-02 to 2026-10-03 | `plan/sessions/012/record.md`, `plan/sessions/012/owner-messages.md` |
| 13 | 2026-10-03 | `plan/sessions/013/record.md`, `plan/sessions/013/owner-messages.md` |
| 14 | 2026-10-04 | `plan/sessions/014/record.md`, `plan/sessions/014/owner-messages.md` |
| 15 | 2026-10-05 | `plan/sessions/015/record.md`, `plan/sessions/015/owner-messages.md` |
| 16 | 2026-10-05 | `plan/sessions/016/record.md`, `plan/sessions/016/owner-messages.md` |
| 17 | 2026-10-05 | `plan/sessions/017/record.md`, `plan/sessions/017/owner-messages.md` |
| 18 | 2026-10-06 to 2026-10-07 | `plan/sessions/018/record.md`, `plan/sessions/018/owner-messages.md` |
| 19 | 2026-10-07 | `plan/sessions/019/record.md`, `plan/sessions/019/owner-messages.md` |
| 22 | 2026-10-08 | `plan/sessions/022/record.md`, `plan/sessions/022/owner-messages.md` |

## Closed, do not reopen

- Documents alone go to `main` directly; code goes through a pull request (D26).
- D56 is done: the fast lane was Phase 11's gate, and the whole browser suite ran once at its close on the owner's say (session 15, #89).
  From here the rule of D55 holds again: `bun check` runs the browser groups a change can reach; the whole suite runs when the owner says.
- Legal check on the map stack: approved by the owner (D18).
- Map provider: Esri plus Overture (D13).
- The old desktop app's layout and look: rejected. Never a reference.
- DC cable label: by the system voltage as chosen (D25).
- Fonts come from the repo, never from Google (D27).
- Tailwind is made of the design tokens alone (D28).
- The design of Tabs (D35).
- The rest of Phase 3 was two pull requests, split after the components; inside each, every step a commit (D34, D36).
- Before a system voltage the vitals speak in the words of the API (D37).
- The vitals bar is in the Studio only (D38); the two widths where the top bar gives way (D39).
- The check's cache is turbo's, for every step; pytest-testmon selects here and not on GitHub; pytest-xdist waits for
  the owner's yes (session 8, `phase-04b-plan.md` decisions 1, 4, 13; D53).
- The figures after the year are worked out after the memo (Phase 8, decision 5). The options run in one thread at 1,769 MB (D67).
- Phase 13's rule on numbers is parity with the desktop app's outputs, shown against the snapshot (D64); ADR-0014 of `solarlayout` is not binding on rooftop.
