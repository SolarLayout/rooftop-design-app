# 011: Phase 8, Performance

Written: 2026-10-02, by session 11, at the owner's request. Status: open. After 010 (Phase 7).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 8: the Performance workspace:
one screen that proves the energy number and lets the user test assumptions in place: the option switch and the
weather source, the KPIs with the P-values, the loss chain as a cascade with its editable steps, the monthly
energy, the 25 years, the assumptions and the summary table. The plan of the phase comes first, then the boards
the phase lacks, then the build in pull requests, several in one session.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md (where the work stands, the open items,
the facts of the machine), plan/SESSIONS.md (every pull request carries its screenshots beside the approved board,
at three sizes), plan/README.md (every decision; D6 the memo, D8 no Run button, D37 and D38 the vitals),
plan/phase-08-performance.md (the goal, the scope, the acceptance: every figure equals the API's to the precision
shown; soiling from 2 to 3 changes the energy and the chain and the layout is not computed again), plan/phase-07-plan.md
(how a phase is planned here), plan/phase-07-studio-strings.md ("As built", "Deviations", "Found on the way"),
plan/reference/functional-inventory.md (1.6 Weather, 1.7 Losses, 2.6 Energy, 2.8 the messages kept verbatim),
plan/reference/demo-numbers.md (option A: the loss chain of 21 steps, the months, the P-values, the 25 years),
and plan/sessions/011/record.md ("Why things are the way they are").
Then docs/design: README.md, guidelines.md ("Charts", "Numbers and units", "States"), components.md ("Loss chain",
"Stat tile and vitals cell", "Table", "Segmented control", "Number field", "Vitals: states"), design-tokens.md (the
data colours: gain, loss, zero; the series colours); the preview performance-desktop.png with its source
mockups/Performance.dc.html (desktop only); and build_phase7_lens_boards.py, build_phase7_state_boards.py with
mockups/strings_lens_data.json as the examples for boards drawn from the engine's own numbers. Load the skill for
charts (dataviz) before drawing or building a chart.
Read the code before you add to it:
  - apps/api/src/rooftop_api/schemas/design.py (Energy with its steps, monthly_mwh, p_values, years_mwh,
    total_25_years_mwh, co2_t; Option.summary; LossStep.kind), schemas/losses.py (the editable losses, the
    uncertainties, p_levels, uc and uv, bifacial and rear_loss_pct), schemas/weather.py and services/weather.py
    (/weather, the sources, WeatherSummary, the notes), rooftop_core/simulation.py (the losses the engine reads;
    co2_t_per_mwh is the engine's and not in the API's Losses: find out what else of the scope's assumptions is
    missing from the document), memo.py (what a change of a loss reruns: the options, not the shading);
  - apps/web/lib/flow/edit-parts.ts (an edit asks for what it changes: a loss asks for the run, not the layout),
    lib/stores/results-store.ts (chosenOptionOf, optionChosen: an option is chosen at once, from the run's answer),
    components/shell/vitals-view.ts and Vitals.tsx (Performance has no vitals bar, D38), the placeholder
    app/(workspaces)/performance/page.tsx, components/studio/StringOptions.tsx (the option cards and their
    marks), SizingTemperatures.tsx and lib/studio/sizing-fields.ts (fields empty for their default, saying it,
    given back), components/ui/Table.tsx;
  - e2e/tests/strings-options.e2e.ts and shade-map.e2e.ts (numbers read from the run's answer, never written into
    a test), e2e/screens.ts (expectWholeScreen: the window grown by what the workspace scrolls).
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests, the running
stacks and a green `bun check`.

Then write the plan of the phase as plan/phase-08-plan.md, the way phase-07-plan.md was written: what you found in
the code and the API (what /design already answers for the KPIs, the chain, the months, the years and the summary;
what is missing for the assumptions: the grid CO2 factor, the degradation's place, the rear shading and mismatch,
the weather variability; how a weather source other than the demo's embedded one is fetched, and how the browser
tests can have it without the network); how a loss edit reaches the run and how fast the number settles (D6);
how the option switch of Performance relates to the Studio's choice; the pull requests (expect three to five: the
header, the KPIs and the summary; the loss chain with its editable steps; the monthly and the 25 years charts with
their tables; the weather source and the assumptions; the states and the sizes; the boards first); the steps, each
with what is tested without a browser and what in the browser; the decisions you take unless overruled, each with
its why; the risks; what done means, against the acceptance. The boards the phase lacks are drawn and approved
before they are built: Performance on tablet and phone (the phone's KPIs two to a row, the chain full width with
its input under the label, the charts stacked); the loss chain's editable steps entered and updating; a chart's
tooltip and its table view; the weather source switched and a CSV loaded with its notes (the GHI-only note of
Erbs); the assumptions; the states (no system voltage: Performance waits in the API's words, D37; a run on its
way; a run failed). Commit the plan to main, show the owner, wait for the yes; draw the boards, show them (from the
previews in the repo; publish to the canvas only if the session has the Artifact tool), wait for the yes; then
build.

Things to know at handover:
  - Choosing an option asks nothing: the results store takes it from the run's answer at once, and a run that
    lands keeps the document's choice (Phase 7, decision 3). Performance's option switch is the same choice.
  - An edit asks for what it changes (lib/flow/edit-parts.ts): a loss asks for the run alone; the layout is not
    asked, which is the acceptance's "the layout is not recomputed". A run after a change of a loss takes about
    4 s on the demo, the shading kept by the memo.
  - Before a system voltage there are no options and no energy: Performance says what it waits for in the API's
    words (D37), as the vitals and the Strings lens do. A roof built on the map has no voltage; the demo has 1500 V.
  - A design built on the map carries no weather: the API would fetch PVGIS, and the tests have no network. The
    Phase 7 tests gave such a design the demo's weather through a route on /api/roof/from-map. NASA POWER and a
    second PVGIS place need fixtures; find how apps/api/tests/recorded.py and tests/fixtures/weather do it.
  - Every number on the screen is the engine's; the words of the engine are not reworded. The chain has 21 steps in
    the engine's order (demo-numbers.md, option A).
  - On tablet the Studio and the workspaces scroll inside their frame (data-workspace-frame): pictures that must
    show a long screen use expectWholeScreen. Every picture shows its stage or chart whole; look at all three sizes
    before a pull request (the owner checks them against the boards).
  - The whole bun check takes about 22 minutes (1,544 browser tests in software WebGL on three sizes). Gate a commit
    on its exit code, never on a grep of its words. Run the check as a job of its own, not in one shell line with a
    git command: the owner watches the harness's shells.
  - The permission system refuses an agent the test stack (bun dev:bg): agents write code and unit tests; you run
    the browser for them. Agents running tests beside a check load the machine: a camera turn timed out once.
  - The design canvas at claude.ai is behind the repo by thirteen boards; on Bedrock there is no Artifact tool. If
    you have it, publish the repo's boards first (STATE.md, "Facts", says how); if not, say so upfront.
  - Never edit apps/web or apps/api while bun check runs; never git stash while the test stack runs. Documents go to
    main from a worktree of their own when a branch is open (git worktree add --detach under $TMPDIR). Agents build
    in worktrees under $TMPDIR too; a worktree has no .env.local, so its ground is plain: baselines are made in the
    main working tree.
  - Sub-agents: give each a written brief (files to read, constraints, tests first, what to report), run independent
    work in parallel, review and run what comes back before merging. Launch them on the model the owner names.
  - Domain questions: read the desktop app (/Users/arunkpatra/codebase/rooftop-design), PVsyst's help and the
    handbook (/Users/arunkpatra/codebase/solar-pv-plant-handbook/book/chapters, markdown only) first, and cite them;
    keep the desktop app's behaviour unless a source shows it wrong. Ask the owner only what no source settles. The
    two outside folders are read only after the owner adds them with /add-dir.
  - The word "bankable" is never used. System voltage is never chosen for the user. No red, no cross: a result that
    does not fit is a tick or an exclamation mark with the engine's words. Gain is blue, loss is orange.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the mockup, never
read or commit apps/web/.env.local, use the test stack only (bun dev:bg --profile test), bun and uv only, versions
pinned exactly (D4). You may commit, push and merge once the check is green; a change to documents only goes to main
directly (D26). Every pull request shows each screen it changed at three sizes beside its approved board. Be brief,
decide small things yourself, ask me only for major decisions, one at a time, and show me each finished part. Update
plan/STATE.md before you stop; write plan/sessions/012 (or the next number). Past two thirds of your context, finish
the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session, then the plan.
```

## Notes for the owner

- Expect three waits for your yes: the plan with its decisions, the boards, then each merged pull request.
- The Performance board in the repo is desktop only; the session draws tablet, phone and the states from the engine's
  own numbers and asks for approval before building.
- Likely to need your word: which assumptions the user may change (the grid CO2 factor is the engine's today and not
  in the document), and the exceedance levels offered.
- The open questions for Prasanta in `plan/STATE.md` (the sun at the middle of the hour; Erbs on a GHI-only CSV) touch
  this phase; nothing blocks on them.
- The session reads the desktop app and the handbook for domain questions: add them with `/add-dir` if it asks.
