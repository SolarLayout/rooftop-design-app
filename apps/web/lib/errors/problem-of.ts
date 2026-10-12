// Every problem the app shows, in one shape (V2 · 5, D101; plan/v2/voice.md §5): the title, the thing and its state; the
// cause, one sentence with the agent named; the remedy, the first thing to try; the actions, a button each; and the
// details only a developer reads, behind Details. No word of the machine in the title or the cause. Pure.

/** A button of a problem: Try again asks again; Open leads to where the matter is put right (its href). */
export type ProblemAction = { id: "try-again" | "choose-inverter" | "sizing" | "open"; label: string; href?: string };

export type Problem = {
  title: string;
  cause: string;
  /** What to do first; none where the cause says it (a refusal of the API, in its own words). */
  remedy: string | null;
  actions: readonly ProblemAction[];
  details: string | null;
};

/** What failed, as the results keep it: the API's code and words, the status of the answer, the fault of the app. */
export type FailureFacts = { code: string; message: string; status?: number | null; details?: string | null };

const TRY_AGAIN: ProblemAction = { id: "try-again", label: "Try again" };
const NO_ANSWER = "No answer";

type Context = {
  /** What did not come. */
  subject: "energy" | "layout";
  /** Whether a result of before is still shown. */
  hasBefore: boolean;
  /** When it failed, as the details say it; none where it is not known. */
  at?: string | null;
};

const TITLE: Record<Context["subject"], [first: string, again: string]> = {
  energy: ["Energy not computed", "Energy not updated"],
  layout: ["Layout not computed", "Layout not updated"],
};

const BEFORE = " The result shown is from before the change.";

/** The details: the parts known, joined. */
const detailsOf = (...parts: readonly (string | number | null | undefined)[]) => parts.filter((part) => part !== null && part !== undefined).join(" · ");

export function problemOfFailure(failure: FailureFacts, { subject, hasBefore, at = null }: Context): Problem {
  const [first, again] = TITLE[subject];
  const title = hasBefore ? again : first;
  if (failure.code === "api_unreachable") {
    return {
      title,
      cause: hasBefore ? `The server could not be reached after your last change.${BEFORE}` : "The server could not be reached.",
      remedy: "Check your connection, then try again.",
      actions: [TRY_AGAIN],
      details: detailsOf(NO_ANSWER, at),
    };
  }
  if (failure.code === "unexpected_answer" || ((failure.status ?? 0) >= 500)) {
    return { title, cause: `The server did not answer.${hasBefore ? BEFORE : ""}`, remedy: "Try again in a moment.", actions: [TRY_AGAIN], details: detailsOf(failure.status ?? NO_ANSWER, at) };
  }
  if (failure.code === "unexpected_fault") {
    return { title, cause: `The app could not finish this step.${hasBefore ? BEFORE : ""}`, remedy: "Try again.", actions: [TRY_AGAIN], details: detailsOf(failure.details ?? failure.code, at) };
  }
  // A refusal of the API: its words say what to change, and trying again would give the same.
  return { title, cause: failure.message, remedy: null, actions: [], details: detailsOf(failure.status ?? NO_ANSWER, failure.code, at) };
}

/** No option to offer, in the API's own words: the result says so, and the way leads to where it is put right. */
export function problemOfNoOptions({ message, path, stepName }: { message: string; path: string; stepName: string }): Problem {
  return { title: "Energy not computed", cause: message, remedy: null, actions: [{ id: "open", label: `Open ${stepName}`, href: path }], details: null };
}

/** A higher voltage that fits, as the step's primary: the user's choice, undone in one step (D87, D88). */
export type VoltageRemedy<Volts extends number = number> = { volts: Volts; label: string; line: string };

/** No string length fits at the voltage set: the problem at the Strings step's head, and its likeliest remedy. */
export function noStringsFitProblemOf<Volts extends number>({ voltage, range, fitsAt }: { voltage: number; range: { n_min: number; n_max: number }; fitsAt: Volts | null }): {
  problem: Problem;
  primary: VoltageRemedy<Volts> | null;
} {
  return {
    problem: {
      title: `No string length fits at ${voltage} V`,
      cause: `This inverter needs at least ${range.n_min} modules in a string. At ${voltage} V a string holds at most ${range.n_max}.`,
      remedy: null,
      actions: [
        { id: "choose-inverter", label: "Choose another inverter" },
        { id: "sizing", label: "Change the sizing temperatures" },
      ],
      details: null,
    },
    primary: fitsAt === null ? null : { volts: fitsAt, label: `Use ${fitsAt} V`, line: "Allowed on most commercial roofs. Check the site's code first." },
  };
}

/** The search for an address without its service (voice §5). */
export const SEARCH_UNAVAILABLE = "Address search is not available. Paste coordinates or a maps link.";

/** A file the API refused, in its dialog until the file changes. */
export const CSV_REFUSED_TITLE = "This file cannot be used";

/** A file the app will not send: its own words, said before any request. */
export const problemOfFileTooLarge = (message: string): Problem => ({ title: CSV_REFUSED_TITLE, cause: message, remedy: null, actions: [], details: null });

/**
 * A file that was not loaded, as the dialog says it until the file changes (V2 · 5, voice §5): a refusal of the API
 * says what was expected and what was found, in its own words, with the status and the code behind Details; a server
 * that did not answer, or a fault of the app, is no refusal of the file, so it says what happened and offers no remedy.
 */
export function problemOfFile(failure: FailureFacts): Problem {
  const status = failure.status ?? 0;
  if (status >= 400 && status < 500) return { title: CSV_REFUSED_TITLE, cause: failure.message, remedy: null, actions: [], details: detailsOf(status, failure.code) };
  const { cause, remedy, details } = problemOfFailure(failure, { subject: "energy", hasBefore: false });
  return { title: "The file was not loaded", cause, remedy, actions: [], details };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** When a problem came, as its details say it: "12 Oct 2026, 10:42". */
export const whenOf = (date: Date): string =>
  `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
