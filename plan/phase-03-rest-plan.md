# Phase 3, the rest: plan

Written 2026-09-29 by session 4, at the owner's request, before the rest of the phase is built.
Work order: `plan/resume/003-phase-3-components-stores-shell.md`. Scope and acceptance:
`plan/phase-03-design-system-shell.md`. This file says how the rest is built, in which order, and what is
decided on the way. It is kept true while the work goes on: a step that is done is marked.

## Where the work stands

| Part | State |
|---|---|
| 1 The guard reads `*.ts` | Merged, pull request #30 |
| 2 Slider, RangeSlider | Merged, pull request #31 |
| 3 to 9 and T: the components | Merged, pull request #32. Its check took 6 min 25 s |
| 10 to 16: stores, data flow, formats, routes, shell | Not begun. One pull request, by session 5, from a branch `feat/phase-3-stores-shell`. Work order: `plan/resume/004-phase-3-stores-data-flow-shell.md` |
| C: the close of the phase | After step 16 |
| Tabs, the board | Approved (decision D35) and built. Not on the canvas: `plan/STATE.md`, "Open items" |

## How the work goes

- Two pull requests (decision D36). The first, #32, branch `feat/phase-3-shell`, holds the components: steps 3
  to 9 and Tabs. It is built and merged by session 4. The second holds steps 10 to 16 and is built by the
  session after it, from a branch of its own.
- Each step below is one commit, or two when a token is new: the document first, in a commit of its own.
- Test first, seen failing. Logic is a pure function or a store without React, tested with `bun test`.
  What is seen is tested in the browser on 390, 834 and 1440.
- `bun check` green before every commit. The owner hears after each step what is there and what was decided.
- Every new component is on the kit in every state; the baselines are renewed after they were looked at.
- `plan/STATE.md` is brought up to date on `main` after steps 5, 9, 12 and 14, so that a session that is
  cut off loses nothing.
- A pull request is opened as a draft after its first step, so that its check runs on every push. It is
  merged after its last step.

## Steps

| # | Step | What is built | Logic, tested without a browser | In the browser |
|---|---|---|---|---|
| 3, done | Sheet | `Sheet`: `color-chrome`, top radius `radius-panel`, handle 40 by 4, three stops. The handle is a `separator` that can be moved by keyboard | `sheet-stops.ts`: where the stops are, the height while dragged, the stop after a drag and after a key. Done | Look, heights at the stops, drag, keys, target of 44 |
| 4, done | ProgressRing, Skeleton | Ring: turning (16 and 12), with an arc (20), with an arc and the number (44). The run in a row. Skeleton blocks that breathe | `ring-arc.ts`: the arc of a share of the way | Sizes, colours, percent said to a screen reader, still under reduced motion |
| 5, done | Tooltip, Toast | Tooltip after 400 ms under the pointer, at once with the focus, never on touch. Toast with mark, words, action or close | `toast-queue.ts`: a store with a clock that is given to it. 5 s for what is done, held under the pointer and with the focus inside, a note stays | Look, the delay, a toast leaves, stays under the pointer, a note stays |
| 6, done | Select, floating list | `Select` (trigger, `listbox`), `FloatingPanel` and `list-look.ts` (what floats, and the look of its rows; the project switcher uses both). On phone and tablet a bottom sheet, rows of 52 | `list-keys.ts` (arrows, Home, End, a letter typed), `place-floating.ts` (under the trigger, above it when there is no room, never outside the screen) | Look open and closed, keys, Escape gives the focus back, press outside closes |
| 7, done | Dialog | The `dialog` of the browser, opened as modal: the focus goes in, stays in and goes back. On phone a sheet, actions under each other | None of its own | Focus in, Tab stays inside, Escape, focus back; look on the three sizes |
| 8, done | FileDrop | Rest, a file held over it, reading, refused. It gives the file to who uses it; reading and refusal are given to it | `dropped-file.ts`: the one file of a drop | The four states, the file chooser by keyboard, a drop |
| 9, done | Table | A real `table`; on phone each row a card with its values as a list | `table-cells.ts`: a row as the cells of a card | Look, the chosen row, marks with their words, cards on phone |
| 10 | Stores | `lib/stores`: project (the `.rtd` document, as the API hands it out), results (layout, design, status, progress, which edit they belong to), view (lens, camera preset, sun time). Selectors by name, narrow | All of it | None |
| 11 | Data flow | `lib/flow/design-flow.ts`: a committed edit asks for the layout at once and for the design run after a pause of 500 ms. A run that is overtaken is given up by its signal. Results of before stay, marked as updating | With a stand-in for the client and a clock that is given: order, the pause, giving up, a late answer never replaces a newer one, failure keeps the last good result | None |
| 12 | Formats | `lib/format`: the quantities of the vitals, each as number and unit, on `shown` of `number-entry.ts` | All of it | None |
| 13 | Routes | `/`, `/studio/[lens]`, `/performance`, `/handover/[item]`, with placeholders. `/studio` and `/handover` lead to their first. An unknown lens or item is not found | `lib/routes.ts`: the lenses and the items, and what is one | Every route answers, an unknown one is not found |
| 14 | Shell | `components/shell`: top bar at three sizes, workspace navigation, tab bar on phone, project switcher, state of saving, Present and Export, vitals in every state, drawer of notes. The stage of the Studio is a placeholder | `vitals-view.ts`: what the vitals show, from the results and their status. `notes-view.ts`: the notes, from the results | Look against the previews, navigation, the switcher, the drawer |
| 15 | Vitals from the API | A workspace without a project opens the demo. The vitals show its numbers; without a system voltage the roof and the positions, and what is waited for in the words of the API | Covered by 11, 12 and 14 | The seven numbers of the demo; the demo with its voltage left out |
| 16 | Tests of the shell | | | Renders and navigates on the three sizes; no scroll sideways at 360, 390, 640, 834, 1100, 1101, 1440; baselines; axe |
| T, done | Tabs | `Tabs`, on `choice-keys.ts`. The board is not on the canvas yet | None new | Look, keys, the row on phone |
| C | Close | "As built", status, `STATE.md`, record of session 4, resume prompt 003 set to used | | |

## Decisions that I take, unless the owner says otherwise

| # | Decision | Why |
|---|---|---|
| 1 | The kit gets a second page, `/kit/part-2`, for the components of round 4, and a third, `/kit/shell`, for the states of the shell | One page with everything is 20 screens high on phone; its baseline is slow to compare and heavy in the repo |
| 2 | What opens over the screen (list, tooltip, dialog) is in the top layer of the browser (`popover`, `dialog`), not in a layer of our own with z-index. The toasts are not: their place is in the page from the start, in the layer `z-toast`, so that a screen reader hears what comes into it | The inspector scrolls and would cut a list off; the browser keeps the focus in a modal dialog by itself |
| 3 | A place in pixels that follows the data (where a list floats) is set with `measures()` too, as the share of a slider is | One way through the guard, not two |
| 4 | One toast is shown at a time, in the order they came | The design shows one; a pile over the vitals hides them |
| 5 | The pause before a design run is 500 ms | A run takes 4 to 12 s; two edits shortly after each other are one run |
| 6 | Every committed edit asks for the layout and for the design run, whatever was edited | The API keeps what it computed; knowing in the web app which edit changes what is a second place for the same rule |
| 7 | Present is shown and cannot be used: dim, and it says "Comes with Home and projects" to a screen reader and in its tooltip | It is there before Phase 10, as the work order says |
| 8 | Notes are what the API calls notes: of the module, of the layout, of the weather, the verdict of the chosen option when it does not fit, and a run that failed | No rule of the engine is written a second time in the web app |
| 9 | New tokens come with their first use: radius 8 and 4, the shadow of a tooltip and of the drawer, the dim of the screen, opacity 0.55 of a value that is updated, 1.6 s of the skeleton, 400 ms and 5 s | `components.md` names them as values today |

## What session 4 found for the steps that remain

Facts that the steps 10 to 16 stand on. They were read from the code and the API on 2026-09-29; the code
wins where it says otherwise.

| Step | Fact |
|---|---|
| 10 | `Project` of `@rooftop/api-types` is the `.rtd` document as the API hands it out, with every field. `system_voltage` is `600`, `1000`, `1500` or null. `ProjectRequest` of `@rooftop/api-types/requests` is the same with what has a default left open; a `Project` can be sent as it is |
| 10 | `zustand` 5.0.14 is installed already. A store without React is `createStore` of `zustand/vanilla`; a component reads it with `useStore` and a selector |
| 11 | `computeLayout(project, { signal })` and `runDesign(project, { signal, onProgress })` of `apps/web/lib/api`. Each throws `ApiError`, and the error of the signal itself when the request was given up: that one is no failure and is not shown |
| 11 | The steps of a run, in the words of the engine: "Fitting modules on the roof", "Computing hourly shading for every module", "Applying the losses", "Sizing strings and simulating the options". Fewer of them come when the server kept its results |
| 11, 15 | Without a system voltage a run does not fail: it answers with `options` empty, `chosen_option` null and `no_options` of the code `system_voltage_missing`, the title "Choose a system voltage to size the strings" and the message "600, 1000 or 1500 V. Nothing is sized until you choose." The other codes are `no_positions`, `no_string_length_fits`, `too_few_positions` |
| 12, 15 | The vitals of a design are of the option that is chosen: the one of `result.options` whose `key` is `result.chosen_option`. Energy is `energy.energy_mwh`, DC `dc_kwp`, AC `energy.ac_kw`, DC/AC `dcac`, modules `n_modules`, PR `energy.pr`, yield `energy.specific_yield`; `pr` is a share: 0.8655 is shown as 86.6 %. Asked of the API on 2026-09-29, the demo answers 617.8405 MWh, 357.28 kWp, 275.0 kW, DC/AC 1.2992, 638 modules, PR 0.8655, 1729.29 kWh/kWp |
| 12, 15 | The mark of DC/AC is `ok` of the option. Its words ("In target", "Below the DC/AC target") are of the mockups and are made in the web app; `verdict` of the option is about the length of the string ("29 in series fits: ...") and is not the words of this mark |
| 10, 15 | The demo as `/demo` hands it out has `system_voltage` 1500 and `chosen_option` empty. The result says which option is chosen: `chosen_option` "29x22x1", the key of option A |
| 12, 15 | "638 of 790": the positions are `result.readouts.positions`. The roof is `readouts.roof_area_m2`. "If all were used" is the positions times `equipment.module.pnom_w`: 790 of 560 W are 442.40 kWp |
| 14 | Notes to review are strings of the API: `equipment.module_notes`, `layout.notes`, `weather_notes`; beside them a run that failed, and the chosen option when it is not `ok`. The demo has one: "Voc coefficient -0.164 %/°C is outside the usual -0.35 to -0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs." `options_note` and `far_shading_note` explain and are no notes to review: they belong to the Strings and the Sun lens |
| 14 | The mockups give a note a short title ("Voc coefficient") over its reason, and the vitals show that title. The API gives the reason only. The title must be made in the web app: the words of the note before its first number serve for the notes of today. Say to the owner what you chose |
| 14 | The project switcher is `FloatingPanel` with `useFloating`; its rows have the look of `list-look.ts`. It is a menu, not a listbox: the keys of `list-keys.ts` serve both |
| 14 | The bottom tab bar of the phone is 72 high (`size-tabbar`). `Toaster` takes a `className`: on phone the toasts stand above the tab bar |
| 14 | The icons of the workspaces and of the lenses are in the mockups (`Main.dc.html`, `StudioPhone.dc.html`), with a stroke of 1.7 (`stroke="light"` of `Icon`). `Icon.tsx` has none of them yet |
| 16 | The home page has a baseline already (`home.png`); `screens.e2e.ts` compares it. The screens of the shell are added there |

## What needs the owner

| What | When | Blocks |
|---|---|---|
| Approval of the Tabs board | Given, 2026-09-29 | Nothing |
| The board of Tabs on the canvas: the publish needs his permission | Any time | Nothing |
| The words of the vitals before a system voltage, if the API's and the board's cannot both be served | Step 15 | Step 15 only |
| Which name of the equipment to show | Only if a part shows equipment. None of this plan does | Nothing |

## Risks

| Risk | What I do |
|---|---|
| One pull request of 14 steps is large to read | Each step is one commit with its own message; the description lists them with their screenshots |
| A design run of the demo takes 12 s the first time, in every browser test that waits for the vitals | The three sizes share the results the server kept; the tests of the shell wait for the result, not for a time |
| The top layer and `popover` behave differently in a test on touch | Tried in step 5, the first that uses it. If it fails, a layer of our own with the `z-` tokens, and decision 2 is changed here |
| The check of the pull request passes 7 minutes | It took 4 min 7 s on #30. If it passes 6 min 30 s, the shading memo goes first, as a pull request of its own |

## Done means

The acceptance of `plan/phase-03-design-system-shell.md`: the shell renders and navigates on 390, 834 and
1440; no scroll sideways from 360 up; baselines of `/kit` and of the shell, compared with the previews by
eye; the vitals show the numbers of the demo from the API; axe finds nothing serious or critical.
