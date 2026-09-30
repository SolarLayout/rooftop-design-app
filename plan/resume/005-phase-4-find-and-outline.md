# 005: Phase 4, find the roof on the map and outline it

Written: 2026-09-30, by session 5, at the owner's request. Status: open.

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session: Phase 4, find the roof on the map
and outline it, the flagship. Phase 3 is done: the design system, the stores, the data flow and the shell
are on main. Nothing of Phase 4 exists yet.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, plan/STATE.md, plan/SESSIONS.md, plan/README.md
(every decision; D13 and D18 are of the map, D37 to D39 are the newest), plan/phase-04-find-and-outline.md
(the goal, the flow, the scope, the limits to state, the acceptance), plan/reference/map-providers.md (what
was verified with our key, what the terms allow, the Overture footprints), plan/reference/functional-
inventory.md (the roof entry of the desktop app: rectangle, corners, KMZ, DXF, lat/lon), plan/phase-03-
design-system-shell.md ("As built": what the shell gives you, and "Found on the way"),
plan/sessions/005/record.md ("Why things are the way they are" and "What was tried and dropped"), and
plan/phase-03-rest-plan.md as the example of a plan that a session writes before it builds.
Then docs/design: README.md, information-architecture.md (the flow for a new design), design-tokens.md
(with "Numbers in code" and "In code"), guidelines.md ("States every screen must handle", "Responsive
rules", "3D scene" for what the map hands to the 3D later), components.md ("Map outline tools", "Decision
card", "Callout on the stage", "Buttons", "Number field", "File drop").
Open the previews in docs/design/previews: find-outline-desktop, find-outline-phone, studio-roof-lens-
desktop, home-desktop; and their sources in docs/design/mockups (Locate, LocatePhone, RoofLens, Home): the
exact values are inline styles there.
Read the code that exists before you add to it:
  - apps/web/lib/api (client.ts, types.ts) and packages/api-types/src/index.ts for Project, Roof,
    Obstacle, RoofInput, ImportedRoof, and what POST /roof/import takes;
  - apps/web/lib/stores (project-store.ts: open, commit, the edit count), apps/web/lib/flow/design-flow.ts
    (what follows a committed edit; openDemo), apps/web/lib/routes.ts;
  - apps/web/components/shell (Shell.tsx, stores.tsx and its hooks, Studio.tsx, TopBar.tsx,
    ProjectSwitcher.tsx: "New design · Find the roof" is shown there and cannot be used yet);
  - apps/web/components/ui, all of it, and apps/web/components/kit (Pages.tsx has the pages of the kit);
  - e2e/fixtures.ts (every request that leaves this machine is stopped and fails the test), e2e/screens.ts,
    e2e/tests/shell.e2e.ts and shell-vitals.e2e.ts (page.route on the way to the API; a test waits for a
    result, never for a time), e2e/tests/kit-shell.e2e.ts;
  - apps/api/src/rooftop_core/geo.py and the API's roof import, for WGS84 to local metres: the engine's
    projection is the only one;
  - tools/imagery-preview (a throwaway page that showed the Esri tiles with our key; it goes when Phase 4
    lands).
Then follow "Start of a session" in plan/SESSIONS.md, including the checks of git, open pull requests, the
running stacks and a green `bun check`.

The phase is large. Work in this order:

  1. Write the plan first, as session 4 did for Phase 3: plan/phase-04-plan.md, with the steps in their
     order, what each builds, what is tested without a browser and what in it, the decisions you take
     unless I say otherwise, the facts you found in the code and the API, what needs me, the risks, and
     what done means. Decide the pull requests: few, split at clean seams, each step a commit. Commit the
     plan to main (documents only) and show it to me. Wait for my word before you build.
  2. Build the plan in its order, test first and seen failing. `bun check` green before every commit. A
     draft pull request after the first step of each, so that its check runs on every push. After each
     step tell me in a few lines what is there and what you decided. Bring plan/STATE.md up to date on main
     after every second step, from a worktree.
  3. Close the phase: acceptance met and written up under "As built" in plan/phase-04-find-and-outline.md;
     status in plan/README.md; plan/STATE.md; the record in plan/sessions/006; this file set to "used" in
     plan/resume/README.md. Then tell me the state in a few lines.

What the plan must settle, so that I can say yes or no to each:
  - The map: MapLibre GL JS with the Esri style (map-providers.md), behind a MapProvider interface, pinned
    exactly (D4). How tiles, search and footprints are stood in for in the browser tests: fixtures on this
    machine, never the network (rule 6). The key: NEXT_PUBLIC_ESRI_API_KEY in apps/web/.env.local, never
    read, printed or committed; a new setting goes into apps/web/.env.example without a value.
  - The route /find and how it is reached: from the project switcher ("New design"), and from Home when
    Home is built (Phase 10). Whether Home gets its "Find my roof" now, as the flow of the IA begins there.
  - The three ways to outline, one result; the live measurements; typed lengths; snapping; undo; keyboard;
    touch. What is a pure function (the geometry, the snapping, the corrections) and tested with bun test.
  - Obstacles on the map, with their heights asked for after; "Enter dimensions by hand instead".
  - "Build this roof": the document goes into the project store and the Studio opens on the Roof lens; the
    flow of Phase 3 asks for the layout and the run. What the Roof lens shows in this phase (its inspector
    with location, outline and roof type is drawn; the 3D stage is Phase 5).
  - What the tests mock and what they prove: the 90.0 by 40.0 m rectangle within 0.5 m per edge and 2 % of
    area; the acceptance of the phase file, point by point.
  - Where Overture's footprints come from in a test, and how a pinned release is mirrored (the plan says
    how; the doing may be a later step).

Traps known at handover, beside those in plan/sessions/005/record.md ("What was tried and dropped"), which
all still hold:
  - Tailwind's own theme is switched off. A class that does not exist makes no CSS and no error. Breakpoints
    are `tablet:`, `desktop:`, and inside them `tablet-wide:` (820) and `desktop-wide:` (1360), for the top
    bar. States are `hovered:`, `pressed:`, `focused:`, `within-hovered:`; none applies to a control that is
    disabled or `aria-disabled`.
  - The only inline style is `style={measures({...})}`: shares (`at`, `span`) and places in pixels (`x`,
    `y`). A map library that writes its own styles into the DOM is outside the guard (it reads
    apps/web/{app,components}); what you write is inside it. A new token goes into
    docs/design/design-tokens.md first, then globals.css, and globals.test.ts holds them equal; a number
    that code needs goes into design-numbers.ts and the table "Numbers in code".
  - Two utilities of the same weight: the later one in the stylesheet wins, not the later in the class. A
    colour that must win goes on an element of its own.
  - `react-hooks/refs` refuses every read of a ref while rendering. A hook gives the ref back beside its
    state (use-floating.ts), or finds the element from the event. A thing with side effects (a map, a
    flow) is made without them and started in an effect (design-flow.ts: `start`).
  - What opens over the screen is in the top layer of the browser (`popover`, `dialog`), shown with
    `open:flex`. The shell is as high as the screen and scrolls inside; the top bar and the tab bar stay.
  - The project store has no default for anything. The system voltage stays as the document has it, or
    null. A committed edit is a function of the document that gives a new one; one that changes nothing
    does not count.
  - A browser test waits for a result, never for a time. The design run of the demo takes 12 s the first
    time. Every request that leaves this machine fails the test: tiles, geocoding and footprints must
    come from fixtures on this machine (page.route with a file, or a stand-in server in the test stack).
  - The browser of the tests runs WebGL in software (playwright.config.ts). MapLibre needs WebGL: check
    early that it renders there, and say in the plan what you do if it does not.
  - `git mv` stages: look at `git status` before a commit of documents. A change to documents only goes to
    main from a worktree of its own. Never `git stash` while the test stack runs. After pages move, stop
    the test stack and delete apps/web/.next-test.
  - To look at a screen: a script of a few lines with `chromium` of @playwright/test against the ports of
    .dev/test/pids.json (plan/sessions/005/record.md says how a board is rendered the same way). Baselines
    are renewed with `bun tools/with-node.ts playwright test <name> --update-snapshots` in e2e/, after you
    looked at the new picture.
  - The check of a pull request took 4 min 18 s to 6 min 29 s in session 5. If one passes 6 min 30 s, do
    what plan/STATE.md says under "Open items" (the memo for the shading), as a pull request of its own,
    before anything else.
  - The design canvas holds the same 17 boards as docs/design/mockups. A publish to it went through in
    session 5; if the permission system refuses one, do not work around it.
  - A screen or a state without a mockup is designed and approved first: the map has two mockups (desktop
    and phone) and no tablet; the loupe of the touch drag, the obstacle heights and "Enter dimensions by
    hand" have no board. Say in the plan which you draw, and draw before you build.

Rules for the whole session: production grade, test first and seen failing, tokens only, build to the
mockup, never read or commit apps/web/.env.local, use the test stack only (`bun dev:bg --profile test`),
bun and uv only, versions pinned exactly. You may commit, push and merge once the check is green. A change
to documents only goes to main directly, without a pull request (decision D26). Be brief, decide small
things yourself, ask me only for major decisions, one at a time, and show me each finished part. Past two
thirds of your context, finish the step in hand, update the state and hand over.

Start by telling me what you found at the start of the session, then write the plan.
```

## Notes for the owner

- The session writes the plan first and waits for your word. Expect that within the first hour, with the
  decisions it takes listed so that you can say no to any.
- Nothing to add with `/add-dir` for the plan. If the session asks for `solar-mms-modeller`, it is for how
  that project drew a map or fed imagery to its 3D; give it or refuse it.
- The Esri key is in `apps/web/.env.local` already. If the session finds it gone, it asks you for it, one
  step at a time.
- The phase is large: expect the session to hand over once or twice before the phase is closed;
  `plan/STATE.md` will say where it stands, and you can paste this prompt again, as the session reads the
  state first.
- Still open for you and Prasanta, not blocking this phase: the three questions in `plan/STATE.md`, "Open
  items", marked "Owner and domain expert".
