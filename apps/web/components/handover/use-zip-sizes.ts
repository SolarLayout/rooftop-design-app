import { useEffect, useState } from "react";
import type { ExportedFile } from "@/lib/api";
import { sizesOfZip, type Sizes } from "@/lib/handover/zip-sizes";

const NONE: Sizes = {};

/** The sizes of the files in the zip of them all (V2 · 9), read from its bytes once it came; none before. */
export function useZipSizes(zip: ExportedFile | null): Sizes {
  const [read, setRead] = useState<{ blob: Blob; sizes: Sizes } | null>(null);
  useEffect(() => {
    if (zip === null) return;
    let isOver = false;
    void zip.blob.arrayBuffer().then((buffer) => {
      if (!isOver) setRead({ blob: zip.blob, sizes: sizesOfZip(new Uint8Array(buffer)) });
    });
    return () => {
      isOver = true;
    };
  }, [zip]);
  return read !== null && read.blob === zip?.blob ? read.sizes : NONE;
}
