# Equipment fixtures

Real PVsyst files supplied by the owner on 2026-09-29, renamed to plain file names. Contents are unchanged,
byte for byte: CRLF line ends throughout, and a UTF-8 byte order mark in the Emmvee and Sungrow files
(`.gitattributes` here stops git from converting them). Readers must cope with both.
They are test inputs. The demo keeps using the bundled `Test.PAN` and `Test-S.ond`, because every expected
number in `plan/reference/demo-numbers.md` was produced with those two.

## Modules

| File | Module | Covers |
|---|---|---|
| `abi-ab340-72phc.PAN` | ABi Solar AB340-72PHC PL01, 340 Wp, poly | Monofacial (no rear gain); not twin half-cell (electrical shading rule for a whole module); states its Voc coefficient: -131.0 mV/°C, -0.286 %/°C; no LID value (the 1.5 % default applies) |
| `emmvee-e620hcbg132-t.PAN` | Emmvee E620HCBG132-T, 620 Wp, mono | Bifacial 0.78; twin half-cell; states its Voc coefficient: -110.1 mV/°C, -0.224 %/°C; 66 cells in series |
| `insolation-ina-144mhc-tf-560.PAN` | Insolation INA-144MHC-TF-560, 560 Wp, mono | Same electrical data as the bundled `Test.PAN`; no Voc coefficient in the file, so it is derived (-0.164 %/°C) and the note fires |

## Inverters

| File | Inverter | Covers |
|---|---|---|
| `wattpower-wp-330ktl-h1.OND` | WattPower WP-330KTL-H1, 275 kW, 6 MPPT, 28 inputs | Same data as the bundled `Test-S.ond`; no current per MPPT in the file (390 A ÷ 6 is used) |
| `sungrow-sg3300ud-20.OND` | Sungrow SG3300UD-20, 3,300 kW, 3 MPPT, 5 inputs | Central inverter far larger than a roof; MPPT minimum 938 V (narrow series range); no `IMaxDC` and no current per MPPT in the file |

## Not covered by a real file

Write a variant for these when the test needs one: copy a real file, change only the lines named, and say so
in the first line of this table.

| Case | Variant to make |
|---|---|
| Inverter that states its current per MPPT | From `wattpower-wp-330ktl-h1.OND`, add `IMaxMPPT` |
| Voltage limit below 1500 V set by the equipment | From a module or inverter file, set the maximum voltage to 1000 V |
| A file that is not a PAN or an OND | Any text without `PNom`, `Voc`, `Isc` (module) or `PNomConv`, `VMPPMax` (inverter) |
