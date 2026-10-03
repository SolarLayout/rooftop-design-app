// What a workspace without a design opens (plan/phase-10-plan.md, step 4, decision 2): the design remembered as open,
// read from the device and opened into the project store (the flow then runs it as it runs the demo: /layout, /design);
// else the demo. A kept design that cannot be read opens the demo and says so with the device's words. Pure in what it
// decides: the ways to open are given to it.

type Ways = {
  /** The id remembered as open; null when none is (lib/device/remembered.ts). */
  remembered: string | null;
  /** Opens the kept design of this id; false when the device has none; throws the device's words when it cannot be read. */
  openFromDevice: (id: string) => Promise<boolean>;
  openDemo: () => void;
  /** Where the words of a design that could not be opened are said. */
  say: (words: string) => void;
};

const INSTEAD = "The demo is open instead.";

/** The device's words, then what was done instead. */
export function notOpenedWordsOf(error: unknown): string {
  const words = error instanceof Error ? error.message : `The design kept on this device could not be opened: ${String(error)}.`;
  return `${words} ${INSTEAD}`;
}

/** Opens what belongs at a workspace without a design, and says which it was. */
export async function openWhatBelongs({ remembered, openFromDevice, openDemo, say }: Ways): Promise<"kept" | "demo"> {
  if (remembered !== null) {
    try {
      if (await openFromDevice(remembered)) return "kept";
      // The design remembered is no longer on the device: it was removed on purpose, and the demo needs no word.
    } catch (error) {
      say(notOpenedWordsOf(error));
    }
  }
  openDemo();
  return "demo";
}
