// The two shapes of a roof entered by hand (the board "Enter dimensions by hand"). Pure, with nothing to import, so that
// the in-app help's gate reads them (D80).

export type Shape = "rectangle" | "corners";

export const SHAPES: readonly { value: Shape; label: string }[] = [
  { value: "rectangle", label: "Rectangle" },
  { value: "corners", label: "Corners" },
];
