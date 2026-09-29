# Map and imagery providers (decision D13)

**Decided 2026-09-29:** Esri World Imagery and geocoding plus Overture footprints. Legal check approved by the
owner and closed. The rest of this file is the record of why.

Researched 2026-09-29 from the providers' published terms and documentation. This is a reading of public
terms, not legal advice. Anything marked "unverified" could not be confirmed from documentation.

## Verified with our own key (2026-09-29)
Key: "SolarLayout Rooftop web - dev", public application, privileges Basemap styles service, Static basemap
tiles and Geocoding, referrers `http://localhost:4700` and `http://127.0.0.1:4700`, expires about 28 Sep 2027.
It lives in `apps/web/.env.local` as `NEXT_PUBLIC_ESRI_API_KEY` (ignored by git).

| Check | Result |
|---|---|
| Address search | `https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates` returns Pune places with score 100 |
| Imagery | Comes from the **Basemap styles service**, style `arcgis/imagery/standard`: `https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/imagery/standard`. Its raster source is `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`, 256 px JPEG |
| Sharpness at Pune | Native tiles to zoom 19 (about 0.3 m per pixel); zoom 20 returns 404, so the map over-zooms from 19. Roof edges, and panels already on roofs, are clearly visible |
| Static basemap tiles service | Has no plain imagery style, only "ArcGIS Imagery Labels" and street styles. Not the source for satellite imagery |
| Referrer restriction | Enforced on the static tiles service (401 without our referrer). The imagery tile host answered without a referrer in one test, so treat the key as scoped, not secret: watch usage on the Esri dashboard |

## What the flagship flow needs
1. Address search for India.
2. Satellite imagery sharp enough to see a roof edge.
3. The right to outline (trace) a building on that imagery, commercially, and keep the outline.
4. The right to show the imagery in our own three.js scene as the ground under the 3D roof.
5. Optional: click a building and get its footprint.

## Finding that shapes the decision
Google, Mapbox and MapTiler forbid commercial tracing of building outlines from their imagery.

| Provider | Tracing of building outlines | Imagery in our own renderer | Imagery at Pune | Cost (after free tier) |
|---|---|---|---|---|
| Google Maps Platform | Forbidden. Terms s.3.2.3(c): customer will not "trace or digitize roadways, building outlines ... from the Maps JavaScript API Satellite base map type" | Map Tiles API contemplates third-party renderers; no explicit grant. Session token, logo and attribution required. No "geodata extraction" | Max zoom unverified | Map Tiles 2D: 100,000 free, then $0.60 per 1,000 (India list: 700,000 free, $0.18) |
| Mapbox | Forbidden commercially (Product Terms s.1.6) unless a Commercial Satellite licence is bought | Allowed on web, billed per request | 0.3 to 0.6 m regional; Pune unverified | Raster tiles: 750,000 free, then $0.25 per 1,000. Licence price unknown |
| MapTiler | Forbidden commercially | Allowed | 1 to 2 m global; India high-res unverified | Flex $30 per month |
| Esri World Imagery (ArcGIS Location Platform) | Granted: "the non-exclusive right to use the World Imagery map to trace features ... in the creation of vector data" | Raster tiles through the Basemap styles service (see the verified section above) | 0.31 m, captured 2025-12-09 (checked in public metadata) | Tiles: 2,000,000 free, then $0.15 per 1,000. Geocoding: 20,000 free, then $0.50 per 1,000 |

Common to all: tiles may not be stored. A saved project keeps the outline and re-fetches imagery when opened.

Also from Google's terms: Places search results may not be shown on a non-Google map, so Google search cannot be
paired with another provider's imagery.

## Building footprints for "click the building"
| Source | India | Licence | Query by point without our own database |
|---|---|---|---|
| Overture Maps buildings (merges OSM, Google Open Buildings, Microsoft) | Yes | ODbL | Yes: public PMTiles over HTTP range requests, CORS open |
| Google Open Buildings v3 | Yes | CC BY 4.0 or ODbL | No hosted query |
| Microsoft Global ML Footprints | Yes | CDLA Permissive 2.0 | No hosted query |
| OpenStreetMap via Overpass | Patchy | ODbL | Yes, but public servers discourage app traffic |

Overture test at Pune: 3,900 to 9,000 buildings per zoom-14 tile, about 4.5 s uncached, 0.3 to 0.6 MB.
Caveats: geometry is quantised to about 0.6 m, machine-learned footprints are approximate shapes, release URLs
are versioned and old ones disappear (pin a release and mirror the tiles we need, which ODbL allows).

## Google Solar API (for reference)
Covers Pune at BASE quality (0.25 m per pixel), residential areas. Returns roof segment pitch, azimuth and a
bounding box, not an outline polygon. Not a substitute for outlining.

## Recommendation
| Rank | Option | Main risk |
|---|---|---|
| 1 | Esri imagery and geocoding, plus Overture footprints for click-to-outline | Get Esri's written confirmation that the tracing grant covers a custom web app. 0.31 m is adequate, not razor sharp |
| 2 | Mapbox Satellite with a Commercial Satellite licence | Sales contract, price unknown; Pune resolution unverified |
| 3 | Google map for finding the building, outline from Overture only (no hand tracing) | Removes hand outlining, which is the fallback that always works |

## To check with counsel
India's 2021 Geospatial Guidelines set a 1 m threshold for who may create and own fine geospatial data
(Indian entities; foreign firms through APIs). Relevant if the company has foreign ownership. Not verified
against the official text.

## Build consequence
The map sits behind a `MapProvider` interface (tiles, search, attribution, terms flags such as
`allowsTracing`). The flow and the UI do not change with the provider.
