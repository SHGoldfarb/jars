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
  subcategoryId: string;
  jarId: string;
}

const getDefaultValues = (): TransactionFormValues => ({
  amount: '',
  date: dateInput.todayDateInputValue(),
  description: '',
  kind: '',
  accountId: '',
  categoryId: '',
  subcategoryId: '',
  jarId: '',
});

// Everything but the date: also what a bookmark is validated against.
const undatedValidators = {
  amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser),
  description: z.string(),
  kind: z.enum(['income', 'expense']),
  accountId: z.string().trim().min(1, 'Account is required'),
  categoryId: z.string().trim().min(1, 'Category is required'),
  // Choosing a subcategory is optional, so an empty value is a valid one.
  subcategoryId: z.string().trim(),
  jarId: z.string().trim().min(1, 'Jar is required'),
};

const transactionValidators = {
  date: z.string().trim().min(1, 'Date is required').transform(dateInput.parseToISO),
  ...undatedValidators,
};

// What the selections are checked against: the ids each selector is offering, and - for
// subcategories - which category each of them belongs to, so a subcategory can only be kept
// while the category it hangs off is the one selected.
interface TransactionFormOptions {
  accountIds: string[];
  jarIds: string[];
  incomeCategoryIds: string[];
  expenseCategoryIds: string[];
  subcategoryIdsByCategoryId: Record<string, string[]>;
}

// The checks that tie the selections to what the selectors offer. Kept apart from the object so
// the bookmark schema below can share every one of them while leaving the date out: Zod refuses
// to `.omit()` a field from an object that already carries a refinement.
const refineSelections =
  ({
    accountIds,
    jarIds,
    incomeCategoryIds,
    expenseCategoryIds,
    subcategoryIdsByCategoryId,
  }: TransactionFormOptions) =>
  (
    values: {
      kind: 'income' | 'expense';
      accountId: string;
      jarId: string;
      categoryId: string;
      subcategoryId: string;
    },
    ctx: z.RefinementCtx
  ) => {
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

    const subcategoryIds = subcategoryIdsByCategoryId[values.categoryId] ?? [];

    if (values.subcategoryId && !subcategoryIds.includes(values.subcategoryId)) {
      ctx.addIssue({
        code: 'custom',
        path: ['subcategoryId'],
        message: 'Subcategory must belong to the selected category',
      });
    }
  };

const createFormSchema = (options: TransactionFormOptions) =>
  z.object(transactionValidators).superRefine(refineSelections(options));

// What saving a bookmark checks: every rule of the form but the date, which a bookmark does not
// keep - an empty or odd date must not stop one being saved.
const createBookmarkSchema = (options: TransactionFormOptions) =>
  z.object(undatedValidators).superRefine(refineSelections(options));

type TransactionFormSchema = ReturnType<typeof createFormSchema>;
type ParsedTransactionFormValues = z.output<TransactionFormSchema>;
type ParsedTransactionBookmarkValues = z.output<ReturnType<typeof createBookmarkSchema>>;

export const transactionFormSchema = {
  getDefaultValues,
  createFormSchema,
  createBookmarkSchema,
};

export type {
  ParsedTransactionBookmarkValues,
  ParsedTransactionFormValues,
  TransactionFormOptions,
  TransactionFormValues,
};
