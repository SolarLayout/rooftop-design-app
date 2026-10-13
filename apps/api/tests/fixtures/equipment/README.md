# Equipment fixtures

Real PVsyst files supplied by the owner on 2026-09-29, renamed to plain file names. Contents are unchanged,
byte for byte: CRLF line ends throughout, and a UTF-8 byte order mark in the Emmvee and Sungrow files
(`.gitattributes` here stops git from converting them). Readers must cope with both.
They are test inputs. The demo's inverter is not here but in `src/rooftop_core/samples`, bundled with the engine
under its real name (decision D24); so is the demo's module, Waaree BiN-08-580, since D117 (`waaree-bin-08-580.PAN`,
fitted from Waaree's datasheet, not one of the files supplied).

`insolation-ina-144mhc-tf-560.PAN` was the demo's module until D117. Its temperature figures are not a real
module's (power -0.210 %/°C and muGamma +0.0008, outside the makers' files of the library; no Voc coefficient), so it
is no longer bundled. It stays here as the engine's reference module (`tools/reference.py`): the desktop app's numbers,
the parity snapshots and the numbers the tests pin were taken with it.

`Test.PAN` and `Test-S.ond` are the samples of the desktop app, with which every expected number in
`plan/reference/demo-numbers.md` was produced. They hold the data of the reference module and the bundled inverter
under the name "Test". The tests copied from the desktop app run on them, and `tests/engine/test_demo_equipment.py`
holds that both pairs give the same results.

## Modules

| File | Module | Covers |
|---|---|---|
| `abi-ab340-72phc.PAN` | ABi Solar AB340-72PHC PL01, 340 Wp, poly | Monofacial (no rear gain); not twin half-cell (electrical shading rule for a whole module); states its Voc coefficient: -131.0 mV/°C, -0.286 %/°C; no LID value (the 1.5 % default applies) |
| `emmvee-e620hcbg132-t.PAN` | Emmvee E620HCBG132-T, 620 Wp, mono | Bifacial 0.78; twin half-cell; states its Voc coefficient: -110.1 mV/°C, -0.224 %/°C; 66 cells in series |
| `Test.PAN` and `insolation-ina-144mhc-tf-560.PAN` | Insolation INA-144MHC-TF-560, 560 Wp, mono | The same electrical data in both; no Voc coefficient in the file, so it is derived (-0.164 %/°C) and the note fires. Its temperature figures are not a real module's (D117) |

## Inverters

| File | Inverter | Covers |
|---|---|---|
| `Test-S.ond`, and in the samples `wattpower-wp-330ktl-h1.OND` | WattPower WP-330KTL-H1, 275 kW, 6 MPPT, 28 inputs | The same data in both; no current per MPPT in the file (390 A ÷ 6 is used) |
| `sungrow-sg3300ud-20.OND` | Sungrow SG3300UD-20, 3,300 kW, 3 MPPT, 5 inputs | Central inverter far larger than a roof; MPPT minimum 938 V (narrow series range); no `IMaxDC` and no current per MPPT in the file |

## Not covered by a real file

A variant is made in the test, in memory, from a real file with the lines named changed
(`variant` in `tests/engine/test_real_equipment.py`). No variant is kept as a file.

| Case | Variant to make |
|---|---|
| Inverter that states its current per MPPT | From `Test-S.ond`, `IMaxMPPT=40.0` added after `IMaxDC` |
| Voltage limit below 1500 V set by the equipment | From `Test.PAN`, `VMaxIEC=1000`; from `Test-S.ond`, `VAbsMax=1000` |
| A file that is not a PAN or an OND | Any text without `PNom`, `Voc`, `Isc` (module) or `PNomConv`, `VMPPMax` (inverter) |
