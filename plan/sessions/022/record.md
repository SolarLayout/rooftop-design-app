# Session 22: the system voltage set by the user's country (2026-10-08)

The owner opened the voltage work named at the end of session 21: first questions (why no default; the codes; whether the
OND holds a system voltage; how to know the user's country), then Phase 16, planned, designed, approved and built. The
owner's words are in `owner-messages.md`. The log:
`~/.claude/projects/-Users-arunkpatra-codebase-rooftop-design-app/70c40a52-ab22-420b-a529-9499f6d46e2f.jsonl`.

## Standing instructions kept

Those of sessions 18 to 21: no browser suites run and no new UI tests; logic tested first; each change checked by hand in
the browser on the test stack at three sizes, its screenshots in the pull request; pull requests one after the other,
merged on a green check; documents to `main` alone (D26). New this session: "we can skip e2e and look at browser tests
later" (the mobile fixes of session 21 may trip some).

## What was done

| What | Where |
|---|---|
| The voltage analysed: how the engine uses it (`series_range`: the lowest of the system voltage, the inverter's `VAbsMax`, the module's `VMaxIEC`), why it had no default (F7 of the desktop app; no rationale written in either repository, and the v1 spec's artifact could not be read), the codes cited; the OND holds no system voltage (`VAbsMax`, the MPPT window), the PAN's `VMaxIEC`/`VMaxUL` is the module's | the conversation; `plan/phase-16-system-voltage.md` |
| Phase 16 planned: the phase file with the references, D87 (US and Canada 600 V, else 1000 V, India the last fallback), the questions answered one at a time | `plan/phase-16-system-voltage.md`, D87 |
| The boards "System voltage · Set by the user's country", from a prototype on the local branch `design/system-voltage` (never merged), on the canvas page "System voltage"; approved | `docs/design/mockups/build_system_voltage.py`, `system_voltage/` |
| The plan; D88 found while planning (lowering the app's value to a class shortened the strings: 11 where the inverter takes 15) and taken on the owner's word | `plan/phase-16-plan.md`, D88 |
| Built: who set it (#153); the country and the default (#154); the lens and the picker (#155); the help (#156); the browser suites by reading (#157) | `phase-16-system-voltage.md`, "As built" |
| Two findings fixed on the owner's word: the bundled files named by their names, not their path on the server (#158; the parity test caught a first try that dropped the inverter's curves); the help sheet's mark of the voltage says who set it (#159) | #158, #159 |
| The boards' third state taken again from the build; hard rule 3, `apps/web/CLAUDE.md`, D10, `components.md` ("System voltage", the vitals' states), `docs/help-content.md` | this commit |

## Why things are as they are

- **The default is the web app's, not the engine's.** A default is a choice of the product; the engine and the API stay
  without one, so a project sent without a voltage still says so, and old files and the API remain valid.
- **The country is the request's, then the time zone's, then India's.** Vercel's header is free and needs no prompt; the
  time zone covers `next dev`, the test stacks and a proxy; India is the owner's last fallback. The table of time zones is
  generated once from the tz database and holds the names browsers report (Chrome says `Asia/Calcutta`), which bun's own
  `Intl` does not give, so the generator asks Node.
- **The roof's location was recommended and not taken.** The roof's coordinates say better which code applies; the owner
  asked for the user's country. Written in the phase file as possible later.
- **D88 over the first approval.** The value stays where it is set; the engine already keeps every string under the
  equipment's rating, so lowering to a class only shortened strings. A plain line says what the strings are sized to.
- **The offer where no length fits is computed, not guessed.** The run's range gives Voc at the coldest a module, the
  shortest length needed and the MPPT's longest, so the lens offers the lowest voltage at which a length fits, or none.
- **The suites by reading, last.** The owner asked to look at browser tests later; one pull request against the finished
  screens kept the others small. The waiting screens are still reachable (no string length fits), so their suites were
  moved to that state rather than removed.

## Tried and dropped

- Recording PR screenshots with `?country=` (the prototype's switch): the build reads the request and the time zone, so the
  checks set Playwright's `timezoneId` and the header instead.
- The phone's inspector sheet scrolled to the voltage by its content alone: it stayed at half height; its grip
  (`separator`, End) opens it fully first.

## Not done, and why

- The browser groups were not run (the owner's instruction). #157's suites and those #151 may trip are to be run when the
  owner says.
- Not deployed: the owner deploys.
