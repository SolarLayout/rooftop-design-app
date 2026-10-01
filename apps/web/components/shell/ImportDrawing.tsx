"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, type FoundPlace } from "@/components/find/Search";
import { Dialog } from "@/components/ui/Dialog";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { NumberField } from "@/components/ui/NumberField";
import { Segmented } from "@/components/ui/Segmented";
import { api, ApiError, type RoofFile } from "@/lib/api";
import { esriProvider, KEY_OF_THE_APP } from "@/lib/map/esri";
import { pathOfLens } from "@/lib/routes";
import { base64OfDataUrl, heldWordsOf, importDrawing, kindOfDrawing } from "@/lib/studio/import-drawing";
import { useStores } from "./stores";

type Props = { open: boolean; onClose: () => void };

type Units = RoofFile["units"] & string;

const UNITS: { value: Units; label: string }[] = [
  { value: "m", label: "m" },
  { value: "mm", label: "mm" },
];

/** The inventory's units of a DXF, suggested once the file is one (functional-inventory.md, 1.1). */
const SUGGESTED_UNITS: Units = "m";

const WHAT_IS_READ = "The largest closed shape is the roof; the other closed shapes are obstacles, named by their layer. A KMZ or KML says where the roof is; a DXF does not, so its place is asked.";

/** The place of a DXF, searched or typed; nothing until it is (docs/design/components.md, "Import a drawing"). */
type Place = { lat: number | null; lon: number | null; found: string | null };
const NO_PLACE: Place = { lat: null, lon: null, found: null };
const LATITUDE = { min: -90, max: 90, decimals: 5 };
const LONGITUDE = { min: -180, max: 180, decimals: 5 };
const PROVIDER = esriProvider(KEY_OF_THE_APP);
const nowhere = () => undefined;

/** The file as the browser reads it, as base64. */
function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(base64OfDataUrl(String(reader.result)));
    reader.onerror = () => reject(new Error("The file could not be read."));
    reader.readAsDataURL(file);
  });
}

/**
 * Import a drawing, from the project switcher (plan/phase-05-plan.md, step 13, decision 13; the board
 * "Import with missing heights"): a KMZ, KML or DXF is held until Open the roof, then sent as base64; the
 * document it answers opens in the Studio on the Roof lens, with the heights the file could not give on the
 * list to review. A refusal shows in the field, in the API's words. The units are asked for a DXF alone.
 */
export function ImportDrawing({ open, onClose }: Props) {
  const router = useRouter();
  const { project, view } = useStores();
  const [held, setHeld] = useState<File | null>(null);
  const [units, setUnits] = useState<Units | null>(null);
  const [place, setPlace] = useState<Place>(NO_PLACE);
  const [state, setState] = useState<FileDropState>({ kind: "rest" });
  const isDxf = held !== null && kindOfDrawing(held.name) === "dxf";
  const isReading = state.kind === "reading";
  // A DXF holds nothing of where the roof is: it waits for its place, and nothing is guessed.
  const lacksPlace = isDxf && (place.lat === null || place.lon === null);

  function hold(file: File) {
    setHeld(file);
    setUnits(kindOfDrawing(file.name) === "dxf" ? SUGGESTED_UNITS : null);
    setState({ kind: "held", file: file.name, detail: heldWordsOf(file.name, file.size) });
  }

  function close() {
    setHeld(null);
    setUnits(null);
    setPlace(NO_PLACE);
    setState({ kind: "rest" });
    onClose();
  }

  function placeFound({ lat, lon, label }: FoundPlace) {
    setPlace({ lat, lon, found: label });
  }

  async function openTheRoof() {
    if (!held || isReading || lacksPlace) return;
    setState({ kind: "reading", file: held.name });
    try {
      const base64 = await readAsBase64(held);
      const drawing = isDxf && units && place.lat !== null && place.lon !== null ? { name: held.name, base64, units, lat: place.lat, lon: place.lon } : { name: held.name, base64 };
      await importDrawing(drawing, { api, project, view });
      close();
      router.push(pathOfLens("roof"));
    } catch (error) {
      setHeld(null);
      setUnits(null);
      setState({ kind: "refused", reason: error instanceof ApiError ? error.message : "The file could not be read. Choose another." });
    }
  }

  return (
    <Dialog
      open={open}
      title="Import a drawing"
      onClose={close}
      actions={[
        { label: "Cancel", kind: "quiet", onPress: close },
        { label: "Open the roof", kind: "primary", waits: held === null || isReading || lacksPlace, onPress: openTheRoof },
      ]}
    >
      <p>{WHAT_IS_READ}</p>
      <div className="mt-3 flex flex-col gap-3">
        <FileDrop title="Drop the drawing here" detail="KMZ, KML or DXF" whenOver="It becomes the roof of a new design" accept=".kmz,.kml,.dxf" state={state} onFile={hold} />
        <div className="flex items-center gap-3">
          <div className="flex grow flex-col gap-0.5">
            <span className="text-text">DXF units</span>
            <span className="type-caption text-text-3">{isDxf ? "Suggested for this file. Change it if the drawing is in millimetres" : "Chosen once the file is a DXF"}</span>
          </div>
          <Segmented label="DXF units" options={UNITS} value={units} onChange={setUnits} disabled={!isDxf} />
        </div>
        {isDxf ? (
          <div data-testid="import-place" className="flex flex-col gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-text">Place</span>
              <span className="type-caption text-text-3">
                {place.found === null ? "The drawing does not say where the roof is. Search the place, or type its coordinates" : "From the search. Change it if the drawing is elsewhere"}
              </span>
            </div>
            <Search provider={PROVIDER} near={nowhere} onPlace={placeFound} found={null} look="field" />
            <div className="grid grid-cols-2 gap-field">
              <NumberField label="Latitude" value={place.lat} unit="° N" range={LATITUDE} labelInside wide onCommit={(lat) => setPlace((was) => ({ ...was, lat }))} />
              <NumberField label="Longitude" value={place.lon} unit="° E" range={LONGITUDE} labelInside wide onCommit={(lon) => setPlace((was) => ({ ...was, lon }))} />
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
