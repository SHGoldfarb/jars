// RFC 4180 serializing and parsing. A row is a list of fields and nothing else: what the
// columns mean, and how a value becomes a string, belong to whoever builds the rows.

const RECORD_SEPARATOR = '\r\n';
const FIELD_SEPARATOR = ',';
const QUOTE = '"';

// A field only has to be quoted when leaving it bare would change where the reader thinks the
// field or the record ends.
// TODO: verify this is catches all possible values that would break the csv
const needsQuoting = /[",\r\n]/;

const serializeField = (field: string) =>
  needsQuoting.test(field)
    ? `${QUOTE}${field.replaceAll(QUOTE, `${QUOTE}${QUOTE}`)}${QUOTE}`
    : field;

const serializeRows = (rows: string[][]) =>
  rows.map((row) => `${row.map(serializeField).join(FIELD_SEPARATOR)}${RECORD_SEPARATOR}`).join('');

export const csv = {
  serialize: serializeRows,
};
