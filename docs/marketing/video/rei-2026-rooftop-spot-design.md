# REI 2026 booth spot — SolarLayout Rooftop — design

**Status:** approved in conversation by Bhushan, 2026-10-23; this document is the written form. Gate 1 (style frames) and
gate 2 (the 1080p preview and one loop cycle) approved 2026-10-23. §3, §4a and §8 carry the values as built.
**Plays:** third in the booth loop, after the SolarLayout Desktop spot and the BESS Desktop spot
(`PVlayout_Advance/docs/marketing/video/rei-2026-booth-spot-design.md` and `rei-2026-bess-spot-design.md`).
**Made by:** Claude Code on the owner's Mac, from this document. The work lives outside this repo and reads it by path.
**Sources of the other two spots:** not on this Mac (they were built on the Windows laptop). The only source is the
assembled 4K loop `~/Downloads/booth_loop_30min_4k_hevc_solarlayout_bess_v1.mp4`: positions and sizes are measured from
its frames, and the two spots are cut from it (owner's decision, 2026-10-23).
**Timing:** no deadline (the owner's instruction). Gates: the 1080p preview is approved before the 4K master and the loop
are made.

---

## 1. Intent

| | |
|---|---|
| **What** | One 48-second spot for SolarLayout Rooftop (the browser app at rooftop.solarlayout.app), the third member of the booth loop |
| **Who watches** | C&I rooftop EPCs and installers, their design engineers, and the sales engineer who has to give a customer a number the same day. A glance lasts 3–8 s; an interested visitor stays 1–3 loops |
| **Job** | Show that one roof outline of any shape, with whatever stands on it, becomes the whole design: the layout, the shade, the strings, a year of energy and the handover documents. Send the visitor to the app |
| **Message** | **Any roof. The highest-energy design, its yield and its materials follow.** |
| **Division of labour** | SolarLayout Desktop's spot owns space on the ground (land to construction). BESS's spot owns time and money. This spot owns **the roof**: any outline, any obstacle, the design that follows |
| **Success** | A visitor who looks at any 5-second window knows the product is SolarLayout Rooftop, which step that moment is about, and what to do next (scan, or ask for a demo). Every number on screen comes from the app and survives a domain expert's question |

**Said by the owner:** under 45–50 s; consistent with the two existing spots' frames so the loop reads as one set; the
audience above; the one line above, with "optimal" carried as the fact that the app recommends the highest-energy option;
the rail is the app's five steps; a new demo roof built for the spot, with horizontal irregularity, vertical irregularity
and vertical objects; do not take the launch video (`solarlayout-rooftop-launch-1920x1080-voice.mp4`) as a reference.

## 2. Truth rules (non-negotiable)

1. **Every shape and every number on screen comes out of SolarLayout Rooftop**, from one run of the real app on the demo
   roof. Nothing is drawn or typed by hand to look like product output.
2. **The roof pictures are the app's own 3D stage**, captured from the real app in a real browser (Playwright, Chromium,
   headed, so the satellite ground renders). The handover pages are the app's own exports: the report PDF's pages and the
   SLD PNG. No mock-ups.
3. **The only designed parts** are typography, colour, motion, framing and sound.
4. **No claims without evidence.** No time-saved percentages, no "fastest", no "No. 1", no "bankable" (never, anywhere:
   CLAUDE.md rule 5), no customer names or logos, no "optimal" or "best" as a bare adjective. "Highest energy" is said only
   where the app's recommendation is on screen with its rule (DC/AC 1.10–1.30).
5. The roof is labelled **"Demo roof · Pune"** in every frame before the end card. It is never presented as a customer
   project.
6. **Not on screen:** "KMZ" and "DXF" as words in a headline (they appear only as chips on the handover pages, as the
   app names them); any UI chrome of the app (the top bar, the work column, the sheet); a red cross anywhere.
7. Brand voice: industry terms and numbers, no idioms, no humour, no decorative adjectives.

## 3. The demo roof

Built for this spot. It earns the first two words of the message.

- **Place (as built):** open ground beside the sheds of Bhosari MIDC's T-block, Pimpri-Chinchwad, Pune, **18.6400° N,
  73.8420° E**, on real satellite imagery; the app's bundled Pune weather (`pune_weather.json`) so the run is offline and
  repeatable. Esri serves no zoom-19 imagery over Chakan, Talegaon or Ranjangaon (404), and the app draws the ground at
  zoom 19; a first Bhosari point (18.6298, 73.8475) sat on dense housing and was dropped.
- **Outline (horizontal irregularity):** an L-shaped flat roof of **2,880 m²**: the long leg 80 × 24 m along x (east) and
  the short leg 30 × 32 m rising north at its east end. Vertices in local metres: (0, 0), (80, 0), (80, 56), (50, 56),
  (50, 24), (0, 24). Built as the app's Project document and run through the app's own API (the same path the Find
  screen's Build takes).
- **Vertical irregularity:** a taller two-storey wing in the notch, 21 × 14 m, 1 m clear of the short leg, modelled as a
  **building** obstacle 6 m above the roof (the engine's roof is one level; what rises above it is a shading solid, which is what the
  app would do for a visitor).
- **Vertical objects on the roof:** a stair room (box, 5 × 4 m, 3 m), a water tank (cylinder, ⌀ 2.5 m, 2 m), an exhaust
  stack (cylinder, ⌀ 0.8 m, 4 m), a row of four AC units (boxes, 1.5 × 1 m, 1.2 m). Beside the roof: a tree (crown
  ⌀ 8 m, 9 m high, trunk 3 m) over the south-west corner, and a taller neighbouring building (building obstacle, 9 m)
  across the lane to the east.
- **Roof settings:** flat with tilted rows; parapet 0.9 m; setback 1.0 m; walkways on; obstacle clearance 0.5 m; the rest
  the app's defaults.
- **Equipment:** the bundled module (`waaree-bin-08-580.PAN`) and **the app's inverter for the roof** (`inverter_by: "app"`,
  D118, as a new design in the app has it): the bundled 275 kW inverter cannot be filled by a roof of this size (DC/AC
  0.79, every option "Below target"); the app picks Waaree 3P-80K × 2. System voltage 1000 V (the app's value for India,
  D87; the spot does not show the voltage).
- **The run (2026-10-23):** 357 modules, 207.06 kWp, 333.7 MWh/yr (P50; P90 315.6), 1,612 kWh/kWp, PR 80.7 %, near
  shading 2.7 %, 8 rows; five options, A recommended (17 in series × 21 strings, 2 inverters, DC/AC 1.29), B and C
  "Less clipping", D and E above the target. The project is `project.json` in the work folder; the captures put it on
  the device as the app keeps a design (IndexedDB) and open it in the real app.

If the layout, with these obstacles, leaves a design the owner would not show (for instance a tiny array, or a strings
result that does not fit), the builder adjusts the roof's dimensions within the shape above, records the change, and
does not touch the engine or the app.

## 4. The spot (48 s, 30 fps, one continuous roof)

**The visual idea: one roof, no cuts.** The 3D roof stays on screen for the whole spot, seen from the app's Present
camera. Layers build on it step by step. The handover pages slide out of the roof rather than replacing it.

**The picture is the app's own Present tour** (`apps/web/lib/present/tour.ts`: The place 4 s, The roof 4 s, The array
6 s, The sun 12 s, The strings 4 s, The energy 10 s; 40 s in all), captured frame by frame at 4K with its panels, words,
controls and fade hidden, and re-timed to the beats below: a scene shorter than its beat holds on its last frame; the
sun scene plays at 1.5× its speed. Nothing in the picture is drawn by hand; the outline, the obstacles rising, the rows
filling, the shadows and the string colours are the app's. Only the type, the rail, the loss chain (drawn from the
run's own `steps`), the options table (the app's cards, captured) and the handover pages are composed over it.

**The stage rail** runs along the top for the whole spot: **Roof → Array → Strings → Performance → Handover**, the current
step lit in accent, in the same type, size and position as the other two spots' rails. **The booth strip** runs along the
bottom: the accent disc, the wordmark, then "SolarLayout Rooftop · Rooftop PV design in the browser". The QR card sits in
the bottom-right corner, "Free to try" under it. The label "Demo roof · Pune" sits under the rail at the left, in the
place and size the BESS spot uses for "Demo case · 100 MW FDRE · illustrative inputs".

Each `[value]` is read from `facts.json` (§6). Captions are the exact on-screen text.

| Time | Rail | Picture | Caption (headline) | Role tag | Numbers shown |
|---|---|---|---|---|---|
| 0.0–6.0 | none lit | The tour's first two scenes: the roof from above on the satellite ground, the camera tilting into 3D; then the roof rising with the wing, the stair room, the tank, the stack, the AC units, the tree and the neighbour | **One roof, outlined.** | — | [area m²] |
| 6.0–15.0 | Roof, then Array | The tour's array scene: the rows fill the roof around the kept-clear zones; it holds on the full array while the counters tick up | **Modules laid out around what stands on it.** | Rooftop EPCs & installers | [modules] · [kWp DC] |
| 15.0–23.0 | Array (Sun view) | The tour's sun scene from sunrise to sunset with the sun path drawn, played at 1.5× its speed so its 12 s fit the beat: the shadows of the wing, the tank and the tree move across the rows | **Shadows, hour by hour.** | Design engineers | the shade-free window [hh:mm–hh:mm] · [shading loss %] |
| 23.0–31.0 | Strings | The tour's strings scene (modules coloured by MPPT), held; the app's option cards captured and stacked as the app lists them (the Strings step shows the three inside the target: A Recommended, B and C Less clipping), the recommended one lit in accent, the rule under them | **Strings sized to your inverter.** | Design engineers | [inverters] · [modules in series] · [DC/AC] · tag: the app's own label, *Recommended*, and beside it in the spot's type the app's rule, *highest energy within DC/AC 1.10–1.30* |
| 31.0–39.0 | Performance | Three figures count up with tabular figures; the loss chain draws from irradiance to the AC output, gains in blue, losses in orange (the app's data colours) | **A year of energy, every loss named.** | Sales engineers | [MWh/yr] · [kWh/kWp] · [PR] |
| 39.0–43.0 | Handover | The real pages fan out of the roof: the report's first page, the SLD (the app's PNG), and the report's BOM page and cable-schedule page (the zip's BOM and schedule are CSV, so the report's pages, which carry the same rows, are the pictures). Chips: PDF · DXF · KMZ · CSV as the app names them | **Report, SLD, BOM, cable schedule.** | Everyone on the job | [BOM lines] |
| 43.0–48.0 | all lit | End card over the dimmed roof: the accent disc and wordmark, "SolarLayout Rooftop", **Any roof. The highest-energy design, its yield and its materials follow.**, "For rooftop EPCs and installers", the large QR, "Free to try · rooftop.solarlayout.app · Phone, tablet or computer". The last 1.5 s fades to the dim ground of frame 0 | the message | — | — |

**The recommendation on screen (the builder's call, settled here):** the Strings beat shows the app's own options table
with the app's own labels (Recommended, Less clipping, Least clipping, Below target, as the Strings step names them). The
recommended row is lit. The rule the engine applies (`options.py`: the first option that fits, sorted by energy, inside
`DCAC_TARGET` 1.10–1.30) is written beside it in the spot's own type: *Recommended · highest energy within DC/AC 1.10–1.30*.
The app's words are never altered; the rule is the spot's caption of them.

**Loop seam:** see §4a. The spot begins as the Rooftop title card fades out over it (0.3 s) and ends as its end card
fades into the SolarLayout title card (0.5 s). The satellite ground fades in over the first 1.0 s of the spot.

## 4a. The title card (found in the loop, 2026-10-23)

The assembled 4K loop differs from the two sibling documents in one way: **each spot is preceded by a solid orange title
card**, and the joins are fades through that card, not dissolves between empty grounds. Measured from the loop
(`booth_loop_30min_4k_hevc_solarlayout_bess_v1.mp4`, 3840 × 2160):

- The card fades in from the previous spot's end card over 0.50 s (15 frames), holds about 2.1 s, fades out to the
  spot's first frame over 0.30 s (9 frames). The first card of the file starts fully on (no fade-in).
- Background `#d06e2e`. Dark text `#1b1a19`, white `#fdfdfd`. Left edge of the text at x 240.
- Lines, top to bottom (y ranges of the glyphs): the white disc and the wordmark "SolarLayout" 500–622 (with its descender); the product
  name in Inter 700 683–1001 (cap height about 230 px); the tagline in Inter 600, dark, 1117–1240; the white line in
  Inter 700, 1316–1414; the QR panel (white, rounded) x 3208–3647, y 1442–2051 with "Free to download" under the code.
- The music bed runs through the card without a gap, at the loop's loudness (integrated −19.9 LUFS over the first
  two cycles; the first 0.35 s of the file are silent).

**The Rooftop card:** the same geometry and colours, with: the disc and wordmark; **SolarLayout Rooftop**; the tagline
*Rooftop PV design in the browser*; the white line *Free · Any device · Scan to try*; the QR panel with the rooftop
address and *Free to try* under it. One cycle of the new loop is then SolarLayout card + spot, BESS card + spot,
Rooftop card + spot. The spot's §4 end card fades to the SolarLayout card, so §4's "fades to the dim ground" is replaced
by this: the last 0.5 s of the Rooftop item is the fade from its end card into the SolarLayout card.

**Measured positions of the shared parts** (for the overlay, since the sources are not on this Mac; from the frame at
22.0 s of the loop): ground `#161618` as decoded (the design's `#17171a`); strip panel `#1e1e20` (translucent), x 192–3159,
y 1902–2051; accent as decoded `#de8448`; text `#e9ebe8`; unlit rail labels `#68686d`. Rail glyphs y 132–187, first
square at x 222, last label ends by x 3647. Role tag y 314–375, x from 198. Headline cap top y 426, two lines to 691,
x from 202. The big number y 895–1042, x from 204. The QR panel x 3208–3647, y 1442–2051. End card: wordmark y 358–470;
headline lines 580–741 and 757–920; the orange tag line 1020–1113; the white line under it 1300–1373; the footer line
1951–2018; its QR panel
x 2788–3647, y 520–1579. The builder renders the rooftop frames with the same values and checks them against these
frames by overlaying at 50 % opacity.

## 5. Look and legibility (43" TV, viewed from 1.5–4 m)

The look is the two existing spots' look. Nothing here is new; it is written down so the builder does not have to find
it in the other documents.

**Canvas:** 3840 × 2160 master, 30 fps.

**Palette** (the booth spots' palette, not the app's tokens; the app's own colours stay inside the captured 3D stage and
the exported pages):

| Role | Hex |
|---|---|
| Ground | `#17171a` (decodes from the loop as `#161618`) |
| Panel / card | `#1f1f22` |
| Text primary / secondary | `#ececea` / `#a6a6a2` |
| Accent (rail lit state, highlights, counters, the recommended option, the outline as it draws) | `#e0864a` |
| Rail unlit | `#a6a6a2` with a hollow square; lit: accent with a filled square |
| Data gain / loss (the loss chain) | the app's `#3987E5` / `#D95926` |

**Type:** Inter for words (600–700 for headlines), Geist Mono for numbers (tabular). Installed locally; never a network
font at render time.

**Sizes at 4K** (the same as the other two spots):

| Element | Size |
|---|---|
| Headline | 150 px, max 7 words per line, max 2 lines |
| Numbers | 200–240 px |
| Role tag | 64 px, accent |
| Rail labels | 56 px |
| Demo label | 56 px, secondary |
| Booth strip | 150 px tall |
| Persistent QR (corner card) | 380 px; the card 440 px with a quiet zone, the strip stops short of it |
| End-card QR | 800 px |

**Rules:**
- Every caption is held at least 3 s.
- Text and the QR codes stay inside a 5 % title-safe margin.
- No flashes, no strobing; motion is ease-out (cubic), 400–900 ms per move; the rows fill in a 3–4 s wave; counters roll
  with tabular figures. Something moves in every second of the spot.
- **The 3D stage** fills the right two thirds of the frame, under the type, as the plant does in the SolarLayout spot. It
  is captured without the app's chrome (the Present view, controls hidden), at a device scale that gives a sharp 4K
  frame. The stage's own satellite ground is dimmed under the type by a gradient in the overlay, never by changing the
  app. The satellite imagery is shown (owner's decision); the imagery's attribution line is kept, small, at the stage's
  foot in the spot's secondary type, since the owner is fine either way and keeping it costs nothing.
- **App UI** (the options table, the timeline) is shown only where this document names it, zoomed until legible on the
  TV, for 3 s or more.

**Logo:** the accent disc and the wordmark "SolarLayout" as the other spots draw them, followed by "Rooftop" in the
product's position.

## 6. Facts: one file, generated, then locked

`facts.json` is written from the run (§7 step 2) and is the only source of every on-screen number. It holds:
- the demo roof: coordinates, the outline's vertices, area in m², every obstacle with its kind and size, the settings;
- the array: module count, kWp DC, rows, the kept-clear zones' reasons;
- the sun: the design day, the shade-free window, the year's shading loss as the app reports it;
- strings: the options as the app lists them, the recommended one, its caption and whether it has the most energy inside the target, inverter count, modules in
  series, strings per MPPT, DC/AC;
- performance: year-1 energy (Likely, and Conservative for the record), specific yield, PR, the loss chain's steps with
  the app's names and values;
- handover: the BOM's line count and the chips shown.

Each value records where it came from (the API response field or the exported file it was read from).

**Rounding rule:** round for display only, and show the rounded value the way the app shows it.

Captions are templates filled from `facts.json`; no number is typed into the scene. A check script compares every number
rendered in the captions with `facts.json` and fails the build on any mismatch.

## 7. Production pipeline (the owner's Mac)

The work lives **outside the product repo**, in `~/work/solarlayout/media/rei-2026-rooftop-video/`, and reads the repo by
path. Nothing is committed to the product repo except this document.

1. **Set up.** The repo is on `main`; `bun install`, `uv sync` in `apps/api`. The stack for the captures is `bun start`
   on the dev ports (web 4700), because the Esri imagery key accepts only `localhost:4700` as a referrer (the owner's
   decision, 2026-10-23: he runs no `bun dev` during this work, and anything found on those ports may be stopped). ffmpeg (a static build is fine), Playwright with
   Chromium, the Inter and Geist Mono font files, a QR library, PyMuPDF for the PDF pages.
2. **The real run.** Through the app in a real browser, driven by Playwright the way the e2e suites drive it: Find and
   outline (the coordinates, the outline, the obstacles, the roof type), Array, Strings (pick the app's recommended
   option), Performance, Handover (download the zip). Save the project file. From the API's responses for this project,
   write `facts.json`. The app's own exported pages come from the zip.
3. **Product renders.** The 3D stage, captured frame by frame from the Present view at the camera positions the beats
   need, with the time control stepped for the Sun beat. The handover PDFs rendered to PNG with PyMuPDF. The options
   table and the timeline captured zoomed.
4. **Style frames — approval gate 1.** One 4K still per beat (6 frames) plus the end card, shown beside one frame of each
   of the other two spots so the owner can judge consistency. Stop until the owner approves the look.
5. **Animation.** An HTML scene: the captured stage frames as the picture, canvas 2D for the outline, the fills and the
   loss chain, HTML and CSS for type. Driven by one deterministic `render(t)`: no wall-clock CSS transitions, no
   `requestAnimationFrame` timing. Playwright steps `t` frame by frame at 3840 × 2160 and saves PNG frames.
6. **Audio.** The music bed is lifted from the existing loop (the audio of one BESS cycle, where no join falls), trimmed
   to 48 s with a 1 s fade at each end, at the same loudness as the loop (about −20 LUFS). No voice.
7. **Preview — approval gate 2.** A 1080p preview of the spot, and a 1080p preview of one full loop cycle
   (SolarLayout → BESS → Rooftop) so the joins can be judged. The owner approves, or lists changes.
8. **Final encode, the loop and checks** (§8 and §9).

## 8. The combined loop

**The join:** every join is a fade through a title card (§4a). The loop is cut into *items*, each one card + one spot,
with the cut points inside a card's solid hold, so that a cut is between two identical orange frames:
- **SolarLayout item** = the loop from 1.05 s (inside the SolarLayout card's hold) to 58.5 s (inside the BESS card's
  hold). It carries the SolarLayout spot and the fade into the BESS card.
- **BESS item** = the loop from 58.5 s to 105.0 s (the last frame of the BESS end card, before the next card fades in).
- **Rooftop item** = rendered: the fade from the BESS end card's last frame (the loop's frame at 105.0 s) into the
  Rooftop card (0.5 s) + the hold (2.1 s) + the fade out (0.3 s) + the spot (48 s) + the fade from the spot's end card
  into the SolarLayout card (0.5 s, the card taken from the loop's frame at 1.0 s) + the SolarLayout card's hold up to
  its midpoint (1.05 s).
Cut frames found from the per-frame luma of the loop (`measured/cuts.json`): the SolarLayout card holds frames 0–76,
the BESS card fades in at frame 1710 (57.00 s) and holds 1725–1786, the second SolarLayout card fades in at frame 3150
(105.00 s). SolarLayout item 1.267–58.500 s (57.23 s); BESS item 58.500–104.967 s (46.47 s); Rooftop item 1573 frames
(52.43 s). One cycle 156.13 s; twelve cycles 1873.6 s (31.2 min). The two existing items are decoded once from the HEVC loop and re-encoded with the final loop; their original
masters are not on this Mac.

**Order:** SolarLayout, BESS, Rooftop, SolarLayout, BESS, Rooftop, and so on, starting with SolarLayout. One cycle is
about 156 s; the loop runs to at least 30 minutes and ends on a whole cycle (12 cycles, about 31.2 min).

**Audio:** the bed of the existing items is kept as it is in the loop. The Rooftop item's bed is the loop's own bed,
taken from a stretch of equal length and cross-faded 0.5 s at each join with the neighbours' audio, so the bed never
clicks. Loudness of the Rooftop item matches the loop's (−20 LUFS ±1).

## 9. Deliverables

| File | Spec | Use |
|---|---|---|
| `rooftop_booth_spot_4k.mp4` | 3840×2160, 30 fps, H.264 High, yuv420p, ~35 Mbps, music bed | Master |
| `rooftop_booth_spot_1080p_preview.mp4` | 1920×1080, H.264 | Gate 2 |
| `booth_loop_30min_4k_hevc_solarlayout_bess_rooftop_v1.mp4` | 3840×2160 HEVC, ~15 Mbps, `+faststart`, AAC stereo 192 kb/s 48 kHz, the same stream layout as the existing loop | **The owner's ask: the 4K loop with Rooftop as the third item** |
| `booth_loop_30min_1080p_solarlayout_bess_rooftop_v1.mp4` | 1920×1080 H.264, ~10 Mbps, `+faststart`, under 4 GB | The stick's fallback, as the existing loops have |
| `stills/*.png` | The six beat frames and the end card at 4K | Social posts |
| `facts.json`, `facts-check.txt`, `contact-sheet.png`, `demo-roof-rei.rtd` | The numbers, the check, one frame every 2 s, the project | Review and evidence |

## 10. Acceptance checks

- [ ] The facts check passes: every on-screen number equals `facts.json`.
- [ ] The contact sheet, reviewed at 1080p downscale: no text under the minimum sizes, all text inside the 5 % safe margin.
- [ ] Side by side with one frame of each other spot: the rail, the strip, the QR card, the headline and the numbers sit
      in the same places at the same sizes.
- [ ] The joins: at BESS → Rooftop and Rooftop → SolarLayout the fade through the card matches the loop's own joins
      (15 frames in, 9 frames out); the Rooftop card overlaid on the BESS card at 50 % lines up; no click in the audio.
- [ ] The QR codes decode to `https://rooftop.solarlayout.app` (checked by decoding the rendered frame, not the source
      image), and that address answers.
- [ ] "Bankable" appears nowhere. "Demo roof · Pune" is in every frame before the end card. No red cross.
- [ ] Duration 48.0 s ±0.1 s for the spot; the loop plays in VLC and in QuickTime from start to end; its streams match
      the existing loop's (HEVC hvc1, yuv420p, 30 fps; AAC LC stereo 48 kHz).

## 11. Out of scope

- An online cut with voice-over (a separate piece of work if wanted).
- Sloped roofs and east-west roofs in the picture (one roof type per spot; the message's "any roof" is earned by the
  outline and the obstacles).
- Other aspect ratios. Hindi.
- Any change to the app.
