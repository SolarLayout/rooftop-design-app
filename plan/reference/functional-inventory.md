# Functional inventory of the desktop app (v0.1.0, commit bf2cb67)

The contract for "nothing is lost". It lists capabilities, not screens. Source: a full read of
`../rooftop-design` (`rooftop_core/*`, `rooftop_ui/main_window.py`, `widgets.py`, tests, samples).

Pipeline: `Project` (inputs) -> `Design`: `generate_layout()` -> `load_weather()` -> `prepare()` (hourly shading,
transposition) -> `size_series()` -> `run_options()` (each option is a full 8,760 h simulation) -> the chosen
option drives every result and export.

## 1. Inputs

### 1.1 Project, site, roof
| Input | Unit / type | Default | Range / choices | Field |
|---|---|---|---|---|
| Project name | text | "Untitled roof" | desktop had no edit control | `Project.name` |
| Roof source | enum | coordinates | kmz, dxf, coordinates | `Roof.source` |
| Roof file | KMZ/KML or DXF | none | | `roof_input.file` |
| DXF units | enum | m | m, mm | `roof_input.dxf_units` |
| Latitude | deg, 5 dp | 18.52 | -80..80; from file for KMZ | `Roof.lat` |
| Longitude | deg, 5 dp | 73.86 | -180..180; from file for KMZ | `Roof.lon` |
| Open satellite view | link | | Google Maps satellite at lat, lon | |
| Outline mode | enum | rect | rect, corners (files force corners) | `roof_input.mode` |
| Length (long side) | m | 30 | 2..2000 | `roof_input.length` |
| Width | m | 20 | 2..2000 | `roof_input.width` |
| Long side faces | deg, compass name shown | 180 | 0..359.9 | `roof_input.facing` |
| Corner points | table of x east, y north (m) | current outline | 3 or more rows; editable after import | `Roof.outline` |
| Roof type | enum | flat_tilted | flat_tilted, flat_ew, sloped_flush | `Roof.roof_type` |
| Roof pitch (sloped) | deg | 10 | 0..60 | `Roof.slope_deg` |
| Slope faces (sloped) | deg | 180 | 0..359.9 | `Roof.slope_azimuth_deg` |
| Parapet height | m | 0.9 | 0..5; set to 0 when switching to sloped | `Roof.parapet_h` |
| Edge setback | m | 1.0 | 0..10 | `Roof.setback_m` |
| Walkway width | m | 0.6 | 0..3 | `Roof.walkway_m` |
| Walkway every | int | 24 modules (tilted) / 4 rows or units | 0..500, 0 = none | `Roof.walkway_every_modules` / `_rows` |
| Clearance around obstacles | m | 0.5 | 0..5 | `Roof.obstacle_clearance_m` |
| Roof albedo | fraction | 0.20 | 0.05..0.9; hint "0.20 concrete, 0.60 white membrane" | `Roof.albedo` |

Not exposed: parapet thickness 0.2 m.

Import rules. KMZ/KML: largest polygon is the roof, other polygons and lines are obstacles, height from the
placemark name or description (`h = 2.5`), lat/lon from the roof centroid. DXF: largest closed polyline is the
roof, other closed polylines and circles are obstacles, name from the layer. Shape classification: circle ->
cylinder, line -> wall, near-rectangle -> box with rotation, else building. Missing heights become 1.0 m and
are listed to the user.

### 1.2 Obstacles (heights above the roof surface)
Kinds: box, cylinder, wall, tree, building. Add, remove, rename, select.

| Field | Unit | New-item default | Range | Kinds |
|---|---|---|---|---|
| name | text | "Box n", "Tank n", "Wall n", "Tree n", "Building n" | | all |
| x, y (centre) | m | roof centroid | -5000..5000 | box, cylinder, tree |
| length, width | m | 2 | 0.1..500 | box |
| rotation (counter-clockwise) | deg | 0 | -180..180 | box |
| diameter (tree: crown) | m | 2, tree 4 | 0.1..100 | cylinder, tree |
| height | m | 1.5, tree 6, building 8 | 0.05..200 | all |
| thickness | m | 0.2 | 0.05..5 | wall |
| crown starts at | m | 2.0 | 0..100 | tree |
| points `x, y; x, y; ...` | m | wall: centroid +/- 3 m; building: 10 m block 3 m east of the roof | wall 2+, building 3+ | wall, building |

Tree model: trunk 0.3 m to crown start, crown disc above. The parapet shows as one read-only entry
"Parapet (all edges)". List columns: name, shape, size, height.

### 1.3 Array
| Input | Unit | Default | Range | Field | Roof types |
|---|---|---|---|---|---|
| Tilt (hint from latitude, clamp 5..15) | deg | 15 | 0..45 | `tilt_deg` | tilted |
| Orientation | enum | portrait | portrait, landscape | `orientation` | tilted, sloped |
| Modules in tilt | int | 2 | 1..4 | `modules_in_tilt` | tilted, sloped |
| Lower-edge clearance | m | 0.5 | 0..3 | `clearance_m` | tilted, E-W |
| Azimuth + "follow the roof edge" | deg | auto | 0..359.9 | `azimuth_deg` | tilted, E-W |
| East-west tilt | deg | 10 | 0..30 | `ew_tilt_deg` | E-W |
| East-west ridge gap | m | 0.3 | 0..2 | `ew_ridge_gap_m` | E-W |
| Row pitch + "shade-free in the window" | m | auto | 0.5..30 | `row_pitch_m` | tilted |
| Allow shaded positions | bool | off | | `allow_shaded` | all |
| Shade-free window from / to | solar h | 9.0 / 16.0 | 5..12 / 12..19, step 0.25 | `window_start_h`, `window_end_h` | all |
| Design day | enum | winter solstice | winter solstice, 21 Dec, 21 Jun, 21 Mar | `design_doy` | all |

No control on desktop: module gap 0.02 m, flush clearance 0.1 m.

### 1.4 Module (PAN) and inverter (OND)
- PAN: empty means the bundled `Test.PAN`. Shown: file, manufacturer, model, Wp, size, Voc, Isc, bypass diodes,
  bifaciality, twin half-cell, and "Coefficients (one-diode model | PAN file): Voc, Vmp, Pmpp in %/degC".
- OND: empty means the bundled `Test-S.ond`. Shown: file, manufacturer, model, kW, MPPT count, inputs,
  MPPT range, nominal V, max V. A new OND clears the Imax override.
- Read errors keep the previous file and show the engine message.

### 1.5 Electrical
| Input | Unit | Default | Range | Field |
|---|---|---|---|---|
| System voltage | V | none, must be chosen | 600, 1000, 1500 | `system_voltage` |
| Max current per MPPT | A | OND, else IMaxDC / MPPT count | 1..2000 | `imax_mppt_override` |
| Lowest ambient + "from the weather" | degC | weather | -50..40 | `t_min_override` |
| Highest ambient + "from the weather" | degC | weather | 0..60 | `t_max_override` |
| Cell rise over ambient | degC | 25 open rack, 35 flush | 0..60 | `cell_rise_c` |
| Custom option n, s, k | int | 26, 24, 1 | 1..60, 1..5000, 1..200 | `custom` |
| Chosen option | pick | first | | `chosen_option` |
| AC cable per inverter | m | 30 | 1..2000 | `ac_cable_m` |

### 1.6 Weather
Source: PVGIS TMY (with horizon), NASA POWER (year 2023, no horizon), CSV (time and GHI required; DNI, DHI,
temperature, wind optional). Weather is embedded in the project so it opens offline.

### 1.7 Losses, bifacial, uncertainty
| Input | Unit | Default | Range | Field |
|---|---|---|---|---|
| Soiling | % | 2.0 | 0..30 | `soiling_pct` |
| LID + "from the PAN file" | % | PAN, else 1.5 | 0..10 | `lid_pct` |
| Module quality | % | 0.0 | -5..10 | `quality_pct` |
| Mismatch | % | 1.0 | 0..10 | `mismatch_pct` |
| DC ohmic at STC | % | 1.5 | 0..10 | `dc_ohmic_pct` |
| AC ohmic at nominal | % | 1.0 | 0..10 | `ac_ohmic_pct` |
| Availability | % | 99.5 | 80..100 | `availability_pct` |
| Thermal Uc | W/m2K | 29 / 20 / 15 by roof type | 5..60 | `uc` |
| Degradation | %/yr | 0.5 | 0..3 | `degradation_pct` |
| Rear-side gain | bool | on; off for monofacial | | `bifacial` |
| Rear shading + mismatch | % | 10 | 0..50 | `rear_loss_pct` |
| Weather variability | % | 3.0 | 0..20 | `weather_sigma_pct` |
| Model and data | % | 3.0 | 0..20 | `model_sigma_pct` |
| Exceedance levels (three) | P | 50, 75, 90 | 50..99 | `p_levels` |
| Grid CO2 factor | t/MWh | 0.716 | 0..2 | `co2_t_per_mwh` |

## 2. Outputs

### 2.1 Headline
DC kWp, AC kW, DC/AC (flagged outside target), modules and n x s, energy, PR, yield, roof area and % covered,
"Voc coefficient" flag. Without an option: roof area, positions, "No stringing yet".

### 2.2 Roof and layout
Roof and inside-setback area; pitch note with window, GCR and limiting profile angle; E-W unit gap; design day
text; far shading note; weather summary; positions, used, strings.

### 2.3 Plan
Roof, setback line, hatched keep-out, modules coloured by MPPT, unused positions, string labels, obstacles with
grouped labels, inverter symbols, north arrow, scale bar, legend.

### 2.4 Shading
Shadow plan at a solar time on the design day; read-out with sun height and bearing; near linear %, electrical
beyond linear %, far %, keep-out m2.

### 2.5 String sizing
Series range values and bar; limit note; verdicts (exact strings below); options table (option, series,
strings, modules, kWp, inverters, DC/AC, clipping, MWh, kWh/kWp, status); options note; per-MPPT table
(inverter and MPPT, strings, Imp, limit, Isc, limit, kWp, status).

Option logic: series candidates `{nominal, max, max(min, max-1)}`; strings formed along rows and ranked least
shaded first; up to three combinations per length; each fully simulated; sorted in-target first then by energy;
at most 5; first is "Recommended" only if in target. DC/AC verdict: below 1.10 "below target", above 1.30
"above target", above 1.40 "heavy clipping".

### 2.6 Energy
Energy, PR, yield, CUF AC and DC, in-plane and horizontal irradiation, clipping, sigma, LID, CO2, monthly (12),
P-values, 25 years, hourly series. Loss diagram, 21 rows in this order: global horizontal irradiation,
transposition, far shading, near shading linear, IAM, soiling, bifacial rear gain, array nominal energy at STC,
irradiance level, temperature, electrical shading, module quality, LID, mismatch, DC ohmic, inverter
efficiency, inverter clipping, night consumption, AC ohmic, availability, energy to grid.
Summary rows: site, roof, structure, module, inverter, stringing, DC capacity, AC capacity, weather, losses,
energy year 1, specific yield, module area, CO2 avoided. 25-year table: years 1, 5, 10, 15, 20, 25, total.

### 2.7 SLD, BOM, cable schedule
SLD: inverter boxes, MPPT blocks with string counts, ACDB, meter, grid. BOM lines: module, inverter, mounting
tables, DC cable, connector pairs, AC cable, ACDB. Cable schedule columns: string, inverter, MPPT, modules,
Voc cold, Isc, DC cable m, cable.

### 2.8 Messages to keep verbatim
- "Choose a system voltage to size the strings" / "600, 1000 or 1500 V. Nothing is sized until you choose."
- "No string length fits: at least {n_min} modules are needed for the {Vmin} V MPPT minimum, but at most
  {n_max} fit under {limit} V."
- "{n} in series fits: Vmp {V} V at STC, inverter nominal {V} V" with the Voc and Vmp detail line.
- "Voc coefficient {x} %/degC is outside the usual -0.35 to -0.20 %/degC for crystalline silicon. Check the
  datasheet and enter it if it differs."
- "Not in the OND: IMaxDC {A} A / {n} MPPT. Enter the datasheet value if it differs."
- "These obstacles have no height in the file and were set to 1.0 m."
- Progress: "Fitting modules on the roof", "Loading {source} weather", "Computing hourly shading for every
  module", "Applying the losses", "Sizing strings and simulating the options".

### 2.9 No system voltage
Layout, weather and shading still run. No options, no energy, no SLD, BOM or exports. Nothing preselected.

## 3. Exports
| Export | Content |
|---|---|
| PDF (A4 landscape, 6 pages) | 1 summary; 2 layout and strings; 3 shadows at window end with shading figures; 4 loss diagram, monthly chart, energy table; 5 cable schedule and BOM; 6 SLD |
| DXF (R2010, metres) | Layers ROOF, SETBACK, OBSTACLES, KEEPOUT, MODULES_UNUSED, INVERTERS, TEXT, one STRING_Snn per string |
| KMZ | Roof, obstacles named "{name} h={height}", used modules |
| Hourly CSV | 8,760 rows: time_utc_hour_start, ghi_w_m2, poa_eff_w_m2, t_cell_c, p_dc_kw, p_ac_kw |
| SLD image | PNG, A4 landscape, 200 dpi |
| Project `.rtd` | JSON, format 1; inputs and embedded weather; results recomputed on open |

## 4. Interaction on desktop (the floor, not the target)
Select obstacle from a list; double-click moves it; time slider in 15 min steps; play the window; click a row to
choose an option; colouring by MPPT only. No click-to-add, drag, hover, zoom, colour by string or by shade.

## 5. Gaps found (decide deliberately)
1. Project name not editable.
2. No Voc coefficient input although the warning asks for one.
3. Saved temperature overrides and custom option not restored into their fields on open.
4. Cell rise, Uc and Imax stored as "None = default", so a value equal to the default cannot be pinned.
5. DC cable always labelled 1500 V and 4 mm2.
6. PDF cable schedule stops at 28 strings.
7. NASA year and CSV time zone hard-coded.
8. One custom option at a time.
9. PAN and OND stored as absolute paths.
10. String inverters only; one module type and one inverter type per project.
