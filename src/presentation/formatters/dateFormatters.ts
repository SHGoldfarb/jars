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

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// "3 days ago", "5 hours ago": the largest whole unit up to days, in the browser's language.
export const formatTimeAgo = (dateISO: string, now: Date) => {
  const elapsedMs = Math.max(0, now.getTime() - new Date(dateISO).getTime());
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'always' });

  if (elapsedMs >= DAY_MS) {
    return format.format(-Math.floor(elapsedMs / DAY_MS), 'day');
  }
  if (elapsedMs >= HOUR_MS) {
    return format.format(-Math.floor(elapsedMs / HOUR_MS), 'hour');
  }
  return format.format(-Math.floor(elapsedMs / MINUTE_MS), 'minute');
};
