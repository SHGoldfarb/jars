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
  'Subcategory',
  'Note',
  'CLP',
  'Income/Expense',
  'Description',
  'Amount',
  'Currency',
  // A real export ends with the `CLP` column over again, headed `Account` a second time. It is
  // written here because an export really does write it: a lookup that took the last `Account`
  // column would read amounts as jar names, and this is the row that would notice.
  'Account',
];

// A cell holding no value at all, which is what the `Description` column carries on every row.
const EMPTY = null;

// `Date` cells are pinned to UTC, the same zone the spec's `test.use` pins the browser to.
const at = (dateTime: string) => new Date(`${dateTime}:00.000Z`);

// Named rather than positional: eleven columns in a row literal cannot be read, and three of
// them are only here to be ignored.
interface SampleRow {
  date: Date;
  account: string;
  category: string;
  subcategory: string;
  note: string;
  clp: number;
  kind: string;
  // What was actually spent, in the currency it was spent in. Never what the app imports.
  spent: string;
  currency: string;
}

// A transfer is written once, from the paying side, and names the account the money went to in
// its `Category` column - there is no second row to collapse and no category to create.
//
// The 11:45 row is not incidental: a spreadsheet date is a floating point serial, and it comes
// back out of the reader as 11:44:59.999. Changing it to a time that happens to round-trip
// exactly would quietly stop testing that.
//
// The snacks are bought in dollars: `spent` and `currency` hold the 0.53 USD that left the jar,
// and `clp` holds what the app imports, which is the only one of the three that is comparable to
// the amount on any other row.
const ROWS: SampleRow[] = [
  {
    date: at('2026-02-10T09:00'),
    account: 'Wallet',
    category: 'Salary',
    subcategory: '',
    note: 'Monthly salary',
    clp: 10000,
    kind: 'Income',
    spent: '10000.0',
    currency: 'CLP',
  },
  {
    date: at('2026-02-11T10:30'),
    account: 'Wallet',
    category: 'Needs',
    subcategory: 'Groceries',
    note: 'Weekly shop',
    clp: 2500,
    kind: 'Expense',
    spent: '2500.0',
    currency: 'CLP',
  },
  {
    date: at('2026-02-12T11:45'),
    account: 'Wallet',
    category: 'Holidays',
    subcategory: '',
    note: 'Holiday saving',
    clp: 3000,
    kind: 'Transfer-Out',
    spent: '3000.0',
    currency: 'CLP',
  },
  {
    date: at('2026-02-13T08:15'),
    account: 'Holidays',
    category: 'Wants',
    subcategory: 'Snacks',
    note: 'Snacks',
    clp: 500,
    kind: 'Expense',
    spent: '0.53',
    currency: 'USD',
  },
];

const toCells = (row: SampleRow) => [
  row.date,
  row.account,
  row.category,
  row.subcategory,
  row.note,
  row.clp,
  row.kind,
  EMPTY,
  row.spent,
  row.currency,
  row.clp,
];

export const moneyManagerSampleFile = async (): Promise<SettingsFile> => ({
  name: 'money-manager-sample.xlsx',
  mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  buffer: await writeXlsxFile([HEADER, ...ROWS.map(toCells)], {
    sheet: 'Money Manager',
    dateFormat: 'yyyy-mm-dd hh:mm',
  }).toBuffer(),
});
