// The system voltages a design can be built for (decision F7: never chosen for the user). Pure, with nothing to import,
// so that the in-app help's gate reads it.

export type Volts = 600 | 1000 | 1500;
export const VOLTAGES: readonly Volts[] = [600, 1000, 1500];
