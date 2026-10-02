"use client";

import { api, type InverterResponse } from "@/lib/api";
import { ReplaceEquipmentDialog, type ReplaceWords } from "./ReplaceEquipmentDialog";

type Props = {
  open: boolean;
  /** Hears the inverter once the API read it; what becomes of it is for who uses the dialog. */
  onRead: (read: InverterResponse) => void;
  onClose: () => void;
};

const WORDS: ReplaceWords = {
  title: "Replace the inverter",
  sentence: "An OND file of PVsyst. The inverter of before stays until the new one is read; the strings and the energy follow.",
  drop: "Drop the inverter file here",
  detail: "An OND file of PVsyst",
  whenOver: "It replaces the inverter of this design",
  accept: ".ond,.OND",
};

/** Replace the inverter (the board "Inverter and sizing"): an OND file of PVsyst, read by /equipment/inverter. */
export function ReplaceInverterDialog(props: Props) {
  return <ReplaceEquipmentDialog words={WORDS} readBy={api.parseInverter} {...props} />;
}
