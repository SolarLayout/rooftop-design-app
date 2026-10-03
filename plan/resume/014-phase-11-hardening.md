# 014: Phase 11, hardening for the tradeshow

Written: 2026-10-03, by session 13, at the close of Phase 10 (built unattended at the owner's pre-approval). Status: open. After 013 (Phase 10).

## Paste this

```
Continue the SolarLayout Rooftop web rebuild in this repo. This session begins Phase 11: hardening for the tradeshow
(plan/phase-11-hardening.md): nothing surprising happens in front of an audience. The plan of the phase comes first, as
plan/phase-10-plan.md and plan/phase-09-plan.md were written (what was found, the boards the phase lacks, the pull requests, the steps
with their tests, the decisions with their why, the risks, what done means); show it and wait for approval. Then build in pull
requests, each checked with the fast check and the browser groups it reaches (D55), every picture looked at beside its board.

You have no memory of earlier sessions. Everything you need is in the repo.

Read first, in this order: CLAUDE.md, apps/web/CLAUDE.md, docs/checks.md (the fast check is the gate; eight browser groups; a new suite
and a new folder are placed by name; the measured times; the known limits), plan/STATE.md (where the work stands, the open items and
the watch items, the facts of the machine), plan/SESSIONS.md, plan/README.md (every decision), plan/phase-11-hardening.md (the goal, the
scope, the acceptance), plan/phase-10-home-projects-present.md ("As built", "Deviations", "Found on the way"),
plan/phase-09-handover.md (the same), plan/reference/functional-inventory.md (the parity audit walks it line by line), and
plan/sessions/013/record.md.

Start by telling me what you found at the start of the session, then the plan. Decide small and medium things yourself and say what you
decided; ask only the major ones, one at a time. The plan should take up, among the scope of the phase file:
  - The open items of plan/STATE.md that are Phase 11's: the rewrite of `next dev` dropping the report's pages (a production build of the
    web app for the test stack, which would also tell whether the drops are `next dev`'s alone, and a proxy in front of the API); pytest
    on GitHub's two-core runner (OMP_NUM_THREADS, or fewer drawing tests); the browser tests made lighter (each workspace's pictures in
    its group's suite; the kit on two sizes); the stage under software WebGL in the tests (hardware WebGL lost the satellite ground);
    Present's first scene (the roof plane lies on the ground as a slab while the building rises; the board shows the satellite with the
    outline alone); the keep-out dashes in the card's thumbnail; the kit's import rule and the base reaching into a group's folder.
  - The offline demo: the demo project and its weather bundled (D5: no database); the stand without a network, Present included.
  - The operator's guide: start, reset to the demo, Present; one page.
  - The parity and numbers audits as a table the owner signs off, row by row.
Documents alone go to main directly (D26); code never does.
```

## Notes for the owner

- Phase 10 is done and merged (#67, #69, #71, #72; the check mended by #68 and #70). `plan/phase-10-home-projects-present.md`, "As built",
  says what exists, what deviated and why, and what was found; `plan/STATE.md` carries the watch items.
- Three things to look at on the stand's machine: Home at `/` (the demo's card, a design kept after an edit, its card with the plan and the
  run's numbers); Open a project with an `.rtd` saved from Handover and with a format 1 file of the desktop app; Present from the top bar,
  left by a key.
- The soak of Present ran thirty minutes on this machine with its own graphics on 2026-10-03: the numbers are in "As built".
- The session that takes this prompt plans first and waits for your approval of the plan, as before Phase 10's exception.
