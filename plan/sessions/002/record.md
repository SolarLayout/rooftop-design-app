# Session 2: record

2026-09-29. One session in this repo, started with the resume prompt `plan/resume/001-phase-2-engine-api.md`.
It built Phase 2, part 2, and closed the phase. The state of the project is in `plan/STATE.md`; what was
built is in `plan/phase-02-engine-api.md`, "As built, part 2". Neither is repeated here.

## What the session did, in order

| # | What | Pull request |
|---|---|---|
| 1 | Start of the session: case a of the work order (part 1 merged), `bun check` green | |
| 2 | CSV weather with GHI alone | #11 |
| 3 | The design run at the desktop app's speed: the build of Python | #12 |
| 4 | `POST /weather`, CSV weather checked, recorded answers of PVGIS and NASA POWER | #13 |
| 5 | `POST /design` with progress as events; `readouts.py`, `shade_summary.py` | #14 |
| 6 | Memoisation (D6) | #15 |
| 7 | `POST /export/{pdf,dxf,kmz,csv,sld}` | #16 |
| 8 | A KMZ exported by the app comes back as the roof it was | #17 |
| 9 | The demo under its real equipment names (D24) | #18 |
| 10 | The test client on `httpx2` | #19 |
| 11 | Designs with the real equipment files; a limit that is not known is not zero; D25 pinned | #20 |
| 12 | Progress inside the shading and the options | #21 |
| 13 | The typed client in `apps/web/lib/api`; request types beside the answer types | #22 |
| 14 | Phase 2 closed; this record | #23 |
| 15 | Resume prompt 002 for Phase 3; documents go to `main` directly from here on (D26) | straight to `main` |

## Why things are the way they are

Reasons that are not obvious from the code or the plan.

- **Python is pinned in `apps/api`, not at the root.** uv reads `.python-version` only next to
  `pyproject.toml`. The pin at the root had never been applied; the first push of #12 passed here by chance
  (3.12.13 was the newest this machine's uv knew) and failed in CI, which ran 3.12.14.
- **uv takes only the Python it manages** because the python.org build of the same version runs the engine
  40 % slower. numpy and scipy make no difference; five environments were measured.
- **Memoisation came before the exports**, against the order of the work order: every export needs a full
  run, and without kept results each would take 12 s.
- **The memo keeps shading and options, not the layout.** The layout takes 0.06 s.
- **A run that finds its results kept sends fewer progress events.** That is why the tests of the route
  compare results and steps, and whole event lists only between two runs that keep nothing.
- **PDF, DXF and KMZ are not the same byte for byte for the same request.** They bear the time they were
  made; the DXF also two identifiers that ezdxf makes by chance. Their content is compared instead.
- **The words of the desktop window are in the engine now** (`readouts.py`). The desktop app built the
  verdict, the notes and the table of MPPTs in its window; the API had nowhere to take them from.
- **The verdict says Vmp 1,199 V for 29 in series**, not 1,196 V: it is the Vmp of the one-diode model
  (41.36 V), as on the desktop, not the 41.24 V of the PAN.
- **A twin half-cell module can lose 0.75**: a half to the row in front and a half to an obstacle.
- **There are two sets of generated types.** openapi-typescript takes a field with a default for one that
  is always there. That is right for an answer and wrong for a request.
- **The client's test against the real API is a browser test without a page** (project `api`), so that it
  runs on the test stack that the browser tests start, once.
- **`Test.PAN` and `Test-S.ond` stay**, as fixtures: the tests copied from the desktop app run on the very
  files its numbers were confirmed with.

## What was tried and dropped

| Tried | Why dropped |
|---|---|
| A test that the split of Erbs comes within 15 % of what PVGIS has | It does not: diffuse is 50 % more. The model differs. The figures are held as they are, and the difference is in the plan for the domain expert |
| `.python-version` at the root of the repo | uv does not read it there |
| Comparing the events of two identical requests in full | The second has less to tell when the first was kept |
| PDF, DXF and KMZ the same byte for byte | Would need the time stamps taken out of three writers; the content is what matters |
| Asserting that an exported KMZ comes back without missing heights, in the pull request of the exports | It did not: the modules came back as obstacles. Fixed in a pull request of its own (#17), then asserted |
| The client's test once for every screen size | It opens no page |

## What the owner should look at

Found on the way, none changed. They are in `plan/STATE.md`, "Open items", and in the phase file.

1. The engine places the sun at the middle of the hour; the PVGIS hours agree with the sun at the time
   stamp (0.8 W/m2 against 43.6 W/m2).
2. Strings are sized with the Voc of the model, also when the PAN states a coefficient.
3. A CSV with GHI alone gives another split of beam and diffuse than PVGIS has for the same hours.
4. The names of the demo's equipment as the files state them are longer than in the mockups.

## Agents used

None. Every part was built and checked by the session itself.

## What was left on the owner's machine

- uv installed its own Python 3.12.13 (`~/.local/share/uv/python`). The repo needs it.
- A Python 3.12.8 of uv, installed for the measurement only, was removed again.
- The python.org Python 3.12.8 was not touched.
- The remote branch `docs/session-1-record`, merged in session 1 and left over, was deleted.

## Where the rest of session 2 is kept

| What | Where | How to use it |
|---|---|---|
| The owner's messages, word for word | `plan/sessions/002/owner-messages.md` | Three lines |
| The full log of the session | `~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/e0f3a902-7864-48c0-a8d4-005b89f54f98.jsonl` | Never read it whole. Search it as `plan/sessions/001/record.md` shows |

The log is on the owner's machine only.
