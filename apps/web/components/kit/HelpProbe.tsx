"use client";

import { HelpBody } from "@/components/shell/help/HelpBody";
import { HELP_KEYS, MANIFEST } from "@/lib/help/manifest.gen";

/** Every topic of the help with its body, loaded as the sheet loads it: proof that each one compiles and draws. */
export function HelpProbe() {
  return (
    <main className="flex min-h-dvh flex-col gap-8 bg-chrome p-8 text-text type-body-touch desktop:type-body">
      {HELP_KEYS.map((key) => (
        <section key={key} data-help-topic={key} className="flex max-w-105 flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="type-body-touch desktop:type-body text-text-3">{key}</span>
            <h2 className="type-title-touch desktop:type-title">{MANIFEST[key].title}</h2>
            <p className="text-text-2">{MANIFEST[key].summary}</p>
          </div>
          <HelpBody entry={MANIFEST[key]} />
        </section>
      ))}
    </main>
  );
}
