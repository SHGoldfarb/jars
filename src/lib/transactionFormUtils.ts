import { type CurrencyAmount } from 'src/services/finance';
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

const todayDateInputValue = () => new Date().toISOString().slice(0, 10);

const getDefaultValues = (): TransactionFormValues => ({
  amount: '',
  date: todayDateInputValue(),
  description: '',
  kind: 'income',
  accountId: '',
  categoryId: '',
  jarId: '',
});

const parsePositiveAmountToClp = (value: string): CurrencyAmount => {
  const normalized = value.trim();
  const amountRegex = /^\d+(\.\d+)?$/;
  if (!amountRegex.test(normalized)) {
    throw new Error('Amount must be a positive number');
  }

  const [wholePart, decimalPart = ''] = normalized.split('.');
  const combinedDigits = `${wholePart}${decimalPart}`;
  const amountValue = BigInt(combinedDigits);

  if (amountValue <= 0n) {
    throw new Error('Amount must be greater than zero');
  }

  return {
    currency: 'CLP',
    amountDecimal: {
      value: amountValue,
      decimalPlaces: decimalPart.length,
    },
  };
};

const amountRegex = /^\d+(\.\d+)?$/;

const isPositiveAmountString = (value: string): boolean => {
  const normalized = value.trim();
  if (!amountRegex.test(normalized)) {
    return false;
  }

  const [wholePart, decimalPart = ''] = normalized.split('.');
  const amountValue = BigInt(`${wholePart}${decimalPart}`);
  return amountValue > 0n;
};

const parseDateInputToISO = (value: string): string => {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Date is required');
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);
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
    .regex(amountRegex, 'Amount must be a positive number')
    .refine(isPositiveAmountString, 'Amount must be greater than zero'),
  date: z
    .string()
    .trim()
    .min(1, 'Date is required')
    .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00.000Z`).valueOf()), {
      message: 'Date must be valid',
    }),
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
): z.ZodType<TransactionFormValues> =>
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
    field.handleChange(e.target.value);
  },
});

export const transactionFormUtils = {
  inputProps,
  createFormSchema,
  parseDateInputToISO,
  parsePositiveAmountToClp,
  getDefaultValues,
};

export type { TransactionFormValues };
