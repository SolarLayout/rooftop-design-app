// The makers of modules and inverters as people know them (D75): the picker of the library and the equipment cards name a
// maker so, not as its file states it. A maker that is not here keeps the file's name. How to add one:
// docs/equipment-library.md.

/** The name a file gives its maker, on the left; the name people know it by, on the right. */
const MAKERS: Readonly<Record<string, string>> = {
  "Canadian Solar Inc.": "Canadian Solar",
  "Chint Power Systems (CPS)": "CPS",
  "ET SOLAR": "ET Solar",
  "Fronius International": "Fronius",
  "Fronius USA": "Fronius",
  "Ginlong Technologies": "Solis",
  "Heliene Inc": "Heliene",
  "INSOLATION GREEN ENERGY PVT. LTD.": "Insolation",
  "Kaco new energy": "KACO",
  "MA SOLAR ITALY": "FIMER",
  "Silfab Solar": "Silfab",
  "Silfab Solar Inc.": "Silfab",
  "Waaree Energies Ltd.": "Waaree",
  "WattPower Systems Pvt.Ltd": "WattPower",
  "Yaskawa Solectria Solar": "Yaskawa Solectria",
};

const keyOf = (name: string) => name.trim().toLowerCase();
const BY_KEY = new Map(Object.entries(MAKERS).map(([file, everyday]) => [keyOf(file), everyday]));

/** The maker as people know it, from the name its file gives it. */
export function makerOf(fileMaker: string): string {
  return BY_KEY.get(keyOf(fileMaker)) ?? fileMaker.trim();
}
