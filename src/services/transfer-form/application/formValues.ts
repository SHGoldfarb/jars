import { decimal } from 'src/lib/decimal';
import { dateInput } from 'src/lib/dateInput';
import type { Transfer } from 'src/services/finance';
import type { TransferFormValues } from '../domain/formSchema';

// Mapping a finance entity onto the form's own shape needs the Transfer entity, so it
// belongs in the application layer; the form shape and its rules stay in the domain.
const toFormValues = (transfer: Transfer): TransferFormValues => ({
  amount:
    transfer.amount.currency === 'CLP'
      ? decimal.toNumber(transfer.amount.amountDecimal).toString()
      : '',
  date: dateInput.toDateInputValue(new Date(transfer.dateISO)),
  description: transfer.description,
  originAccountId: transfer.originAccountId,
  destinationAccountId: transfer.destinationAccountId,
});

export const transferFormValues = {
  toFormValues,
};
