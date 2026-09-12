// Reads an `.xlsx` workbook into plain rows. It knows nothing about what the columns mean:
// turning a ZIP of XML parts into cells is all that happens here, so everything downstream of
// `readRows` is plain data that can be written by hand.

export type XlsxCell = string | number | boolean | Date | null;

// The reader's own cell type does not describe the values it actually returns, so each cell is
// narrowed by what it is at runtime rather than by what the library claims. A cell this module
// does not model carries no value, and the caller sees it as an empty one.
const toCell = (value: unknown): XlsxCell => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  return value instanceof Date ? value : null;
};

const readRows = async (file: Blob): Promise<XlsxCell[][]> => {
  // Loaded on demand: a PWA should not ship a ZIP and XML parser to every user for a button
  // most of them never press.
  const { readSheet } = await import('read-excel-file/browser');
  const rows = await readSheet(file);

  return rows.map((row) => row.map(toCell));
};

export const xlsx = {
  readRows,
};
