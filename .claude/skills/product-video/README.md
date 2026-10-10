# product-video: usage notes

Videos of SolarLayout Rooftop made from the app itself: recorded a frame at a time on the test stack, cut by a plan,
captioned in the app's fonts, narrated by ElevenLabs if wanted. The first video, `launch` (2026-10-10, 81 s with
voice), is the model. In Claude Code, ask for a video and the skill takes over; the commands below are what it runs.

## Once on a machine

```sh
bun install                                   # Playwright and the encoder come with the e2e workspace
cd e2e && bun x playwright install chromium   # the browser
```

Node is found as `tools/lib/node.ts` finds it (Homebrew's). `uv` runs `compose.py` with Pillow in an environment of its
own. For a voice, put the key and the voice in `.product-video/.env` (gitignored):

```
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

A key scoped to text-to-speech alone is enough.

## Making the launch video again

```sh
bun dev:bg --profile test                                           # the test stack, never the dev one
cd .claude/skills/product-video/scripts
node record.cjs launch                                              # about 8 min; a browser window opens: leave it alone
node overlays.cjs launch captions                                   # the captions and the end card, wide and square
node overlays.cjs launch thumb ../../../../.product-video/launch/frames/s9-present/00410.jpg
uv run --with pillow python compose.py launch wide                  # about 7 min
uv run --with pillow python compose.py launch square                # the 1:1 cut, if wanted
uv run --with pillow python compose.py launch gif-640               # the email GIF, if wanted
python3 -I narrate.py launch speak                                  # the lines, with their length against their screen
python3 -I narrate.py launch mix                                    # the cuts with sound: ...-voice.mp4
bun stop --profile test
```

Outputs: `.product-video/launch/out/`. Frames and overlays stay in `.product-video/launch/`, so a change of captions is
`overlays.cjs` and `compose.py` again, a change of a spoken line is `narrate.py launch speak <id>` and `mix`.

## A new video

Copy `assets/videos/launch` to `assets/videos/<name>`, keep what fits, change the rest:

- `record.json`: the segments and acts (`references/scripting.md`). A feature video can start on `/studio/roof`
  (the demo) and record one lens.
- `plan.json`: the shots (`references/storyboard-launch.md`). `"name"` names the output files.
- `captions.json`: short plain captions; `narration.json`: full plain sentences, or delete it for a silent video.
- A new roof: `assets/sites/<site>.json` and its weather,
  `cd apps/api && ROOFTOP_WEATHER_DOWNLOADS=on uv run python ../../.claude/skills/product-video/scripts/weather.py <lat> <lon> ../../.claude/skills/product-video/assets/sites/<site>-weather.json`.

Then the same commands with `<name>` in place of `launch`.

## Where things are

```
.claude/skills/product-video/
  SKILL.md                 what Claude does, and in what order
  README.md                this
  scripts/paths.cjs        where the repo, the work, the stack, Playwright and ffmpeg are
  scripts/record.cjs       the recorder: a video's script played in the app, a frame a tick
  scripts/overlays.cjs     captions, end card, thumbnails
  scripts/compose.py       the cuts and the GIF
  scripts/narrate.py       the narration: speak, check, mix
  scripts/weather.py       a site's PVGIS weather through the API's own service
  assets/videos/<video>/   record.json, plan.json, captions.json, narration.json, plan-gif-*.json
  assets/sites/            a site and its weather
  references/              scripting.md, storyboard-launch.md, pipeline.md
.product-video/<video>/    frames, overlays, html, out, audio (gitignored)
.product-video/.env        the ElevenLabs key and voice (gitignored)
```

## When something fails

`references/pipeline.md` lists the three things that fail without their workaround (the Esri key's referrer, the API's
weather downloads, Present on the GPU) and the smaller ones. Leftover headless browsers from an interrupted run slow
everything: `pkill -f ms-playwright/chromium`.
