# Scripting a recording

A video's recording is `assets/videos/<video>/record.json`: the site it designs, how the browser runs, where the first
page is, and the segments of acts the hand does. `scripts/record.cjs <video>` plays it in the app on the test stack and
writes a JPEG per frame into `.product-video/<video>/frames/<segment>/`, 30 frames a second, 1920×1080 at twice the
pixels. The segments are then cut by `plan.json` (see `storyboard-launch.md` for how a plan is read).

```json
{
  "site": "hadapsar",
  "gpu": true,
  "start": { "path": "/", "waitFor": { "role": "link", "name": "Find my roof" } },
  "segments": [ { "name": "s1-home", "acts": [ ... ] } ]
}
```

- `site`: a file of `assets/sites/`: the words typed into the search (`place`), the design's `name`, where the building
  is clicked (`click`, CSS pixels of the 1920×1080 window at the roof zoom), its PVGIS `weather` file (made by
  `scripts/weather.py`), the page's `clock` while recording, and the `geocoderReferrer`. In the acts, `{place}`, `{name}`,
  `{click.x}` and `{click.y}` stand for the site's values.
- `gpu`: true (the default) opens a headed browser and renders on the GPU, about 85 ms a frame; a window shows on the
  screen for the length of the recording and must be left alone. False uses software WebGL as the browser tests do: the
  same picture on any machine, 0.4 s a frame, and 12 s a frame once the imagery is the ground of the 3D view, so only for a
  video that never shows the imagery in 3D.
- `start`: the page loaded before the clock is installed, and what to wait for on it. The clock is installed after this
  page because Home's hydration waits on timers the fake clock would hold.

## The clock

Every frame is one tick of the page's clock (Playwright's `clock`), 33.3 ms: every animation of the app, the map's
flight, the Studio's reveal, Present's tour, runs at exactly that pace whatever the machine does, and a screenshot is
taken after each tick. Network answers (tiles, the API) still arrive in real time between ticks, which is why a wait on
something that comes from the network is written as an `until` act (it ticks until the thing is there) rather than a rest.

## The acts

Each act is an object with `"act"` and its fields. Frames are at 30 a second.

| Act | Fields | What |
|---|---|---|
| `rest` | `frames` | Nothing moves for so many frames |
| `glide` | `x`, `y`, `frames` (24) | The pointer glides there, eased |
| `click` | a target, `frames` (24), `settle` (6) | Glides to the target, settles, presses 4 frames, lets go |
| `type` | `text`, `framesPerChar` (2) | Types into what has the focus, a frame or two a character |
| `key` | `key`, `frames` (2) | A key pressed (`Escape`, `Enter`) |
| `fill` | a target, `text`, `then` (`Enter`), `frames` (4) | A field filled at once (not typed) and committed |
| `drag` | `dx`, `dy`, `frames` (60), `settle` (2) | Presses where the pointer is and drags by so many pixels (on the stage: an orbit) |
| `until` | `url` · or a target + `attr` + `equals` · or `includes` with a target or `in` (a CSS selector, `main`), `max` (300) | Ticks until the condition holds; fails after `max` frames |
| `press-until` | `testid`, `includes`, `tries` (40), `frames` (10) | Presses where the pointer is, again and again, until the element says the words (Detect building waits for its tile) |
| `pointer-away` | | The pointer leaves the screen (Present) |
| `rename` | `name`, `from` (`/Untitled roof/`) | The design named through the project switcher |
| `unseen` | `acts` | The acts inside run with no frame taken (the clock still runs) |

A target is `testid` (a `data-testid`), or `role` with `name` and `exact`; a name written `/.../` is a regular
expression. Targets are the app's accessible names, the ones the browser tests use: `Detect building`, `Use this outline`,
`Build this roof`, `Layers`, `Satellite imagery` (a switch), the lenses `Roof` `Array` `Sun` `Strings` (links), the
workspaces `Performance` `Handover` (links), `Present` (a link), `Play the day` / `Pause` (buttons).

## Recording a part again

`node record.cjs launch s5-sun s6-strings` runs the whole script but takes frames only in the segments named: the
design is made the same way, the other segments pass unseen. A segment cannot be recorded alone because the segments
follow one design in one browser.

## Writing a new script

Start the browser where the feature is. A feature of the Studio needs a design: either copy the first three segments of
the launch script into one `unseen` act (the roof found, detected and built, named), or start on `/studio/roof`, which
opens the demo (`"start": { "path": "/studio/roof", "waitFor": { "role": "link", "name": "Sun" } }`), and record from
there. Keep each segment one thing (one lens, one action), so that the plan can cut and time them apart. Look at the
frames before composing: `.product-video/<video>/frames/<segment>/00060.jpg` and a few others, with the Read tool.
