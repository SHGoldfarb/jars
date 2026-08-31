import { decimal } from 'src/lib/decimal';
import { Transfer } from 'src/services/finance';
import * as z from 'zod';
import { movementFormUtils } from './movementFormUtils';

interface TransferFormValues {
  amount: string;
  date: string;
  description: string;
  originAccountId: string;
  destinationAccountId: string;
}

const getDefaultValues = (): TransferFormValues => ({
  amount: '',
  date: movementFormUtils.todayDateInputValue(),
  description: '',
  originAccountId: '',
  destinationAccountId: '',
});

const toFormValues = (transfer: Transfer): TransferFormValues => ({
  amount:
    transfer.amount.currency === 'CLP'
      ? decimal.toNumber(transfer.amount.amountDecimal).toString()
      : '',
  date: movementFormUtils.toDateInputValue(new Date(transfer.dateISO)),
  description: transfer.description,
  originAccountId: transfer.originAccountId,
  destinationAccountId: transfer.destinationAccountId,
});

const transferValidators = {
  amount: movementFormUtils.amountValidator,
  date: movementFormUtils.dateValidator,
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

export const transferFormUtils = {
  inputProps: movementFormUtils.inputProps,
  createFormSchema,
  getDefaultValues,
  toFormValues,
};

export type { TransferFormValues };
