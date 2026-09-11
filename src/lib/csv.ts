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

// TODO: break up and simplify parseText. Correctness should be more apparent.
const parseText = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  // Inside quotes, separators and line breaks are just characters.
  let quoted = false;
  let index = 0;

  const endField = () => {
    row.push(field);
    field = '';
  };

  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  while (index < text.length) {
    const char = text[index];

    if (quoted) {
      if (char === QUOTE && text[index + 1] === QUOTE) {
        field += QUOTE;
        index += 2;
        continue;
      }
      if (char === QUOTE) {
        quoted = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }

    if (char === QUOTE) {
      quoted = true;
      index += 1;
      continue;
    }
    if (char === FIELD_SEPARATOR) {
      endField();
      index += 1;
      continue;
    }
    if (char === '\r' || char === '\n') {
      endRow();
      index += char === '\r' && text[index + 1] === '\n' ? 2 : 1;
      continue;
    }

    field += char;
    index += 1;
  }

  // A file that ends on a record separator is complete; anything left over is a last record
  // that simply wasn't terminated.
  if (field !== '' || row.length > 0) {
    endRow();
  }

  return rows;
};

export const csv = {
  serialize: serializeRows,
  parse: parseText,
};
