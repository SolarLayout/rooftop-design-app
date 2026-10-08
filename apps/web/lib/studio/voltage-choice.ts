import type { Project } from "../api";
import type { Volts } from "./voltages";

/** The document with the voltage the user chose in the lens: theirs from now on, never moved by the app (D87, D88). */
export function withVoltageChosen(document: Project, volts: Volts): Project {
  if (document.system_voltage === volts && document.system_voltage_by === "user") return document;
  return { ...document, system_voltage: volts, system_voltage_by: "user" };
}
