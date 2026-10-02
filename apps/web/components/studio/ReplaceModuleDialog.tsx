"use client";

import { api, type ModuleResponse } from "@/lib/api";
import { ReplaceEquipmentDialog, type ReplaceWords } from "./ReplaceEquipmentDialog";

type Props = {
  open: boolean;
  /** Hears the module once the API read it; what becomes of it is for who uses the dialog. */
  onRead: (read: ModuleResponse) => void;
  onClose: () => void;
};

const WORDS: ReplaceWords = {
  title: "Replace the module",
  sentence: "A PAN file of PVsyst. The module of before stays until the new one is read; the layout and the energy follow.",
  drop: "Drop the module file here",
  detail: "A PAN file of PVsyst",
  whenOver: "It replaces the module of this design",
  accept: ".pan,.PAN",
};

/** Replace the module (the board "Studio, Array lens, states"): a PAN file of PVsyst, read by /equipment/module. */
export function ReplaceModuleDialog(props: Props) {
  return <ReplaceEquipmentDialog words={WORDS} readBy={api.parseModule} {...props} />;
}
