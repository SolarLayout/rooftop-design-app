# Phase 15: plan

What the phase is and why: `phase-15-help-clips.md`. This file is how it is done, in order. Decisions proposed here take a
number (D82 onwards) once the owner keeps them.

## How the phase works
- The owner's standing instructions hold (sessions 18 and 19): run solo; each pull request merged on a green check, one after
  the other, no stacked branches; no browser test suites run and no new UI tests; each change checked by hand in the browser
  on the test stack at three sizes, its screenshots embedded in its description and seen to show (`docs/screenshots.md`);
  every board for approval in three sizes on the canvas; documents to `main` alone (D26).
- Major decisions go to the owner one at a time, each with a recommendation. The rest is decided and said.
- Design first: no player is built before its boards are approved.

## Steps

### 1. The spike (no UI; a local branch, never merged)
Record "Move or turn the roof" (its four acts: pick, drag, turn) three ways, and measure each:
- Playwright's own video (WebM, VP8) at the step's frame;
- frames taken at twice the pixels, encoded to H.264 MP4 and to VP9 WebM with a pinned `ffmpeg-static`;
- (if quick) frames encoded in the browser with WebCodecs, no native tool.

For each: size, sharpness of the edges' labels at the sheet's width and opened large, smoothness, time to make. Play each in
Chrome, Firefox and Safari on this Mac, and in iOS Safari (the owner's phone, or the Simulator if Xcode is there). A pointer
(desktop) and a finger's dot (touch) are drawn into the page by the script while recording, as the clip's only additions.
The result is a table in this file, "What the spike found", and a recommendation of format, encoder and budget.

### 2. Decisions with the owner (one at a time, after the spike)
- **D82, where clips live** (recommended from the spike's sizes): in the repository beside the pictures under a budget held
  by the gate, if the total stays small (proposed: 1 MB a clip, 15 MB in all); else in object storage with a manifest in the
  repository (Vercel Blob, the app's own host; or S3 and CloudFront in the AWS account).
- **D83, the format and its encoder** (from the spike): proposed MP4 (H.264) for everything, made by a pinned dev dependency;
  a second format only if the spike shows it worth its weight.
- **D84, which steps get a clip**: proposed the gestures a still cannot show (moving and turning the roof, a rectangle turned,
  a corner dragged and snapping, an obstacle turned); every step keeps its picture.

### 3. The boards (the canvas page "In-App Help", three sizes, for approval)
The clip in a step: its poster with play and length; playing (progress, pause); ended (replay); loading; failed (the picture,
and words); `prefers-reduced-motion` (the poster, play on request only); its timed callouts; opened full screen on touch;
the pointer and the finger as they show inside the clip. Drawn by a prototype in the app (a local branch, never merged), as
the boards of D80 and D81 were.

### 4. The pull requests (written here once the boards are approved; proposed)
1. **The clips' making:** `bun help:clips`, the acts of `tools/help/pictures.ts` given a pace (pure, tested: each act's
   duration, the frames' times), recorded on the test stack as the pictures are, the pointer drawn in, encoded as D83 says,
   a poster from the first frame; written where D82 says.
2. **The player in the help kit:** `components.md` first; a `Clip` in a step's frame (or a picture's `clip` prop), its
   states, timed marks, reduced motion, failure to the picture; the gate (each clip and poster there, length and size within
   the budget, marks inside the length); the kit page.
3. **The clips of the chosen steps** (D84), each looked at, in Chrome and Safari.
4. **Full screen on touch**, as a picture opens large.
5. **The guide:** `docs/help-content.md`, "Clips"; `docs/screenshots.md`; both `CLAUDE.md` files.

## Risks
- iOS Safari and a format: the spike plays each candidate there before anything is decided.
- A native encoder as a dependency (licence, size, platforms): dev only, never shipped, pinned (D4); the spike weighs the
  alternative of no encoder at all (Playwright's VP8).
- Repository weight: the budget, held by the gate; storage elsewhere if the spike's numbers say so.
- Clips that drift from the app: made by the script only, taken again with the pictures when a screen changes.

## What done means
The acceptance of `phase-15-help-clips.md`, each pull request merged on a green check with its screenshots, the guide
written, `plan/STATE.md` and this file's "As built" brought up to date.
