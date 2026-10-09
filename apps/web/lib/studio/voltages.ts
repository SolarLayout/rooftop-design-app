// The system voltages a design can be built for. A design without one gets its user's country's (D87), never raised by
// the app (D88). Pure, with nothing to import, so that the in-app help's gate reads it.

export type Volts = 600 | 1000 | 1500;
export const VOLTAGES: readonly Volts[] = [600, 1000, 1500];
