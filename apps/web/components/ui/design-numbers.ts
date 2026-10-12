// Numbers of the design that code needs and a stylesheet cannot give: times that a clock waits, and
// distances that a place is worked out with. docs/design/design-tokens.md, "Numbers in code", has the
// same; design-numbers.test.ts holds the two equal.

/** A tooltip comes this long after the pointer came, in milliseconds. With the keyboard focus it comes at once. */
export const TOOLTIP_DELAY = 400;

/** A toast of something done leaves after this long, in milliseconds. */
export const TOAST_STAYS = 5000;

/** Between a tooltip and its control, in pixels. */
export const TOOLTIP_GAP = 8;

/** Between a list that floats and its trigger, in pixels. */
export const LIST_GAP = 6;

/** What stays free between a thing that floats and the edge of the screen, in pixels. */
export const SCREEN_MARGIN = 8;

/** A design run begins this long after a committed edit, in milliseconds: edits shortly after each other are one run. */
export const DESIGN_PAUSE = 500;

/** The zoom of the map at a roof that was found, as MapLibre counts zoom (on tiles of 512): the native zoom 19 of the imagery's tiles of 256, about 0.3 m per pixel. */
export const ROOF_ZOOM = 18;

/** How wide the scale bar of the map may be at most, in pixels; it shows the largest round length that fits. */
export const SCALE_BAR_MAX = 124;

/** Degrees within which a corner snaps to a right angle or to a parallel, and the rectangle's turn to north. */
export const SNAP_DEGREES = 3;

/** Pixels of the map within which such a snap may carry a corner from the pointer: a drag moves finely, never by metres. */
export const SNAP_REACH = 4;

/** Pixels within which a press on the first corner closes the outline. */
export const CLOSE_WITHIN = 12;

/** The same on phone and tablet. */
export const CLOSE_WITHIN_TOUCH = 20;

/** Millimetres a selected corner moves by an arrow key. */
export const NUDGE_MM = 100;

/** The same with Shift held. */
export const NUDGE_SHIFT_MM = 1000;

/** Pixels the turn handle of a selected obstacle stands off the middle of the north edge of its top, due north, on its stem. */
export const STEM_TURN = 44;

/** Pixels the height handle stands over the middle of the top, on its vertical stem, on desktop. */
export const STEM_HEIGHT = 40;

/** The same on phone and tablet. */
export const STEM_HEIGHT_TOUCH = 52;

/** The time of the sun must stand still this long, in milliseconds, before the engine's shadow outlines are asked for it. */
export const TIME_REST = 150;

/** Percent that the glass of every other position is mixed toward the stage's colour while a string is traced or selected. */
export const DIM_TOWARD_STAGE = 55;

/** Pixels: the marker of a point under the pointer is 8 across. */
export const MARKER_RADIUS = 4;

/** Pixels of the ring in the surface colour around a marker, so that it stays legible on the line. */
export const MARKER_RING = 2;

/** A design is written to the device this long after the last committed edit, in milliseconds: edits shortly after each other are one write. */
export const SAVE_DEBOUNCE = 600;

/** Pixels the sheet of a step shows of itself at peek on phone (V2 · 10): its handle, the step's instruction and its primary. */
export const SHEET_PEEK_OF_A_STEP = 156;
