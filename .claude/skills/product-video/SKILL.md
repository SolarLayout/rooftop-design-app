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
| `plan.json` | The cut: the shots from the segments, their speed, captions, push-in, the square window (`references/storyboard-launch.md`) | yes |
| `captions.json` | The words on the screen, the end card, the thumbnail | yes (captions may be empty) |
| `narration.json` | The spoken lines, each tied to a shot | only with a voice |
| `plan-gif-640.json` | The email GIF's shots | only for a GIF |

The work (frames, overlays, cuts, audio) goes to `.product-video/<video>/`, gitignored and kept, so a cut is remade
without recording again. The ElevenLabs key and voice are in `.product-video/.env` (`ELEVENLABS_API_KEY`,
`ELEVENLABS_VOICE_ID`), never printed, never committed.

## Making a video

1. **Agree the brief in a few lines**: what it shows, for whom, how long, which cuts, with or without a voice. Then
   decide the shots yourself and say what you decided. Short videos run 30 to 90 s; a LinkedIn launch is about 60 to
   80 s; a YouTube walkthrough can be minutes, with one segment per feature.
2. **Write the words first**, in `captions.json` and, with a voice, `narration.json`. The rule the owner set
   (2026-10-10): plain, direct, standard English. Captions are short, a few words read at a glance. Narration is natural,
   complete sentences, the way a person explains something aloud, never clipped fragments, never flourish, drama or
   emotion, never the same thing said twice. Numbers spoken are written in words. If a sentence needs more time than its
   screen, lengthen the screen in the plan; do not cut the English.
3. **Write the script** (`record.json`), one segment per thing shown, copying the launch's segments where they fit
   (the design from the map, each lens, Performance, Handover, Present). A site is in `assets/sites/`; a new site needs
   its weather fetched once (`references/pipeline.md`).
4. **Start the test stack** (`bun dev:bg --profile test`, never the dev profile) and **record**:
   `node scripts/record.cjs <video>`. A headed browser opens on the screen for the length of the recording; say so, and
   leave it alone. Look at a few frames of each segment with the Read tool before going on.
5. **Render the overlays**: `node scripts/overlays.cjs <video> captions`, and the thumbnails over a chosen frame:
   `node scripts/overlays.cjs <video> thumb <frame.jpg>`. Composite a caption on its frame and look at it: a card must
   not cover the app's own words or controls (`references/storyboard-launch.md`, the captions).
6. **Compose**: `uv run --with pillow python scripts/compose.py <video> wide`, then `square` if asked, then `gif-640`
   if asked. Check each with a contact sheet (`references/pipeline.md`, checking).
7. **With a voice**: `python3 -I scripts/narrate.py <video> speak` speaks every line and reports its length against its
   screen; fix the plan or the words until `check` says every line fits; `compose` again if the plan changed; then
   `narrate.py <video> mix`. Confirm the speech lands where the lines say (the silence scan in `references/pipeline.md`).
8. **Deliver**: copy the cuts, the GIF and the thumbnails where the campaign keeps them, keep the previous versions
   beside them, and tell the owner the paths, the length, and what you could not check (you cannot listen: say so).
   Stop the test stack.

## What to read when

- `references/scripting.md`: the acts of a recording, the clock, how to script a new feature.
- `references/storyboard-launch.md`: the launch video shot by shot, how a plan, the captions and the narration are read.
- `references/pipeline.md`: what each script needs on this machine, the three things that would otherwise fail (the
  Esri key's referrer, the weather downloads, Present on the GPU), how to check a video without playing it.
- `README.md`: the commands in one place, for the owner.

## Rules that hold for every video

- The product as it is: real screens, real numbers from the app's own run of that roof, the Esri attribution visible
  wherever the imagery shows. Never a mock-up, never a number typed in.
- No business named. A real building may be designed, searched by its coordinates; the design's name is a locality.
- "Free, no account needed" is the agreed wording; "rooftop solar" is the industry's phrase, never a bare "rooftops";
  the word "bankable" is never used.
- The owner approves the words and the result; a change of words is one command per line and one mix, so offer the
  change rather than the argument.
