import { decimal } from 'src/lib/decimal';
import { dateInput } from 'src/lib/dateInput';
import type {
  BookmarkUnsaved,
  Transaction,
  TransactionBookmark,
  TransactionUnsaved,
} from 'src/services/finance';
import {
  transactionFormSchema,
  type ParsedTransactionBookmarkValues,
  type ParsedTransactionFormValues,
  type TransactionFormValues,
} from '../domain/formSchema';

// The fields a transaction and its bookmark both carry: everything but the date.
type TransactionFields = Pick<
  Transaction,
  'amount' | 'description' | 'kind' | 'accountId' | 'categoryId' | 'subcategoryId' | 'jarId'
>;

const undatedFormValues = (fields: TransactionFields): Omit<TransactionFormValues, 'date'> => ({
  amount:
    fields.amount.currency === 'CLP'
      ? decimal.toNumber(fields.amount.amountDecimal).toString()
      : '',
  description: fields.description,
  kind: fields.kind,
  accountId: fields.accountId,
  categoryId: fields.categoryId,
  subcategoryId: fields.subcategoryId ?? '',
  jarId: fields.jarId,
});

// Mapping a finance entity onto the form's own shape needs the Transaction entity, so it
// belongs in the application layer; the form shape and its rules stay in the domain.
const toFormValues = (transaction: Transaction): TransactionFormValues => ({
  ...undatedFormValues(transaction),
  date: dateInput.toDateInputValue(new Date(transaction.dateISO)),
});

// A bookmark has no date, so the form's own default fills it: the same one a blank form opens
// with.
const fromBookmark = (bookmark: TransactionBookmark): TransactionFormValues => ({
  ...transactionFormSchema.getDefaultValues(),
  ...undatedFormValues(bookmark),
});

// What the undated fields become on the entity: a trimmed description, and no subcategory as an
// absent one - the form holds '' for an empty selector, which is not an id the entity accepts.
const undatedEntityFields = (values: ParsedTransactionBookmarkValues): TransactionFields => ({
  amount: values.amount,
  description: values.description.trim(),
  kind: values.kind,
  accountId: values.accountId,
  categoryId: values.categoryId,
  subcategoryId: values.subcategoryId || undefined,
  jarId: values.jarId,
});

const toUnsaved = (values: ParsedTransactionFormValues): TransactionUnsaved => ({
  ...undatedEntityFields(values),
  dateISO: values.date,
});

const toBookmark = (values: ParsedTransactionBookmarkValues): BookmarkUnsaved => ({
  ...undatedEntityFields(values),
  movementType: 'transaction',
});

export const transactionFormValues = {
  toFormValues,
  fromBookmark,
  toUnsaved,
  toBookmark,
};
