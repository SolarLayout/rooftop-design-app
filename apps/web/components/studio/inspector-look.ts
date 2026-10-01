import type { Size } from "./use-size";

// The look that the sections of an inspector share (the boards "Studio, Roof lens" on three sizes).

export const SECTION = "type-section text-text-3 uppercase";

/**
 * How the fields of a section stand: two to a row with the label inside on tablet and desktop; on phone
 * one to a row, the label before the field, as the boards draw the edges and the fields of an obstacle.
 */
export const fieldsLayoutOf = (size: Size) => (size === "phone" ? "flex flex-col gap-field" : "grid grid-cols-2 gap-field");
