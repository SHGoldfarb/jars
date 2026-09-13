import { dateInput } from 'src/lib/dateInput';
import { generateId } from 'src/lib/utils';
import type { XlsxCell } from 'src/lib/xlsx';
import type {
  Account,
  Allocation,
  Category,
  FinanceSnapshot,
  Jar,
  Transaction,
} from 'src/services/finance';
import { currencyInput } from 'src/services/shared';
import type { ParseResult } from './result';

// The shape of a Money Manager export, read off a real one.
//
// A row is `Date | Account | Category | Subcategory | Note | CLP | Income/Expense | Description |
// Amount | Currency | CLP`, and this mapping reads the first seven:
//
//   - `Account` is a Money Manager account, which is a jar here: Money Manager has no accounts
//     in this app's sense, so every movement lands in the one invented `Cash` account.
//   - `Category` and `Subcategory` are one category here, joined by `CATEGORY_SEPARATOR`. A row
//     with no subcategory keeps the category on its own.
//   - `Note` is what this app calls a description. The column the export heads `Description` is
//     written empty on every row, so it is not read at all.
//   - The amount is the main-currency column. `Amount` and `Currency` hold what was originally
//     spent (`96.01`, `USD`) and so are not comparable across rows; the main-currency column is
//     the same money converted, and is the only amount worth importing.
//
// Two things the export does are worth knowing before changing any of this. It heads the
// main-currency column with the currency's own code, so `MAIN_CURRENCY_TITLE` is the title in an
// export whose main currency is CLP and would be `USD` in one where it is dollars. And it then
// repeats that column as a last column, which it heads `Account` - so a title is looked up by
// its first column, which is the real one.
const COLUMN_TITLES = {
  date: 'Date',
  account: 'Account',
  category: 'Category',
  subcategory: 'Subcategory',
  note: 'Note',
  amount: 'CLP',
  rowKind: 'Income/Expense',
} as const;

type ColumnKey = keyof typeof COLUMN_TITLES;

type HeaderIndex = Record<ColumnKey, number>;

// The kinds the export writes. It writes a transfer once, from the paying side only, so there is
// no `Transfer-In` to pair up - and a kind this mapping has never seen is reported rather than
// skipped, because skipping it would drop money out of an import that otherwise looked fine.
const ROW_KINDS = ['Income', 'Expense', 'Transfer-Out'] as const;

type RowKind = (typeof ROW_KINDS)[number];

// Money Manager has no accounts in this app's sense, so everything it exports lands in one.
const CASH_ACCOUNT_NAME = 'Cash';

// What joins a category to its subcategory: `Needs` and `Groceries` become `Needs / Groceries`,
// one category of that name in this app.
const CATEGORY_SEPARATOR = ' / ';

const NOT_FOUND = -1;

const MS_PER_MINUTE = 60_000;

// `YYYY-MM-DD`, optionally followed by a time that may or may not carry seconds.
const TEXT_DATE = /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/;
const DATE_LENGTH = 'YYYY-MM-DD'.length;
const TIME_START = 'YYYY-MM-DDT'.length;
const DATE_TIME_LENGTH = 'YYYY-MM-DDTHH:mm'.length;

// A text amount may be grouped and may carry the direction the row kind already carries.
const SEPARATORS = /[\s,]/g;
const SIGN = /^[+-]/;

const isRowKind = (value: string): value is RowKind => ROW_KINDS.some((kind) => kind === value);

const cellAt = (row: XlsxCell[], position: number): XlsxCell => row[position] ?? null;

// What the file says, for an error message that quotes the cell the user has to go and fix.
const describeCell = (value: XlsxCell): string => {
  if (value === null) {
    return '';
  }

  return value instanceof Date ? value.toISOString() : value.toString();
};

const textAt = (row: XlsxCell[], position: number): string => {
  const value = cellAt(row, position);
  if (typeof value === 'string') {
    return value.trim();
  }

  return typeof value === 'number' || typeof value === 'boolean' ? value.toString() : '';
};

const columnIndex = (header: XlsxCell[], title: string) =>
  header.findIndex((cell) => typeof cell === 'string' && cell.trim() === title);

// Every column the mapping reads is a column the file must have: without one the rows cannot be
// read at all, which is what "does not carry the columns a Money Manager export has" means.
const toHeaderIndex = (header: XlsxCell[]): ParseResult<HeaderIndex> => {
  const missing = Object.values(COLUMN_TITLES).find(
    (title) => columnIndex(header, title) === NOT_FOUND
  );

  if (missing !== undefined) {
    return { ok: false, error: `Missing column: ${missing}.` };
  }

  return {
    ok: true,
    value: {
      date: columnIndex(header, COLUMN_TITLES.date),
      account: columnIndex(header, COLUMN_TITLES.account),
      category: columnIndex(header, COLUMN_TITLES.category),
      subcategory: columnIndex(header, COLUMN_TITLES.subcategory),
      note: columnIndex(header, COLUMN_TITLES.note),
      amount: columnIndex(header, COLUMN_TITLES.amount),
      rowKind: columnIndex(header, COLUMN_TITLES.rowKind),
    },
  };
};

// A spreadsheet date is a floating point serial, so a cell the spreadsheet shows as 11:45 can
// arrive as 11:44:59.999. Movements are stored to the minute, so rounding to the minute recovers
// the value the file displays rather than carrying the serial's drift into the database.
const toMinute = (date: Date) =>
  new Date(Math.round(date.valueOf() / MS_PER_MINUTE) * MS_PER_MINUTE);

const fromTextDate = (value: string): string | null => {
  const text = value.trim();
  if (!TEXT_DATE.test(text)) {
    return null;
  }

  // `dateInput` speaks the `YYYY-MM-DDTHH:mm` a date field produces, so the file's own separator
  // and its optional seconds are dropped to that shape first, and a date with no time is
  // midnight. The wall clock the file carries is the value that is stored, which is the rule the
  // date field of every form in the app follows.
  const dateTime =
    text.length === DATE_LENGTH
      ? `${text}T00:00`
      : `${text.slice(0, DATE_LENGTH)}T${text.slice(TIME_START, DATE_TIME_LENGTH)}`;

  try {
    return dateInput.parseToISO(dateTime);
  } catch {
    return null;
  }
};

// A formatted date cell arrives as a `Date`; an unformatted one arrives as the text it holds.
const toDateISO = (value: XlsxCell): string | null => {
  if (value instanceof Date) {
    const rounded = toMinute(value);
    return Number.isNaN(rounded.valueOf()) ? null : rounded.toISOString();
  }

  return typeof value === 'string' ? fromTextDate(value) : null;
};

// A number cell is an IEEE double, so the exact decimal the sheet holds is whatever `toString`
// round-trips - which is the value the spreadsheet itself displays, and the closest the file
// gets to an authoritative amount. Either way the model stores a non-negative amount and carries
// the direction in the movement's kind, so the sign is dropped here.
const toAmountText = (value: XlsxCell): string => {
  if (typeof value === 'number') {
    return Math.abs(value).toString();
  }

  return typeof value === 'string' ? value.trim().replace(SEPARATORS, '').replace(SIGN, '') : '';
};

const isBlank = (row: XlsxCell[]) => row.every((cell) => describeCell(cell).trim() === '');

// A rejection names the row the user has to look at, counted the way the spreadsheet counts it.
const rowFailure = (rowNumber: number, problem: string): ParseResult<never> => ({
  ok: false,
  error: `Row ${rowNumber.toString()}: ${problem}.`,
});

const emptyColumn = (rowNumber: number, title: string) =>
  rowFailure(rowNumber, `${title} is empty`);

// Rows in, snapshot out: no `File`, no workbook reader and no `await`, so every rule below can
// be exercised over rows written by hand.
const toFinanceSnapshot = (rows: XlsxCell[][]): ParseResult<FinanceSnapshot> => {
  if (rows.length === 0) {
    return { ok: false, error: 'The spreadsheet is empty.' };
  }

  const [header, ...dataRows] = rows;

  const index = toHeaderIndex(header);
  if (!index.ok) {
    return index;
  }

  const columns = index.value;

  // One jar per distinct account name, and one category per name and kind, however many rows
  // mention them. A name used by both an income and an expense row is two categories, because
  // a category carries its kind and nothing else would preserve both.
  const jars = new Map<string, Jar>();
  const categories = new Map<string, Category>();

  const jarFor = (name: string): Jar => {
    const existing = jars.get(name);
    if (existing) {
      return existing;
    }

    const jar: Jar = { id: generateId(), name };
    jars.set(name, jar);
    return jar;
  };

  const categoryFor = (name: string, kind: Category['kind']): Category => {
    const key = `${kind}:${name}`;
    const existing = categories.get(key);
    if (existing) {
      return existing;
    }

    const category: Category = { id: generateId(), name, kind };
    categories.set(key, category);
    return category;
  };

  const cashAccount: Account = { id: generateId(), name: CASH_ACCOUNT_NAME };
  const transactions: Transaction[] = [];
  const allocations: Allocation[] = [];

  for (const [offset, row] of dataRows.entries()) {
    // The row number the spreadsheet shows: row 1 is the header.
    const rowNumber = offset + 2;

    if (isBlank(row)) {
      continue;
    }

    const rowKind = textAt(row, columns.rowKind);
    if (!isRowKind(rowKind)) {
      return rowFailure(
        rowNumber,
        `${COLUMN_TITLES.rowKind} is not one of ${ROW_KINDS.join(', ')} ("${rowKind}")`
      );
    }

    const dateCell = cellAt(row, columns.date);
    const dateISO = toDateISO(dateCell);
    if (dateISO === null) {
      return rowFailure(
        rowNumber,
        `${COLUMN_TITLES.date} is not a date ("${describeCell(dateCell)}")`
      );
    }

    const amountCell = cellAt(row, columns.amount);
    const amount = currencyInput.parser.safeParse(toAmountText(amountCell));
    if (!amount.success) {
      return rowFailure(
        rowNumber,
        `${COLUMN_TITLES.amount} is not an amount ("${describeCell(amountCell)}")`
      );
    }

    const accountName = textAt(row, columns.account);
    if (accountName === '') {
      return emptyColumn(rowNumber, COLUMN_TITLES.account);
    }

    const categoryName = textAt(row, columns.category);
    if (categoryName === '') {
      return emptyColumn(rowNumber, COLUMN_TITLES.category);
    }

    const movement = {
      id: generateId(),
      amount: amount.data,
      dateISO,
      description: textAt(row, columns.note),
    };

    // A transfer has no category to carry: the export writes the account the money went to in
    // the `Category` column, and both sides of it are jars here.
    if (rowKind === 'Transfer-Out') {
      allocations.push({
        ...movement,
        originJarId: jarFor(accountName).id,
        destinationJarId: jarFor(categoryName).id,
      });
      continue;
    }

    const subcategoryName = textAt(row, columns.subcategory);
    const kind = rowKind === 'Income' ? 'income' : 'expense';
    const fullCategoryName =
      subcategoryName === ''
        ? categoryName
        : `${categoryName}${CATEGORY_SEPARATOR}${subcategoryName}`;

    transactions.push({
      ...movement,
      kind,
      accountId: cashAccount.id,
      categoryId: categoryFor(fullCategoryName, kind).id,
      jarId: jarFor(accountName).id,
    });
  }

  return {
    ok: true,
    value: {
      accounts: [cashAccount],
      jars: [...jars.values()],
      categories: [...categories.values()],
      transactions,
      // Every movement lives in the single `Cash` account, so nothing moves between accounts.
      transfers: [],
      allocations,
    },
  };
};

export const moneyManager = {
  toFinanceSnapshot,
};
