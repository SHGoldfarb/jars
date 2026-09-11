import { decimal } from 'src/lib/decimal';
import type { Account, Category, Jar, MovementListEntry } from 'src/services/finance';
import { dateStamp } from './fileName';

// One table for every movement kind: the shared columns are filled by all of them, and each
// kind fills only the endpoint columns it has. `Type` carries the kind, so no second column
// has to.
const COLUMNS = [
  'Type',
  'Date',
  'Description',
  'Amount',
  'Currency',
  'Account',
  'Category',
  'Jar',
  'Origin account',
  'Destination account',
  'Origin jar',
  'Destination jar',
] as const;

type Column = (typeof COLUMNS)[number];

// A movement fills the columns its kind has; the rest of the row is empty.
type Cells = Partial<Record<Column, string>>;

export interface MovementsCsvData {
  movements: MovementListEntry[];
  accounts: Account[];
  jars: Jar[];
  categories: Category[];
}

export const movementsCsvFileName = (date: Date) => `jars-export-${dateStamp(date)}.csv`;

// The form pins what the user typed to UTC, so the first characters of the stored value are
// that value back: `YYYY-MM-DD HH:mm`, with no locale or timezone involved either way.
const toCsvDate = (dateISO: string) => `${dateISO.slice(0, 10)} ${dateISO.slice(11, 16)}`;

const namesById = (items: { id: string; name: string }[]) =>
  new Map(items.map(({ id, name }) => [id, name]));

const transactionTypes = { income: 'Income', expense: 'Expense' };

export const toMovementsCsvRows = ({
  movements,
  accounts,
  jars,
  categories,
}: MovementsCsvData): string[][] => {
  const accountNames = namesById(accounts);
  const jarNames = namesById(jars);
  const categoryNames = namesById(categories);

  // A movement always names something that exists; an empty name would be a broken reference
  // rather than a value the file should carry an id for.
  const nameOf = (names: Map<string, string>, id: string) => names.get(id) ?? '';

  const cellsOf = (movement: MovementListEntry): Cells => {
    const shared = {
      Date: toCsvDate(movement.dateISO),
      Description: movement.description,
      Amount: decimal.toDecimalString(movement.amount.amountDecimal),
      Currency: movement.amount.currency,
    };

    switch (movement.movementType) {
      case 'transaction':
        return {
          ...shared,
          Type: transactionTypes[movement.kind],
          Account: nameOf(accountNames, movement.accountId),
          Category: nameOf(categoryNames, movement.categoryId),
          Jar: nameOf(jarNames, movement.jarId),
        };
      case 'transfer':
        return {
          ...shared,
          Type: 'Transfer',
          'Origin account': nameOf(accountNames, movement.originAccountId),
          'Destination account': nameOf(accountNames, movement.destinationAccountId),
        };
      case 'allocation':
        return {
          ...shared,
          Type: 'Allocation',
          'Origin jar': nameOf(jarNames, movement.originJarId),
          'Destination jar': nameOf(jarNames, movement.destinationJarId),
        };
    }
  };

  const toRow = (movement: MovementListEntry) => {
    const cells = cellsOf(movement);
    return COLUMNS.map((column) => cells[column] ?? '');
  };

  return [[...COLUMNS], ...movements.map(toRow)];
};
