import { decimal, type CurrencyAmount } from 'src/services/finance';
import * as z from 'zod';

type TransactionKind = 'income' | 'expense';

interface TransactionFormValues {
  amount: string;
  date: string;
  description: string;
  kind: TransactionKind;
  accountId: string;
  categoryId: string;
  jarId: string;
}

// e.g. If new Date() is "Mon Jun 15 2026 21:17:09 GMT-0400 (Chile Standard Time)"
// then this returns 2026-06-15T21:17
const todayDateInputValue = () =>
  new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

const getDefaultValues = (): TransactionFormValues => ({
  amount: '',
  date: todayDateInputValue(),
  description: '',
  kind: 'income',
  accountId: '',
  categoryId: '',
  jarId: '',
});

const nonNegativeNumberRegex = /^\d+(\.\d+)?$/;

const parseAmountToCLP = (value: string): CurrencyAmount => {
  const amountDecimal = decimal.parseString(value);

  return {
    currency: 'CLP',
    amountDecimal,
  };
};

const parseDateInputToISO = (value: string) => {
  const normalized = value.trim();

  const date = new Date(`${normalized}:00.000Z`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error('Date must be valid');
  }

  return date.toISOString();
};

const transactionValidators = {
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .regex(nonNegativeNumberRegex, 'Amount must be a positive number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than zero')
    .transform((val) => parseAmountToCLP(val)),
  date: z.string().trim().min(1, 'Date is required').transform(parseDateInputToISO),
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

const inputProps = <
  T extends {
    name: unknown;
    state: { value: unknown };
    handleBlur: unknown;
    handleChange: (value: T['state']['value']) => unknown;
  },
>(
  field: T
): {
  id: T['name'];
  name: T['name'];
  value: T['state']['value'];
  onBlur: T['handleBlur'];
  onChange: (e: { target: { value: T['state']['value'] } }) => void;
} => ({
  id: field.name,
  name: field.name,
  value: field.state.value,
  onBlur: field.handleBlur,
  onChange: (e) => {
    console.log(e.target.value);
    field.handleChange(e.target.value);
  },
});

export const transactionFormUtils = {
  inputProps,
  createFormSchema,
  getDefaultValues,
};

export type { TransactionFormValues };
