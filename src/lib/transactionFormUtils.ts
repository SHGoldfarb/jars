import { decimal } from 'src/lib/decimal';
import { Transaction } from 'src/services/finance';
import * as z from 'zod';
import { movementFormUtils } from './movementFormUtils';

interface TransactionFormValues {
  amount: string;
  date: string;
  description: string;
  kind: 'income' | 'expense' | '';
  accountId: string;
  categoryId: string;
  jarId: string;
}

const getDefaultValues = (): TransactionFormValues => ({
  amount: '',
  date: movementFormUtils.todayDateInputValue(),
  description: '',
  kind: '',
  accountId: '',
  categoryId: '',
  jarId: '',
});

const toFormValues = (transaction: Transaction): TransactionFormValues => ({
  amount:
    transaction.amount.currency === 'CLP'
      ? decimal.toNumber(transaction.amount.amountDecimal).toString()
      : '',
  date: movementFormUtils.toDateInputValue(new Date(transaction.dateISO)),
  description: transaction.description,
  kind: transaction.kind,
  accountId: transaction.accountId,
  categoryId: transaction.categoryId,
  jarId: transaction.jarId,
});

const transactionValidators = {
  amount: movementFormUtils.amountValidator,
  date: movementFormUtils.dateValidator,
  description: z.string(),
  kind: z.enum(['income', 'expense']),
  accountId: z.string().trim().min(1, 'Account is required'),
  categoryId: z.string().trim().min(1, 'Category is required'),
  jarId: z.string().trim().min(1, 'Jar is required'),
};

const createFormSchema = (
  accountIds: string[],
  jarIds: string[],
  incomeCategoryIds: string[],
  expenseCategoryIds: string[]
) =>
  z.object(transactionValidators).superRefine((values, ctx) => {
    if (values.accountId && !accountIds.includes(values.accountId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['accountId'],
        message: 'Account must be active',
      });
    }

    if (values.jarId && !jarIds.includes(values.jarId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['jarId'],
        message: 'Jar must be active',
      });
    }

    const categoryIds = values.kind === 'income' ? incomeCategoryIds : expenseCategoryIds;

    if (values.categoryId && !categoryIds.includes(values.categoryId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Category must match transaction type',
      });
    }
  });

export const transactionFormUtils = {
  inputProps: movementFormUtils.inputProps,
  createFormSchema,
  getDefaultValues,
  toFormValues,
};

export type { TransactionFormValues };
