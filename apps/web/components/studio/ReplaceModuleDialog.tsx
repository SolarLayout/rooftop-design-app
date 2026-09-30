"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { api, ApiError, type ModuleResponse } from "@/lib/api";

type Props = {
  open: boolean;
  /** Hears the module once the API read it; what becomes of it is for who uses the dialog. */
  onRead: (read: ModuleResponse) => void;
  onClose: () => void;
};

const REST: FileDropState = { kind: "rest" };

/** Why the file was not loaded: the words of the engine, or what the browser could not do. */
function reasonOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return `The file could not be read (${error instanceof Error ? error.message : String(error)}). Choose another.`;
}

/**
 * Replace the module (the board "Studio, Array lens, states"): a PAN file of PVsyst is read as text and
 * sent to the API. A file that is refused leaves the module of before in place and says why, in the
 * words of the engine (D32). Closing the dialog gives up a file that is still being read.
 */
export function ReplaceModuleDialog({ open, onRead, onClose }: Props) {
  const [state, setState] = useState<FileDropState>(REST);
  const call = useRef<AbortController | null>(null);

  function giveUp() {
    call.current?.abort();
    call.current = null;
  }

  function close() {
    giveUp();
    setState(REST);
    onClose();
  }

  async function read(file: File) {
    giveUp();
    const thisCall = new AbortController();
    call.current = thisCall;
    setState({ kind: "reading", file: file.name });
    try {
      const text = await file.text();
      const answer = await api.parseModule({ name: file.name, text }, { signal: thisCall.signal });
      if (thisCall.signal.aborted) return;
      call.current = null;
      setState(REST);
      onRead(answer);
    } catch (error) {
      if (thisCall.signal.aborted) return;
      call.current = null;
      setState({ kind: "refused", reason: reasonOf(error) });
    }
  }

  return (
    <Dialog open={open} title="Replace the module" onClose={close} actions={[{ label: "Cancel", kind: "quiet", onPress: close }]}>
      <p>A PAN file of PVsyst. The module of before stays until the new one is read; the layout and the energy follow.</p>
      <FileDrop
        title="Drop the module file here"
        detail="A PAN file of PVsyst"
        whenOver="It replaces the module of this design"
        accept=".pan,.PAN"
        state={state}
        onFile={read}
        className="mt-3"
      />
    </Dialog>
  );
}
