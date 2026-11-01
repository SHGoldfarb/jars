// TODO: maybe move this to a service?
// Consecutive entries that fall on the same day, in the order they were given. Days are read off
// the ISO date in UTC, the zone every movement date is shown in.
export const groupByDay = <T extends { dateISO: string }>(entries: readonly T[]) => {
  const days: { dayISO: string; entries: T[] }[] = [];

  for (const entry of entries) {
    const dayISO = entry.dateISO.slice(0, 10);
    const last = days.at(-1);
    if (last?.dayISO === dayISO) {
      last.entries.push(entry);
    } else {
      days.push({ dayISO, entries: [entry] });
    }
  }

  return days;
};
