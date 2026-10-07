# Phase 15: short video clips in the help

**Status:** started (session 19, 2026-10-07): this file and `phase-15-plan.md`; the spike next, then the boards for approval.
**Depends on:** Phase 14 (the help, its how-tos and their pictures: D80, D81).

## What the owner asked (session 19)
"after this work is done, we will work on the video clips work, the setup/infra/mechanics around it. FYI. That will be the
next phase and you have already put some designs around that in the canvas which i tend to like." The design he likes is the
board "In-App Help · How-tos with pictures", section 5, "Later: a short clip in the same frame": a step's picture frame with
a play button and the clip's length; it plays in place, muted, never by itself, and loops; the step's words stay as its
caption, the callouts as the clip's marks; a picture first, always, a clip only where a gesture is hard to see still.

## Goal
A how-to's step can show a short clip of the app doing what the step says, made from the app itself by a script as its
pictures are (never filmed or edited by hand), small enough to keep and serve without a burden, played in the same frame as
the step's picture on every size, and checked by the gate as the pictures are.

## What exists to build on
- **The pictures' pipeline** (Phase 14, D81): `tools/help/pictures.ts` says what each picture shows as the hand's acts;
  `e2e/help-pictures` performs them on the test stack with the imagery replaced by a plain ground and nothing leaving the
  machine; `bun help:pictures` writes `apps/web/public/help/<dir>/<n>.jpg`. A clip is the same acts, recorded over time.
- **The help kit**: `Steps`, `Step`, `Picture` with its `Mark`s (`components/shell/help/help-steps.tsx`), the picture
  opened large on touch (`PictureLarge`, `lib/help/zoom.ts`), the gate over every picture (`tools/help/pictures-in-topics.ts`).
- **Serving**: the web app is on Vercel (Phase 12); a file in `apps/web/public` is served by Vercel's CDN with the app. The
  help's pictures are 1.3 MB today, in the repository.
- **Tooling on this machine**: Playwright 1.52 records a page as WebM (VP8) with its own ffmpeg build; no system ffmpeg.

## Questions this phase answers
1. **Making a clip.** Recorded by Playwright's video, or frames taken and encoded? A pointer or a finger drawn into the page
   while recording (headless shows none), and the pace of each act (a drag eased over a second, a pause to read).
2. **Format.** What plays everywhere the app runs (Chrome, Edge, Firefox, Safari on macOS, iOS and iPadOS): H.264 in MP4 is
   universal; WebM (VP9, AV1) is smaller but its support on iOS is to be checked. What encodes it here (a pinned
   `ffmpeg-static` as a dev dependency, WebCodecs in the browser, or Playwright's VP8 as it is).
3. **Size and storage.** A budget per clip and in all; in the repository beside the pictures (a gate on size) or in object
   storage (Vercel Blob, or S3 behind CloudFront in the AWS account) with a manifest in the repository. The owner's
   "setup/infra" is this question.
4. **Playing.** The player in the step's frame: poster (the first frame), play and pause, its length and progress, loop,
   muted, `preload="none"` (nothing loads until play), `prefers-reduced-motion` respected, a failure falling back to the
   picture with words; full screen on touch as a picture opens large; the callouts timed with the clip.
5. **Which steps get a clip.** Those whose gesture a still cannot show: a drag, a turn, a corner snapping, a pinch.
6. **The gate.** Each clip and its poster there, its length and size within the budget, its marks inside its length.

## Acceptance
- A clip in at least the how-tos chosen with the owner, made by a script from the app, played in the help sheet at 1440, 834
  and 390 in Chrome and Safari (macOS and iOS); the picture stays for each step, and shows where a clip cannot play.
- Every clip within the budget, the gate green, the tools and the guide (`docs/help-content.md`, "Clips") committed.
- The boards approved first, in three sizes, on the canvas.

## Not in this phase
Sound and narration; clips anywhere but the help; clips made by hand or edited after.
