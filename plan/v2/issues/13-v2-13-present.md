# V2 · 13 · Present: one figure a scene, captions as nouns, controls to pause, step and leave

Part of the epic **V2** (#207). Board set 13 of the V2 design (for approval; D72 kept; D110 on approval, in [`plan/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/README.md)).
Build order: after Handover and Home (#216) and before Phone and tablet (#217); it needs only #208 and #209, so it may run in parallel with #211, #214, #215, #216.
The board is a proposal. When the build reaches this issue, the owner reviews today's Present and the proposed design together (his words, 2026-10-12: "we can do that exercise at that time"); nothing is built before his approval (D110), and the board may change in that review. The other issues go on meanwhile.
In this text "issue N" means build order N of the epic: 1 = #208 · 2 = #209 · 3 = #210 · 4 = #211 · 5 = #212 · 6 = #213 · 7 = #214 · 8 = #215 · 9 = #216 · 10 = #217 · 11 = #218 · 12 = #219; Present is #220.

## Goal

Present plays the design as six scenes on the whole screen, for a client. In V2 each scene has one name and one figure in the panel (D72's place and look), a noun at the foot, and the presenter has controls: a move of the pointer or a touch shows a bar with the scene before, Pause or Play, the scene after, the six scenes as a track, and Leave; they fade after three seconds while the tour plays. A stray key no longer ends the tour. Under reduced motion the scenes are stills. The day scene keeps the sun's arc (D72).

## The board

The canvas page **V2**, row 13: https://claude.ai/artifact/Xv8m9Ara4qLMj57DdD1Rjy (open the page "V2"). Sources: [`V2Present.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2Present.dc.html), [`V2PresentTablet.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2PresentTablet.dc.html), [`V2PresentPhone.dc.html`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/V2PresentPhone.dc.html), [`build_v2_present.py`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/mockups/build_v2_present.py).
The board's own text says what changed and which rules of the approved documents change; read it whole before starting.

![V2 · 13 · Present: one figure a scene, captions as nouns, controls to pause, step and leave · desktop](https://github.com/SolarLayout/rooftop-design-app/blob/8942a70acb0fdd0fa226d65d74eafc0b4df52cb9/v2-boards/V2Present.jpg?raw=true)

Tablet: [V2PresentTablet](https://github.com/SolarLayout/rooftop-design-app/blob/8942a70acb0fdd0fa226d65d74eafc0b4df52cb9/v2-boards/V2PresentTablet.jpg?raw=true) · Phone: [V2PresentPhone](https://github.com/SolarLayout/rooftop-design-app/blob/8942a70acb0fdd0fa226d65d74eafc0b4df52cb9/v2-boards/V2PresentPhone.jpg?raw=true)

## The audit's issues this closes

From [`plan/v2/audit.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/audit.md), each read in full there (its "Direction" is what the board settled):

- **V2-40** (P1) · Flowery, dramatic or cute: "The map flies to it"; "The search understands"; "The roof rises in the Studio; the array fills it at once"; "From sunlight to the grid"; "On its way"; "The sun's day is on its way"; "A step too far"; Present's captions "The satellite from above tilts into 3D", "The building and the obstacles rise", "The day plays with its shadows", "The strings light up by MPPT", "The energy counts up"; Find's "Find the building first: the map flies to it, close enough to outline its roof."
- **V2-79** (P1) · The top bar at 834: drops Present's word (an icon alone, a play triangle that reads as "run"), the coordinates and the save state.
- **V2-96** (P2) · Present's panel: "2 · THE ROOF · Obstacles 3 of 6 · Roof 90.0 × 40.0 m · Parapet 0.9 m" counts obstacles as they rise, a number no viewer needs.
- **V2-102** (P2) · Icon-only buttons: (Present at 834, the view controls' north and layers, the card's "⋮") rely on aria names; the visible affordance is the icon.
- **V2-103** (P3) · Reduced motion: stops the sun's play but the Present tour still moves the camera.

## Scope in

1. The panel (`components/present/PresentPanel.tsx`, `lib/present/scene-panel.ts`): the scene's name (`strong`, `text-2`), its one figure (`figure`), the figure's label (`body`, `text-2`), on `color-dim-panel` blurred, at the top left (D72). The six: The place · `Pune` · `18.52° N · 73.86° E`; The roof · `3,600 m²` · `Roof area · 6 obstacles`; The array · `790` · `Module positions · 6 rows`; The sun · 21 December · `10:30` · `Solar time · sun 42.6° high` (the time counts as the day plays); The strings · `357.28 kWp` · `22 strings of 29 modules`; The energy · `617.8 MWh` · `Energy to the grid in year 1` (counts up in the place of its final value, D72). No count of obstacles or positions as they rise (V2-96).
2. The line at the foot (`Words` in `Present.tsx`, `lib/present/tour.ts`): the design's facts (`Pune demo roof · 357.28 kWp · 617.8 MWh a year`), then the scene as a noun: The roof from above, The roof in 3D, The array, Shadows over the day, The strings, Energy over the year (V2-40). The attribution under them while the imagery shows.
3. The controls (a new `PresentControls.tsx` and pure `lib/present/controls.ts`): a bar at the foot on `color-dim-panel` with Scene before, Pause/Play (48, white), Scene after, the six scenes as segments (done full, current filling, the rest empty; each a link to jump; names under them on desktop and tablet, dots on phone), and `Leave` (with `Esc` on desktop). Shown on a move of the pointer or a touch; hidden after 3 s while playing; always shown while paused, with `Paused`. Targets 44 on touch, a label on hover and focus (V2-102).
4. Keys: Space pauses and plays, ← and → move between scenes, Esc leaves. Other keys do nothing; a touch shows the controls rather than leaving. `Press any key or touch the screen to return` is removed; the keys' line (`Space pauses · ← → move between scenes · Esc leaves`) shows at the foot's right on the first loop while the controls are hidden, then fades.
5. The tour (`lib/present/create-tour.ts`, `tour.ts`): pause, resume, go to scene n, before, after, as pure logic with its tests; going to a scene starts it from its beginning; the loop goes on after the last scene as today.
6. Reduced motion (V2-103): each scene a still, held for its time, changed with a fade; the camera does not move; the counting figures show their final values.
7. The day scene keeps the sun's arc, its shade-free hours thicker and the sun moving along it (D72); the camera frames the arc's dome through the tour (D72).
8. The documents: `components.md` (Present), `information-architecture.md` (Present's place), `guidelines.md` (motion: reduced motion).

## Scope out

- The scenes' camera paths and the reveal's choreography (D72 as built).
- Where the Present button sits (issue 2, #209: at the head of Performance and Handover, with its word).
- The ground: Present follows the Imagery toggle (D72).

## Where the code is

- `apps/web/components/present/Present.tsx`, `PresentPanel.tsx`, new `PresentControls.tsx`
- `apps/web/lib/present/tour.ts`, `create-tour.ts`, `scene-panel.ts`, `figures.ts`, new `controls.ts`
- `apps/web/app/present` (the route)

## Words

As in Scope in, word for word. `Leave`, `Paused`, `Scene before`, `Scene after`, `Play`, `Pause`.

## Help to keep true

No topic describes Present today (search `Present`, `tour`); if the head of Performance gets a ? for it, its topic is #219's.

## Tests, written first

- `scene-panel.test.ts`: each scene's name, one figure and label (the demo's numbers).
- `tour.test.ts`: the six nouns; pause, resume, before, after, go to n; the loop.
- `controls.test.ts`: shown on a move or touch, hidden after 3 s while playing, always while paused; the keys and what each does; other keys do nothing.
- Reduced motion: stills, final values, no camera move.

## Done when

The owner can check each of these on the test stack at 1440 × 900, 834 × 1194 and 390 × 844, and the pull request's screenshots show it:

- [ ] Moving the pointer during the tour shows the controls; they fade after 3 s; paused, they stay with `Paused`.
- [ ] Space pauses, ← → move between scenes, Esc leaves; any other key does nothing.
- [ ] Each scene's panel shows one figure; the line at the foot is a noun.
- [ ] The day scene shows the sun's arc with the sun moving along it.
- [ ] With reduced motion on, the scenes are stills.
- [ ] On a phone and a tablet a touch shows the controls; Leave leaves.

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

- Title `V2 · 13 · <what it does>`; body: What it does · How it was checked (the tests written first, `bun check --skip=e2e`,
  what was pressed and read at each size, `Help: read …; changed …`, the voice's checklist of `plan/v2/voice.md` §10) ·
  Screenshots (the board beside what is built at 1440, 834 and 390, through `bun tools/pr-shots.ts`) · Not done · `Closes #220`.
- Merged on a green `check`. After the merge, `plan/STATE.md` and the epic's checklist on `main` (D26).

## Read first

[`plan/v2/build.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/build.md) (the loop) · [`plan/v2/voice.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/plan/v2/voice.md) · [`docs/design/README.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/design/README.md) · [`apps/web/CLAUDE.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/apps/web/CLAUDE.md) · [`docs/help-upkeep.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/help-upkeep.md) · [`docs/screenshots.md`](https://github.com/SolarLayout/rooftop-design-app/blob/main/docs/screenshots.md) · the board's builder `build_v2_present.py` · D72 in `plan/README.md`
