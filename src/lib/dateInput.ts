// Conversions between `<input type="datetime-local">` string values and Date/ISO strings.
// Conversion only: whether a form may leave the field blank is that form's rule, not this
// module's, so the requiredness lives in the form schemas.

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 16);

const dateLocalToUTC = (date: Date) =>
  new Date(date.getTime() - new Date().getTimezoneOffset() * 60000);

const todayDateInputValue = () => toDateInputValue(dateLocalToUTC(new Date()));

const parseToISO = (value: string) => {
  const normalized = value.trim();

  const date = new Date(`${normalized}:00.000Z`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error('Date must be valid');
  }

  return date.toISOString();
};

export const dateInput = {
  toDateInputValue,
  todayDateInputValue,
  parseToISO,
};
