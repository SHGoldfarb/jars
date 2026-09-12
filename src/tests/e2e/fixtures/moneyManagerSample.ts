import writeXlsxFile from 'write-excel-file/node';
import type { SettingsFile } from '../pages/settings.page';

// The Money Manager export the import is judged against, written out as the table it is: the
// spec's expected values are all read off these rows, and a binary fixture could not be read at
// a glance or edited to try something else.
//
// It is a whole workbook rather than a list of rows because the reader is half of what step 6
// ships: the date cells below are stored as spreadsheet serials and have to survive the trip
// back out.
const HEADER = [
  'Date',
  'Account',
  'Category',
  'Note',
  'Amount',
  'Income/Expense',
  'Transfer account',
];

// A cell holding no value at all, which is what a non-transfer row carries in the last column.
const EMPTY = null;

// `Date` cells are pinned to UTC, the same zone the spec's `test.use` pins the browser to.
const at = (dateTime: string) => new Date(`${dateTime}:00.000Z`);

type SampleRow = [Date, string, string, string, number, string, string | null];

// The transfer is written twice, once from each side, which is the shape the import has to
// collapse into a single allocation.
//
// The 11:45 rows are not incidental: a spreadsheet date is a floating point serial, and these
// two come back out of the reader as 11:44:59.999. Changing them to a time that happens to
// round-trip exactly would quietly stop testing that.
const ROWS: SampleRow[] = [
  [at('2026-02-10T09:00'), 'Wallet', 'Salary', 'Monthly salary', 10000, 'Income', EMPTY],
  [at('2026-02-11T10:30'), 'Wallet', 'Groceries', 'Weekly shop', 2500, 'Expense', EMPTY],
  [
    at('2026-02-12T11:45'),
    'Wallet',
    'Transfer',
    'Holiday saving',
    3000,
    'Transfer-Out',
    'Holidays',
  ],
  [at('2026-02-12T11:45'), 'Holidays', 'Transfer', 'Holiday saving', 3000, 'Transfer-In', 'Wallet'],
  [at('2026-02-13T08:15'), 'Holidays', 'Groceries', 'Snacks', 500, 'Expense', EMPTY],
];

export const moneyManagerSampleFile = async (): Promise<SettingsFile> => ({
  name: 'money-manager-sample.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  buffer: await writeXlsxFile([HEADER, ...ROWS], {
    sheet: 'Money Manager',
    dateFormat: 'yyyy-mm-dd hh:mm',
  }).toBuffer(),
});
