# Copied from rooftop-design (SolarLayout/rooftop-design) at commit bf2cb67.
"""PVsyst .PAN (module) and .OND (inverter) readers.

The key/value reading follows ``solar_core.pan_parser`` / ``solar_core.ond_parser``
in SolarLayout/PVlayout_Advance (commit 4eb6775), extended with the one-diode
parameters, the IAM profile, the per-voltage efficiency curves and the MPPT
input limits that rooftop string sizing and the hourly simulation need.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path


def _read_lines(path: str | Path) -> list[str]:
    for enc in ("utf-8", "latin-1", "cp1252"):
        try:
            return Path(path).read_text(encoding=enc).splitlines()
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Cannot decode {path}")


def _flat_kv(lines: list[str]) -> dict[str, str]:
    """First occurrence of every key, case-folded. Profile points are skipped."""
    kv: dict[str, str] = {}
    for raw in lines:
        line = raw.strip()
        if not line or line.startswith((";", "//")) or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        if key.startswith(("PVObject_", "End of", "Point_")):
            continue
        val = val.split(";")[0].strip()
        if key and val:
            kv.setdefault(key.lower(), val)
    return kv


def _profile(lines: list[str], block: str) -> list[tuple[float, float]]:
    """``Point_N=x,y`` pairs of the first block named *block*; the (0, 0) padding is dropped."""
    pts: list[tuple[float, float]] = []
    inside = False
    for raw in lines:
        line = raw.strip()
        if not inside:
            if line.split("=")[0].strip() == block:
                inside = True
            continue
        if line.startswith("End of"):
            break
        if line.startswith("Point_") and "=" in line:
            parts = line.partition("=")[2].split(",")
            try:
                pts.append((float(parts[0]), float(parts[1])))
            except (ValueError, IndexError):
                pass
    # Trailing (0, 0) points are unused slots of the fixed-size PVsyst array.
    while len(pts) > 1 and pts[-1] == (0.0, 0.0):
        pts.pop()
    return pts


def _f(kv: dict[str, str], *keys: str, default: float = 0.0) -> float:
    for k in keys:
        v = kv.get(k.lower())
        if v is None:
            continue
        try:
            return float(v.split(",")[0])
        except ValueError:
            continue
    return default


def _s(kv: dict[str, str], *keys: str) -> str:
    for k in keys:
        v = kv.get(k.lower())
        if v:
            return v
    return ""


def _floats(kv: dict[str, str], key: str) -> list[float]:
    v = kv.get(key.lower(), "")
    out = []
    for part in v.split(","):
        part = part.strip()
        if part:
            try:
                out.append(float(part))
            except ValueError:
                pass
    return out


# ── Module ──────────────────────────────────────────────────────────────────
@dataclass
class Module:
    manufacturer: str = ""
    model: str = ""
    pnom_w: float = 0.0
    length_m: float = 0.0          # long side
    width_m: float = 0.0           # short side
    technology: str = ""
    n_cells_series: int = 60
    n_cells_parallel: int = 1
    n_diodes: int = 3
    half_cell: bool = False        # SubModuleLayout = slTwinHalfCells
    isc: float = 0.0
    voc: float = 0.0
    imp: float = 0.0
    vmp: float = 0.0
    mu_isc_ma: float = 0.0         # mA/°C
    mu_voc_mv: float = 0.0         # mV/°C, 0 when the file does not give it
    mu_pmpp_pct: float = 0.0       # %/°C, 0 when the file does not give it
    r_shunt: float = 0.0
    r_shunt_0: float = 0.0
    r_shunt_exp: float = 5.5
    r_series: float = 0.0
    gamma: float = 0.0
    mu_gamma: float = 0.0
    v_max_iec: float = 1000.0
    bifaciality: float = 0.0
    lid_loss_pct: float | None = None
    iam_profile: list[tuple[float, float]] = field(default_factory=list)
    source: str = ""

    @property
    def area_m2(self) -> float:
        return self.length_m * self.width_m

    @property
    def efficiency(self) -> float:
        return self.pnom_w / (self.area_m2 * 1000.0) if self.area_m2 else 0.2

    @property
    def is_bifacial(self) -> bool:
        return self.bifaciality > 0


def read_pan(path: str | Path) -> Module:
    lines = _read_lines(path)
    kv = _flat_kv(lines)
    w, h = _f(kv, "Width"), _f(kv, "Height")
    if w >= 100:  # millimetres
        w, h = w / 1000.0, h / 1000.0
    mu_voc = _f(kv, "muVocSpec", "muVoc")
    if mu_voc and abs(mu_voc) < 1.0:  # V/°C
        mu_voc *= 1000.0
    lid = kv.get("lidloss")
    m = Module(
        manufacturer=_s(kv, "Manufacturer"),
        model=_s(kv, "Model"),
        pnom_w=_f(kv, "PNom"),
        length_m=max(w, h),
        width_m=min(w, h),
        technology=_s(kv, "Technol"),
        n_cells_series=int(_f(kv, "NCelS", default=60)),
        n_cells_parallel=int(_f(kv, "NCelP", default=1)),
        n_diodes=int(_f(kv, "NDiode", default=3)) or 3,
        half_cell="half" in _s(kv, "SubModuleLayout").lower(),
        isc=_f(kv, "Isc"),
        voc=_f(kv, "Voc"),
        imp=_f(kv, "Imp"),
        vmp=_f(kv, "Vmp"),
        mu_isc_ma=_f(kv, "muISC"),
        mu_voc_mv=mu_voc,
        mu_pmpp_pct=_f(kv, "muPmpp", "muPMax"),
        r_shunt=_f(kv, "RShunt"),
        r_shunt_0=_f(kv, "Rp_0"),
        r_shunt_exp=_f(kv, "Rp_Exp", default=5.5),
        r_series=_f(kv, "RSerie"),
        gamma=_f(kv, "Gamma"),
        mu_gamma=_f(kv, "muGamma"),
        v_max_iec=_f(kv, "VMaxIEC", "VMaxUL", default=1000.0),
        bifaciality=_f(kv, "BifacialityFactor"),
        lid_loss_pct=float(lid) if lid not in (None, "") else None,
        iam_profile=_profile(lines, "IAMProfile"),
        source=str(path),
    )
    if not m.pnom_w or not m.voc or not m.isc:
        raise ValueError(f"{Path(path).name}: not a PVsyst module file (PNom, Voc or Isc missing)")
    if not m.r_shunt_0:
        m.r_shunt_0 = 4 * m.r_shunt
    return m


# ── Inverter ────────────────────────────────────────────────────────────────
@dataclass
class Inverter:
    manufacturer: str = ""
    model: str = ""
    pnom_kw: float = 0.0
    pmax_kw: float = 0.0
    vmpp_min: float = 0.0
    vmpp_max: float = 0.0
    vmpp_nom: float = 0.0
    vabs_max: float = 0.0
    pseuil_w: float = 0.0
    idc_max_a: float = 0.0          # whole inverter
    n_mppt: int = 1
    n_inputs: int = 1
    imax_mppt_a: float = 0.0        # per MPPT, 0 = not in the file
    isc_max_mppt_a: float = 0.0     # per MPPT, 0 = not in the file
    effic_max_pct: float = 0.0
    effic_euro_pct: float = 0.0
    night_loss_w: float = 0.0
    v_out_v: float = 0.0            # AC output voltage
    i_max_ac_a: float = 0.0
    # {V_nominal: [(P_in W, P_out W), ...]}
    curves: dict[float, list[tuple[float, float]]] = field(default_factory=dict)
    source: str = ""

    @property
    def mppt_current_limit(self) -> float:
        if self.imax_mppt_a:
            return self.imax_mppt_a
        return self.idc_max_a / self.n_mppt if self.idc_max_a and self.n_mppt else 0.0

    @property
    def mppt_isc_limit(self) -> float:
        return self.isc_max_mppt_a or self.mppt_current_limit

    @property
    def curve_euro_pct(self) -> list[float]:
        return getattr(self, "_curve_euro", [])


def read_ond(path: str | Path) -> Inverter:
    lines = _read_lines(path)
    kv = _flat_kv(lines)
    unit = _s(kv, "UnitAffEnum").lower()
    pnom = _f(kv, "PNomConv")
    pmax = _f(kv, "PMaxOUT")
    if unit == "w" or pnom > 10000:  # older files give watts
        pnom, pmax = pnom / 1000.0, pmax / 1000.0
    inv = Inverter(
        manufacturer=_s(kv, "Manufacturer"),
        model=_s(kv, "Model"),
        pnom_kw=pnom,
        pmax_kw=pmax or pnom,
        vmpp_min=_f(kv, "VMppMin"),
        vmpp_max=_f(kv, "VMPPMax"),
        vmpp_nom=_f(kv, "VmppNom"),
        vabs_max=_f(kv, "VAbsMax", default=_f(kv, "VMPPMax")),
        pseuil_w=_f(kv, "PSeuil"),
        idc_max_a=_f(kv, "IMaxDC"),
        n_mppt=int(_f(kv, "NbMPPT", default=1)) or 1,
        n_inputs=int(_f(kv, "NbInputs", default=1)) or 1,
        imax_mppt_a=_f(kv, "IMaxMPPT", "IMaxDCMPPT"),
        isc_max_mppt_a=_f(kv, "IscMaxMPPT", "ISCMax"),
        effic_max_pct=_f(kv, "EfficMax"),
        effic_euro_pct=_f(kv, "EfficEuro"),
        night_loss_w=_f(kv, "Night_Loss"),
        v_out_v=_f(kv, "VOutConv"),
        i_max_ac_a=_f(kv, "IMaxAC"),
        source=str(path),
    )
    vnoms = _floats(kv, "VNomEff")
    for i, v in enumerate(vnoms[:3], start=1):
        pts = _profile(lines, f"ProfilPIOV{i}")
        if len(pts) >= 3:
            inv.curves[v] = pts
    if not inv.curves:
        pts = _profile(lines, "ProfilPIO")
        if len(pts) >= 3:
            # Single curve, often in kW: scale to watts against PNom.
            scale = 1000.0 if pts[-1][0] < 10 * inv.pnom_kw else 1.0
            inv.curves[inv.vmpp_nom or 0.0] = [(a * scale, b * scale) for a, b in pts]
    if not inv.pnom_kw or not inv.vmpp_max:
        raise ValueError(f"{Path(path).name}: not a PVsyst inverter file (PNomConv or VMPPMax missing)")
    inv._curve_euro = _floats(kv, "EfficEuroV")  # type: ignore[attr-defined]
    return inv
