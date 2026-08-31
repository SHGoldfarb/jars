import * as z from 'zod';
import { dateInput } from 'src/lib/dateInput';
import { currencyInput } from 'src/services/shared';

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
  date: dateInput.todayDateInputValue(),
  description: '',
  kind: '',
  accountId: '',
  categoryId: '',
  jarId: '',
});

const transactionValidators = {
  amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser),
  date: z.string().trim().min(1, 'Date is required').transform(dateInput.parseToISO),
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

export const transactionFormSchema = {
  getDefaultValues,
  createFormSchema,
};

export type { TransactionFormValues };
