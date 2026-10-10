---
name: product-video
description: Makes videos of SolarLayout Rooftop from the app itself, recorded a frame at a time on the test stack: launch videos, short feature videos for LinkedIn or email, long-form walkthroughs for YouTube, with or without an ElevenLabs narration, in a wide 16:9 cut, a square cut and an email GIF, with captions, an end card and thumbnails. Use it whenever the owner asks for a video, a clip, a GIF, a screen recording, a demo, a teaser, a walkthrough, a narration or a voice-over of the product, or to remake, re-cut, re-caption or re-voice one, even if the word "video" is not used.
---

# Product videos of SolarLayout Rooftop

A video is the product on the screen, nothing drawn by hand: the app runs on the test stack, a script of acts drives it
under the page's clock, and a screenshot is taken after every tick, 30 a second. The frames are cut by a plan, captioned,
and encoded; a narration is spoken line by line by ElevenLabs and placed on the timeline. The launch video of 2026-10-10
(`assets/videos/launch`) is the model, approved by the owner, and `references/storyboard-launch.md` explains its choices.

## What a video is made of

Each video is a folder `assets/videos/<video>/`:

| File | What | Needed |
|---|---|---|
| `record.json` | The recording: the site, the browser, the segments of acts (`references/scripting.md`) | yes |
| `plan.json` | The cut: the shots from the segments, their speed, captions, push-in, the square window, and the frame the thumbnails are made over (`references/storyboard-launch.md`) | yes |
| `captions.json` | The words on the screen, the end card, the thumbnail's words | yes (captions may be empty; the end card and the thumbnail never) |
| `narration.json` | The spoken lines, each tied to a shot | only with a voice |
| `plan-gif-640.json` | The email GIF's shots | only for a GIF |
| `post-<channel>.md` | The post, tweet or email the video is posted with (`references/posts.md`) | when the video is for LinkedIn, Twitter or an email |

The work (frames, overlays, cuts, audio) goes to `.product-video/<video>/`, gitignored and kept, so a cut is remade
without recording again. The ElevenLabs key and voice are in `.product-video/.env` (`ELEVENLABS_API_KEY`,
`ELEVENLABS_VOICE_ID`), never printed, never committed.

## Making a video

1. **Agree the brief in a few lines**: what it shows, for whom, where it will be posted (LinkedIn, Twitter, an email,
   YouTube), how long, which cuts, with or without a voice. Then decide the shots yourself and say what you decided.
   Short videos run 30 to 90 s; a LinkedIn launch is about 60 to 80 s; a YouTube walkthrough can be minutes, with one
   segment per feature. A video for LinkedIn, Twitter or an email is delivered with its post, tweet or email
   (`references/posts.md`): the words are half the work, and the owner wants them in the same delivery.
2. **Write the words first**, in `captions.json` and, with a voice, `narration.json`. The rule the owner set
   (2026-10-10): plain, direct, standard English. Captions are short, a few words read at a glance. Narration is natural,
   complete sentences, the way a person explains something aloud, never clipped fragments, never flourish, drama or
   emotion, never the same thing said twice. Numbers spoken are written in words. If a sentence needs more time than its
   screen, lengthen the screen in the plan; do not cut the English. With the words of the screen, write the post of the
   channel the video is for, `post-<channel>.md`, in the form `references/posts.md` gives (the launch's
   `post-linkedin.md` is the model): two versions, the first comment, the notes for posting.
3. **Write the script** (`record.json`), one segment per thing shown, copying the launch's segments where they fit
   (the design from the map, each lens, Performance, Handover, Present). A site is in `assets/sites/`; a new site needs
   its weather fetched once (`references/pipeline.md`).
4. **Start the test stack** (`bun dev:bg --profile test`, never the dev profile) and **record**:
   `node scripts/record.cjs <video>`. A headed browser opens on the screen for the length of the recording; say so, and
   leave it alone. Look at a few frames of each segment with the Read tool before going on.
5. **Choose the thumbnail's frame** after looking at the frames: the one picture that says what the video is about, with
   the roof or the number in the right two thirds (the words go on the left). Name it in `plan.json`, `"thumb": { "seg",
   "frame" }`, and its words in `captions.json` (`thumb`: head, sub, pills). It is kept with the cut so a remake gives the
   same picture.
6. **Render the overlays**: `node scripts/overlays.cjs <video> captions` renders the captions, the end card and the
   thumbnails, wide and square, in one go; it refuses to run without the thumbnail's frame or words, so a cut is never
   composed without them. Composite a caption on its frame and look at it: a card must not cover the app's own words or
   controls (`references/storyboard-launch.md`, the captions). Look at `overlays/thumb-wide.png` too; to try another frame,
   `node scripts/overlays.cjs <video> thumb <frame.jpg>`, then put the frame you keep into the plan.
7. **Compose**: `uv run --with pillow python scripts/compose.py <video> wide`, then `square` if asked, then `gif-640`
   if asked. Each cut comes out with its thumbnail beside it in `out/` (`<name>-thumbnail-1920x1080.png` and `.jpg`,
   `<name>-thumbnail-1080x1080.png`). Check each cut with a contact sheet (`references/pipeline.md`, checking).
8. **With a voice**: `python3 -I scripts/narrate.py <video> speak` (`python -I` on Windows) speaks every line and
   reports its length against its screen; fix the plan or the words until `check` says every line fits; `compose` again
   if the plan changed; then `narrate.py <video> mix`. Confirm the speech lands where the lines say (the silence scan in
   `references/pipeline.md`).
9. **Deliver**: copy everything in `out/` (the cuts, their thumbnails, the GIF) and the post where the campaign keeps
   them, keep the previous versions beside them, and tell the owner the paths, the length, the thumbnails by name, the
   post's versions, and what you could not check (you cannot listen: say so). Stop the test stack.

## What to read when

- `references/scripting.md`: the acts of a recording, the clock, how to script a new feature.
- `references/storyboard-launch.md`: the launch video shot by shot, how a plan, the captions and the narration are read.
- `references/posts.md`: the LinkedIn post, the tweet or the email a video is delivered with, channel by channel.
- `references/pipeline.md`: what each script needs on the machine, the three things that would otherwise fail (the
  Esri key's referrer, the weather downloads, Present on the GPU), how to check a video without playing it.
- `README.md`: the commands in one place, for the owner.

## Rules that hold for every video

- The product as it is: real screens, real numbers from the app's own run of that roof, the Esri attribution visible
  wherever the imagery shows. Never a mock-up, never a number typed in.
- Every video is delivered with its thumbnails, one per cut (the owner, 2026-10-10): LinkedIn and YouTube ask for one at
  upload, and the pipeline makes them from the plan's frame, so a delivery without them is a step skipped, not a choice.
- No business named. A real building may be designed, searched by its coordinates; the design's name is a locality.
- "Free, no account needed" is the agreed wording; "rooftop solar" is the industry's phrase, never a bare "rooftops";
  the word "bankable" is never used.
- The skill is self-contained and runs on macOS or Windows, on any machine with the repository: nothing in it points at
  one machine or one person's folders; every path comes from `scripts/paths.cjs` or the video's own files; where a
  command differs by platform, both are given (`references/pipeline.md`). Never add a path of this machine to it.
- A video for LinkedIn, Twitter or an email comes with its post, tweet or email written (`references/posts.md`), never
  with the words left to the owner.
- The owner approves the words and the result; a change of words is one command per line and one mix, so offer the
  change rather than the argument.
