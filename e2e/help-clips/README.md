# e2e/help-clips

The clips of the in-app help's how-tos (Phase 15; D82 to D84): recorded from the app itself, a frame at a time, never
filmed or edited by hand. A Playwright run of its own, as `e2e/help-pictures` is; the check never runs it.

| File | What |
|---|---|
| `playwright.config.ts` | One Chromium on the test stack, at twice the pixels, software WebGL as the tests have it |
| `help-clips.ts` | Begins each clip's how-to as for its pictures, puts the map where its step begins, draws the pointer in, does each act of the hand a frame at a time (a screenshot of the part kept after every step), encodes the frames |
| `pointer.ts` | The dot drawn where the pointer is, white, the accent while it presses (headless shows none) |
| `ffmpeg.d.ts` | The types of the pinned encoder, `@ffmpeg-installer/ffmpeg` 1.1.0 (D83) |
| `../help-pictures/on-find.ts` | Shared with the pictures: how a how-to begins, where things are, each act on the map, the part kept |
| `../../tools/help/clips.ts` | The pace (thirty frames a second, each move's seconds), the pointer's eased glide, a clip's length; tested by `bun test tools/help` |
| `../../tools/help/pictures.ts` | Each how-to's `clips`, beside its pictures: a clip's name (the step it plays in), `before` (unseen), `acts` (recorded) |

## Make a clip

```sh
bun help:clips                          # every clip
bun help:clips -g find/move-the-roof/4  # one clip, by its how-to's folder and its step
```

It writes `apps/web/public/help/<dir>/<step>.mp4`: H.264, 30 frames a second, twice the pixels of the step's picture, about
CRF 26, the index at the front (D83). The test stack is started when it is not running, and stopped after in that case.
Nothing leaves this machine: the fixtures' guard refuses every request but the plain ground served in place of the imagery.

## Add a clip

1. In `tools/help/pictures.ts`, give the how-to a `clips` entry named for the step it plays in. `before` holds the pictures'
   acts that put the map where the step begins (done unseen); `acts` the hand's moves to record: `rest`, `click`, `drag`
   (with `back`), `turn` (with `back`).
2. **End as it began.** A clip loops: take the hand back (`back: true`) and let it come home, so the last frame is the first.
   If a move ends somewhere else (a turn taken back to nothing lets the roof go), begin the clip there instead.
3. `bun help:clips -g <dir>/<step>`, then look at it: play it, and check the first and the last frames match, the pointer
   is seen at each press, the labels are sharp. Keep it under 500 kB (the budget is 6 MB for all, D82).
4. Put it in the topic, on the step's picture (`docs/help-content.md`, "Clips"), and commit the clip with the topic.

Once on a machine: `cd e2e && bun x playwright install chromium` (the root `README.md`). The encoder comes with
`bun install`: a binary per platform, no install script.
