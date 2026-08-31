import { decimal } from 'src/lib/decimal';
import { dateInput } from 'src/lib/dateInput';
import type { Transaction } from 'src/services/finance';
import type { TransactionFormValues } from '../domain/formSchema';

// Mapping a finance entity onto the form's own shape needs the Transaction entity, so it
// belongs in the application layer; the form shape and its rules stay in the domain.
const toFormValues = (transaction: Transaction): TransactionFormValues => ({
  amount:
    transaction.amount.currency === 'CLP'
      ? decimal.toNumber(transaction.amount.amountDecimal).toString()
      : '',
  date: dateInput.toDateInputValue(new Date(transaction.dateISO)),
  description: transaction.description,
  kind: transaction.kind,
  accountId: transaction.accountId,
  categoryId: transaction.categoryId,
  jarId: transaction.jarId,
});

export const transactionFormValues = {
  toFormValues,
};
