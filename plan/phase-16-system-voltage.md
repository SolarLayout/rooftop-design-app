# Phase 16: the system voltage set by the user's country

**Status:** planned (session 22, 2026-10-08). Not started.
**Depends on:** Phase 7 (the Strings lens, its voltage decision card: D10, D37), Phase 12 (the web app on Vercel, D58).
**Replaces:** D10 and hard rule 3 as they stand, by D87, when this phase is built.

## What the owner asked (session 22)
"we need to detect, the user country, for US, 600 V will be chosen and set by default, for all other places - 1000 V will be
set by default. Reasoning: It was a constant cause of friction for the user, and teh voltages we are chosing are standard -
give references."

Then, on the questions of this file: "Canada 600 V."; "if we fail to get the location by all methods tried, final fallback
will be India."; and, asked: a voltage set by the country, then an OND rated for another voltage (question 2).

Asked before it, and answered in the session: is a string of 500 V on a 1000 V or 1500 V inverter valid? Yes, if its Vmp
stays inside the inverter's MPPT window (below, "Why a ceiling, not an operating point").

## Goal
A new design starts with a system voltage: 600 V when the user is in the United States or Canada, 1000 V everywhere else. The user can
change it as today (600, 1000, 1500 V). Nothing waits for a choice any more on a new design: strings, options, energy, the
single-line diagram, the bill of materials and the exports come with the first run. The screen says where the voltage came
from and how to change it.

## Why these two numbers (references)
The limits are on the string's open-circuit voltage at the site's lowest temperature, which `series_range` already computes
(`apps/api/src/rooftop_core/stringing.py:51`).

| Where | Limit | Source |
|---|---|---|
| United States | 600 V DC on or in one- and two-family dwellings; 1000 V DC on other buildings; above 1000 V only under 690.31(G), not on or in dwellings or buildings with habitable rooms | NFPA 70 (NEC) 2023, 690.7 and 690.31(G). Summaries: [North American Clean Energy, "Get Ready for NEC 2023"](https://www.nacleanenergy.com/solar/get-ready-for-nec-2023); [ANSI blog, NFPA 70-2017 PV changes](https://blog.ansi.org/ansi/changes-solar-photovoltaic-pv-nfpa-70-2017/); [IAEI Magazine, 2023 NEC and PV (J. Wiles)](https://iaeimagazine.org/columns/photovoltaic/2023-national-electrical-code-and-photovoltaic-power-systems) |
| Australia, New Zealand | 1000 V DC domestic, 1500 V DC other installations (AS/NZS 5033:2021 cl. 3.1); the 600 V domestic limit of AS/NZS 4777.1:2016 cl. 2.3 lifted to 1000 V by AS/NZS 4777.1:2024 (in force February 2025) | [ERAC FAQ on AS/NZS 5033:2021](https://www.erac.gov.au/wp-content/uploads/2021/12/AS-NZS-5033-2021-FAQ.pdf) (read: it states both clauses); [GSES, the 1000 V rule in AS/NZS 4777.1:2024](https://www.gses.com.au/understanding-the-1000v-rule-in-as-nzs-4777-12024/) |
| IEC countries, EU | Low voltage ends at 1500 V DC; IEC 60364-7-712 and IEC 62548-1 set no lower figure by building type in what could be read | [Directive 2014/35/EU, Art. 1](https://www.legislation.gov.uk/eudr/2014/35/article/1/data.html) (75 to 1500 V DC); [IEC 60364-7-712 ed. 2 preview](https://assets.vde-verlag.de/iec-normen/preview-pdf/info_iec60364-7-712%7Bed2.0%7Db.pdf); [IEC 62548-1:2023](https://webstore.iec.ch/publication/64171) |
| India | No MNRE or CEA limit by building type found; MNRE's inverter series-approval guidelines cover inverters to 150 kW of 1000/1100 V DC maximum, 415 V AC | [pv magazine India](https://www.pv-magazine-india.com/2019/04/10/mnre-issues-guidelines-for-approval-of-solar-inverters/); [Mercom](https://www.mercomindia.com/mnre-approves-series-guidelines-solar-inverters) |
| Canada | 600 V DC on or in dwelling units since the 2015 CE Code (CSA C22.1, Section 64) | [IAEI Magazine, 2015 CE Code changes](https://iaeimagazine.org/2015/2015-ce-code-part-1-changes-part-7/) |

The app's own library agrees: of 388 inverters, 215 are rated 1000 or 1100 V DC (`VAbsMax`); of 119 modules, 116 are rated 1000 V
or 1500 V (`VMaxIEC`), two carry only `VMaxUL=1000`, and one (Silfab SLG350M) states no rating, which the reader takes as
1000 V (`io/pvsyst.py:209`).

**Why a default is safe in the engine.** The engine sizes to the lowest of the system voltage, the inverter's `VAbsMax` and
the module's `VMaxIEC` (`stringing.py:57`), so a default never takes a string over its equipment's rating. 1000 V on a 600 V
inverter sizes to 600 V; 1000 V on a 1500 V inverter caps the string at 1000 V, which the user can raise.

**Why a ceiling, not an operating point.** The system voltage and the inverter's maximum DC voltage are limits the string
must stay under; under the NEC the "maximum PV system voltage" is the string's own cold Voc. A string of 500 V cold Voc on a
1000 V or 1500 V inverter is valid when its Vmp at the hottest cell temperature is at or over the inverter's MPPT minimum and
start voltage (`n_min`, `stringing.py:59`; refused in words, `readouts.py:192`). It works on most 1000/1100 V string
inverters (MPPT minimum about 150 to 250 V, e.g. [SMA Sunny Tripower](https://manuals.sma.de/STPTL-20/en-US/818051979.html));
it does not on 1500 V-class inverters (the library's Solis 255K-EHV: MPPT 480 to 1500 V), where the engine says "No string
length fits". A lower string voltage carries more current for the same power: more strings per MPPT against its current
limits, more DC cable loss, and the inverter's efficiency at that voltage (the OND's curves by voltage, `simulation.py:124`).
Components rated for 1000 V on a 500 V string are fine.

## What exists to build on
- **The engine and the API** take a project with or without `system_voltage` (`rooftop_core/project.py:44`,
  `rooftop_api/schemas/project.py:61`); without one the run waits (`system_voltage_missing`, `services/design.py:34`). This
  phase keeps that: a project sent without a voltage still waits, so old files and the API stay valid.
- **New designs** are made by the API's `POST /roof/from-map` (`routers/roof.py:18`), from a drawing (`/roof/import`,
  `lib/flow/import-drawing.ts`) and by hand. The web app sets the voltage on the document it receives, before the first run.
- **The Strings lens**: the decision card before a voltage (`components/studio/SystemVoltage.tsx`, `VoltageDecision`,
  `WaitingAndDone`), the segmented choice after it; the choice committed as an edit (`StringsInspector.tsx:80`).
- **Where "waiting for a voltage" is said**: the vitals (D37), Home's cards (`lib/home/cards.ts:35`), the stage
  (`stage-view.ts:33`), the help topic (`content/help/studio/section/system-voltage.mdx`, "Nothing is chosen for you"), the
  shell examples of the kit.
- **The country**: the web app runs on Vercel (D58, `bom1`). Every request carries `x-vercel-ip-country` (ISO 3166-1
  alpha-2), read by a route handler (`app/app-icons/[file]/route.tsx` is the one route handler today). In the browser, the
  time zone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) is a fallback with no prompt and no network.
- **Tests**: the strings suites assert "no voltage, nothing preselected" (`strings-lens.e2e.ts`, `strings-states.e2e.ts`,
  `home.e2e.ts`, `shell-vitals.e2e.ts`); Playwright can send the header (`extraHTTPHeaders`) and set the time zone
  (`timezoneId`), so both ways are tested without the network.

## Decisions (D87, and the session's own)
1. **D87 (the owner).** A new design's system voltage is set by the user's country: 600 V in the United States and
   Canada, 1000 V elsewhere. The user can change it to 600, 1000 or 1500 V. Replaces D10 and hard rule 3 ("no default, never chosen for the
   user") when this phase is built.
2. **The country is found** by a route handler of the web app that answers the request's `x-vercel-ip-country` (`no-store`;
   the country is not kept anywhere), then by the browser's time zone when the header is missing (`next dev`, the test
   stacks, a proxy), and when both fail the country is India (the owner), so 1000 V. A pure function maps a country to its default and is tested by itself.
3. **"United States" is the NEC's reach**: US, and the territories that adopt the NEC (PR, GU, VI, AS, MP). The session's
   decision; the owner may overrule.
4. **The engine keeps no default.** `rooftop_core` and the API are unchanged: a default is a choice of the product, made in
   the web app, and a project without a voltage still waits and says so (a file of before, a call to the API).

## Questions this phase answers
1. **Canada**: answered, 600 V as the US (the owner, session 22).
2. **The equipment rated for another voltage than the one set** (asked by the owner). The engine already sizes to the
   lowest of the system voltage, the inverter's `VAbsMax` and the module's rating, so a string never exceeds its equipment;
   what is open is what the app shows and whether it moves the value. Proposed:
   - Keep where the value came from: set by the country, or chosen by the user (this answers question 4).
   - An inverter or module rated **under** the value: the strings follow the equipment (as today), and the lens says so
     ("Sized to 600 V, the inverter's limit"). While the value is the country's, it follows the equipment down to the
     highest of 600, 1000, 1500 V at or under the rating (an inverter of 1100 V gives 1000 V; of 550 V keeps 600 V and sizes
     to 550 V), so the screens and the bill of materials say what is built. A value the user chose is never moved.
   - An inverter rated **over** the value (a 1500 V inverter at 1000 V): never raised by the app, since the value is the
     legal ceiling of the place. The lens offers it in words, with one press ("This inverter takes up to 1500 V. Use 1500 V
     if the site's code allows it"), and when no string length fits, says which voltage would fit.
   - The equipment picker marks each inverter against the voltage set, with a tick or an exclamation mark (hard rule 4).
3. **A design of before, without a voltage** (on the device or opened from a `.rtd`): give it the default when it is opened,
   with the note, or leave it waiting as today?
4. **Where the voltage came from**: the line under the choice says it ("600 V, the limit for homes in the United States
   (NEC 690.7). Change it if the site allows more.", and for elsewhere its own words). Kept with the design (a field of the
   document, which the API must then accept) or worked out when shown (only while the value equals the default)?
5. **The board**: the Strings lens with the voltage set, its line, at 1440, 834 and 390; the decision card, the waiting list
   and the vitals' waiting state leave a new design. Drawn and approved before it is built (CLAUDE.md, "Design").

## Acceptance
- A new design, from the map, a drawing or by hand, has 600 V when the request comes from the US or Canada, 1000 V otherwise (India when no country is found); the first
  run brings strings, options and energy with no choice made. Shown by the browser tests with the header and with the time
  zone, and by unit tests of the mapping.
- The user changes the voltage as before; the edit is one step of undo.
- The Strings lens says where the voltage came from; the help topic "System voltage" says how the default is set, with the
  references, and no longer "Nothing is chosen for you".
- Hard rule 3 in `CLAUDE.md`, `apps/web/CLAUDE.md`, the `rooftop_core` docstring and D10 say the new rule.
- A project without a voltage, sent to the API, still waits and says so.
- The boards approved first, in three sizes, on the canvas; screenshots in each pull request that changes what is seen.

## Not in this phase
A default by the roof's location (the roof's coordinates are a better guide to the code that applies; possible later); limits
by building type (home or commercial); any voltage other than 600, 1000 and 1500 V; the engine's hourly model of a string
below the MPPT minimum (found while planning: `_inverter_out` clips the voltage to the efficiency curves and never stops at
`vmpp_min`; sizing keeps the strings above it at the hot design point).
