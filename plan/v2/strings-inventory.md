# V2 · Inventory of the user-facing strings

The evidence behind `plan/v2/audit.md`, category E, and the list to work through when the voice (`plan/v2/voice.md`)
is applied: every string of the web app and the API that reaches the user, by screen, with the file and line at `main`
dc34cf4 (2026-10-12). Read by an agent of the session, checked by sample.

**Path roots.** `W/` = `apps/web/` and `A/` = `apps/api/src/`.

**Scope.** I left out tests, `*.test.*`, `test-fixtures.ts` and the dev-only design kit (`W/components/kit/**`, `W/app/kit/**`). Strings built from values show the template as written in code: `${…}` is a value filled in at run time.

**Marks.**
- `[!J]` jargon a new user will not know.
- `[!S]` a full sentence where a label would do.
- `[!F]` flowery, dramatic or cute.
- `[!T]` tautological.
- `[!E]` exclamation mark.
- `[?]` awkward or ambiguous wording, outside your rules but worth a look.

There are no first-person strings ("we", "our") anywhere in scope. No user-visible string contains "!". The only "!" is a `" ! "` separator that `OptionsNote` splits on and never shows.

## Findings worth a look first

1. **Possible bug.** `W/components/shell/NoOptionsCard.tsx:34` always says "Open the Strings lens". Its link comes from `W/lib/flow/no-options.ts:5`, which sends `no_positions` ("No module fits on this roof") to the **Roof** lens. The label is wrong in that case. — still so (checked on V2 · 12's branch): `NoOptionsCard` says "Open the Strings lens" whatever `decision.path` is, and `pathOfNoOptions` still sends `no_positions` to the Roof step. A bug, reported, not fixed here. The label also uses "lens", an internal word (§6).
2. **"Enter by hand" is worded three ways:**
   - "Enter dimensions by hand" (`W/lib/outline/first-step.ts:28`)
   - "Enter the roof by hand" (`W/components/find/Find.tsx:79`)
   - "By hand" (docs)

   The Roof-lens obstacle panel reuses "Enter dimensions by hand" only in a comment.
3. **Saving state is worded four ways:**
   - "Not saved" (`W/components/shell/SaveState.tsx:24`)
   - "Not kept on this device" (`SaveState.tsx:20`)
   - "Not saved on this device" (`W/components/shell/notes-view.ts:126`)
   - "Saved on this device" (`SaveState.tsx:18`)
4. **"Remove" is the dismiss button of the height dialog.** The new shape is not added yet, so this is really Cancel (`W/components/find/HeightDialog.tsx:59`).
5. **"The engine" appears in many user strings.** Examples: "The engine's shadows…", "summed up by the engine", "The PNG is the engine's drawing on A4", "in the engine's order". It is an internal term that users are never introduced to.
6. **Unclear unit "mod".** It is the unit of the Roof field "Every" (`W/lib/studio/roof-fields.ts:18`).
7. **"before" as an adjective reads oddly:** "Values are of the design before", "They are of the design before", "The values shown are of the design before", "The positions shown are of the design before".

---

## Home

| Text | File |
|---|---|
| "SolarLayout Rooftop" (page title) | W/app/page.tsx:4 |
| "Rooftop PV design." (meta description) [!J PV] | W/app/metadata.ts:10, W/app/manifest.ts:10 |
| "Docs" (header link) | W/components/home/Home.tsx:137 |
| "Find your roof." / "Design it in 3D." (H1) | W/components/home/Home.tsx:29 |
| "Search the map, outline your roof, and get layout, shading, stringing and 8,760-hour energy yield on one live model." [!J "8,760-hour energy yield", "stringing"] | Home.tsx:30 |
| "Find my roof" (hero button) | Home.tsx:31 |
| "Import a drawing" / "KMZ, KML or DXF with the roof and its obstacles" [!J KMZ/KML/DXF] | Home.tsx:37 |
| "Open a project" / "A saved .rtd file, from this device or a colleague" [!J .rtd] | Home.tsx:38, W/components/shell/OpenProject.tsx:17 |
| "Demo project" (card caption, aria) | W/components/home/DemoCard.tsx:19 |
| "Open the demo" | DemoCard.tsx:20 |
| "Capacity" / "Energy, year 1" (stats) | DemoCard.tsx:54-55; W/components/home/DesignCard.tsx:135-136 |
| "Capacity and energy come with the run in the Studio" [!S] [?] | W/lib/flow/open-project.ts:27 (DemoCard.tsx:59) |
| "On this device" (H2) | W/components/home/OnThisDevice.tsx:26 |
| "Designs you save appear here." [!S] | W/lib/home/home-view.ts:27 |
| "Your designs are kept on this device." [!S] | home-view.ts:28 |
| Card menu: "Open", "Rename", "Duplicate", "Save a copy" (fact ".rtd"), "Delete" | DesignCard.tsx:34-38 |
| "Menu" (aria) | DesignCard.tsx:41 |
| "Open ${card.name}" (aria, thumbnail) | DesignCard.tsx:71 |
| "Name" (rename field label) | DesignCard.tsx:123 |
| "Waiting for a system voltage" [!J] | W/lib/home/cards.ts:24 |
| "Not run yet" | cards.ts:25 |
| "Copy of ${name}" | cards.ts:47 |
| Delete dialog: "Delete ${name}?" / "It is kept on this device alone." [?] / "Cancel", "Delete" | cards.ts:51; OnThisDevice.tsx:61-63 |
| "Edited just now" / "Edited ${n} minute(s)/hour(s)/day(s) ago" / "Edited yesterday" / "Edited ${d} ${Mon} ${yyyy}" | W/lib/device/kept-design.ts:85-91 |
| Roof words: "flat roof, tilted rows" / "sloped roof" / "${size} ${type}" (e.g. "90.0 × 40.0 m flat roof, tilted rows") | kept-design.ts:34-41 |
| Thumbnail aria: "The plan of the layout, north up: the roof, its obstacles and the module rows" [!S] | W/lib/device/thumbnail.ts:15 |
| Device errors: "The designs on this device could not be read" / "The design on this device could not be read" / "The design could not be kept on this device" / "The design could not be removed from this device", each followed by ": ${reason}." | W/lib/device/designs-db.ts:66-88 |
| Reasons: "this browser has no IndexedDB" [!J], "the browser gave no reason", "the database is open in another tab and blocks the change", "the transaction was given up" [!J] | designs-db.ts:24-62 |
| Opening: "The design kept on this device could not be opened: ${error}. The demo is open instead." [?] | W/lib/device/opening.ts:16-21 |
| "That design is no longer on this device." | opening.ts:38 |
| "No design is open: nothing can be kept." | W/lib/device/saving.ts:137 |

## Find (search, outline tools, obstacles, by hand, states and errors)

**Page and shell**

| Text | File |
|---|---|
| "Find and outline · SolarLayout Rooftop" | W/app/find/page.tsx:5 |
| "Back to home" (aria) | W/components/find/Find.tsx:303 |
| Steps pill: "Find", "Outline", "Build"; aria "Steps", "Done" | W/components/find/Steps.tsx:6-8, 25, 29 |
| "Step ${n} of 3" | Find.tsx:362 |
| Panel titles and leads (W/components/find/Find.tsx:71-79) | |
| "Outline the roof" — "Click each corner. Drag a corner to adjust it, or type a length you have measured." [!S] | :71 |
| (rectangle) "Drag a box across the roof, then turn it to the building by its handle. Drag a corner to adjust it." [!S] | :72 |
| (detect) "Click inside the building. Where its footprint is known, it is proposed as the outline, to accept or adjust." [!S] [?] | :73 |
| (box) "Drag a box across the thing on the roof, then turn it by its handle. Its height is asked right after." [!S] | :74 |
| (tank) "Drag from the middle of the tank to its edge. Its height is asked right after." | :75 |
| (wall) "Click each point of the wall; click the last again, or press Enter, to end it. Its height is asked right after." [!S] | :76 |
| (building) "Click the corners of the building beside the roof; click the first again to close it. Its height is asked right after." [!S] | :77 |
| "Build the roof" — "The roof rises in the Studio; the array fills it at once." [!F] | :78 |
| "Enter the roof by hand" — "Type what you have measured. The roof is drawn as you type; Faces is where its long side looks." [?] | :79 |
| "Find the roof" (title, step find) | Find.tsx:154 |
| "Roof type" (section) | Find.tsx:387 |
| "Building the roof" (busy) / "Build this roof" (primary) | Find.tsx:402, 405; W/lib/outline/build-request.ts:24 |
| "Enter dimensions by hand instead" / "Draw on the map instead" | Find.tsx:410, 414; W/components/find/NoMap.tsx:16 |
| "The outline could not be shown on the map." | Find.tsx:237 |
| "The roof could not be built. Try again." | Find.tsx:259 |

**First step (Start here).** Lead and ways are in W/lib/outline/first-step.ts; layout is in W/components/find/FirstStep.tsx.

- "Start here", "The search understands" [!F mild personification], "Press one to put it in the search.", "Three steps": FirstStep.tsx:34, 51, 62, 67
- Lead "Find the building first: the map flies to it, close enough to outline its roof." [!S] [!F "flies"]: first-step.ts:31
- Ways:
  - "Search for the building" / "An address, coordinates or a maps link"
  - "Use my location" / "When you are at the building"
  - "Enter dimensions by hand" / "The roof is measured already"
  - first-step.ts:26-32
- Examples: "Address" "Koregaon Park, Pune"; "Coordinates" "18.53621, 73.89380"; "Degrees" "18°32′10.4″N 73°53′37.7″E"; "Maps link" "google.com/maps/@18.53621,73.89380": first-step.ts:20-23
- Steps: "Find" — "the map flies to the building" [!F]; "Outline" — "trace the roof, then what stands on it"; "Build" — "the Studio opens, the array on the roof": first-step.ts:35-37
- No-map variant:
  - "The map cannot be shown here. The roof can still be entered by its measurements, at a place you search or type." [!S]
  - "Its place, then its length, width and facing"
  - "the place, searched or typed" / "the roof's measurements, typed"
  - first-step.ts:42-48

**Search** (W/components/shell/Search.tsx)

- Placeholder and aria "Search an address or paste coordinates": :48
- "Use my location" (tooltip, aria): :51
- "Search" (button): :296
- "Searching" (ring) / "Searching for "${query}"": :247, 338
- "Places found" (aria), facts "Coordinates", "Swapped": :304-325
- "Nothing found for "${query}". Try a fuller address, or paste coordinates.": :330
- "Words cannot be searched for without a map key. Paste coordinates or a maps link instead." [!S] [!J "map key"] [?]: :49
- "Your location is not available. Allow it in the browser, or search for the address.": :50
- "The search failed. Try again.": :113

Search errors in W/lib/places/esri.ts:
- "Coordinates in the search" / "The address search is not available right now. Paste coordinates or a maps link instead.": :18-19
- "The search answered in a shape that cannot be read." [?]: :35, :39
- "The search cannot be reached. Check the connection and try again.": :74
- "The search answered ${status}. Try again in a moment." [!J HTTP status]: :76

Attribution:
- "Powered by Esri · Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community": esri.ts:14
- "© Overture Maps Foundation, ODbL": W/lib/map/overture.ts:14

Coordinate refusals in W/lib/places/place-input.ts. All are [!S], which is reasonable for error text.
- "These look like coordinates, but ${they / the latitude / the longitude} cannot be read. Write them as 12°54′50.74″N 77°29′31.16″E, or 12.91409, 77.49199.": :44-45
- "Check where it was copied from.": :46
- "−${x} is marked ${N/E}, and a minus means ${south/west}. Keep the minus or the letter, not both.": :206
- "Minutes and seconds go up to 59. The ${axis} has ${past}: check where it was copied from.": :211
- "Only the longitude is here. Add the latitude before it: ${EXAMPLE}." / "Only the latitude is here. Add the longitude after it: ${EXAMPLE}.": :228-229
- "Both are marked ${N or S / E or W}. The latitude takes N or S, the longitude E or W.": :245
- "The latitude comes first, and ${x} is more than 90°. Did you mean this?": :257
- "A latitude goes up to 90°, and this one is ${x}°. Check where it was copied from.": :259
- "A longitude goes up to 180°, and this one is ${x}°. Check where it was copied from.": :261

**Map states** (W/lib/map/map-state.ts)
- "The map is not available" / "This app has no key for the imagery. The roof can still be entered by its measurements." [!J "key"]: :17-18
- "This browser cannot draw the map" / "It has no WebGL. Try another browser, or enter the roof by its measurements." [!J WebGL]: :21-22
- "The imagery does not load" / "Check the connection and try again, or enter the roof by its measurements.": :25-26
- "Satellite map" (aria): W/components/find/RoofMap.tsx:141
- Map buttons: "North up", "Zoom in", "Zoom out": W/components/find/MapButtons.tsx:20, 27, 29
- Scale bar: "${n} km" / "${n} m": W/lib/map/scale-bar.ts:23

**Outline tools** (W/components/find/OutlineTools.tsx)
- "Corners", "Rectangle", "Detect building" (short "Detect"): :25-27
- "Box", "Tank", "Wall", "Building": :32-35
- "Outline tools" (aria), "Undo", "Redo", "Clear outline", "Show the tips": :54, 72, 75, 77, 85

**Outline panel** (W/components/find/OutlinePanel.tsx)
- "Find and outline" (aria), "Measurements", "Area", "Faces" ("${deg}° ${compass}"), "Corners", "Lengths", "Edges": :16, 39-47, 55
- "Click the first corner of the roof." / "${n} of at least 3 corners placed." / "${n} corners placed. Click the first corner, or press Enter, to close the outline.": :74-77
- "Square the corners" / "Snaps to 90° when you are within 3°": :82-85
- Edge names: "North", "North-east", "East", "South-east", "South", "South-west", "West", "North-west", "Edge ${n}": W/lib/outline/outline-state.ts:483-495

**Map labels**
- "Corner ${n}" (", selected"), "Corner ${n} of the obstacle", "Add a corner on edge ${n}", "Turn the roof" / "Turn the obstacle" / "Turn the rectangle", "${len} m": W/components/find/OutlineLayer.tsx:602, 619, 638, 749, 788, 838, 928
- Move readouts: "${x} m W/E · ${y} m S/N"; "${turn} · faces ${deg}° ${compass}": W/lib/outline/roof-move.ts:98-106
- "${name} · ${move}" / "${name} · ${size} · turned ${deg}°": W/lib/outline/obstacle-move.ts:66-68

**Detect building** (W/components/find/DetectedCallout.tsx)
- "Footprint found · ${n} corners · ${area} m²" / "No footprint known here": :29
- "From Overture Maps · approximate, about ${x} m. Accept it, or drag the corners to the roof edge you see." [!S]: :35
- "Outline the roof by corners or by a rectangle instead.": :36
- "Use this outline", "Close": :41, 31

**Tips** (W/lib/outline/tips.ts; W/components/ui/Tip.tsx)
- "Move or turn the roof": "Click"/"Press" — "inside the roof to pick it up"; "Drag" — "inside it to move it" / "with one finger inside it to move it"; "◯" — "drag the round handle to turn it"; "← ↑ → ↓" — "nudge 0.1 m, with Shift 1 m"; "2 fingers" — "move the map, as always": tips.ts:14-25
- "Move or turn an obstacle": "Click"/"Press" — "an obstacle to pick it"; "Drag" — "it to move it"; "◯" — "turns a box or a building"; "Delete" — "removes it": tips.ts:29-39
- "Got it", "Hide the tips" (aria): Tip.tsx:48, 35
- "Show me how": W/components/shell/help/ways-in.tsx:19

**Obstacles on Find**
- "Obstacles"; empty: "None yet. Draw a box, a tank, a wall or a building with the tools on the map. Each asks its height." [!S]: W/components/find/ObstacleList.tsx:26, 29
- "Remove ${name}" (aria): ObstacleList.tsx:54
- Default names: "Box ${n}", "Tank ${n}", "Wall ${n}", "Building ${n}"; facts "${a} × ${b}", "⌀ ${d}", "${len} m", "${area} m²", "${size} · h ${h} m", "${name} · h ${h} m": W/lib/outline/obstacles.ts:19-107

Height dialog (W/components/find/HeightDialog.tsx):
- "Height of the ${kind}": :55
- "Remove" [?, acts as Cancel]: :59
- "Add the ${kind}": :60
- "The imagery cannot give it. Enter its height above the roof surface." [!S]: :63
- "Name", "Height": :72, 75

**By hand** (W/components/find/ByHandPanel.tsx)
- "Place", "Latitude", "Longitude": :47, 51-52
- "From the search above, or typed. Five decimals; north and east are positive." [!S]: :54
- "Shape" (Segmented "Rectangle" / "Corners", W/lib/outline/shapes.ts:7-8): :57-61
- "Length", "Width", "Long side faces": :65-68
- "Corner", "East", "North", "East of corner ${n}", "North of corner ${n}", "Remove corner ${n}", "Add a corner": :73-87
- "Metres east and north of the middle of the roof, in order around it. Three at least.": :89

Plan view (W/components/find/PlanView.tsx):
- "Plan of the roof, north up" (aria): :46
- "The plan of the roof is drawn here" / "Enter its length and width, or its corners.": :63-64

**Roof type cards** (W/lib/geometry/roof-types.ts:7-9)
- "Flat, tilted rows" (short "Tilted rows") — "Rows facing the equator"
- "Flat, east-west" ("East-west") — "Back-to-back, low tilt"
- "Sloped, flush" ("Sloped") — "Modules follow the roof pitch"

## Studio shell (top bar, lens nav, vitals, notes, project menu, save state)

**Page titles**
- "${Lens} · Studio · SolarLayout Rooftop": W/app/(workspaces)/studio/[lens]/page.tsx:12
- Workspaces "Studio", "Performance", "Handover": W/lib/routes.ts:6-8
- Lenses "Roof", "Array", "Sun", "Strings": routes.ts:15-18

**Top bar** (W/components/shell/TopBar.tsx)
- "Home" (aria logo): :83
- "Present": :53
- "Export": :68
- "Nothing to review" / "1 note to review" / "${n} notes to review" (aria): :73

**Navigation and logo**
- Nav aria "Workspaces", "Lenses": W/components/shell/WorkspaceNav.tsx:27; W/components/shell/LensNav.tsx:37
- Inspector aria "${Lens} inspector"; sheet "Inspector": W/components/studio/Studio.tsx:61, 68
- Logo "SolarLayout Rooftop" / "Rooftop": W/components/shell/Logo.tsx:12, 19

**Vitals** (W/components/shell/vitals-view.ts; aria "Design vitals" in Vitals.tsx:182)
- Cells: "Energy, year 1", "DC capacity", "AC capacity", "DC/AC" [!J], "Modules", "PR" [!J], "Yield": :77-88
- Layout-only cells: "Roof", "Positions", "If all were used" [?]: :95-102
- "Updating energy", "Opening ${name}" / "Opening the design", "Try again": :64-66
- "Energy was not updated" / "Values are of the design before" [?]: :67
- "Energy was not computed" / "There are no values yet": :68
- "Nothing to review" / "Every check of the design fits." [?]: :111
- "${detail} · Try again": :129
- Units: "of ${positions}", "MWh", "kWh/kWp" [!J]: W/lib/format/vitals.ts:15-25

**Notes to review** (W/components/shell/NotesDrawer.tsx; W/components/shell/notes-view.ts)
- "Notes to review" (H2), "Close", "Note" (aria), "Fits" (aria): NotesDrawer.tsx:66, 71, 31, 76
- "Nothing to review" / "Every check of the design fits.": NotesDrawer.tsx:78-79
- Actions: "Try again", "Open Array", "Open Strings", "Open Performance": notes-view.ts:39-44
- Where-lines: "Module · Array lens", "Layout · Array lens", "Weather · Performance", "Option ${L} · Strings lens", "This design · on this device": notes-view.ts:91-128
- Note titles:
  - "Layout was not updated", with "The positions shown are of the design before" [?] / "There are no positions yet": :108-110
  - "Energy was not updated" / "Energy was not computed", with "The values shown are of the design before" [?] / "There are no values yet": :117-119
  - "Not saved on this device": :126
- Target words: "In target", "Outside the DC/AC target" [!J], "${Below} the DC/AC target": notes-view.ts:68-70
- Note titles are otherwise built from the API text (the words before the first number or verb, e.g. "Voc coefficient" [!J]).

**Save state** (W/components/shell/SaveState.tsx)
- "Saved on this device", "Saving", "Not kept on this device", "Not saved" [? inconsistent with the others]: :18-24

**Project menu** (W/components/shell/ProjectSwitcher.tsx)
- "Project" (aria): :47
- "This design", "On this device": :185, 188
- "Designs you save appear here.": :190
- "Name", "Rename": :123, 143
- Actions: "New design" (fact "Find the roof"), "Open a project" (".rtd"), "Import a drawing" ("KMZ, KML, DXF") [!J], "Save a copy" (".rtd"), "Home", "Docs": :72-78

**Other shell**
- "Open the Strings lens" (decision card button) [? wrong for no_positions, see finding 1]: W/components/shell/NoOptionsCard.tsx:34
- "This part is not built yet.": W/components/shell/NotBuiltYet.tsx:3
- Toast "Choose another" (when the chosen stringing is gone): W/components/shell/use-says-choice-gone.ts:10
- Choice-gone toast words (W/lib/flow/choice-gone.ts:40-48):
  - "The stringing you chose, ${n} in series × ${s} strings on ${i} inverters, no longer fits this design." / "The stringing you chose no longer fits this design." [!S, long]
  - "Option ${L}, ${caption}, is used instead: ${instead}."
- App error: "Something went wrong in the app: ${what}. Try again; if it fails again, report it." [!S] [? exposes internals]: W/lib/flow/design-flow.ts:61; W/components/performance/use-weather-load.ts:23
- API client:
  - "The design run ended before its result arrived. Run it again.": W/lib/api/client.ts:44
  - "The server cannot be reached. Check the connection and try again.": W/lib/api/errors.ts:4
  - "The server answered ${status} in a form that cannot be read. Try again; if it fails again, report it." [!J status]: W/lib/api/errors.ts:31

## Roof lens

- Sections: "Location", "Location and outline" (aria), "Roof type", "Edges and access", "Obstacles · ${n}": W/components/studio/RoofInspector.tsx:148-172; W/components/studio/ObstaclePanel.tsx:331
- "Edit" / "Edit the outline" (aria): RoofInspector.tsx:92, 80
- Location card facts: "Outlined on satellite", "Entered by hand", "From a file", "From a file"; "${a} × ${b} m" or "${area} m²"; " · faces ${deg}° ${compass}"; "${n} corners · ${n} obstacles": W/lib/geometry/roof-card.ts:21-52
- Review note (W/lib/studio/review-heights.ts; button at RoofInspector.tsx:111):
  - "These obstacles have no height in the file and were set to 1.0 m.": :7
  - "${n} to review": :12
  - "Review": RoofInspector.tsx:111
  - Hint "Enter the real height. The file gave none; 1.0 m stands until you do" [!S] [?]: :10
- Edges and access fields (W/lib/studio/roof-fields.ts:15-23):
  - "Parapet" [!J]
  - "Setback" [!J]
  - "Walkway"
  - "Every" ("mod" [? unclear unit] / "rows") [? label alone is unclear]
  - "Clearance"
  - "Albedo" [!J]
  - "Pitch"
  - "Faces"
- Obstacle panel (W/components/studio/ObstaclePanel.tsx):
  - "Add" / menu "Add an obstacle": :246, 249
  - "Name" (aria), "Remove ${name}", "Height to review", "Remove", "Next", "Add the ${kind}": :76, 158, 195, 349, 378, 352
  - Empty "None yet. Add a box, a tank, a wall, a tree or a building." [!S]: :359
  - Points: "Point", "East", "North", "East of point ${n}", "North of point ${n}", "Remove point ${n}", "Add a point": :99-113
  - "Metres east and north of the middle of the roof, in order. Two/Three at least.": :116
  - "Parapet, all edges" / "h ${h} m": :394-395
- Obstacle kinds and fields (W/lib/geometry/obstacle-fields.ts):
  - Kinds "Box", "Tank", "Wall", "Tree", "Building": :47-51
  - Fields "Length", "Width", "Height", "Rotation", "East", "North", "Diameter", "Crown starts at", "Thickness", "Crown ⌀": :26-34, 129
  - Menu facts "${l} × ${w} m", "⌀ ${d} m", "crown ⌀ ${d} m", "${len} m, points", "beside the roof, points": :59-63
- Stage callouts for obstacles (W/lib/geometry/obstacles.ts:108-115):
  - "${name} · draft/selected"
  - "${size} · type its height to add it"
  - "${size} · height to review"
  - "drag to move" / "moved by its points in the list"
  - "${size} from ${trunk} to ${h} m · …"
  - "${size} · ${h} m high · …"
- Drag readouts: "Obstacle edited on the roof", "East ${x} · North ${y}", "Rotation ${deg}°", "${h} high", "crown ⌀ ${d}": W/lib/stores/drag.ts:70-76
- Keep-out callouts on stage (W/lib/geometry/keepout.ts:31-34):
  - "The parapet" / "An obstacle"
  - "Shaded in the window" / "Kept clear" · "${n} position(s)" / "no whole position" [?]
  - "${what} shades this area between ${hh:mm} and ${hh:mm}"
- Roof line under the title: "${area} · ${area} inside the setback · ${n} obstacles" / "no obstacles" [!J setback]: W/components/studio/stage-view.ts:12-22
- Callout "Roof · selected" / "${shape} · ${area} m²": W/lib/scene/pick.ts:59

**Stage, shared by all lenses**
- "3D scene" (aria): W/components/scene/Modules.tsx:139
- View: "3D view", "Plan" ("Plan view"), "View" (aria), "Fit" / "Fit the roof": W/components/studio/ViewControls.tsx:28-56
- "Layers", "Satellite imagery", "Off: the plain grid", "Close": ViewControls.tsx:36-38, 117
- North button aria (W/lib/scene/projection.ts:40-43):
  - "North: the view looks north"
  - "North: the view looks south"
  - "North: the view looks ${n}° east of north"
  - "North: the view looks ${n}° west of north"
- 3D failure:
  - "This browser cannot draw the roof in 3D." / "The browser stopped drawing the roof in 3D.": W/components/studio/stage-words.ts:4-5
  - "Plan of the roof, north up": W/components/studio/PlanFallback.tsx:29
- Imagery: "The ground: ${n} of ${m} tiles of the imagery did not come; their squares are plain." [?]: W/components/scene/Ground.tsx:81
- Failed chips (Try again): "The layout was not updated" / "The sun was not updated": W/components/studio/stage-view.ts:79, 85
- Screen-reader list "On the roof" (W/components/studio/Stage.tsx:195-241):
  - "Roof, ${n} corners, ${a} m², parapet ${h} m, selected"
  - ", height to review", ", position ${n} selected"
  - "The ground is the satellite imagery" / "The ground is plain, with a grid"
  - "The strings follow the design run"
  - "The engine's shadow outlines at ${hh}: ${n} polygon(s)" [!J]

## Array lens

- "Module" (section): W/components/studio/ArrayInspector.tsx:58
- Module card (W/lib/studio/module-card.ts):
  - "${maker} · ${W} Wp" [!J Wp]: :14
  - "${l} × ${w} m · bifacial ${x}" [!J bifacial]: :15
  - "Voc ${v} V · Isc ${a} A · ${n} diodes" [!J Voc, Isc, diodes]: :11
  - "Coefficients (${source}): Voc …, Vmp …, Pmpp … %/°C" [!J]: :17
- "Reading the module with the first run" [?]: W/components/studio/ModuleCard.tsx:52
- "Change" (tooltip "Choose a module, or use a PAN file" / "Choose from ${n} modules, or use a PAN file" [!J PAN]): W/components/studio/ChangeButton.tsx:15; W/lib/equipment/card-words.ts:6-13
- Mounting (W/components/studio/ArrayMounting.tsx):
  - "Mounting", "Tilt", "East-west tilt" (hint "Each side, away from the ridge"), "Orientation" ("Portrait" / "Landscape"), "Modules in tilt" [? unclear], "Lower-edge clearance", "Ridge gap": :23-65
  - Tilt hint "Latitude ${x}° N/S suggests ${t}°": W/lib/studio/array-fields.ts:33
  - Sloped tilt: "Follows the roof pitch · ${deg}° facing ${bearing} · set in the Roof lens": W/lib/studio/array-view.ts:36
- Spacing (W/components/studio/ArraySpacing.tsx):
  - "Spacing", "Row pitch" [!J], "Shade-free row pitch" (switch), "Azimuth" [!J], "Follow the roof edge" (switch): :80-107
  - Row pitch line "Shade-free · GCR ${x} · profile angle ${y}°" [!J GCR, profile angle]: W/lib/studio/array-fields.ts:59-60
  - "Shade-free would be ${x} m": array-fields.ts:64
  - Azimuth lines: "Follows the roof edge closest to the equator"; "The ridges run square to the roof edge closest to the equator" [?]; "The roof edge closest to the equator faces ${bearing}": W/lib/studio/array-view.ts:17-29
- Shade-free window:
  - "Shade-free window" (range, note "solar time" [!J]): ArraySpacing.tsx:111-118
  - "Design day" ("Winter solstice", "21 Jun", "21 Mar"): ArraySpacing.tsx:25-27, 126-127
  - "Allow shaded positions": ArraySpacing.tsx:129-130
  - "On: positions shaded inside the window are used too" / "Off: positions shaded inside the window stay empty" [!S]: array-view.ts:41
- Array line: "${n} positions · ${n} tables · ${n} rows · ${area} of modules": W/components/studio/stage-view.ts:24
- Module callout: "Position ${n}" / "${Row/Unit} ${n} · ${tilt}° to the ${toward}": W/lib/scene/pick.ts:43-44

## Sun lens

- Tabs: "Shadows", "Shade map"; aria "Sun lens": W/components/studio/SunInspector.tsx:145-158
- Day:
  - "Day" ("21 Dec", "21 Mar", "21 Jun", "Any date"), "Day", "Month" (January…December): SunInspector.tsx:57-72; W/lib/flow/day-choices.ts:5-11
  - "Day ${n} · the design day is ${date}": SunInspector.tsx:76
  - "${date} is the design day: the winter solstice for this hemisphere" / "${date} is the design day of the array": W/lib/flow/sun-time.ts:94
- Sun at the hour:
  - "Sun at ${hh:mm}", "Height", "Bearing": SunInspector.tsx:92-97
  - "The sun is down" / "The sun was not fetched" / "The sun's day is on its way" [!F "on its way"] [?]: SunInspector.tsx:100
  - Bearing words "due south/north/east/west", "${deg}° W/E of south/north": sun-time.ts:23-35
- On the roof (switches):
  - "Sun path" — "The arc the sun follows on this day"
  - "Shade-free window" — "Thick part of the arc, ${from} to ${to}"
  - "Calculated shadow outlines" — "The engine's shadows, drawn over what you see" [!J engine]
  - SunInspector.tsx:109-128
- Shading over the year (W/components/studio/SunShading.tsx):
  - "Shading over the year": :40
  - Tiles "Near, linear" [!J], "Electrical, beyond linear" [!J], "Far, horizon" [!J], "Kept clear": :43-46
  - "Of the ${n} modules of option ${L}" / "Of all ${n} positions": W/lib/studio/sun-figures.ts:43, 50
- Shade map:
  - "Shade map"; "Each module is coloured by its near shading over the year, of all ${n} positions. Select/Tap a module for its value." [!S]: SunShading.tsx:73-77
  - Legend: "Near shading over the year", "${x} %", "Of all ${n} positions", "The shade map follows the design run" [?]: W/lib/scene/shade-map.ts:67-77
  - Module callout: "Position ${n} · row/unit ${n}" / "Near shading ${x} % over the year" / "… · string ${S}, ${x} %" / "… · not used by option ${L}": shade-map.ts:56-60
- Line under title: "${date} · winter solstice · shade-free from ${hh} to ${hh}": sun-time.ts:147-156
- Marker callout: "${hh:mm} · start/end of the shade-free window" / "Sun ${x}° high, ${bearing}": sun-time.ts:166-167
- Sunrise and sunset marks: "${hh} sunrise" / "sunset ${hh}": W/lib/scene/sun-marks.ts:42-43
- Timeline (W/components/studio/Time.tsx):
  - "Time" (aria), "Time of day", "solar time" [!J], "Shade-free"
  - "Play the day" / "Pause"; "${Play the day/Pause}, ${hh} solar time"
  - Keys tooltip: "an hour", "a day", "a quarter hour"
  - "The sun stays below the horizon all day" / "The sun stays above the horizon all day"
  - Time.tsx:21-23, 42, 87-88, 112, 130-136, 154-155, 201
- Readout: "${date}, ${hh} solar time, sun ${x}° high, ${bearing}" / "${…}, the sun is down": sun-time.ts:38-42
- "Sun path of ${date} from ${hh} to ${hh}, the shade-free window from … thicker": sun-time.ts:177-179

## Strings lens

**Inverter**
- "Inverter" (section, card aria): W/components/studio/StringsInspector.tsx:106; W/components/studio/InverterCard.tsx:39 — right
- Card facts (W/lib/studio/inverter-card.ts:20-33):
  - "${maker} · ${kW} kW · ${n} MPPT" [!J MPPT] — right (MPPT is the trade's name, §6)
  - "${A} A per MPPT, entered" — right
  - "Current per MPPT not in the OND" [!J OND] — done: "Current per MPPT not in the inverter file"
  - "${n} input(s)" — right (the plural follows the count: "1 input", "5 inputs")

**System voltage** (W/components/studio/SystemVoltage.tsx)
- "System voltage", options "600 V / 1000 V / 1500 V": :32-36 — right
- "Sized to the equipment" (aria): :41 — right
- "Use ${v} V": :64 — right
- Who (W/lib/studio/voltage-words.ts:85): "Your choice" / "Set for ${country}" / "Set by the app" — gone (now set-by.ts's "Yours" / "Set for ${country}" / "Default", V2 · 3)
- Lines (voltage-words.ts):
  - "600 V, the limit for homes in ${the United States and Canada / Canada (CE Code, Section 64) / ${country} (NEC 690.7)}. Change it if the site allows more." [!J code refs]: :52-53 — right (the codes are what the installer checks)
  - "${v}, the usual limit for rooftops ${in ${country} / outside the United States and Canada}. Change it if the site needs another.": :55-56 — right
  - "No string length fits under ${v}; at ${v2} one does. Raise it only if the site's code allows." [!S]: :71 — done: "No string length fits at ${v}. One fits at ${v2}. Raise it only if the site's code allows."
  - "${v} is taken for this module: its file gives no limit." / "This ${inverter/module} takes up to ${v}." + " Raise it only if the site's code allows.": :75-76 — done: "The module file gives no limit, so the app takes ${v}." / "This ${inverter/module} takes up to ${v}." (the second right)
  - "Strings sized to ${v}, taken for this module: its file gives no limit." / "Strings sized to ${v}, this ${of}'s limit.": :87 — done: "Strings sized to ${v}, the app's value for a module file without a limit." (the second right)
  - Note title (same without the period) and detail "Its file gives no limit, so ${v} is taken. Your system is set to ${v}. The bill of materials follows the voltage set." [!S]: :91-92 — done: title "Strings sized to ${v}, the app's value for this module"; detail "The module file gives no limit, so the app takes ${v}. Your system voltage is ${v}, and the bill of materials uses it."

**Modules in series** (W/components/studio/SeriesRange.tsx; W/lib/studio/series-bar.ts)
- "Modules in series": SeriesRange.tsx:29 — done: "Modules per string" (board 12; the field of your own option and the proof behind Why too: "Modules per string", "29 modules per string fits at 1500 V", "Modules per string at 1500 V", W/lib/studio/fit-proof.ts)
- "${low} to ${high} fit" / "None fit": series-bar.ts:24-49 — right
- Ends "${n} · MPPT minimum" [!J], "${n} · Voc limit" [!J], "${n} · MPPT maximum" [!J]: series-bar.ts:28-34 — right (MPPT and Voc are the trade's names, §6; the help defines them)
- "Sizing the strings for ${v} V": SeriesRange.tsx:55 — right
- "Fits" (mark): SeriesRange.tsx:60 — right
- The verdict text comes from the API (see API section).

**Options** (W/components/studio/StringOptions.tsx)
- "Options", header "series × strings · kWp · DC/AC · MWh" [!J]: :69-71 — gone (the header row; "Options" stays, right)
- Card: "Option ${L}", "${s} × ${n} · ${kWp} · ${dcac}": W/lib/studio/option-cards.ts:30-31 — right (now "${s} × ${n} · ${kWp} kWp", V2 · 6)
- Mark "Over the current of an MPPT, or its limit not known: see the MPPT loading" [!S] [!J]: option-cards.ts:23 — done: "MPPT current over its limit, or the limit not known"
- "Outside the DC/AC target": StringOptions.tsx:211 — right
- Nothing fits: "Change the system voltage, the inverter or the sizing temperatures": W/lib/studio/strings-view.ts:31 — gone (the step's problem with a button for each remedy, V2 · 5)
- Line under title (W/components/studio/stage-view.ts:33-59):
  - "${n} strings of ${n} modules · ${n} inverters, ${n} MPPT each · ${n} positions not used" / "every position used" — right
  - "${n} positions ready · no strings yet / no string length fits / too few for a string" — right
- Custom option (StringOptions.tsx):
  - "Add your own", "Your own", "series × strings × inverters", "Series", "Strings", "Inverters", "Cancel", "Add" / "Change", "Change", "Remove": :133-192 — done: "Add your own option", "Your own option" (the heading, and the card of one the run refused), "Modules per string", "Strings", "Inverters", "Cancel", "Add option" / "Change option", "Change", "Remove"; "series × strings × inverters" gone
  - Field hints "${low} to ${high} fit", "No string of ${n} fits on the roof", "${a} to ${b} of ${n} fit" [?], "1 to ${n}": W/lib/studio/custom-fields.ts:33-38 — done: "Strings of ${n}: ${a} to ${b} fit" (the others right)
  - "${s} × ${n} · ${i} inverter(s)": custom-fields.ts:61 — right (the plural follows the count)

**Inverter limits and cabling** (W/components/studio/InverterLimits.tsx)
- "Inverter limits and cabling", "Current per MPPT" [!J], "AC cable per inverter": :48-72 — right (MPPT is the trade's name)
- Details (W/lib/studio/inverter-fields.ts):
  - "${A} · from the OND" [!J] — done: "${A} · from the inverter file"
  - "${A} · IMaxDC ${x} A ÷ ${n} MPPT" [!J IMaxDC] — done: "${A} · max DC current ${x} A ÷ ${n} MPPT"
  - "not in the OND" — done: "not in the inverter file"
  - "entered" — right
  - "Use the file's" / "Use the file's ${A}" — right
  - "${min} to ${max} m" — right
  - Row "${A} · ${m}" / "not known · ${m}" — right
  - :29-58

**MPPT loading** (W/components/studio/MpptTable.tsx; W/lib/studio/mppt-table.ts)
- "MPPT loading" [!J]: MpptTable.tsx:47 — right (MPPT is the trade's name; the step's summary row)
- Columns "MPPT", "Strings", "Current", "Imp" [!J], "Isc" [!J], "kWp": MpptTable.tsx:11-26 — right (a table the trade reads, §6)
- Caption "Option ${L}: ${n} strings on ${n} MPPT of ${n} inverters, at ${v} V": mppt-table.ts:76 — right
- "of option ${L}", cells "${A} of ${limit} A", "Limit not known", "Fits", "Over the limit", "MPPT ${n}", "INV-${n}": mppt-table.ts:41-74 — right ("INV-1" is the schedule's and the single-line diagram's tag)
- "Enter the current per MPPT": MpptTable.tsx:56 — right

**Sizing temperatures** (W/components/studio/SizingTemperatures.tsx; W/lib/studio/sizing-fields.ts)
- "Sizing temperatures": SizingTemperatures.tsx:54 — right
- Fields "Lowest ambient", "Highest ambient", "Cell rise" [!J], "Voc coefficient" [!J]: sizing-fields.ts:51-57 — right (Voc is the trade's name; the cell rise's hint names the roof type it comes from)
- Details:
  - "${x} °C from the weather" — right (now "From the weather · ${x} °C", V2 · 3)
  - "${x} °C by roof type: flat, open rack / flat east-west, open rack / sloped, flush" [!J open rack] — done: "${x} °C by roof type: Flat, tilted rows / Flat, east-west / Sloped, flush" (the roof types' own names)
  - "${x} %/°C, the one-diode model's" [!J] — done: "${x} %/°C, computed from the module file"
  - "entered" — gone (now "Yours · default ${x}", V2 · 3)
- Resets: "Use the weather's ${x}", "Use the roof type's", "Use the module's" — gone (the hint's Reset, V2 · 3)
- Row "${min} to ${max} °C": sizing-fields.ts:64 — right

**Strings on the stage** (W/components/studio/StringLegend.tsx; W/lib/scene/string-legend.ts)
- "Colour the strings by" ("String", "MPPT", "Inverter"); "Strings on the roof" (aria): StringLegend.tsx:15-37, 107 — right
- "The strings follow the design run" [?]: StringLegend.tsx:97 — done: "Wiring the strings" (the loading line beside its ring)
- Legend:
  - "Not used": string-legend.ts:13 — right
  - "Colours: …": string-legend.ts:53 — right
  - "By string: ${n} colours in turn along the rows": string-legend.ts:60 — done: the count as a figure, "By string: 6 colours in turn along the rows" (it was a word, "six")
  - Prefixes "MPPT ", "INV-", "S${n}" [!J INV]: string-legend.ts:27-28, 55 — right (the schedule's tags)
- String callout (W/lib/scene/pick.ts:92-94):
  - "String ${n} · ${INV}, MPPT ${n}" — right
  - "${n} modules" — right
  - "${n} modules · Voc cold ${v} V · ${m} m of cable" [!J Voc cold] — right ("Voc cold" is the cable schedule's column, one name for one thing)
- Screen-reader lines (W/components/studio/stage-view.ts:114-136):
  - "${n} strings of option ${L}, coloured by …" — done: the count of colours as a figure and no semicolons: "${n} strings of option ${L}, coloured by string, 6 colours in turn: Colour 1, 2 strings, S1 and S7. Colour 2, …"
  - "${label} at ${x} m east, ${y} m north" — right
  - "Inverter(s) …" — done: "Inverter: INV-1 at …" / "Inverters: INV-1 at … INV-2 at …", joined by full stops, not semicolons
  - "${n} positions not used" / "Every position used" — right

## Equipment picker (module and inverter)

Most strings are in W/components/studio/EquipmentPicker.tsx.

- Titles and actions: "Choose a module" / "Use this module" (W/components/studio/ModulePicker.tsx:34); "Choose an inverter" / "Use this inverter" (W/components/studio/InverterPicker.tsx:36) — right
- Columns:
  - Module: "Module", "Wp" [!J], "Efficiency %", "Size m", "Bifacial" [!J]: ModulePicker.tsx:38-42 — right (a table the trade reads, as the approved picker boards head it)
  - Inverter: "Inverter", "AC kW", "MPPT" [!J], "MPPT V" [!J], "Max DC V": InverterPicker.tsx:40-44 — right (the same)
- Filters: "Power" (note "Wp"); "AC power", "MPPT", "Max DC" (note "V"): ModulePicker.tsx:72-79; InverterPicker.tsx:89-117 — right (behind Filter, V2 · 10)
- Mobile order labels: "Model", "Power", "Efficiency", "Bifaciality", "AC power", "MPPT", "Max DC voltage"; "${col}, A to Z / Z to A / low to high / high to low"; "Order" (select): W/lib/equipment/picker.ts:78-130; EquipmentPicker.tsx:279 — right
- Search: placeholder "Maker or model"; aria "Search the maker or the model"; "Clear the search": W/components/studio/PickerSearch.tsx:23-28 — right (now "Maker, model or power", V2 · 10)
- Count: "${shown} of ${total} ${things}"; "Clear the filters": EquipmentPicker.tsx:268-276 — right (with "${n} modules from ${n} makers, or your own module file (PAN)" before a filter)
- Tags: "In this design", "Preliminary" [?]; mark "Rated under the voltage set": EquipmentPicker.tsx:314-342 — done: mark "Rated under the system voltage" ("In this design" right; "Preliminary" right: the maker's own word for a datasheet not final)
- Row fact: "Up to ${v} V: strings sized under the ${v} V set" [?]: W/lib/equipment/rows.ts:65 — done: "Up to ${r} V: strings sized to ${r} V, not ${v} V"
- Sort aria: ", sorted upwards/downwards": EquipmentPicker.tsx:300 — right
- Actions: "Cancel"; "Choose a PAN / an OND file of your own" [!J PAN/OND]; "Reading": EquipmentPicker.tsx:193-195 — done: "Choose your own module file (PAN)" / "Choose your own inverter file (OND)" ("Cancel" and "Reading" right)
- Loading: "Loading the library"; "Try again": EquipmentPicker.tsx:369, 363 — right
- Empty:
  - "No ${module/inverter} in the app matches "${q}"." / "No ${thing} in the app within these filters.": :380 — done: "No ${thing} in the library matches "${q}"." / "No ${thing} in the library fits these filters."
  - "The search reads the maker, the model and the file's name. A/An ${PAN/OND} file of your own is taken below." [!S]: :382 — done: "Or choose your own module file (PAN) below." / "… inverter file (OND) below."
  - "Clear the search" / "Clear the filters": :385 — right
- Own file:
  - "Let go to load the file"; "Or drop a/an ${PAN/OND} file of your own here"; "Choose a file"; "Reading the file ${name}": EquipmentPicker.tsx:434-443 — done: "Or drop your own module file (PAN) here" / "… inverter file (OND) here" (the others right)
- Refusals:
  - "This ${thing} was not loaded" + "${reason}. The ${thing} of before is kept." [?]: EquipmentPicker.tsx:253-255 — done: title "${Thing} not changed" ("Module not changed"), then the reason alone: the title says the design keeps its own
  - "The file could not be read (${error}). Choose another.": EquipmentPicker.tsx:77 — done: "The file could not be read: ${error}. Choose another."
- Library errors:
  - "The equipment catalog could not be loaded (HTTP ${status}). Try again." [!J HTTP]: W/lib/equipment/catalog.ts:87 — done: "The equipment library did not load. Details: HTTP ${status}" (the Try again button under it)
  - "${file} could not be loaded from the app's library (HTTP ${status}). Try again.": W/lib/equipment/library-file.ts:21 — done: "${file} did not load from the library. Try again. Details: HTTP ${status}"
  - "${name} is over 256 KB, larger than any PAN or OND file. Choose another.": library-file.ts:30 — done: "${name} is over 256 KB, larger than any module or inverter file. Choose another."
  - Dev-facing "The equipment catalog is not as expected (${where}). Write it again with `bun equipment:catalog`.": catalog.ts:56 — right (a developer's words: the catalog is written by the build, never by the user)

## Performance (KPIs, loss chain, weather, charts)

**Header and weather**
- "Performance" (H1, page title): W/components/performance/PerformanceHeader.tsx:35; W/app/(workspaces)/performance/page.tsx:4 — right
- Option switch: "Option" / "Stringing option"; "${L} · ${caption}": W/components/performance/OptionSwitch.tsx:15-36 — right ("Option" and "${L} · ${caption}"; "Stringing option" gone)
- Captions from the API: "Recommended", "Your own", "Fills the inverter(s)", "Lower clipping" [!J clipping], "${Below target}, n inverters" (A/rooftop_core/readouts.py:156-165); "A · Recommended" (W/lib/performance/header.ts:14) — done: the web says the API's "Your own" as "Your own option" and "Lower clipping" as "Less clipping", on the cards and in Performance's Option alike (W/lib/studio/option-cards.ts, `captionWordsOf`); the others right ("Fills the inverter" / "Fills the inverters" follows the count)
- Run line (W/lib/performance/header.ts):
  - "${n} modules in series × ${n} strings on ${n} inverter(s)": :38 — gone
  - "${hours} hours of ${PVGIS/NASA POWER/CSV} weather, ${min} to ${max} °C, no horizon / horizon up to ${x}°" [!J horizon]: :42-43 — gone (the Weather assumption's facts now: "${hours} hours · ${min} to ${max} °C · no horizon / horizon up to ${x}°", right)
  - "${n} positions ready": :51 — gone
- "Weather" select (W/components/performance/WeatherSelect.tsx; W/lib/flow/weather-source.ts):
  - Options: "PVGIS TMY" [!J], "NASA POWER 2023" [!J], "CSV file": weather-source.ts:11 — gone (now "Typical year", "2023, measured", "Your file", board 12)
  - Facts: "Typical year · PVGIS horizon", "The year 2023 · no horizon", "Hourly or finer · times read as UTC" [!J UTC]: weather-source.ts:18-20 — gone (now "From PVGIS, with the site's horizon", "From NASA POWER, without a horizon", "A CSV of hourly weather", right)
  - "Loading ${source} weather", "Reading ${file}": weather-source.ts:35, 39 — right (now "Loading the typical year from PVGIS", "Loading 2023's weather from NASA POWER")
  - "The weather was not loaded": WeatherSelect.tsx:19 — done: "Weather not loaded"

**KPIs** (W/lib/performance/kpis.ts)
- Lead "Energy to grid, year 1": :30 — gone (now "Energy to the grid in year 1", V2 · 8, right)
- Exceedance cells "P${level}" / "P${level} · σ ${x} %" [!J P50/P90, σ]: :32; W/lib/format/performance.ts:11 — gone (now "Likely" and "Conservative (P${level})" with "${n} years in ${m} at least", right)
- Tiles: "Performance ratio", "Specific yield", "Capacity factor, AC" (more "${x} % DC"), "In-plane irradiation" [!J], "Energy over 25 years", "CO₂ avoided": kpis.ts:36-41 — gone (now "System size", "Yield", "Performance ratio (PR)", each with a few words, right)

**Loss chain** (W/components/performance/LossChain.tsx; W/lib/performance/loss-fields.ts)
- "From sunlight to the grid" [!F mild], legend "Gain", "Loss", "Boxed values are yours to change" [!S]: LossChain.tsx:27-57 — done: the legend's last "Editable", beside a boxed swatch; "Gain", "Loss" right; "From sunlight to the grid" gone (now "Where the energy goes", board 12); the back press "Eleven steps" done: "11 steps"
- Step labels from the API (A/rooftop_core/simulation.py:382-409) — right, every one: the 21 steps are the report's words, kept where the trade reads them under "All 21 steps, as the report lists them" (§6); the 11 plain steps lead (W/lib/performance/energy-steps.ts)
  - "Global horizontal irradiation" [!J]
  - "Transposition to plane (${tilt}°)" [!J]
  - "Far shading, horizon"
  - "Near shading, linear" [!J]
  - "IAM" [!J]
  - "Soiling"
  - "Bifacial rear gain"
  - "Array nominal energy at STC" [!J]
  - "Irradiance level"
  - "Temperature"
  - "Electrical shading"
  - "Module quality"
  - "LID" / "LID (PAN)" [!J]
  - "Mismatch"
  - "DC ohmic" [!J]
  - "Inverter efficiency"
  - "Inverter clipping"
  - "Night consumption"
  - "AC ohmic" [!J]
  - "Availability"
  - "Energy to grid"
- Row readout "${value} ${kWh/m²|MWh} · ${±pct} %": W/lib/performance/loss-chain.ts:35-44 — right
- LID: "default ${x}" / "PAN ${x}" / "PAN gives ${x} %"; "Use the default" / "Use the PAN's": loss-fields.ts:75-76 — done: "Module file gives ${x} %", "Use the module file's"; "default ${x}", "PAN ${x}" (inside the field, beside the step "LID (PAN)") and "Use the default" right
- Switch notes: "The module is monofacial: no rear gain." [!J] / "Flush modules lie on the roof: no rear gain.": loss-fields.ts:65-67 — done: "The module is not bifacial: no rear gain."; the second right

**Assumptions** (W/lib/performance/assumption-fields.ts; component W/components/performance/Assumptions.tsx:19)
- "Assumptions" — right
- "Thermal Uc" (unit "W/m²K") [!J]: :51-52 — done: "Heat loss factor (Uc)", unit W/m²K after the number (on the step Temperature, W/lib/performance/loss-fields.ts)
- "${x} W/m²K by roof type" / "${x} by roof type"; "Use the roof type's": :53-62 — right (now "Roof type gives ${x} W/m²K" and "Use the roof type's")
- "Rear shading and mismatch", "Roof albedo" [!J], "Weather variability", "Model and data", "Exceedance levels" [!J], "Grid CO₂" (t/MWh): :86-91 — right ("Roof albedo" with "how much light the roof reflects" in its row; "Grid CO₂" under the row "Grid CO₂ per MWh", its unit after the number); "Exceedance levels" gone (now "Likely and conservative levels")
- Chip aria "Exceedance level ${n}": Assumptions.tsx:81 — gone (now "Level ${n}")
- The Weather row's line "Choose the weather beside the energy, at the top of the page." (Assumptions.tsx, V2 · 8) — done: "At the top of the page, choose the weather beside the energy." (the place before the action, §4)

**Charts**
- Chart and Table tabs: "Chart" / "Table": W/components/performance/chart-card.ts:15-16 — right
- "Energy to grid by month" (unit "MWh"): W/components/performance/MonthlyChart.tsx:20, 94 — gone (now "Energy to the grid each month of year 1", right)
- Monthly caption "The energy to grid of every month, and of the year" [!S]: MonthlyChart.tsx:158 — done: "Each month of year 1, and the year"
- Monthly cells: "Jan"…"Dec", "Year", "Month", "MWh", "kWh/kWp"; tooltip "${mwh} MWh · ${x} kWh/kWp"; aria "${Mon}: ${mwh} MWh, ${x} kWh/kWp": W/lib/performance/month-bars.ts:9-71 — done: the heads "Energy, MWh" and "Yield, kWh/kWp" (a unit is never the label, §7); the others right
- "25 years", "Degradation", "Year" (slider aria): W/components/performance/YearsChart.tsx:27, 109, 135 — gone (now "Energy each year" with "${x} MWh in all · ${x} % less each year"; "Year" right)
- Years caption "Every year is in the chart; the table says six of them and the total." [!S] [?]: YearsChart.tsx:174 — done: "Years 1, 5, 10, 15, 20 and 25, and the total" (W/lib/performance/year-line.ts, `YEARS_CAPTION`)
- Years cells: "Year ${n}", "Year ${n}: ${x} MWh", "Total, 25 years": W/lib/performance/year-line.ts:20-80 — done: the head "Energy, MWh"; the cells right
- "Summary" with caption "The design, summed up by the engine" [!J engine] [?]; columns "Item", "Value": W/components/performance/SummaryTable.tsx:20-22; W/lib/performance/summary.ts:33-34 — done: heading "Summary, as in the report", caption "Summary of the chosen option"; "Item", "Value" right
- API summary row "Losses": "Clipping ${x} % · LID ${x} % · uncertainty σ ${x} %" [!J]: A/rooftop_core/readouts.py:320-322 — right (the report's row, under "Summary, as in the report"; the API's words are the API's work in #218)

**Weather CSV dialog** (W/lib/performance/weather-csv.ts)
- "Load weather from a CSV": :9 — right
- "A year of values, every hour or more often: a time column, global irradiance, and, if you have them, beam, diffuse, air temperature and wind. Rows of less than an hour are averaged into hours. Times are read as UTC." [!S] [!J beam, diffuse, UTC]: :10 — done: "A year of values, every hour or more often, times in UTC. Columns: the time and the global irradiance, then beam, diffuse, air temperature and wind if you have them. The app averages rows of less than an hour into hours."
- "Drop the weather file here" / "A CSV of a year's weather, 3 MB at most" / "It is read, and becomes the weather of this design when you use it" [!S]: :11-13 — done: the third "Let go to read the file" (Use this weather says the rest); the first two right
- "Use this weather" / "Cancel": :15 — right
- "This file is over 3 MB, more than a year of weather takes, even every 15 minutes. Choose a file of one year.": :25 — done: "The file is over 3 MB. A year of weather is under 3 MB, even every 15 minutes. Choose a file of one year."
- Summary "${n} hours · GHI ${x} kWh/m²" [!J GHI], "beam ${x} · diffuse ${x} kWh/m²", "${min} to ${max} °C": :35-37 — done: "${n} hours · ${x} kWh/m² on the ground" (as the Weather assumption says it); the other two right
- "The file could not be read (${error}). Choose another.": W/components/performance/WeatherCsvDialog.tsx:28 — gone (the dialog's problem, from the shared problem-of.ts, V2 · 5)

**States.** Performance and Handover reuse the vitals strings: "Updating energy", "Opening …", "Energy was not updated/computed", "Try again". Decision card: NoOptionsCard (see Shell). — right (now "Updating energy", "Energy not updated", "Energy not computed", the shell's words)

## Handover (list, previews, downloads, states)

**List** (W/components/handover/DeliverableList.tsx; W/components/handover/Handover.tsx)
- "Handover" (H1, page title): DeliverableList.tsx:68
- "Everything the installer, the client and the utility need" [!S tagline]: DeliverableList.tsx:69
- "Download all" (fact "${n} files · one zip"), "Save a copy": DeliverableList.tsx:62, 79, 108
- "Deliverables" (aria), "Back to Handover" (aria): Handover.tsx:51, 136
- Items: "Design report", "Single-line diagram", "Bill of materials", "DC cable schedule", "CAD layout", "Google Earth model", "Hourly data", "Project file": W/lib/routes.ts:25-32
- Badges: "PDF", "PNG", "BOM", "DC", "DXF", "KMZ", "CSV", "RTD" [!J]: W/lib/flow/deliverables/items.ts:42-49
- Actions "Download ${badge}" (e.g. "Download PDF"), "Save a copy"; "On its way" (ring aria) [!F]: items.ts:120; W/components/handover/DeliverableRow.tsx:64
- Facts (items.ts):
  - "A4 landscape · ${n} pages"
  - "${n} strings of ${n} × ${W} Wp · ${n} inverters, ${n} MPPT" [!J]
  - "${n} modules · ${n} ${unit} · ${m} m DC cable"
  - "${n} strings · Voc cold ${v} V" [!J]
  - "Metres · one layer per string"
  - "Roof, obstacles with heights, ${n} modules"
  - "${n} rows · irradiance, temperature, power"
  - "${file}.rtd · opens again here"
  - Lines 54-117
- States (W/lib/handover/page-view.ts:14-17):
  - "The files were not updated" / "They are of the design before" [?]
  - "The files were not made" / "There are no files yet"
  - "Not made · the run failed"
- Download failure: toast with the API message + "Try again": W/lib/stores/downloads-store.ts:94, 168, 186
- "No design is open: open one before its files are asked for.": downloads-store.ts:128

**Report preview** (W/lib/handover/report-view.ts; W/components/handover/ReportPreview.tsx)
- "Page ${n} of ${count} · ${title}", "Page ${n}, ${title}", "${n} · ${title}": report-view.ts:65-95
- "The pages were not updated" / "They are of the design before"; "The pages were not made" / "There is no preview yet": report-view.ts:11-12
- "Previous page", "Next page", "Report pages" (aria): ReportPreview.tsx:70-71, 133

**Single-line diagram** (W/components/handover/SingleLineDiagram.tsx; W/lib/handover/sld.ts)
- "The PNG is the engine's drawing on A4" [!J engine]: SingleLineDiagram.tsx:19
- "The diagram", "The diagram as a list" (aria): SingleLineDiagram.tsx:106, 168
- Title "Single-line diagram · ${n} strings of ${n} × ${W} Wp": sld.ts:118
- Blocks: "${n} × ${s} mod", "MPPT ${n} · DC", "MPPT ${n} · not used", "MPPT ${n}, ${n} strings", "Imp ${a} of ${b} A" / "Imp ${a} A · limit not known", "INV-${n}", "${kW} kW · ${n} MPPT" [!J]: sld.ts:64-118
- Fixed boxes: "AC", "ACDB" [!J], "Net meter", "Grid / LT panel" [!J]: sld.ts:64-68

**Bill of materials** (W/lib/handover/bom-view.ts)
- Columns "Item", "Specification", "Qty", "Unit": :23-26
- Caption "The bill of materials of option ${L}, as the engine lists it" [!J engine]: :39
- "Copy as table"; toasts "Bill of materials copied as a table" and "The table could not be copied. Select it and copy by hand.": W/components/handover/CopyAsTable.tsx:12-18; W/lib/handover/copy-table.ts:8

**Cable schedule** (W/lib/handover/schedule-view.ts)
- Columns "String", "Inverter", "MPPT", "Modules", "Voc cold (V)" [!J], "Isc (A)" [!J], "DC cable (m)", "Drop (%)" [!J], "Cable": :50-65
- "${n} strings" (total): :89
- Caption "The DC cable schedule of option ${L}, in the engine's order, by string": :93
- Sort note "Sorted by ${head}, upwards/downwards. The order of the engine, by string, is the default" [!S]: :95
- Drop note "More than 1 % even at 10 mm²: a shorter run, or the inverter nearer, brings it down" [!S]: :44
- Toast "DC cable schedule copied as a table": :40

**CAD layout** (W/lib/handover/cad-view.ts; W/components/handover/CadPreview.tsx)
- "Layers" (fact rows); "Layout"; "R2010 · metres · x east, y north" [!J R2010]: cad-view.ts:25-26; CadPreview.tsx:46
- Layers: "ROOF" — "the outline"; "SETBACK" — "the inner line"; "OBSTACLES" — "${n} footprints"; "KEEPOUT" [!J]; "MODULES_UNUSED" — "${n} positions"; "INVERTERS"; "TEXT" — "the names and heights, …"; "STRING_S01 to STRING_S${n}" — "${n} each": cad-view.ts:36-47
- Plan alt "${title} · page ${n} of the report": CadPreview.tsx:37

**Google Earth model** (W/lib/handover/earth-view.ts; W/components/handover/EarthPreview.tsx:19-20)
- "In the file" / "Not in the file"
- In the file:
  - "Roof" — "the outline"
  - "Modules (${n})" — "the positions used, one by one"
  - "${name} h=${h}" — "the ${kind}'s footprint, its height in the name" [?]
- Not in the file:
  - "Positions not used (${n})" — "the layout's free positions stay off the model"
  - "The inverter and the wiring" — "the SLD and the schedule carry them" [!J SLD]
  - "Heights as shapes" — "everything lies flat, the heights are in the names, as the import reads them" [!S]
- Source lines: earth-view.ts:46-61

**Hourly data** (W/components/handover/HourlyPreview.tsx; W/lib/handover/csv-head.ts; W/lib/handover/csv-columns.ts)
- "The first rows of the file" (aria), "Columns": HourlyPreview.tsx:76, 79
- "The first ${n} of ${count} rows"; "The hourly data was not made" / "There is no preview yet": csv-head.ts:37-40
- Column descriptions:
  - "The hour's start, UTC"
  - "Global horizontal irradiance, W/m²" [!J]
  - "Effective irradiance in the plane of the modules, W/m²" [!J]
  - "Cell temperature, °C"
  - "DC power into the inverter, kW"
  - "AC power to the grid, kW"
  - "A column of the file, not described here"
  - csv-columns.ts:7-14

**Project file** (W/components/handover/ProjectFilePreview.tsx; W/lib/handover/project-file.ts)
- "Project file" (aria), "Name", "What is in it": ProjectFilePreview.tsx:52, 54, 72
- Facts: "Format 2" [!J], "None yet", "${v} V", "${L} · ${s} × ${n} on ${i} inverter(s)", "${n} KB": project-file.ts:37-58
- Rows: "Module file", "Inverter file", "Weather" ("${label} · ${n} hours"), "System voltage", "Chosen option": project-file.ts:61-65
- Shared name validation: "A name is needed": W/lib/flow/name-field.ts:9; W/components/ui/text-entry.ts:6

## Present

- Page title "Present · SolarLayout Rooftop"; main aria "Present": W/app/present/page.tsx:4; W/components/present/Present.tsx:114
- Hint "Press any key or touch the screen to return": Present.tsx:36
- Scene captions (W/lib/present/tour.ts):
  - "The satellite from above tilts into 3D" [!F]: :76
  - "The building and the obstacles rise" [!F]: :87
  - "The modules fill row by row": :98
  - "The day plays with its shadows" [!F]: :109
  - "The strings light up by MPPT" [!F] [!J]: :120
  - "The energy counts up" [!F]: :131
- Panels (W/lib/present/scene-panel.ts:124-178):
  - "1 · The place": "Roof area", "Latitude", "Longitude"
  - "2 · The roof": "Obstacles" ("of ${n}"), "Roof", "Corners", "Parapet"
  - "3 · The array": "Positions" ("of ${n}"), "Rows", "Tilt"
  - "4 · The sun, ${date}": "Solar time", "Sun height", "Bearing"
  - "5 · The strings": "DC capacity", "Strings", "Inverter(s)"
  - "6 · The energy": "MWh", "Yield" (kWh/kWp), "PR" [!J]
- Energy figure: "Energy to grid, year 1"; "${x} MWh": W/lib/present/figures.ts:10, 36
- Bottom-left line: "${name} · ${kWp} kWp · ${MWh} MWh a year": W/lib/present/words.ts:16-20
- Screen-reader lines: "On the roof"; "The ground is the satellite imagery" / "The ground is plain, with a grid": Present.tsx:191, 197

## Open a project, Import a drawing, project switcher

**Open a project** (W/components/shell/OpenProject.tsx)
- Title "Open a project": :17
- "A project saved by this app. It opens in the Studio and runs again here." [!S]: :18
- Drop zone "Drop the project file here" / "An .rtd file saved by this app" / "It is read, and opens as a new design on this device" [!S]: :107
- "Cancel", "Open", "Try again": :101-111
- "Notes on the file" (aria): :117
- Refusals (W/lib/flow/open-project.ts):
  - "Choose a project file (.rtd).": :11
  - "This file is larger than any project this app saves, so it cannot be opened.": :21
  - "The file could not be read. Choose another.": :24

**Import a drawing** (W/components/shell/ImportDrawing.tsx)
- Title "Import a drawing": :112
- Intro: "The largest closed shape is the roof. In a KMZ or KML the other closed shapes are obstacles named by their placemark, and open lines are walls; in a DXF the other closed polylines are obstacles named by their layer, and circles are tanks. A height in a name, as h=2.5, is read. A KMZ or KML says where the roof is; a DXF does not, so its place is asked." [!S, very long] [!J KMZ/KML/DXF, placemark, polylines]: :30
- Drop zone "Drop the drawing here" / "KMZ, KML or DXF" / "It becomes the roof of a new design": :121
- "DXF units" [!J]; "Suggested for this file. Change it if the drawing is in millimetres" / "Chosen once the file is a DXF": :124-127
- "Place"; "The drawing does not say where the roof is. Search the place, or type its coordinates" / "From the search. Change it if the drawing is elsewhere": :132-134
- "Latitude" (° N), "Longitude" (° E): :139-140
- "Cancel", "Open the roof": :115-116
- Errors:
  - "The file could not be read." / "The file could not be read. Choose another.": :45, 105
  - "This drawing is larger than the app can send, about 4.7 MB. Save it with the roof and its obstacles alone, and choose it again." [!S]: W/lib/flow/import-drawing.ts:26
- File fact "${DXF|File} · ${n} KB · read when the roof is opened": import-drawing.ts:59

**Shared file drop** (W/components/ui/FileDrop.tsx)
- "Let go to load the file": :94
- "Choose another": :106, 124, 144
- "Reading the file": :132
- "This file was not loaded" (mark "Note"): :140-142
- "Choose a file": :153

**Project switcher.** See Studio shell above.

## Help sheet

**Chrome** (W/components/shell/help/*)
- Header "${Section|Setting|Metric|Deliverable|Tool|Concept} · ${Roof lens|…|Find|Performance|Handover|Present|Home|Studio}": W/lib/help/where.ts:4-12
- "Back", "Close help", "Options" (aria), "Related", "In the docs": HelpSheet.tsx:78-147
- Value badges "Your choice" / "Set for India" (help-state, HelpDisc): W/lib/help/help-state.ts:6
- Disc: aria "Help: ${title}"; tooltip summary + "Click for more": HelpDisc.tsx:37-40; W/components/ui/Tooltip.tsx:55
- Loading: "Loading the help"; "This part of the help did not load. Check the connection and try again." + "Try again": HelpBody.tsx:36-51
- Clips: "Play/Pause the clip: ${alt}", "Open the clip larger: ${alt}", "The clip did not load. The picture shows the step.", "Open the picture larger: ${alt}", "Pinch to look closer", "Close the picture": PictureClip.tsx:79-131; help-steps.tsx:88; PictureLarge.tsx:78-79
- Links: "Show me how", "Show the tips on the map again": ways-in.tsx:19, 45

**Docs titles** (W/lib/docs/docs.ts:30-118)
- "Getting started"
- "Your first rooftop design"
- "Find the roof"
- "The Roof lens" / "The Array lens" / "The Sun lens" / "The Strings lens"
- "Performance"
- "Handover"
- "Present"
- "Your designs and the project file"
- "Reference"
- "Troubleshooting"
- "Getting help"

Section names are listed in docs.ts:30-118.

**Help topics: title / summary (front matter), headings, first paragraph.** All under W/content/help/. Summaries are full sentences by design.

- **app/section/obstacles.mdx**
  - Title "Obstacles". Summary: "Things on or beside the roof that take room and cast shadows, each with its height above the roof surface."
  - Headings: What an obstacle does / On Find / In the Roof lens.
  - First paragraph: "Each obstacle counts three times. No module is placed on its footprint or within the clearance around it, set under `Clearance` in Edges and access. The area its shadow sweeps through the shade-free window of the design day is kept clear of modules, unless shaded positions are allowed. And its shadow is counted, hour by hour over the year, in the shading of every module it falls on." ("counts three times" [?])
- **app/section/roof-type.mdx**
  - Title "Roof type". Summary: "How the modules sit on the roof. It decides how the engine lays out the rows, their tilt and their direction." [!J engine]
  - Values: Flat tilted rows / Flat east-west / Sloped flush meanings.
  - Headings: The three types / What else it changes / Where you choose it.
  - First paragraph: "`Flat, tilted rows` (`Tilted rows` in the Roof lens and on smaller screens) lays rows of tables at the array's tilt. By default they face the edge of the roof closest to the equator, and the rows are spaced so that they do not shade each other through the shade-free window of the design day, unless you set the row pitch yourself."
  - Violations: "`Thermal Uc`, how fast the modules shed heat…" [!J]
- **find/section/edges.mdx**
  - Title "Edges". Summary: "The length of each edge of the outline drawn on the map. Type a length you measured to correct one edge."
  - Headings: While you draw / The length of each edge / Square the corners / Under the section.
  - First paragraph: "Until the outline is closed, the section counts the corners placed and says what to do next. A roof needs three corners at least. Click the first corner again, or press Enter, to close it."
- **find/section/place.mdx**
  - Title "Place". Summary: "Where the roof entered by hand stands, as latitude and longitude. The shape you type is drawn around this point."
  - Headings: What it is / Where the numbers come from / How it behaves.
  - First paragraph: "When you enter the roof by hand, `Latitude` and `Longitude` say where it is, in degrees with five decimals. North and east are positive; south and west are negative."
- **find/section/shape.mdx**
  - Title "Shape". Summary: "The outline of a roof entered by hand, as a rectangle by its sides or as a table of corners in metres."
  - Headings: Rectangle / Corners / How it behaves.
  - First paragraph: "`Length` and `Width` are in metres. The longer of the two is the long side, whichever field it is typed in. `Long side faces` is the direction of the long side, in whole degrees clockwise from north."
- **find/tool/box.mdx**
  - Title "Draw a box". Summary: "Drag across a thing on the roof, such as a stair room or a plant room, then give its height. It casts a shadow and takes room."
  - Steps: Drag across the thing / Give its height / It is on the roof.
  - First paragraph: "With `Box` in hand, press at one corner of it and drag to the opposite one."
- **find/tool/building.mdx**
  - Title "Draw a building beside the roof". Summary: "Press each corner of a building next to the roof, close it on the first, then give its height. Its shadow can fall on the roof."
  - Steps: Press each corner / Close it, and give its height.
  - First paragraph: "With `Building` in hand, go round the building beside the roof, one corner after another."
- **find/tool/corners.mdx**
  - Title "Outline by its corners". Summary: "Press each corner of the roof in turn, then the first again to close it. Drag a corner to adjust it, or add one on an edge."
  - Steps: Press each corner / Close it on the first corner / Adjust it. Heading: A step too far [!F mild idiom].
  - First paragraph: "Go round the roof's edge, one corner after another. While `Square the corners` is on, a corner close to a right angle snaps to it."
- **find/tool/detect.mdx**
  - Title "Detect the building". Summary: "Press inside a building to have its footprint proposed as the outline, then use it and drag its corners to the roof."
  - Steps: Press inside the building / Use it / Check it against the roof.
  - First paragraph: "With `Detect building` in hand, the footprints that are known show faintly on the map."
- **find/tool/find-the-roof.mdx**
  - Title "Find the roof". Summary: "Search the building's address, or paste coordinates or a maps link, and choose the place. Or use your location, or enter the roof by hand."
  - Steps: Choose how to start / Search for the building / Choose the place. Headings: What the search understands / Without a map.
  - First paragraph: "Under `Start here`, the search finds the building on the map; your location takes the map to where this device is; by hand, you type the roof's measurements and need no map."
- **find/tool/move-an-obstacle.mdx**
  - Title "Move, turn or remove an obstacle". Summary: "Pick an obstacle on the map, then drag it, turn a box or a building by its handle, or remove it. Its height is changed in the Roof lens."
  - Steps: Pick it / Drag it / Turn it by its handle. Heading: Remove it.
  - First paragraph: "Click it on the map, or its row in the list of obstacles." (touch: "Press it…")
  - Violations: "A step too far: ⌘ Z or Ctrl Z takes it back." [!F idiom]
- **find/tool/move-the-roof.mdx**
  - Title "Move or turn the roof". Summary: "Pick the closed roof up, then drag it into place or turn it by its round handle. Its obstacles go with it."
  - Steps: Pick the roof up / It is picked / Drag it into place / Turn it by its handle. Heading: Then.
  - First paragraph: "With `Box` or `Tank` in hand (`Box` is the tool you hold once the roof is closed), click inside the roof, away from a corner and from an obstacle. With `Wall` or `Building` in hand, a click places a point instead." [?]
- **find/tool/rectangle.mdx**
  - Title "Draw a rectangle". Summary: "Drag across the roof from one corner to the opposite one, then turn the rectangle by its handle to lie on the building."
  - Steps: Drag across the roof / Turn it to the building / Adjust it.
  - First paragraph: "Press at one corner of the roof and drag to the opposite one."
- **find/tool/tank.mdx**
  - Title "Draw a tank". Summary: "Drag from the middle of a round tank to its edge, then give its height. It casts a shadow and takes room."
  - Steps: Drag from its middle to its edge / Give its height.
  - First paragraph: "With `Tank` in hand, press at the tank's middle and drag out to its edge."
- **find/tool/wall.mdx**
  - Title "Draw a wall". Summary: "Press each point of a wall in turn and end it on its last point, then give its height. A wall shades what is behind it."
  - Steps: Press each point of the wall / End it, and give its height.
  - First paragraph: "With `Wall` in hand, press where it begins, then at each turn of it."
- **studio/section/day.mdx**
  - Title "Day". Summary: "The day whose sun, sun path and shadows the Sun lens shows. It changes what you see, not the design."
  - Values: 21 Dec / 21 Mar / 21 Jun / Any date.
  - Headings: The choices / What it changes / The design day.
  - First paragraph: "`21 Dec`, `21 Mar` and `21 Jun` are the two solstices and the March equinox. `Any date` opens a `Day` field and a `Month` list; a day past the end of its month is taken as the month's last day. The year has no leap day, as the engine's sun has none." [!J engine]
- **studio/section/edges-and-access.mdx**
  - Title "Edges and access". Summary: "The parapet, the setback from the edges, the walkways, the clearance around obstacles and the roof's albedo." [!J setback, albedo]
  - Headings: The fields / On a sloped roof / How it behaves.
  - First paragraph: a bullet list of Parapet, Setback, Walkway, Every, Clearance, Albedo.
- **studio/section/inverter.mdx**
  - Title "Inverter". Summary: "The inverter the strings are sized for, read from its OND file. Change picks another from the library or a file of your own." [!J OND]
  - Headings: What the card shows / Change / How it shapes the strings / The current per MPPT.
  - First paragraph: "The model, the maker, the rated AC power and the number of MPPTs; then the current per MPPT and the number of inputs. … the card says `Current per MPPT not in the OND` with an exclamation mark." [!J MPPT]
- **studio/section/location.mdx**
  - Title "Location". Summary: "Where the roof is and how it was entered, with its corners, obstacles, size and facing. Edit opens its outline on the map."
  - Headings: What the card says / Changing the outline.
  - First paragraph: "The first line is the place of the roof, its latitude and longitude in degrees with five decimals. The next lines say how the roof was entered (`Outlined on satellite`, `Entered by hand` or `From a file`), …"
- **studio/section/module.mdx**
  - Title "Module". Summary: "The PV module of the design, read from its PAN file. Its size sets the layout; its ratings set the strings and the energy." [!J PV, PAN]
  - Headings: What the card shows / Change / What the module sets / The Voc coefficient.
  - First paragraph: "The model, the maker and the rated power; the size, and the bifaciality of a bifacial module; Voc, Isc, the bypass diodes, and whether it is twin half-cell. Then the temperature coefficients of Voc, Vmp and Pmpp …" [!J heavy]
- **studio/section/modules-in-series.mdx**
  - Title "Modules in series". Summary: "How many modules one string can hold: the lengths that fit at your system voltage, what limits each end, and the chosen length."
  - Headings: The bar / How the ends are set / The verdict / When no length fits.
  - First paragraph: "It appears once the strings are sized. … set by the `MPPT minimum`. The right end is the longest, set by the `Voc limit` or the `MPPT maximum`, whichever is tighter. …" [!J]
- **studio/section/mounting.mdx**
  - Title "Mounting". Summary: "How the modules stand on the roof: their tilt, their orientation, how many up a table, and their height. The fields follow the roof type."
  - Headings: The fields by roof type / What each field does / How it behaves.
  - First paragraph: a list by roof type.
- **studio/section/mppt-loading.mdx**
  - Title "MPPT loading" [!J]. Summary: "The current and the power on each MPPT of the chosen option, set against the inverter's current limits per MPPT."
  - Headings: The table / How the numbers are worked out / Where the limits come from / How the options use it.
  - First paragraph: "A row for each MPPT that has strings, named with its inverter: the strings on it, its Imp and its Isc each against its limit, its kWp, and a mark: `Fits`, `Over the limit` or `Limit not known`. …"
- **studio/section/on-the-roof.mdx**
  - Title "On the roof". Summary: "What the Sun lens draws over the roof, the sun's path, its shade-free window and the engine's own shadow outlines."
  - Headings: The three switches / How to read the outlines / What they change.
  - First paragraph: a list of the three switches.
- **studio/section/options.mdx**
  - Title "Options". Summary: "The ways to string the roof that the run simulated, each for a full year. Choose one, or add your own."
  - Headings: What a card shows / How the run builds them / Choosing one / Your own.
  - First paragraph: "Its letter and a caption, then modules in series × strings, kWp and DC/AC, then the energy of the first year in MWh. The caption says what sets it apart: `Recommended`, `Your own`, … `Lower clipping`, …" [!J]
  - "How the run builds them" is a single very long paragraph [!S].
- **studio/section/shade-free-window.mdx**
  - Title "Shade-free window". Summary: "The hours of the design day, in solar time, in which rows and obstacles must not shade the modules. It shapes the layout."
  - Headings: The fields / What it sets / When to change it.
  - Violations: "…at the sun's lowest profile angle in the window." [!J]
- **studio/section/shade-map.mdx**
  - Title "Shade map". Summary: "Every module position coloured by its near shading over the year, in five steps, with how many positions are in each."
  - Headings: What it shows / The steps / Reading one module / When it waits.
  - First paragraph: "Each position of the layout takes the colour of its near shading over the year, as the design run worked it out: …"
- **studio/section/shading-over-the-year.mdx**
  - Title "Shading over the year". Summary: "What shading costs over a year of the weather, as near, electrical and far losses, and the roof area kept clear."
  - Headings: The four tiles / What the figures count.
  - First paragraph: a list of Near linear / Electrical beyond linear / Far horizon / Kept clear ("bypass diodes" [!J]).
- **studio/section/spacing.mdx**
  - Title "Spacing". Summary: "How far apart the rows stand and which way they face. The engine decides both unless you switch it off and enter your own."
  - Headings: The fields / Row pitch / Azimuth / How it behaves.
  - Violations: "the line under it gives the GCR and the sun's profile angle that sets it" [!J]
- **studio/section/sun-at-the-hour.mdx**
  - Title "Sun at the hour". Summary: "Where the sun stands at the hour of the timeline on the day shown, as its height above the horizon and its bearing."
  - Headings: The two tiles / The hour / When there are no tiles.
  - First paragraph: "`Height` is the sun's elevation above the horizon, in degrees. `Bearing` says where it stands, …"
- **studio/section/system-voltage.mdx**
  - Title "System voltage". Summary: "The highest DC voltage the system is built for. It caps how many modules can go in one string. The app starts it from your country."
  - Values: 600 / 1000 / 1500 V ("Strings stay at or under ${v} V on the coldest morning of the site.").
  - Headings: How it limits a string / Where it starts / When the equipment is rated lower / Going higher. Callout: "The bill of materials names the DC cable by the voltage set."
  - Violations: "(NEC 690.7; CE Code, Section 64)" [!J]

## API refusals and notes (texts that reach the user)

**A/rooftop_api/errors.py**
- "The server could not finish this request. Try again; if it fails again, report it.": :28
- "The request body is not valid JSON: ${msg}." [!J JSON]: :108
- "${field}: ${pydantic msg}" (+ " (and ${n} more faults in this request)") [!J raw validation text]: :109-111
- Raw `HTTPException.detail` is passed through as the message: :148
- OpenAPI-only (not in UI): "The request cannot be used; the message says why."; " An outline over ${limit} m² is refused with the code roof_too_large, before any work.": :36-39

**A/rooftop_api/services/design.py**
- "No module fits on this roof" / "Inside the edge setback and clear of shadows there is no room for a module. Check the outline, the setback and the obstacles." [!J setback]: :30-32
- Voltage missing (from readouts): "Choose a system voltage to size the strings" / "600, 1000 or 1500 V. Nothing is sized until you choose.": :34
- "PVGIS sent no horizon for this site, so far shading is not counted." [!J PVGIS, far shading]: :130
- "Too few positions for a string" / "The roof holds ${n} position(s), and a string takes ${min} to ${max} modules. ${No string of that length fits. / A string of ${n} would fit: add it as your own option.}": :243-251
- Not an OND: `ApiError(422, "not_an_ond_file", str(error))` passes the parser's text through: :126

**A/rooftop_core/readouts.py**
- "Choose a system voltage to size the strings": :19
- "600, 1000 or 1500 V. Nothing is sized until you choose.": :20
- "No string length fits this inverter": :21
- "Change your option or remove it.": :22
- "The OND gives no current limit per MPPT: enter the datasheet value." [!J]: :23
- Verdict title "${n} in series[ fits]: Vmp ${v} V at STC[, inverter nominal ${v} V]" [!J Vmp, STC]: :73
- Verdict detail "Voc at ${t} °C is ${v} V (limit ${v} V); Vmp at ${t} °C cell is ${v} V (MPPT minimum ${v} V). ${n} strings on ${n} inverter(s), DC/AC ${x}[ (${note})].[ ${currents}]" [!J heavy] [!S]: :75-81
- MPPT over limit: "${INV-n · }MPPT … carries/carry ${a} A, over the limit of ${a} A." / "… has/have an Isc of ${a} A, over the limit of ${a} A.": :104-109
- Option captions: "Recommended", "Your own", "${Note}[, n inverters]", "Fills the inverters/inverter", "Lower clipping" [!J]: :156-165
- Custom refused:
  - "${n} string(s) cannot fill ${n} inverter(s)" / "Each inverter needs a string at least. Change your option or remove it.": :179-180
  - "At most ${n} fit: Voc at ${t} °C is ${v} V, over the limit of ${v} V.": :184
  - "At most ${n} fit: Vmp at ${t} °C is ${v} V, over the inverter's MPPT maximum of ${v} V.": :189
  - "At least ${n} are needed: Vmp at ${t} °C cell is ${v} V, under the MPPT minimum of ${v} V." [!J]: :194
  - Title "${n} in series does not fit at ${v} V": :199
- Limit note "Limit ${v} V: the lowest of the system, module (${v} V | ${v} V taken, its file gives none) and inverter (${v} V) ratings.": :223-227
- Options note (in the UI under the cards):
  - "Target DC/AC ${a}–${b}, warning above ${c}. At most ${n} strings per MPPT (${n} × ${imp} A ≤ ${lim} A), so one inverter takes ${n} strings. The least shaded strings in a row are used first, then those across rows." [!J] [!S]
  - Variant: "The OND gives no current limit per MPPT: one string for each of its ${n} inputs at most, ${n} per MPPT, so one inverter takes ${n} strings. Enter the datasheet value of the current per MPPT."
  - Missed: " ! ${L}: DC/AC ${x}, ${note}; …." (the " ! " is split off by the UI)
  - Lines :236-251
- Far shading lines: "Far shading: not counted, PVGIS sent no horizon for this site" / "Far shading: no horizon profile for this weather source" / "Far shading: PVGIS horizon, highest ${x}°" [!J]: :256-260
- MPPT label "INV-${i} · MPPT ${j}": :280
- Summary row "Losses": "Clipping ${x} % · LID ${x} % · uncertainty σ ${x} %" [!J]: :320-322

**A/rooftop_core/csv_weather.py** (refusals unless noted; ${label} is the file name or "CSV file")
- "Choose a CSV weather file.": :37
- "${label} cannot be read as a table of hours: ${parser message}." [!J raw parser text]: :49
- "${label} has no hours: below its header there is no row.": :78
- "${label}: the time cannot be read in ${n} rows, the first of them on line ${n} (${raw}). Write it as 2023-06-01 13:00, in UTC.": :84-85
- "${label}: ${n} hour(s) is/are there more than once, the first of them ${time}. Every hour may be there once." [?]: :92-93
- Gaps: "${label}: ${column} has no value in ${n} rows, the first of them on line ${n}. ${advice}": :120-121. Advice options:
  - "Fill the gaps: an hour without its irradiance is not an hour of none." [?]: :104
  - "Fill the gaps, or leave out both beam and diffuse.": :108
  - "Fill the gaps, or leave the column out.": :133
- "${label} has ${n} hours, not the 8,760 of a year (8,784 in a leap year). The energy of a year needs every hour of it: give a whole year.": :142-143
- Notes (not refusals):
  - "${label} has no beam and diffuse irradiance. They were worked out from the global irradiance (Erbs model), which is less exact than measured values." [!J Erbs model]: :152-153
  - "${label} has no air temperature. 25 °C was taken for every hour, so the strings are sized for 25 °C. Enter the site's lowest and highest ambient in the Strings lens.": :159-160
  - "${label} has no wind speed. 1 m/s was taken for every hour.": :163
  - "${label} gives the weather every ${n} minutes. Each hour is the average of its rows (the simulation takes a row as an hour).": :168-169
  - "${label} has irradiance below zero in ${n} rows. It was taken as 0.": :183
  - "${label} has no air temperature in ${n} rows. It was taken from the hours on either side.": :189-190

**A/rooftop_core/placement.py** (layout notes, shown as "Layout · Array lens" notes)
- "Row pitch ${x} m is under a table's depth on plan plus 0.3 m, so ${y} m is used." [!J "depth on plan"]: :186-187
- "Unit gap ${g} m keeps east-west units shade-free in the window." [?]: :292

**Out of scope but seen in the UI.** Loss step labels from A/rooftop_core/simulation.py:382-409 (listed under Performance). BOM AC cable spec "Inverter to ACDB, sized for ${A} A at ${V} V AC" from A/rooftop_core/bom.py:137 [!J ACDB].

## Shared UI controls (appear across screens)

- Dialog close "Close": W/components/ui/Dialog.tsx:57; W/components/ui/SheetGrip.tsx:28
- Sheet stops "Closed" / "Half open" / "Open" (aria): W/components/ui/sheet-stops.ts:103
- Stepper "Fewer" / "More": W/components/ui/Stepper.tsx:32
- Toasts: marks "Done" / "Note", "Close", "Undo", region "What was done": W/components/ui/Toast.tsx:11-49; W/components/ui/Toaster.tsx:30
- Number field errors (W/components/ui/number-entry.ts:77-84):
  - "${max} is the highest that can be set."
  - "${min} is the lowest that can be set."
  - "Enter a number, from ${min} to ${max}."
  - "Enter a number, ${min} or more."
  - "Enter a number, ${max} or less."
  - "Enter a number."
- Range slider aria "${label}, from" / "${label}, to": W/components/ui/RangeSlider.tsx:65
- Status mark default words "Fits" / "Below the DC/AC target": W/components/ui/StatusMark.tsx:9
