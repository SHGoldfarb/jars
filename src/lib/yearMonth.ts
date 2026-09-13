// A calendar month, as the 'YYYY-MM' key the Movements URL carries.
//
// Months are UTC. Movement dates are stored as UTC instants and rendered with `timeZone: 'UTC'`,
// and `dateInput` reads the `datetime-local` field as UTC too, so bucketing by anything else
// would file a movement under a month its own row does not show.

import * as z from 'zod';

export const YearMonthKey = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be formatted as YYYY-MM')
  .brand<'YearMonthKey'>();

export type YearMonthKey = z.infer<typeof YearMonthKey>;

const pad = (value: number) => value.toString().padStart(2, '0');

// Date.UTC normalizes an out-of-range month index into the neighbouring year, which is what makes
// stepping from December to January a plain +1.
const fromUTCParts = (year: number, monthIndex: number) => {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return YearMonthKey.parse(`${date.getUTCFullYear().toString()}-${pad(date.getUTCMonth() + 1)}`);
};

const fromDate = (date: Date) => fromUTCParts(date.getUTCFullYear(), date.getUTCMonth());

const toParts = (key: YearMonthKey) => {
  const date = new Date(`${key}-01T00:00:00.000Z`);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
};

const current = () => fromDate(new Date());

const fromISO = (dateISO: string) => fromDate(new Date(dateISO));

const shift = (key: YearMonthKey, months: number) => {
  const { year, month } = toParts(key);
  return fromUTCParts(year, month - 1 + months);
};

// Half-open on purpose: there is no end-of-month instant to get right, and no dependence on the
// precision of the stored dates.
const toRangeISO = (key: YearMonthKey) => {
  const { year, month } = toParts(key);
  return {
    fromISO: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    untilISO: new Date(Date.UTC(year, month, 1)).toISOString(),
  };
};

// Keys are fixed-width and zero-padded, so they order as strings.
const compareDescending = (a: YearMonthKey, b: YearMonthKey) => b.localeCompare(a);

export const yearMonth = {
  schema: YearMonthKey,
  current,
  fromISO,
  shift,
  toParts,
  toRangeISO,
  compareDescending,
};
