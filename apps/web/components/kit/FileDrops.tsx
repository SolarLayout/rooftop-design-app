"use client";

import { useRef } from "react";
import { FileDrop, type FileDropState } from "@/components/ui/FileDrop";
import { Example, Row, Section } from "./Example";

type Props = { onPress: (what: string) => void };

const MODULE = {
  title: "Drop the module file here",
  detail: "A PAN file of PVsyst",
  whenOver: "It replaces the module of before",
  accept: ".pan",
};
const REST: FileDropState = { kind: "rest" };

export function FileDrops({ onPress }: Props) {
  const files = useRef(0);

  function said(file: File) {
    files.current += 1;
    onPress(`File, ${file.name}, ${file.size} bytes, file ${files.current}`);
  }

  return (
    <Section title="File drop">
      <Row label="It gives the file to who uses it; reading and refusing are told to it">
        <div className="grid w-full max-w-115 gap-3">
          <Example name="file-drop" caption="Rest. Drop a file, or choose one">
            <FileDrop {...MODULE} state={REST} onFile={said} className="w-full" />
          </Example>
          <Example name="file-drop-over" caption="A file is held over it">
            <FileDrop {...MODULE} state={REST} onFile={said} shownAs="over" className="w-full" />
          </Example>
          <Example name="file-drop-reading" caption="Reading">
            <FileDrop {...MODULE} state={{ kind: "reading", file: "insolation-ina-144mhc-tf-560.PAN" }} onFile={said} className="w-full" />
          </Example>
          <Example name="file-drop-refused" caption="Refused, in the words of the engine. What was there before stays">
            <FileDrop
              {...MODULE}
              state={{ kind: "refused", reason: "datasheet.PAN: not a PVsyst module file (PNom, Voc or Isc missing)" }}
              onFile={said}
              className="w-full"
            />
          </Example>
        </div>
      </Row>
    </Section>
  );
}
