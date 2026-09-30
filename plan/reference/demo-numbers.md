# Pune demo: expected numbers

Produced by running the desktop engine (commit bf2cb67) on the bundled weather. Use them in API and e2e tests.

## Roof
90 x 40 m flat roof, lat 18.52, lon 73.86, long side facing 180. Parapet 0.9 m, setback 1.0 m, walkway 0.6 m
every 24 modules, obstacle clearance 0.5 m, albedo 0.20.

| Obstacle | Kind | Centre x, y (m) | Size (m) | Height (m) |
|---|---|---|---|---|
| Stair room | box | 22.5, 18.0 | 5.0 x 4.0 | 3.0 |
| Water tank | cylinder | 62.0, 24.0 | dia 2.5 | 2.0 |
| AC unit 1 to 4 | box | 70.75 / 73.75 / 76.75 / 79.75, 3.5 | 1.5 x 1.0 | 1.2 |

## Equipment
Shown in the demo by their real names (decision D24): Insolation INA-144MHC-TF-560 and WattPower
WP-330KTL-H1, bundled as `insolation-ina-144mhc-tf-560.PAN` and `wattpower-wp-330ktl-h1.OND`. `Test.PAN` and
`Test-S.ond` of the desktop app hold the same data under the name "Test"; they are test fixtures here.
- Module: 560 Wp, 2.277 x 1.133 m, Voc 49.95 V, Isc 14.30 A, Vmp 41.24 V, Imp 13.58 A, twin half-cell,
  3 diodes, bifaciality 0.80, LID 0.2 %. Derived: Voc -0.164 %/degC, Vmp -0.228, Pmpp -0.212 (the Voc note fires).
- Inverter: 275 kW, 6 MPPT, 28 inputs, MPPT 500 to 1500 V, nominal 1080 V, IMaxDC 390 A (65 A per MPPT).

## Weather
PVGIS TMY: GHI 1,822.9 kWh/m2, ambient 11.93 to 39.26 degC, horizon highest 2.7 deg.

## Layout (flat tilted, defaults)
| Item | Value |
|---|---|
| Roof / inside setback / usable | 3,600 / 3,344 / 3,184 m2 |
| Keep-out left empty | 150 m2 |
| Positions, tables, rows | 790, 28, 6 |
| Modules per row (south to north) | 122, 148, 128, 110, 134, 148 |
| Pitch, GCR, profile angle | 6.45 m, 0.709, 30.5 deg |
| Row lower edges y | 1.0, 7.45, 13.9, 20.35, 26.8, 33.25 m |

## Kept clear by each part of the keep-out
The positions of the layout with shaded positions allowed that fall in each part (`Keepout.positions`, Phase 5):
parapet 12, stair room 18, water tank 9, AC units 0, 0, 0 and 1. The layout with shaded positions allowed has
834 positions: the grid begins at the edge of what is usable, which the keep-out moves, so the parts together
(40) are not exactly the 44 the keep-out takes away.

## Strings at 1500 V
Series range 14 to 29, nominal 26. Voc cold 51.04 V per module. 4 strings per MPPT, 24 per inverter.

| Option | n x s x k | Modules | kWp | DC/AC | Clipping | MWh/yr | kWh/kWp | PR | Status |
|---|---|---|---|---|---|---|---|---|---|
| A, recommended | 29 x 22 x 1 | 638 | 357.28 | 1.30 | 3.4 % | 617.8 | 1,729 | 86.6 % | tick |
| B | 26 x 24 x 1 | 624 | 349.44 | 1.27 | 2.7 % | 607.7 | 1,739 | 87.0 % | tick |
| C | 28 x 22 x 1 | 616 | 344.96 | 1.25 | 2.4 % | 602.9 | 1,748 | 87.5 % | tick |
| D, below target | 26 x 27 x 2 | 702 | 393.12 | 0.71 | 0.0 % | 700.9 | 1,783 | 89.2 % | exclamation |
| E, below target | 28 x 25 x 2 | 700 | 392.00 | 0.71 | 0.0 % | 700.5 | 1,787 | 89.4 % | exclamation |

At 1000 V the maximum series length is 19.

## Option A
- AC 275 kW; CUF 25.6 % AC, 19.7 % DC; in-plane 1,998.0 kWh/m2.
- P50 617.8, P75 600.2, P90 584.2 MWh (sigma 4.24 %).
- Monthly MWh, Jan to Dec: 62.0, 58.8, 68.4, 64.1, 54.9, 46.9, 31.5, 38.5, 37.5, 53.4, 53.5, 48.5.
- Years 1, 5, 10, 15, 20, 25: 617.8, 605.6, 590.6, 576.0, 561.7, 547.8 MWh; 25-year total 14,554 MWh.
- CO2 442.4 t/yr. Module area 1,646 m2, 45.7 % of the roof.
- MPPT loading 4, 4, 4, 4, 3, 3 strings. String Voc cold 1,480 V.
- BOM: 638 modules, 1 inverter, 27 tables, 1,681 m DC cable, 44 connector pairs, 30 m AC cable, 1 ACDB.

| Loss step | Change |
|---|---|
| Global horizontal irradiation | 1,822.9 kWh/m2 |
| Transposition to plane (15 deg) | +9.60 % |
| Far shading, horizon | -0.01 % |
| Near shading, linear | -0.35 % |
| IAM | -2.22 % |
| Soiling | -2.00 % |
| Bifacial rear gain | +3.65 % |
| Array nominal energy at STC | 706.4 MWh |
| Irradiance level | -0.48 % |
| Temperature | -4.08 % |
| Electrical shading | -0.56 % |
| Module quality | 0.00 % |
| LID (PAN) | -0.20 % |
| Mismatch | -1.00 % |
| DC ohmic | -0.95 % |
| Inverter efficiency | -1.33 % |
| Inverter clipping | -3.36 % |
| Night consumption | -0.00 % |
| AC ohmic | -0.76 % |
| Availability | -0.50 % |
| Energy to grid | 617.84 MWh |

## Other roof types on the same roof (recommended option 29 x 22 x 1 in both)
| Roof type | Positions | Energy | kWh/kWp | PR |
|---|---|---|---|---|
| Flat east-west, 10 deg | 940 | 572.6 MWh | 1,603 | 86.1 % |
| Sloped flush, 10 deg pitch, no parapet | 1,068 | 586.2 MWh | 1,641 | 83.4 % |

## Engine timings (M-series laptop)
Layout 0.05 s; shading and precompute 7.6 s; options 2.8 s.
