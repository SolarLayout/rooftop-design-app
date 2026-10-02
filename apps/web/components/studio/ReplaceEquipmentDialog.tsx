"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { ApiError, type CallOptions, type EquipmentFile } from "@/lib/api";

/** The words of the dialog: the title, one sentence of what happens, and the file drop's. */
export type ReplaceWords = { title: string; sentence: string; drop: string; detail: string; whenOver: string; accept: string };

type Props<Read> = {
  words: ReplaceWords;
  /** The API's reading of the file: it answers what was read, or refuses it in the engine's words. */
  readBy: (file: EquipmentFile, options: CallOptions) => Promise<Read>;
  open: boolean;
  /** Hears the file once the API read it; what becomes of it is for who uses the dialog. */
  onRead: (read: Read) => void;
  onClose: () => void;
};

const REST: FileDropState = { kind: "rest" };

/** Why the file was not loaded: the words of the engine, or what the browser could not do. */
function reasonOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return `The file could not be read (${error instanceof Error ? error.message : String(error)}). Choose another.`;
}

/**
 * Replace a file of the equipment (the boards "Studio, Array lens, states" and "Inverter and sizing"): a file
 * of PVsyst is read as text and sent to the API. A file that is refused leaves the equipment of before in
 * place and says why, in the words of the engine (D32). Closing the dialog gives up a file that is still being
 * read.
 */
export function ReplaceEquipmentDialog<Read>({ words, readBy, open, onRead, onClose }: Props<Read>) {
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
      const answer = await readBy({ name: file.name, text }, { signal: thisCall.signal });
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
    <Dialog open={open} title={words.title} onClose={close} actions={[{ label: "Cancel", kind: "quiet", onPress: close }]}>
      <p>{words.sentence}</p>
      <FileDrop title={words.drop} detail={words.detail} whenOver={words.whenOver} accept={words.accept} state={state} onFile={read} className="mt-3" />
    </Dialog>
  );
}
