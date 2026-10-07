// The days the Sun lens offers (decision 2 of phase 6): the solstices and the March equinox by their day of the year,
// and any date. Pure, with nothing to import, so that the in-app help's gate reads them (D80).

export const DAY_CHOICES = [
  { dayOfYear: 355, label: "21 Dec" },
  { dayOfYear: 80, label: "21 Mar" },
  { dayOfYear: 172, label: "21 Jun" },
] as const;

/** Any day of the year, by its day and its month. */
export const ANY_DATE = { id: "any", label: "Any date" } as const;
