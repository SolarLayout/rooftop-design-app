# Phase 11: hardening for the tradeshow

**Status:** not started. **Depends on:** all earlier phases.

## Goal
Nothing surprising happens in front of an audience.

## Scope
- Parity audit: walk `reference/functional-inventory.md` line by line against the running app; every row is
  ticked or has a written reason.
- Numbers audit: demo and two other roofs (east-west, sloped flush) compared with the desktop app to the
  displayed precision.
- End-to-end suite: full journey (locate roof, add obstacle, array, voltage, option, losses, export) on
  phone, tablet and desktop. Runs in CI.
- Performance: web vitals budget for the shell; 3D frame budget; API timings logged; large roof
  (5,000 positions) stays usable.
- Resilience: API unreachable, slow weather download, bad PAN/OND/KMZ/DXF/CSV, WebGL unavailable or context
  lost (fall back to the plan view with a note), browser storage full.
- Offline demo: the demo project and its weather are bundled so the stand works without a network.
- Accessibility: keyboard path through every screen, focus order, labels, contrast, reduced motion.
- Browsers: current Chrome, Safari (macOS, iPadOS, iOS), Edge, Firefox.
- One-page operator guide for the stand: start, reset to demo, Present mode.

## Acceptance
- `bun check` green including the full e2e suite.
- Parity and numbers audits signed off by the owner.
- A dry run on the actual tradeshow hardware.
