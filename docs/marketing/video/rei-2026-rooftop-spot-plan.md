# REI 2026 Rooftop Booth Spot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 48 s 4K spot for SolarLayout Rooftop in the booth loop's style, with its title card, and the 30-minute 4K HEVC loop with it as the third item after SolarLayout and BESS.

**Architecture:** A Python (uv) pipeline in a folder outside the repo. It (1) measures the existing loop and cuts the two existing items out of it; (2) builds the demo roof as a Project, runs it through the app's own API and writes `facts.json`; (3) captures the app's Present tour, option cards and handover pages at 4K with Playwright; (4) renders the type, rail, strip, QR and title card as an HTML scene driven by one `render(t)` and steps it frame by frame; (5) encodes the spot, assembles the loop with ffmpeg and runs the acceptance checks.

**Tech Stack:** Python 3.12 via uv (`playwright`, `pillow`, `numpy`, `pymupdf`, `qrcode`, `opencv-python-headless`, `httpx`, `pytest`); Chromium via Playwright; a static ffmpeg (`imageio-ffmpeg`'s binary); the app on `bun start` (web 4700, API 4701).

**Spec:** `docs/marketing/video/rei-2026-rooftop-spot-design.md` (this repo). Read §2 (truth rules), §4, §4a and §8 before any task.

## Global Constraints

- Work folder `~/work/solarlayout/media/rei-2026-rooftop-video/` (`WORK` below). Nothing from it is committed to the product repo except the two documents in `docs/marketing/video/`.
- The app runs as `bun start` (web **4700**, API **4701**); the Esri key accepts only `localhost:4700`. Never `bun dev`. If something holds 4700/4701, `bun stop --all` first (owner's permission, 2026-10-23).
- Canvas 3840 × 2160, 30 fps. Spot 1440 frames (48.0 s). Fades: card in 15 frames, card hold 63 frames, card out 9 frames, end card to next card 15 frames.
- Colours (render values): ground `#17171a`, panel `#1f1f22`, text `#ececea` / `#a6a6a2`, accent `#e0864a`, card `#d06e2e`, card dark text `#1b1a19`, card white `#fdfdfd`, data gain `#3987E5`, data loss `#D95926`. Fonts: Inter (words), Geist Mono (numbers), local files only.
- Copy, verbatim: strip `SolarLayout Rooftop · Rooftop PV design in the browser`; demo label `Demo roof · Pune`; QR card `Free to try`; end card line `Any roof. The highest-energy design, its yield and its materials follow.`, tag `For rooftop EPCs and installers`, footer `Free to try · rooftop.solarlayout.app · Phone, tablet or computer`; title card `SolarLayout Rooftop` / `Rooftop PV design in the browser` / `Free · Any device · Scan to try` / `Free to try`. QR target `https://rooftop.solarlayout.app`.
- Never on screen: "bankable", "optimal", "best", a red cross, app chrome. Every number comes from `facts.json`.
- Loop order SolarLayout, BESS, Rooftop × 12; HEVC `hvc1` yuv420p ~15 Mbps `+faststart`; AAC LC stereo 48 kHz 192 kb/s.
- Two approval gates: style frames (Task 6) and the 1080p preview (Task 9). Nothing after a gate runs before the owner says so.

## Review Focus

1. A run whose recommended option is not the highest-energy one (the engine recommends the first *ok* option sorted by energy; an option can be ok and still not the top energy if the top one fails) — the Strings tag must say what the app says. Test in Task 3.
2. A luma series with a single card (the file's first card has no fade-in) — the cut finder must still return a hold. Test in Task 1.
3. A caption whose number is rounded differently from the app (e.g. `586.4` vs `586.40`) — the facts check must fail it. Test in Task 7.
4. A Present capture that fell back to the plain grid (imagery blocked) — the capture must stop, not produce 1200 grey frames. Test in Task 4.
5. An audio join that clicks because the bed is cut mid-wave — the loop checker must measure the sample step at every join. Test in Task 10.

---

### Task 1: Workspace, toolchain and the loop's cut points

**Files:**
- Create: `WORK/pyproject.toml`, `WORK/rei/__init__.py`, `WORK/rei/ff.py`, `WORK/rei/loopcuts.py`, `WORK/tools/measure_loop.py`
- Test: `WORK/tests/test_loopcuts.py`

**Interfaces:**
- Produces: `ff.FFMPEG: str` (path of the static binary, from `imageio_ffmpeg.get_ffmpeg_exe()`); `ff.run(args: list[str]) -> None` (raises on a non-zero exit).
- Produces: `loopcuts.luma_per_frame(video: Path, t0: float, t1: float) -> list[float]` (YAVG of a 16×9 downscale, one value per frame, via `signalstats`).
- Produces: `loopcuts.find_cards(yavg: list[float], lo: float = 115, hi: float = 140) -> list[Card]` where `Card = NamedTuple(first: int, hold_first: int, hold_last: int, last: int)` in frame indices: `first` the first frame brighter than the frame before by > 3, `hold_first..hold_last` the frames inside `[lo, hi]`, `last` the last frame of the fade-out (the last frame above 45 before the series settles).
- Produces: `WORK/measured/cuts.json`: `{"fps": 30, "sl_card": Card, "bess_card": Card, "sl_card_2": Card, "sl_item": [t0, t1], "bess_item": [t0, t1], "bess_last_frame_t": t, "sl_card_frame_t": t}` with `sl_item = [mid of sl_card hold, mid of bess_card hold]`, `bess_item = [mid of bess_card hold, bess_card_2.first - 1 frame]`.

- [ ] **Step 1: Create the project.** `uv init --no-workspace` in `WORK`; `requires-python = ">=3.12"`; dependencies pinned to the current releases of `playwright`, `pillow`, `numpy`, `pymupdf`, `qrcode`, `opencv-python-headless`, `httpx`, `imageio-ffmpeg`; dev `pytest`. `uv sync`, then `uv run playwright install chromium`.
- [ ] **Step 2: Write the failing tests** in `tests/test_loopcuts.py`:

```python
def test_find_cards_two_cards_with_fades():
    y = [22]*30 + list(range(22, 130, 8)) + [128]*63 + [128, 110, 90, 70, 55, 48, 44, 40, 38] + [40]*60 + list(range(40, 130, 6)) + [129]*63 + [100, 60, 40] + [38]*20
    cards = find_cards(y)
    assert len(cards) == 2
    assert cards[0].first == 30 and cards[0].hold_first == 44 and cards[0].hold_last == 106
    assert cards[0].last == 115
def test_find_cards_first_card_without_fade_in():
    y = [128]*63 + [100, 60, 40] + [38]*30
    c = find_cards(y)[0]
    assert c.first == 0 and c.hold_first == 0 and c.hold_last == 62
```
- [ ] **Step 3: Run them to see them fail.** `uv run pytest tests/test_loopcuts.py -v` → FAIL, `ModuleNotFoundError: rei`.
- [ ] **Step 4: Implement `rei/ff.py` and `rei/loopcuts.py`** with the signatures above. `luma_per_frame` parses `metadata=print` output written to a temp file (the pattern `pts_time:` then `lavfi.signalstats.YAVG=`).
- [ ] **Step 5: Run the tests.** `uv run pytest tests/test_loopcuts.py -v` → PASS.
- [ ] **Step 6: Write `tools/measure_loop.py`**: reads `~/Downloads/booth_loop_30min_4k_hevc_solarlayout_bess_v1.mp4` over 0–120 s, calls `find_cards`, writes `measured/cuts.json`, and extracts to `measured/`: `sl_card.png` (frame at the SL card hold mid), `bess_card.png`, `bess_last.png` (frame `bess_item[1]`), `sl_beat_22s.png`, `sl_end_56.9s.png`, `bess_end_104.9s.png` as lossless PNG at 3840 × 2160.
- [ ] **Step 7: Run it and check.** `uv run python tools/measure_loop.py` → prints the cards; expected within ±2 frames of: SL card first 0, hold 0–62; BESS card first 1711 (57.03 s), hold 1725–1788, last 1797; SL card 2 first 3151 (105.03 s). `bess_card.png` mean colour is (208,110,46) ±3.
- [ ] **Step 8: Commit** (`git init` in `WORK`; commit everything but `measured/*.png`, which go in `.gitignore` with `frames/`, `captures/`, `out/`).

### Task 2: Fonts and the reference geometry

**Files:**
- Create: `WORK/fonts/` (Inter 600/700 and Geist Mono 500 as `.ttf`/`.woff2`), `WORK/rei/geometry.py`
- Test: `WORK/tests/test_geometry.py`

**Interfaces:**
- Produces: `geometry.LAYOUT: dict` with the measured boxes from spec §4a (keys `rail_y`, `rail_x0`, `tag_y`, `headline_y`, `headline_x`, `number_y`, `strip_x`, `strip_y`, `qr_card`, `end_qr_card`, `end_wordmark_y`, `end_headline_y`, `end_tag_y`, `end_footer_y`, `card_text_x`, `card_lines_y`, `card_qr`), each a tuple of ints, exactly the values in §4a.
- Produces: `geometry.measure(png: Path) -> dict` returning the same keys as found by pixel analysis of a rendered or reference frame (white ≥ 235 for text and QR panel, accent within 40 of `(222,132,72)`, panel within 4 of `(30,30,32)`).

- [ ] **Step 1: Fetch fonts.** Inter (rsms/inter release, OFL) and Geist Mono (vercel/geist, OFL) into `fonts/`; record their versions in `fonts/README.md`. No network use after this step except the app's own imagery tiles.
- [ ] **Step 2: Write the failing test**:

```python
def test_measure_reference_frame_matches_layout():
    m = measure(Path("measured/sl_beat_22s.png"))
    for key in ("rail_y", "tag_y", "headline_y", "strip_x", "qr_card"):
        assert all(abs(a - b) <= 4 for a, b in zip(m[key], LAYOUT[key])), key
```
- [ ] **Step 3: Run it to see it fail.** `uv run pytest tests/test_geometry.py -v` → FAIL.
- [ ] **Step 4: Implement `rei/geometry.py`.** `measure` repeats the analysis used to produce §4a (bounding boxes of colour masks, bands by row runs).
- [ ] **Step 5: Run the test.** → PASS.
- [ ] **Step 6: Commit.**

### Task 3: The demo roof, the run and `facts.json`

**Files:**
- Create: `WORK/rei/demo_roof.py`, `WORK/rei/run.py`, `WORK/rei/facts.py`, `WORK/tools/run_design.py`
- Test: `WORK/tests/test_demo_roof.py`, `WORK/tests/test_facts.py`

**Interfaces:**
- Consumes: the API's `Project` schema (`apps/api/src/rooftop_api/schemas/project.py`), `POST /api/layout`, `POST /api/design` (SSE: `DesignProgress` | `DesignDone{result}` | `DesignFailed`), `GET /api/demo` for a template document. The roof outline is in local metres about `lat, lon`; obstacles in the stored form (`x, y, length, width, height, diameter, trunk_height, points`).
- Produces: `demo_roof.project(name: str = "Demo roof · Pune") -> dict` — a `Project` document: `format 2`, `place_name "Pune"`, `roof.source "map"`, `roof_type "flat_tilted"`, `parapet_h 0.9`, `setback_m 1.0`, `obstacle_clearance_m 0.5`, the L outline (long leg 80 × 24 m along x, short leg 30 × 32 m at its east end going north; vertices clockwise from the origin), the obstacles of spec §3 with the wing as `kind "building"` 6 m high along the notch's inner edge, the tree outside the outline at the south-west corner, the neighbour a `building` 9 m high east of the roof; `system_voltage 1000`, `system_voltage_by "app"`; the bundled PAN/OND names copied from the demo document; `weather_json` copied from the demo document; `lat, lon` of a Chakan industrial plot the implementer picks on the satellite view (recorded in the doc string).
- Produces: `run.design(project: dict, api: str = "http://127.0.0.1:4701") -> dict` (the `DesignResult` from the SSE stream; raises on `DesignFailed`) and `run.layout(project, api) -> dict`.
- Produces: `facts.build(project: dict, result: dict) -> dict` and `facts.json` written by `tools/run_design.py` at `WORK/facts.json`, with these keys, each value a `{"value": ..., "shown": "<as the app shows it>", "from": "<result path>"}`: `site.lat`, `site.lon`, `site.area_m2`, `site.outline`, `site.obstacles`, `array.modules`, `array.dc_kwp`, `array.rows`, `sun.design_day`, `sun.window` ("09:00–16:00" from `array.window_start_h/_end_h`), `sun.near_pct`, `strings.options` (the list as the app shows: letter, title, caption, n_series, n_strings, n_inverters, dcac, energy_mwh, recommended), `strings.recommended_letter`, `strings.recommended_caption`, `strings.n_inverters`, `strings.n_series`, `strings.dcac`, `performance.energy_mwh`, `performance.conservative_mwh`, `performance.specific_yield`, `performance.pr_pct`, `performance.steps` (label, value, kind, pct), `handover.bom_lines`, `handover.cable_rows`. `shown` uses the app's rounding: kWp 2 decimals, MWh 1 decimal, yield 0 decimals, PR 1 decimal, DC/AC 2 decimals, m² thousands separator.

- [ ] **Step 1: Write the failing tests** in `tests/test_demo_roof.py`:

```python
def test_outline_is_an_l_of_about_2400_m2():
    p = project(); poly = Polygon(p["roof"]["outline"])
    assert 2300 <= poly.area <= 2500 and len(p["roof"]["outline"]) == 6
def test_obstacles_kinds_and_heights():
    kinds = Counter(o["kind"] for o in project()["roof"]["obstacles"])
    assert kinds == {"building": 2, "box": 5, "cylinder": 2, "tree": 1}
    assert max(o["height"] for o in project()["roof"]["obstacles"]) == 9.0
def test_wing_is_outside_the_roof_outline():
    p = project(); roof = Polygon(p["roof"]["outline"])
    wing = next(o for o in p["roof"]["obstacles"] if o["name"] == "Wing")
    assert roof.intersection(Polygon(wing["points"])).area < 1.0
```
and in `tests/test_facts.py` (pure, with a small fixture `tests/fixtures/result_min.json` the implementer writes from the API's schema):

```python
def test_shown_values_use_the_apps_rounding():
    f = build(project(), result_min())
    assert f["performance"]["energy_mwh"]["shown"] == "586.4"
    assert f["array"]["dc_kwp"]["shown"] == "348.00"
def test_recommended_caption_is_the_apps_word():
    f = build(project(), result_min())
    assert f["strings"]["recommended_caption"]["value"] == "Recommended"
def test_recommended_not_top_energy_is_recorded():
    r = result_min(); r["options"][0]["energy"]["energy_mwh"] = 1.0
    f = build(project(), r)
    assert f["strings"]["recommended_is_highest_energy"]["value"] is False
```
- [ ] **Step 2: Run them to see them fail.** `uv run pytest tests/test_demo_roof.py tests/test_facts.py -v` → FAIL.
- [ ] **Step 3: Implement `rei/demo_roof.py`, `rei/facts.py`, `rei/run.py`.** `run.design` reads the SSE stream with `httpx.stream` and parses `data:` lines as JSON.
- [ ] **Step 4: Run the tests.** → PASS.
- [ ] **Step 5: Start the app and run the design.** In the repo: `bun status`; if 4700/4701 are held, `bun stop --all`; then `bun start` in the background (`run_in_background`), wait for `curl -s http://localhost:4700/api/health` → 200. Then `uv run python tools/run_design.py` → writes `facts.json`, `design.json`, `project.json`; prints modules, kWp, MWh, the options with captions, and `recommended_is_highest_energy`.
- [ ] **Step 6: Judge the run.** If the array is under 200 kWp, no option is ok, or `recommended_is_highest_energy` is false, adjust the roof's dimensions within spec §3's shape (never the engine), note the change in `demo_roof.py`'s doc string, and rerun. Record the final numbers in `WORK/NOTES.md`.
- [ ] **Step 7: Commit** (`facts.json`, `project.json` included; `design.json` too, it is the evidence).

### Task 4: Captures from the real app

**Files:**
- Create: `WORK/rei/browser.py`, `WORK/tools/capture_tour.py`, `WORK/tools/capture_parts.py`, `WORK/tools/capture_handover.py`
- Test: `WORK/tests/test_browser.py`

**Interfaces:**
- Consumes (from the repo): IndexedDB `rooftop` store `designs` record `KeptDesign {id, name, document, facts{roofWords, dcKwp, energyMwh}, thumbnail: null, editedAt, openedAt}` and `localStorage["rooftop.open-design"] = id` (`e2e/device.ts:30-63`); view control button `Imagery` (`components/studio/ViewControls.tsx`); the `Present` link in the Performance head; `[data-testid=present][data-state=touring]`; `[data-testid=present-ground]` text `The ground is the satellite imagery`; overlays to hide: `present-panel`, `present-controls`, `present-words`, `present-scene`, `present-keys`, `.stage-fade` (keep `present-attribution`); keys Space / ArrowLeft / ArrowRight; `page.clock` for exact moments; `[data-testid=option-card]`; `[data-testid=download-all]`; Studio `step-primary`.
- Produces: `browser.open_design(page, project: dict) -> None` (injects the KeptDesign and remembers it, then `goto("/studio/roof")` and waits for the stage); `browser.imagery_on(page) -> None`; `browser.to_present(page) -> None` (client-side navigation through Performance's `Present` link, waits for touring, asserts the ground text; raises `GroundNotImagery` otherwise); `browser.hide_overlays(page) -> None` (CSS `display:none` on the testids above and `.stage-fade`).
- Produces: `captures/tour/%04d.png` (1200 frames, 3840 × 2160: viewport 1920 × 1080, `device_scale_factor=2`, full-page screenshots of the stage, the tour paused and stepped by `page.clock.run_for(33.333)` per frame from `t=0` of scene 1, `omit_background=False`); `captures/tour/index.json` (`frame → {scene_id, t_ms}`); `captures/parts/option-card-{A..E}.png` (each card at 2×, from `/studio/strings`); `captures/parts/attribution.txt`; `captures/handover/<stem>.zip` and `captures/handover/pages/report-{1..n}.png` (PyMuPDF at 300 dpi), `sld.png`.

- [ ] **Step 1: Write the failing test** `tests/test_browser.py` (unit, no browser): `test_kept_design_record_shape` asserts `browser.kept_design(project)` has the keys above, `facts.dcKwp` equal to `facts.json`'s value and `thumbnail is None`; `test_overlay_css_hides_every_listed_testid` asserts the CSS string contains all six selectors and not `present-attribution`; `test_to_present_refuses_a_plain_ground` passes a fake page whose `present-ground` text is `The ground is a plain grid` and asserts `GroundNotImagery` is raised.
- [ ] **Step 2: Run to see it fail.** → FAIL.
- [ ] **Step 3: Implement `rei/browser.py`.**
- [ ] **Step 4: Run the test.** → PASS.
- [ ] **Step 5: Write and run `tools/capture_tour.py`** against the running app (headed Chromium, `--window-size=1920,1080`). It must raise `GroundNotImagery` and write nothing if the ground is plain. Expected: 1200 PNGs, the first showing the roof from above on satellite imagery, frame 300–480 showing moving shadows. Spot-check by reading `captures/tour/0000.png`, `0150.png`, `0420.png`, `0900.png`, `1100.png`.
- [ ] **Step 6: Write and run `tools/capture_parts.py` and `tools/capture_handover.py`.** Expected: five option cards; the zip with 8 files; report pages PNG; `sld.png`. Confirm with `ls` and by reading one card and the report's Schedule page.
- [ ] **Step 7: Commit** (scripts and `index.json`; captures are ignored).

### Task 5: The scene: timeline, overlay and `render(t)`

**Files:**
- Create: `WORK/rei/timeline.py`, `WORK/scene/index.html`, `WORK/scene/scene.css`, `WORK/scene/scene.js`, `WORK/scene/qr.py` (writes `scene/qr.svg` for `https://rooftop.solarlayout.app`), `WORK/tools/build_timeline.py`
- Test: `WORK/tests/test_timeline.py`

**Interfaces:**
- Produces: `timeline.BEATS: list[Beat]`, `Beat = dataclass(t0: float, t1: float, rail: str | None, headline: str, tag: str | None, numbers: list[tuple[str, str]])` — the rows of spec §4 verbatim, numbers as `(facts path, unit label)`; `timeline.frame_for(t: float, fps: int = 30) -> int` mapping spot time to a tour frame, 1:1 except the sun scene, with holds: `t ∈ [0, 6)` → tour `t`; `t ∈ [6, 15)` → tour `min(t, 14.0)` (the array fills to 14 s, then holds); `t ∈ [15, 23)` → tour `14 + 1.5·(t − 15)` (the 12 s sun scene in 8 s); `t ∈ [23, 31)` → tour `26 + min(t − 23, 4)`; `t ∈ [31, 41)` → tour `30 + (t − 31)`; `t ≥ 41` → tour frame 1199. Returns `min(round(tour·fps), 1199)`.
- Produces: `timeline.json` = `{"fps": 30, "frames": 1440, "beats": [...], "tour_frame": [1440 ints], "facts": <facts.json>}`.
- Produces: `scene/index.html` loads `timeline.json`, the fonts and `captures/tour/<frame>.png`, option cards, report pages; exposes `window.render(frame: int): Promise<void>` that sets every element's state for that frame deterministically (no CSS transitions, no rAF timing; eases computed in JS from `frame`), and `window.ready: Promise<void>` after fonts and images are loaded. Layout from `geometry.LAYOUT` copied into `scene.css` as CSS variables (the build writes `scene/layout.css` from `LAYOUT` so there is one source).
- Scene parts and their motion (ease-out cubic, 400–900 ms): the stage image (right two thirds, under a left-to-right gradient from the ground colour to transparent over x 0–1900, 1 s fade-in at t 0); rail (lit square filled accent, label accent; others `#a6a6a2` hollow); demo label; role tag; headline (two lines max, slides up 40 px and fades in over 600 ms at each beat start, out over 300 ms at its end); numbers (Geist Mono 220 px, roll from 0 over 1.5 s at beat start with tabular figures, unit label 64 px `#a6a6a2` beside); option cards (beat 4: five captured cards in a row at the right, the recommended one with an accent 6 px border and the tag `Recommended · highest energy within DC/AC 1.10–1.30` in accent 64 px under it; the others at 70 % opacity); loss chain (beat 5: a horizontal waterfall of `performance.steps` drawn on a `<canvas>`, gains `#3987E5`, losses `#D95926`, the result bar `#ececea`, labels 44 px, bars draw left to right over 3 s); handover pages (beat 6: report page 1, `sld.png`, the Schedule page and the Energy page fan out from the roof's centre to four positions at 12°, 4°, −4°, −12° over 900 ms, each 1100 px tall with a 24 px shadow; chips `PDF · DXF · KMZ · CSV` in 56 px under the headline); the end card (beat 7: stage dims to 25 %, wordmark, headline, tag, 800 px QR, footer, per §4a's end-card rows); the strip and the QR card on every frame.

- [ ] **Step 1: Write the failing tests** `tests/test_timeline.py`:

```python
def test_beats_cover_48_seconds_without_gaps():
    assert BEATS[0].t0 == 0 and BEATS[-1].t1 == 48.0
    assert all(a.t1 == b.t0 for a, b in zip(BEATS, BEATS[1:]))
def test_every_caption_is_held_three_seconds():
    assert all(b.t1 - b.t0 >= 3.0 for b in BEATS)
def test_tour_frame_mapping_holds_and_plays():
    assert frame_for(0.0) == 0 and frame_for(7.0) == 210
    assert frame_for(14.5) == 420 and frame_for(22.9) == 776
    assert frame_for(27.5) == 900 and frame_for(40.0) == 1170 and frame_for(45.0) == 1199
def test_headlines_are_the_specs_words():
    assert [b.headline for b in BEATS][:2] == ["One roof, outlined.", "Modules laid out around what stands on it."]
```
- [ ] **Step 2: Run to see them fail.** → FAIL.
- [ ] **Step 3: Implement `rei/timeline.py` and `tools/build_timeline.py`.**
- [ ] **Step 4: Run the tests.** → PASS.
- [ ] **Step 5: Write `scene/qr.py`, `scene/index.html`, `scene/scene.css`, `scene/scene.js`.** Open `scene/index.html?frame=300` in Chromium by hand (`uv run python -m http.server` in `WORK`) and look at frames 60, 300, 600, 800, 1000, 1200, 1400.
- [ ] **Step 6: Commit.**

### Task 6: Style frames — approval gate 1

**Files:**
- Create: `WORK/rei/render.py`, `WORK/tools/style_frames.py`
- Test: `WORK/tests/test_render_geometry.py`

**Interfaces:**
- Produces: `render.open_scene(playwright) -> Page` (Chromium, viewport 3840 × 2160, `device_scale_factor=1`, serves `WORK` over a local `http.server` thread, waits for `window.ready`); `render.frame(page, n: int, out: Path) -> None` (`await window.render(n)`, then a PNG screenshot).
- Produces: `out/stills/beat-{1..7}.png` (frames 90, 330, 570, 810, 1050, 1230, 1380) and `out/stills/compare-{sl,bess}.png` (the rooftop frame at 50 % over `measured/sl_beat_22s.png` / `measured/bess_end_104.9s.png`).

- [ ] **Step 1: Write the failing test** `tests/test_render_geometry.py` (marked `slow`): renders frame 330 and asserts `geometry.measure(png)` matches `LAYOUT` within 4 px for `rail_y, tag_y, headline_y, strip_x, strip_y, qr_card`; renders frame 1380 and checks `end_qr_card` and `end_headline_y`; decodes the QR in both with `cv2.QRCodeDetector` → `https://rooftop.solarlayout.app`.
- [ ] **Step 2: Run to see it fail.** → FAIL.
- [ ] **Step 3: Implement `rei/render.py` and `tools/style_frames.py`.**
- [ ] **Step 4: Run the test.** → PASS.
- [ ] **Step 5: Render the stills and the comparisons**, read all nine images, fix what is off, and then **stop and show the owner** the seven stills and two comparisons. Wait for approval before Task 7.
- [ ] **Step 6: Commit.**

### Task 7: The title card and the facts check

**Files:**
- Create: `WORK/scene/card.html`, `WORK/rei/factscheck.py`, `WORK/tools/check_facts.py`
- Test: `WORK/tests/test_factscheck.py`

**Interfaces:**
- Produces: `out/card.png` (3840 × 2160, from `card.html`, geometry per §4a, the rooftop QR, `Free to try` under it); `tests` assert `geometry.measure` of it against `measured/bess_card.png` within 4 px for `card_lines_y`, `card_qr`, `card_text_x`.
- Produces: `factscheck.numbers_on_screen(timeline: dict) -> list[tuple[frame, text]]` (every number string the scene will show, from `BEATS` and `facts`), and `factscheck.check(timeline, facts) -> list[str]` returning the mismatches (a shown string that is not the `shown` of its facts path, or a fact in a beat with no `shown`). `tools/check_facts.py` exits 1 on any mismatch and writes `out/facts-check.txt`.

- [ ] **Step 1: Write the failing tests**:

```python
def test_check_passes_on_the_built_timeline():
    assert check(load_timeline(), load_facts()) == []
def test_check_fails_on_a_wrongly_rounded_number():
    t = load_timeline(); t["beats"][4]["numbers"][0]["shown"] = "586.40"
    assert check(t, load_facts()) != []
def test_card_geometry_matches_bess_card():  # slow
    m = measure(Path("out/card.png")); r = measure(Path("measured/bess_card.png"))
    assert all(abs(a-b) <= 4 for a, b in zip(m["card_qr"], r["card_qr"]))
```
- [ ] **Step 2: Run to see them fail.** → FAIL.
- [ ] **Step 3: Implement `card.html`, `rei/factscheck.py`, `tools/check_facts.py`.** Render the card with `render.frame` on `card.html`.
- [ ] **Step 4: Run the tests and the check.** `uv run pytest -v`; `uv run python tools/check_facts.py` → `facts-check: 0 mismatches`.
- [ ] **Step 5: Commit.**

### Task 8: Render the spot's frames

**Files:**
- Create: `WORK/tools/render_frames.py`, `WORK/tools/contact_sheet.py`

**Interfaces:**
- Produces: `frames/spot/%04d.png` for 0..1439; `out/contact-sheet.png` (one frame every 2 s, 8 columns, each thumb 480 px wide with its time stamped).

- [ ] **Step 1: Write `tools/render_frames.py`**: one Chromium page, `render.frame` for every n, resumable (skips existing files), prints progress every 60 frames.
- [ ] **Step 2: Run it.** Expected: 1440 files; wall time about 10–20 min. Check `ls frames/spot | wc -l` → 1440.
- [ ] **Step 3: Write and run `tools/contact_sheet.py`**, read `out/contact-sheet.png`, and check: every caption inside the safe margin, nothing under the minimum sizes, the sun scene moving between 15 and 23 s, the end card from 43 s.
- [ ] **Step 4: Commit.**

### Task 9: Audio, the spot's encodes and the preview — approval gate 2

**Files:**
- Create: `WORK/rei/audio.py`, `WORK/tools/encode_spot.py`, `WORK/tools/preview_cycle.py`
- Test: `WORK/tests/test_audio.py`

**Interfaces:**
- Produces: `audio.bed(loop: Path, t0: float, length: float, out: Path) -> None` (extracts `length` s of the loop's audio from `t0`, 0.5 s fade in and out, stereo 48 kHz WAV); `audio.loudness(path) -> float` (integrated LUFS via `ebur128`).
- Produces: `out/rooftop_item_video.mov` (ProRes 422 or `libx264 -crf 10`, 3840 × 2160, 30 fps): the fade from `measured/bess_last.png` to `out/card.png` (15 frames) + hold (63) + fade to `frames/spot/0000.png` (9) + the 1440 frames + fade from frame 1439 to `measured/sl_card.png` (15) + hold of `sl_card.png` (31 frames, 1.05 s) = 1573 frames; `out/rooftop_item.wav` = `audio.bed(loop, t0 = cuts.bess_item[0], length = 1573/30)`; `out/rooftop_booth_spot_4k.mp4` (the 1440 frames alone, H.264 High yuv420p ~35 Mbps, with the bed trimmed to 48 s); `out/rooftop_booth_spot_1080p_preview.mp4`; `out/preview_cycle_1080p.mp4` = SL item + BESS item (cut from the loop per `cuts.json`, scaled to 1080p) + the rooftop item at 1080p, concatenated with the audio treatment of Task 10.

- [ ] **Step 1: Write the failing test** `tests/test_audio.py` (slow): `bed(...)` of 5 s has 240000 frames per channel ±1 and its first and last 10 ms are below −60 dBFS; `loudness` of the extracted rooftop bed is within −20 ±1.5 LUFS.
- [ ] **Step 2: Run to see it fail.** → FAIL.
- [ ] **Step 3: Implement `rei/audio.py`, `tools/encode_spot.py`, `tools/preview_cycle.py`.** Fades between stills are made with ffmpeg `xfade=transition=fade` on `loop=1` image inputs; the frame sequence with `-framerate 30 -i frames/spot/%04d.png`.
- [ ] **Step 4: Run the test and the tools.** Expected: `ffprobe` of `rooftop_booth_spot_4k.mp4` → duration 48.000 ±0.034, 3840 × 2160, 30/1; `rooftop_item_video.mov` → 1573 frames.
- [ ] **Step 5: Stop and show the owner** `out/rooftop_booth_spot_1080p_preview.mp4` and `out/preview_cycle_1080p.mp4`. Wait for approval or changes before Task 10.
- [ ] **Step 6: Commit.**

### Task 10: The loop

**Files:**
- Create: `WORK/rei/loop.py`, `WORK/tools/build_loop.py`, `WORK/tools/check_loop.py`
- Test: `WORK/tests/test_loop.py`

**Interfaces:**
- Produces: `loop.items(loop_src: Path, cuts: dict, out_dir: Path) -> tuple[Path, Path]` (SL and BESS items decoded once from the HEVC loop to the same intermediate codec as the rooftop item, cut on exact frames with `-ss`/`-frames:v` after seeking to a keyframe and trimming with `select`, audio cut with `atrim` and 0.25 s fade in/out at the cuts); `loop.concat(items: list[Path], repeats: int, out: Path, hevc: bool) -> None` (concat demuxer → `libx265 -tag:v hvc1 -pix_fmt yuv420p -b:v 15M -maxrate 18M -bufsize 30M -g 60 -movflags +faststart`, AAC 192 kb/s 48 kHz stereo; the 1080p variant `libx264 -profile:v high -b:v 10M`).
- Produces: `loop.join_report(video: Path, join_times: list[float]) -> list[dict]` (for each join: the luma series of ±1 s and the max absolute sample step of the audio within ±20 ms of the join).
- Produces: `out/booth_loop_30min_4k_hevc_solarlayout_bess_rooftop_v1.mp4`, `out/booth_loop_30min_1080p_solarlayout_bess_rooftop_v1.mp4`, `out/loop-check.txt`.

- [ ] **Step 1: Write the failing test** `tests/test_loop.py`: `test_join_times_for_twelve_cycles` asserts `loop.join_times(item_lengths=[57.45, 46.5, 52.43], repeats=12)` returns 36 values ending below 12 × 156.38 + 0.01 and that the total length is ≥ 1800 s; `test_concat_list_text` asserts the concat file text repeats the three paths 12 times in order.
- [ ] **Step 2: Run to see it fail.** → FAIL.
- [ ] **Step 3: Implement `rei/loop.py`, `tools/build_loop.py`, `tools/check_loop.py`.**
- [ ] **Step 4: Run the test, then build.** `uv run python tools/build_loop.py` (expect 30–90 min for the HEVC encode; run in the background). Then `uv run python tools/check_loop.py` → writes `out/loop-check.txt` with: duration (≥ 1800 s, a whole number of cycles), streams (`hevc`, `hvc1`, `yuv420p`, 3840 × 2160, 30 fps; `aac`, stereo, 48000), size, each join's luma profile (a 15-frame rise into orange, a 9-frame fall out of it) and audio step (< 0.05 full scale), the integrated loudness of one cycle (−20 ±1.5 LUFS), and the QR decode of the frame at the rooftop card and the rooftop end card. Every line `ok`.
- [ ] **Step 5: Play it.** Open the 4K loop in QuickTime at the two rooftop joins and at the end; open in VLC if installed. Report what was watched.
- [ ] **Step 6: Commit.**

### Task 11: Deliverables and the record

**Files:**
- Modify: `docs/marketing/video/rei-2026-rooftop-spot-design.md` (§3 the final coordinates, vertices and any dimension change; §6 the recorded numbers; §8 the exact cut frames)
- Create: `WORK/README.md` (how to rerun each stage), `WORK/out/stills/` (already), copy `out/*.mp4` to `~/Downloads/` under their final names.

- [ ] **Step 1: Copy the deliverables** to `~/Downloads/` and list them with sizes and `ffprobe` one-liners.
- [ ] **Step 2: Update the spec** with the recorded facts (the actual roof vertices and coordinates, the run's headline numbers, the cut frames, the item lengths) and commit it to `main` directly (documents only, D26).
- [ ] **Step 3: Final check** `uv run pytest -v` in `WORK` → all pass; `bun stop --all` in the repo.
- [ ] **Step 4: Commit `WORK`** and tell the owner the paths, the numbers, and what was and was not verified by eye.
