import { yearMonth, type YearMonthKey } from 'src/lib/yearMonth';

export const formatDateISO = (dateISO: string) => {
  return new Date(dateISO).toLocaleString(undefined, { timeZone: 'UTC' });
};

export const formatYearMonth = (key: YearMonthKey) => {
  const { year, month } = yearMonth.toParts(key);

  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
};
