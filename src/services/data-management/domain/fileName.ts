// Every file this context produces is named for what it is and the day it was taken, so it is
// recognizable in a downloads folder. The date is the browser's own, not UTC: the user's
// "today" is the one they will look for.
const twoDigits = (value: number) => value.toString().padStart(2, '0');

export const dateStamp = (date: Date) =>
  `${date.getFullYear().toString()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
