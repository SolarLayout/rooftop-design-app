// A file of the API saved by the browser (plan/phase-09-plan.md, decision 12): an anchor with `download` is pressed for
// the user. This is the one place that touches the DOM for it; it is tested in the browser (e2e/tests/handover.e2e.ts).

/** Saves *blob* as a file called *name*: the browser shows its download. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // The URL is given back once the press has been taken up: a browser may still read it in this turn.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
