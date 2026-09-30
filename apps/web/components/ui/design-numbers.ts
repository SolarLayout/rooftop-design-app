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

/** Pixels within which a press on the first corner closes the outline. */
export const CLOSE_WITHIN = 12;

/** The same on phone and tablet. */
export const CLOSE_WITHIN_TOUCH = 20;

/** Millimetres a selected corner moves by an arrow key. */
export const NUDGE_MM = 100;

/** The same with Shift held. */
export const NUDGE_SHIFT_MM = 1000;
