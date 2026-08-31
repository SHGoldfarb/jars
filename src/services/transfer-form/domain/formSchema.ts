import * as z from 'zod';
import { dateInput } from 'src/lib/dateInput';
import { currencyInput } from 'src/services/shared';

interface TransferFormValues {
  amount: string;
  date: string;
  description: string;
  originAccountId: string;
  destinationAccountId: string;
}

const getDefaultValues = (): TransferFormValues => ({
  amount: '',
  date: dateInput.todayDateInputValue(),
  description: '',
  originAccountId: '',
  destinationAccountId: '',
});

const transferValidators = {
  amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser),
  date: z.string().trim().min(1, 'Date is required').transform(dateInput.parseToISO),
  description: z.string(),
  originAccountId: z.string().trim().min(1, 'Origin account is required'),
  destinationAccountId: z.string().trim().min(1, 'Destination account is required'),
};

const createFormSchema = (activeAccountIds: string[]) =>
  z.object(transferValidators).superRefine((values, ctx) => {
    if (values.originAccountId && !activeAccountIds.includes(values.originAccountId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['originAccountId'],
        message: 'Origin account must be active',
      });
    }

    if (values.destinationAccountId && !activeAccountIds.includes(values.destinationAccountId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Destination account must be active',
      });
    }

    if (
      values.originAccountId &&
      values.destinationAccountId &&
      values.originAccountId === values.destinationAccountId
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['destinationAccountId'],
        message: 'Origin and destination accounts must be different',
      });
    }
  });

export const transferFormSchema = {
  getDefaultValues,
  createFormSchema,
};

export type { TransferFormValues };
