# The equipment library

The app carries a library of PVsyst files, so that a user without a PAN or an OND file at hand can choose a module or
an inverter (D75): Change on the module card or the inverter card opens a picker over it. The files are the ones their
makers publish, gathered in the owner's two libraries (`solarlayout-pan-repo`, `solarlayout-ond-repo`).

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
   `<Maker>_<Model>.PAN` as the owner's libraries name them. Leave out a file its maker has superseded.
2. Run `bun equipment:catalog`. It reads every file and writes the catalog. A file the engine cannot read is named with the
   reason and left out of the catalog, and the command fails: remove the file or fix it, and run it again.
3. A maker the picker should name otherwise than the file does ("Ginlong Technologies" is Solis): add it to
   `apps/web/lib/equipment/makers.ts`, the file's name on the left, the everyday name on the right.
4. Run `bun check`. Its web tests check that the catalog and the files agree: every file listed once, with its SHA-256,
   and nothing listed that is not there. A catalog not written again after a change of the files fails here.
5. Commit the files and the catalog together, on a branch, and open a pull request.

Removing a file is the same: delete it, run `bun equipment:catalog`, `bun check`, commit.

## What the library held on 2026-10-06

119 modules from 5 makers (300 to 650 Wp) and 405 inverters from 8 makers (0.7 to 350 kW), the superseded inverter files of
the owner's library left out.
