import { useEffect, useState } from "react";

/** The text of a blob, once read; null before, and while there is no blob. */
export function useBlobText(blob: Blob | null): string | null {
  const [read, setRead] = useState<{ blob: Blob; text: string } | null>(null);

  useEffect(() => {
    if (blob === null) return;
    let isOver = false;
    void blob.text().then((text) => {
      if (!isOver) setRead({ blob, text });
    });
    return () => {
      isOver = true;
    };
  }, [blob]);

  return read !== null && read.blob === blob ? read.text : null;
}
