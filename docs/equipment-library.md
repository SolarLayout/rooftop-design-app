# The equipment library

The app carries a library of PVsyst files, so that a user without a PAN or an OND file at hand can choose a module or
an inverter (D75): Change on the module card or the inverter card opens a picker over it. The files are the ones their
makers publish, gathered in the owner's two libraries (`solarlayout-pan-repo`, `solarlayout-ond-repo`), and, for a maker
that publishes no PAN file, module files fitted from its datasheets (D115, below).

## Where it lives

| What | Where |
|---|---|
| The modules | `apps/web/public/equipment/modules/*.PAN` |
| The inverters | `apps/web/public/equipment/inverters/*.OND` |
| The catalog the picker reads | `apps/web/public/equipment/catalog.json`, written by `bun equipment:catalog`; never edited by hand |
| The makers as people know them | `apps/web/lib/equipment/makers.ts` |

The files are served as they are, at `/equipment/modules/<file>` and `/equipment/inverters/<file>`. The picker fetches the
catalog when it opens; a file chosen is fetched and sent to the API's `/equipment/module` or `/equipment/inverter`, which
reads it as it reads a dropped file. The design keeps the file's text, so a design stays whole if a file later leaves the
library.

The catalog is written by the engine's own readers (`rooftop_core.catalog`), so that what the picker shows of a file is
what the card will show once it is read. For each file: its name, its SHA-256, the maker and the model as the file states
them, the file's data source, and the numbers the picker filters and sorts by (a module's power, efficiency, size and
bifaciality; an inverter's AC power, MPPT count, MPPT window and maximum DC voltage, and whether its maker calls it
preliminary).

## Adding files

1. Copy the files into `apps/web/public/equipment/modules/` (PAN) or `apps/web/public/equipment/inverters/` (OND), named
   `<Maker>_<Model>.PAN` as the owner's libraries name them. Leave out a file its maker has superseded, and the owner's
   `-old` files: they are out of date.
2. Run `bun equipment:catalog`. It reads every file and writes the catalog. A file the engine cannot read is named with the
   reason and left out of the catalog, and the command fails: remove the file or fix it, and run it again.
3. A maker the picker should name otherwise than the file does ("Ginlong Technologies" is Solis): add it to
   `apps/web/lib/equipment/makers.ts`, the file's name on the left, the everyday name on the right.
4. Run `bun check`. Its web tests check that the catalog and the files agree: every file listed once, with its SHA-256,
   and nothing listed that is not there. A catalog not written again after a change of the files fails here.
5. Commit the files and the catalog together, on a branch, and open a pull request.

Removing a file is the same: delete it, run `bun equipment:catalog`, `bun check`, commit.

## Module files fitted from a datasheet (D115)

Where a maker publishes datasheets but no PAN file, a file per power bin is fitted from the datasheet with the owner's
`datasheet-to-pan-ond` (`uv run ds2panond module <spec>.yaml -o <file>.PAN --strict`):

1. One spec a power bin, from the datasheet's own figures: the STC values (Pmax, Vmp, Imp, Isc, Voc), the three
   temperature coefficients, the 200 W/m² loss as `low_light_rel_eff_pct`, the maximum system voltage, the size, the cell
   layout (a half-cut module of N cells is `cells_in_series: N/2`, `cells_in_parallel: 2`, `half_cell: true`) and the
   bifaciality. `data_source` names the datasheet by its document number.
2. A figure the datasheet does not give is written into `provenance_notes`, so the file's Remarks say what was assumed and
   why. Nothing is guessed silently.
3. Only a fit without warnings is written (`--strict`).
4. Before the files are added: every file read by `rooftop_core.catalog` (none refused), and the engine's `ModuleModel`
   giving the nameplate at STC within 0.5 % and the datasheet's 200 W/m² figure.
5. Then as any other file: copied in as `<Maker>_<Model>.PAN`, `bun equipment:catalog`, the maker's everyday name in
   `makers.ts`.

Waaree (#248, 2026-10-13): its 22 current framed datasheets (Elite and Elite R TOPCon, Plexus HJT, Ahnay and Arka PERC),
from the download center's Product Datasheet section, 159 files. Assumed where silent: the bifaciality of Bi-53 and Bi-57
(0.70, as the other Ahnay PERC datasheets state) and 3 bypass diodes on the Ahnay and Arka sheets. Left out: the flexible
WFLW panels (no temperature coefficients in their text) and BiN-08's revision 10 (revision 12 has the same figures).
The specs, the list of datasheets with their URLs, and the script that writes the specs from the datasheets' text are
in `datasheet-to-pan-ond`, `datasheets/waaree/` (its README says how to rebuild them).

## What the library held

On 2026-10-13, after #248: 278 modules from 6 makers (300 to 730 Wp), Waaree's 159 fitted from datasheets.

On 2026-10-06: 119 modules from 5 makers (300 to 650 Wp) and 388 inverters from 8 makers (0.7 to 350 kW), the superseded and the `-old`
inverter files of the owner's library left out.
