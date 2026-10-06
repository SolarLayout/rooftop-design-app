"""The catalog of the app's library of PVsyst files (D75): what the equipment picker lists of each
PAN and OND file.

Every file is read by the engine's own readers, so that what the picker shows of a file is what the
card shows once the API has read it. A file the readers refuse is named with their reason and left
out. Run it over the library of the web app:
``python -m rooftop_core.catalog apps/web/public/equipment`` (``bun equipment:catalog``;
docs/equipment-library.md).
"""

from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

from rooftop_core.io.pvsyst import data_source_of, decode_pvsyst, parse_ond, parse_pan

MODULES, INVERTERS, CATALOG = "modules", "inverters", "catalog.json"


@dataclass(frozen=True)
class ModuleEntry:
    file: str
    sha256: str
    maker: str
    model: str
    data_source: str
    wp: float
    efficiency_pct: float
    length_m: float
    width_m: float
    bifaciality: float | None


@dataclass(frozen=True)
class InverterEntry:
    file: str
    sha256: str
    maker: str
    model: str
    data_source: str
    ac_kw: float
    mppt: int
    vmpp_min_v: float
    vmpp_max_v: float
    vdc_max_v: float
    preliminary: bool


@dataclass(frozen=True)
class Refused:
    """A file of the library the readers refused: its path under the library, and why."""

    file: str
    reason: str


def module_entry(name: str, data: bytes) -> ModuleEntry:
    """What the picker lists of a PAN file.

    Raises ValueError, in the reader's words, for a file it cannot use."""
    text = decode_pvsyst(data)
    module = parse_pan(text, name)
    if module.length_m <= 0 or module.width_m <= 0:
        raise ValueError(f"{name}: gives no size of the module (Width and Height); the layout needs it")
    return ModuleEntry(
        file=name,
        sha256=hashlib.sha256(data).hexdigest(),
        maker=module.manufacturer,
        model=module.model,
        data_source=data_source_of(text),
        wp=module.pnom_w,
        efficiency_pct=round(module.efficiency * 100, 2),
        length_m=module.length_m,
        width_m=module.width_m,
        bifaciality=module.bifaciality or None,
    )


def inverter_entry(name: str, data: bytes) -> InverterEntry:
    """What the picker lists of an OND file.

    Raises ValueError, in the reader's words, for a file it cannot use."""
    text = decode_pvsyst(data)
    inverter = parse_ond(text, name)
    return InverterEntry(
        file=name,
        sha256=hashlib.sha256(data).hexdigest(),
        maker=inverter.manufacturer,
        model=inverter.model,
        data_source=data_source_of(text),
        ac_kw=inverter.pnom_kw,
        mppt=inverter.n_mppt,
        vmpp_min_v=inverter.vmpp_min,
        vmpp_max_v=inverter.vmpp_max,
        vdc_max_v=inverter.vabs_max,
        preliminary="prelim" in f"{name} {inverter.model}".lower(),
    )


def _files(folder: Path, ending: str) -> list[Path]:
    if not folder.is_dir():
        return []
    return sorted(
        (path for path in folder.iterdir() if path.is_file() and path.suffix.lower() == ending),
        key=lambda p: p.name,
    )


def catalog_of(root: Path) -> tuple[dict[str, list[dict[str, object]]], list[Refused]]:
    """The catalog of the library at *root* (its folders modules/ and inverters/), sorted by power,
    then model and
    file; and the files refused."""
    refused: list[Refused] = []
    modules: list[ModuleEntry] = []
    inverters: list[InverterEntry] = []
    for path in _files(root / MODULES, ".pan"):
        try:
            modules.append(module_entry(path.name, path.read_bytes()))
        except ValueError as error:
            refused.append(Refused(f"{MODULES}/{path.name}", str(error)))
    for path in _files(root / INVERTERS, ".ond"):
        try:
            inverters.append(inverter_entry(path.name, path.read_bytes()))
        except ValueError as error:
            refused.append(Refused(f"{INVERTERS}/{path.name}", str(error)))
    modules.sort(key=lambda m: (m.wp, m.model, m.file))
    inverters.sort(key=lambda i: (i.ac_kw, i.model, i.file))
    return {MODULES: [asdict(m) for m in modules], INVERTERS: [asdict(i) for i in inverters]}, refused


def as_json(catalog: dict[str, list[dict[str, object]]]) -> str:
    """The catalog as it is kept: one entry to a line, so that a change of the library is a change
    of its lines."""
    parts = []
    for key, entries in catalog.items():
        lines = ",\n".join(f"    {json.dumps(entry, ensure_ascii=False)}" for entry in entries)
        parts.append(f'  "{key}": [\n{lines}\n  ]' if entries else f'  "{key}": []')
    return "{\n" + ",\n".join(parts) + "\n}\n"


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print(
            "Usage: python -m rooftop_core.catalog <the library: a folder with modules/ and inverters/>",
            file=sys.stderr,
        )
        return 2
    root = Path(argv[0])
    catalog, refused = catalog_of(root)
    (root / CATALOG).write_text(as_json(catalog), encoding="utf-8")
    print(f"Wrote {root / CATALOG}: {len(catalog[MODULES])} modules, {len(catalog[INVERTERS])} inverters.")
    for r in refused:
        print(f"Left out {r.file}: {r.reason}", file=sys.stderr)
    return 1 if refused else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
