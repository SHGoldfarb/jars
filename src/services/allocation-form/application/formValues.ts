import { decimal } from 'src/lib/decimal';
import { dateInput } from 'src/lib/dateInput';
import type { Allocation } from 'src/services/finance';
import type { AllocationFormValues } from '../domain/formSchema';

// Mapping a finance entity onto the form's own shape needs the Allocation entity, so it
// belongs in the application layer; the form shape and its rules stay in the domain.
const toFormValues = (allocation: Allocation): AllocationFormValues => ({
  amount:
    allocation.amount.currency === 'CLP'
      ? decimal.toNumber(allocation.amount.amountDecimal).toString()
      : '',
  date: dateInput.toDateInputValue(new Date(allocation.dateISO)),
  description: allocation.description,
  originJarId: allocation.originJarId,
  destinationJarId: allocation.destinationJarId,
});

export const allocationFormValues = {
  toFormValues,
};
