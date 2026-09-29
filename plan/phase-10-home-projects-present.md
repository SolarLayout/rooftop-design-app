# Phase 10: Home, projects on the device, Present mode

**Status:** not started. **Depends on:** phases 3 to 9.

## Goal
A first screen that gets a visitor into a design in one action, and a hands-off mode for the tradeshow stand.

## Scope: Home
- Find my roof: the search field opens the map of phase 4 at the result.
- Import a drawing: KMZ, KML or DXF by drop or picker.
- Open a project: `.rtd` by drop or picker.
- Open the demo.
- Designs on this device: cards with a thumbnail of the 3D, name, capacity, energy, last edited.
  Rename, duplicate, delete, save a copy as a file.

## Scope: projects on the device
- IndexedDB store, autosave on every committed edit, "Saved on this device" state in the top bar.
- Undo and redo across the whole project document.
- Results are not stored; they are recomputed on open (as on desktop).
- Warning before leaving with an export in progress.

## Scope: Present mode
- Full screen, chrome hidden. A scripted tour of the current design:
  satellite view tilts into 3D, the building rises, obstacles rise, modules fill row by row, the sun sweeps the design day with shadows,
  strings light up by colour, energy counts up to the year-1 number, loss chain cascades.
- Slow camera moves between set points; loops until a key or touch; any input returns control.
- Respects reduced motion (cuts instead of moves).
- Runs from cached results, so it works with the API offline once a design is loaded.

## Acceptance
- From a cold start to the demo in Studio: one click.
- Reload the browser: the design is there, results recompute, no data lost.
- Present mode runs 30 minutes without a frame hitch over 50 ms or a memory climb.
- Playwright: create, rename, reopen, delete a project; Home on three viewports.
