// "1 inverter(s)", "12 position(s)": the engine's words for a count it does not know the number of (voice §7, audit
// V2-46). Said by count on the screen: one is the singular, any other number the plural. Pure.

/** The words with every "N word(s)" said by its count: "1 inverter(s)" is "1 inverter", "2 inverter(s)" is "2 inverters". */
export const byCount = (words: string): string =>
  words.replace(/(\d[\d,]*)(\s+[A-Za-z][A-Za-z-]*?)\(s\)/g, (_, count: string, word: string) => `${count}${word}${count === "1" ? "" : "s"}`);
