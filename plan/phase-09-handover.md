# Phase 9: Handover and exports

**Status:** not started. **Depends on:** phases 2, 7 and 8.

## Goal
Every deliverable of the desktop app, previewed before download.

## Scope
| Item | Preview | Download |
|---|---|---|
| Design report | Page thumbnails and a live page view | PDF, A4 landscape, 6 pages, from `/export/pdf` |
| Single-line diagram | Interactive SVG drawn in the browser from the system data | PNG from `/export/sld` |
| Bill of materials | Table (item, specification, quantity, unit) | In the PDF; copy as table |
| DC cable schedule | Table, all strings, sortable | In the PDF; copy as table |
| CAD layout | Layer list and a plan thumbnail | DXF |
| Google Earth model | What is included and what is not | KMZ |
| Hourly data | First rows and column meanings | CSV, 8,760 rows |
| Project file | Name, size, what is embedded | `.rtd` format 2 |

- Project name is editable here and in the project switcher (desktop had no way to edit it).
- Exports need a chosen option. Until then each item says what is missing and links to it.
- "Download all" makes one zip.
- Report pages are rendered by the engine (matplotlib) so the PDF equals the desktop output; the on-screen
  preview shows those pages as images.

## Acceptance
- Each export downloads and opens: PDF page count 6, DXF loads in ezdxf with the expected layers,
  KMZ re-imports through `/roof/import` with heights intact, CSV has 8,760 rows and the five columns.
- Playwright: download events captured and files checked, on desktop; preview navigation on three viewports.
