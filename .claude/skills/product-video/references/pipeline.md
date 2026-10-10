# The pipeline, and what it needs on this machine

```
record.cjs <video>        the app on the test stack, a frame a tick          -> .product-video/<video>/frames/<segment>/*.jpg
overlays.cjs <video>      captions, end card, thumbnails, in the app's fonts  -> .product-video/<video>/overlays/*.png
                          (the thumbnails over plan.json's "thumb" frame; refused without it)
compose.py <video> wide   the shots of plan.json, crossfaded, captioned      -> .product-video/<video>/out/<name>-1920x1080.mp4
                          and the cut's thumbnail                              and <name>-thumbnail-1920x1080.png, .jpg
compose.py <video> square                                                     -> .product-video/<video>/out/<name>-1080x1080.mp4
                                                                                 and <name>-thumbnail-1080x1080.png
compose.py <video> gif-640                                                    -> .product-video/<video>/out/<name>.gif
narrate.py <video> speak  each line through ElevenLabs                        -> .product-video/<video>/audio/<id>.mp3
narrate.py <video> mix    the lines at their seconds, muxed into the cuts    -> .product-video/<video>/out/<name>-...-voice.mp4
```

Everything under `.product-video/` is gitignored and kept between runs: a cut is remade from the frames without
recording again, a line is respoken alone.

## What runs what

- The Node scripts load Playwright and the encoder from `e2e/node_modules` (`paths.cjs`), so they run with plain
  `node` from anywhere; Node is the one the repository's tools find (`tools/lib/node.ts`; `bun status` prints it).
- `compose.py` needs Pillow: `uv run --with pillow python scripts/compose.py ...` gives it an environment of its own,
  nothing is added to the API's project. `narrate.py` and `weather.py` are the standard library (`python3 -I` on macOS,
  `python -I` on Windows).
- The skill runs on macOS or Windows: paths are built with `path.join` and `pathlib`, file URLs with `pathToFileURL`,
  nothing points at one machine. Where a command differs by platform it is given for both, here and in the README.
- The encoder is `@ffmpeg-installer/ffmpeg` of the e2e workspace (D83): H.264 at CRF 18, `+faststart`; the GIF through
  `palettegen`/`paletteuse`.
- The test stack: `bun dev:bg --profile test` (web 4710, API 4711 by preference; the scripts read the real port from
  `.dev/test/pids.json`). Never the dev profile. Stop it after: `bun stop --profile test`.

## The three things that would otherwise fail

1. **The Esri key is restricted to `http://localhost:4700`**, the dev profile's origin; the test stack is on 4710. The
   imagery tiles answer anyway; the geocoder refuses, so the recorder asks it with the referrer of the site file
   (`geocoderReferrer`). Coordinates typed into the search need no geocoder at all.
2. **The test stack's API has weather downloads off.** A design at a new place asks `/api/weather` for its PVGIS TMY and
   is refused, so the recorder answers that request itself with the site's weather file, fetched once through the API's
   own service with downloads on: `cd apps/api && ROOFTOP_WEATHER_DOWNLOADS=on uv run python
   ../../.claude/skills/product-video/scripts/weather.py <lat> <lon> ../../.claude/skills/product-video/assets/sites/<site>-weather.json`.
   The API checks the weather's place against the roof's, so the file must be the site's own.
3. **Present with the imagery ground is 12 s a frame in software WebGL**; the GPU (a headed browser, `"gpu": true`)
   is 85 ms. The headed browser opens a window on the screen; the script refuses Present's request for the full screen.

## Smaller things the scripts take care of

- The clock is installed after the first page has loaded: installed before, Home's hydration waits on it.
- Home's primary action is a link until something is typed, a button after: the script waits for the link.
- The pointer is a dot drawn into the page (headless shows none), amber while it presses, as the help's clips draw it.
- The Next dev badge (`nextjs-portal`) and Present's hint ("Press any key...") are hidden by a style; the map's tips are
  put away by the device flag the app uses; the browser's full screen is refused.
- The design is named through the project switcher unseen (a design from the map is "Untitled roof").
- Detect building needs its tile: the press is repeated until the callout says "Footprint found".
- Leftover headless browsers slow everything and make pages fail to render in time: on macOS `pkill -f ms-playwright/chromium`,
  on Windows end the Chromium processes under `ms-playwright` (Task Manager, or
  in PowerShell `Get-Process chrome | Where-Object { $_.Path -like '*ms-playwright*' } | Stop-Process`)
  if a run was interrupted.

## Checking a video without playing it

- A contact sheet of a cut: `ffmpeg -i <cut> -vf "fps=1/3,scale=640:-1,tile=4x7" -frames:v 1 sheet.jpg` and look at it.
- A caption over a frame: composite the overlay on a frame with `compose.py`'s `frame_of` (or Pillow) and look at it.
- The speech placed: `ffmpeg -i narration.wav -af silencedetect=n=-40dB:d=0.6 -f null -` lists where speech starts,
  which must match the lines' `at` seconds from `narrate.py <video> check`.
- The GIF's first frame: `ffmpeg -i <gif> -frames:v 1 first.png`.

## Where the deliverables go

The cuts are large and never committed. Copy them where the campaign keeps them on the machine you are on: ask if it is
not said (on the owner's machine the launch's went to a gitignored `output/rooftop-launch-2026-10-10/` folder of the
website's repository, `solarlayout`). A GIF
for an email lives in `apps/solarlayout_web/public/email/` of that repository, which serves it from `solarlayout.app/email/`.
