# The launch video, and how a plan is read

The launch video (`assets/videos/launch`, approved 2026-10-10) is the model for every other video: a real roof designed
from the map to the handover, the product's own screens, short plain captions, a plain narration in full sentences.

## The sequence

| Shot | Segment and frames | Seconds | On screen | Caption |
|---|---|---|---|---|
| Hook | `s9-present` 15 to 235 | 7.3 | The satellite tilting into 3D, the building rising | the brand, "Rooftop PV design, in your browser." |
| Find | `s1-home` 20 to 225 at 1.15× | 5.9 | Home; the coordinates typed; the map at the roof | 01 Paste the coordinates. |
| Outline | `s2-detect` at 1.1× | 7.7 | Detect building; the footprint; Use this outline | 02 One click detects the building. |
| Build | `s3-build` | 2.9 | Build this roof; the Studio opens | 03 The roof rises in 3D, laid out at once. |
| Site | `s4-imagery` at 1.15× | 7.9 | Layers; the imagery under the roof; an orbit | 03, then 04 On the satellite imagery, to scale. |
| Sun | `s5-sun` at 1.1× | 8.8 | The Sun lens; the day played | 05 Shadows at any hour. |
| Strings | `s6-strings` at 0.6× | 8.0 | The Strings lens, the options | 06 Strings sized to your inverter. |
| Performance | `s7-performance` at 0.48× | 10.8 | The Performance page, a slow push-in | 07 8,760 hours, every loss named. |
| Handover | `s8-handover` at 0.5× | 10.4 | The handover files and the report | 08 Report, SLD, BOM, cable schedule, DXF, KMZ. |
| Result | `s9-present` 905 to 1160 | 8.5 | Present's energy counting up over the roof | The result |
| End | the end card, 190 frames | 6.3 | The address, free, no account | |

With the narration the video is 81 s. The shots were slowed (the `speed` below 1) so that every spoken sentence ends
on its own screen: lengthen a screen, never cut the English.

Present's tour, as recorded in `s9-present` from its first frame: the satellite tilting (frames 0 to 120), the building
rising (120 to 240), the modules filling (240 to 420), the day (420 to 780), the strings (780 to 900), the energy (900 to
1200). The hook and the result come from it.

## How a plan is read (`plan.json`)

```json
{ "name": "solarlayout-rooftop-launch",
  "thumb": { "seg": "s9-present", "frame": 410 },
  "shots": [
    { "seg": "s2-detect", "start": 0, "end": 253, "speed": 1.1, "captions": [{ "name": "c2", "in": 16 }], "square": "full", "sq_cx": 960 },
    { "seg": "s7-performance", "start": 0, "end": 156, "speed": 0.48, "captions": [{ "name": "c7", "in": 24 }], "push": 0.04, "square": "full", "sq_cx": 560 },
    { "card": "end", "hold": 190 } ] }
```

- A shot is a segment's frames from `start` to `end`, at `speed`: 1 is the recorded pace, 2 skips every other frame, 0.5
  shows each frame twice (slower). Frames of the shot count at the output's pace.
- `captions`: the overlays shown, by name, from frame `in` to `out` of the shot (to its end without `out`), fading over 10
  frames; `"fade": 1` shows one whole from its first frame (a GIF's first frame). A caption may carry across shots that
  show the same view (c3 ends inside the imagery shot).
- `push`: a slow push-in, the zoom at the shot's end (0.04 is 4 %), for a still screen.
- `square`: on the 1:1 cut, `full` keeps a 1080-wide window of the screen centred at `sq_cx` (in 1920 coordinates: 960 is
  the middle), chosen per shot so that the roof, the map or the number is in it; `box` letterboxes the whole frame.
- A `card` is an overlay held for `hold` frames (the end card).
- `thumb`: the recorded frame the thumbnails are made over (the modules filling in Present, for the launch), with the words
  of `captions.json`'s `thumb`. Every video has one per cut; `overlays.cjs` renders them with the captions and `compose.py`
  writes them beside the cuts.
- Shots are joined by a 12-frame crossfade; the video fades in from black and out to black.

## The cuts

- Wide, 1920×1080: the one for LinkedIn on desktop, YouTube, embeds.
- Square, 1080×1080, full bleed: the one for the mobile feed. Its captions are cards placed per shot (`sqPlace`).
- The GIF plans (`plan-gif-640.json`, `plan-gif-800.json`): a 10 s loop for an email, 640 wide at 2.2 MB or 800 wide at
  3.7 MB; the first frame stands alone with the hook caption, because Outlook shows only the first frame.

## The captions (`captions.json`)

Short, plain, direct: a caption is read at a glance over a moving screen. The owner tried a set of full sentences on
2026-10-10 and rejected it; the narration is the place for full sentences. A caption is a card placed where the screen is
empty (`place` on the wide cut, `sqPlace` on the square: `bl`, `bc`, `tl`, `tr`, `tl-find`, `br`), or, without a place,
the words at the bottom left over a fade (the hook, the result). Where a card goes depends on the screen under it: the
Studio's top right is empty black above the roof, Home's bottom left is empty under the rows, Performance and Handover
take the bottom left over their lower rows. Check with a frame and the overlay composited (compose.py's `frame_of`).

## The narration (`narration.json`)

Ten lines, each tied to a shot by index with an offset in seconds; `narrate.py check` places them on the plan's timeline
and says whether each ends before the next begins and on its own screen. The approved voice settings: stability 0.75,
style 0, speed 1. Numbers are written in words ("one thousand one hundred and fifty-five megawatt hours") or the voice
reads digits apart. A line that must run into the next shot (the build line runs into the imagery shot, the same view)
is marked `"continues": true`.
