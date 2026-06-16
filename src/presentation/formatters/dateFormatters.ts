export const formatDateISO = (dateISO: string) => {
  return new Date(dateISO).toLocaleString(undefined, { timeZone: 'UTC' });
};
