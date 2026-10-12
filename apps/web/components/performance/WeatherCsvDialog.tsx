"use client";

import { useRef, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { Problem } from "@/components/ui/Problem";
import { api, type WeatherResponse } from "@/lib/api";
import { problemOfFile, problemOfFileTooLarge, type Problem as ProblemFacts } from "@/lib/errors/problem-of";
import { failureOf } from "@/lib/flow/design-flow";
import { CSV_TOO_LARGE, CSV_WORDS, csvFits, csvSummaryLinesOf } from "@/lib/performance/weather-csv";
import type { WeatherChosen } from "@/lib/flow/weather-source";
import { NoteLine } from "./NoteLine";

type Props = {
  open: boolean;
  /** The roof's place: the hours are sorted into the sun's day by it. */
  site: { lat: number; lon: number };
  /** Hears Use: the source, the file's name and text, and its hours; what becomes of them is for who uses the dialog. */
  onUse: (chosen: WeatherChosen) => void;
  onClose: () => void;
};

/** A file the API read, kept until Use: its name and text, which the document will carry (D7), and the API's answer. */
type Read = { name: string; text: string; answer: WeatherResponse };

/** A file that was not loaded: it stays in the dialog with its problem until the file changes (V2 · 5). */
type Refused = { name: string; size: string; problem: ProblemFacts };

const REST: FileDropState = { kind: "rest" };

const sizeOf = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

/**
 * Load weather from a CSV (plan/phase-08-plan.md, step 19; the board "Weather and assumptions"): the file is read as text
 * and sent to /weather, which answers its hours, its summary and its notes, shown before anything is committed. A file
 * that is refused stays in the dialog with its problem, in the API's words and its detail behind Details, until the file changes; the weather of before stays (D32, V2 · 5). Use commits the source, the file's
 * name and text and its hours in one edit. Closing the dialog gives up a file that is still being read.
 */
export function WeatherCsvDialog({ open, site, onUse, onClose }: Props) {
  const [read, setRead] = useState<Read | null>(null);
  const [refused, setRefused] = useState<Refused | null>(null);
  const [reading, setReading] = useState<string | null>(null);
  const call = useRef<AbortController | null>(null);

  function giveUp() {
    call.current?.abort();
    call.current = null;
  }

  function reset() {
    giveUp();
    setRead(null);
    setRefused(null);
    setReading(null);
  }

  function close() {
    reset();
    onClose();
  }

  function use() {
    if (!read) return;
    const { name, text, answer } = read;
    reset();
    onUse({ source: "csv", weather: answer.weather, csv: { name, text } });
  }

  async function readFile(file: File) {
    giveUp();
    setRead(null);
    if (!csvFits(file)) {
      setReading(null);
      setRefused({ name: file.name, size: sizeOf(file.size), problem: problemOfFileTooLarge(CSV_TOO_LARGE) });
      return;
    }
    const thisCall = new AbortController();
    call.current = thisCall;
    setRefused(null);
    setReading(file.name);
    try {
      const text = await file.text();
      const answer = await api.loadWeather({ source: "csv", lat: site.lat, lon: site.lon, csv_name: file.name, csv_text: text }, { signal: thisCall.signal });
      if (thisCall.signal.aborted) return;
      call.current = null;
      setReading(null);
      setRead({ name: file.name, text, answer });
    } catch (error) {
      if (thisCall.signal.aborted) return;
      call.current = null;
      setReading(null);
      setRefused({ name: file.name, size: sizeOf(file.size), problem: problemOfFile(failureOf(error)) });
    }
  }

  const state: FileDropState = reading
    ? { kind: "reading", file: reading }
    : read
      ? { kind: "read", file: read.name, lines: csvSummaryLinesOf(read.answer.summary) }
      : refused
        ? { kind: "held", file: refused.name, detail: refused.size }
        : REST;

  return (
    <Dialog
      open={open}
      title={CSV_WORDS.title}
      onClose={close}
      actions={[
        { label: "Cancel", kind: "quiet", onPress: close },
        { label: CSV_WORDS.use, kind: "primary", waits: read === null, onPress: use },
      ]}
    >
      <p>{CSV_WORDS.sentence}</p>
      <FileDrop title={CSV_WORDS.drop} detail={CSV_WORDS.detail} whenOver={CSV_WORDS.whenOver} accept={CSV_WORDS.accept} state={state} onFile={readFile} className="mt-3" />
      {refused ? <Problem problem={refused.problem} testId="csv-refused" className="mt-3" onAction={() => undefined} /> : null}
      {read && read.answer.notes.length > 0 ? (
        <ul aria-live="polite" data-testid="csv-notes" className="mt-3 flex flex-col gap-2">
          {read.answer.notes.map((note) => (
            <NoteLine key={note} words={note} testId="csv-note" />
          ))}
        </ul>
      ) : null}
    </Dialog>
  );
}
