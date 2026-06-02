// TODO: refactor into multiple, small files

import { Link, useNavigate } from '@tanstack/react-router';
import { useForm, useStore } from '@tanstack/react-form';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from 'src/components/ui/field';
import { Input } from 'src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Button } from 'src/components/ui/button';
import { useAccounts } from 'src/hooks/useAccounts';
import { useCategoriesExpense, useCategoriesIncome } from 'src/hooks/useCategories';
import { useJars } from 'src/hooks/useJars';
import { financeCommands, type CurrencyAmount } from 'src/services/finance';
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

const createTransactionFormSchema = (
  accountIds: string[],
  jarIds: string[],
  incomeCategoryIds: string[],
  expenseCategoryIds: string[]
): z.ZodType<TransactionFormValues> =>
  z
    .object({
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
    })
    .superRefine((values, ctx) => {
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

const validateTransactionFormWithSchema = (
  value: TransactionFormValues,
  schema: z.ZodType<TransactionFormValues>
): { fields: Partial<Record<keyof TransactionFormValues, string>> } | undefined => {
  const result = schema.safeParse(value);

  if (result.success) {
    return undefined;
  }

  const fields: Partial<Record<keyof TransactionFormValues, string>> = {};

  for (const issue of result.error.issues) {
    const [path] = issue.path;
    if (typeof path !== 'string') {
      continue;
    }

    if (!(path in fields) && issue.message) {
      fields[path as keyof TransactionFormValues] = issue.message;
    }
  }

  return {
    fields,
  };
};

const getFirstErrorMessage = (errors: readonly unknown[] | undefined): string | undefined => {
  if (!errors?.length) {
    return undefined;
  }

  const firstError = errors[0];

  if (typeof firstError === 'string') {
    return firstError;
  }

  if (firstError && typeof firstError === 'object' && 'message' in firstError) {
    const message = (firstError as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }

  return undefined;
};

const useCategories = (kind: TransactionKind) => {
  const { categories: incomeCategories } = useCategoriesIncome();
  const { categories: expenseCategories } = useCategoriesExpense();
  return { categories: kind === 'income' ? incomeCategories : expenseCategories };
};

const useTransactionForm = () => {
  const navigate = useNavigate();
  const { accounts } = useAccounts();
  const { jars } = useJars();
  const { categories: incomeCategories } = useCategoriesIncome();
  const { categories: expenseCategories } = useCategoriesExpense();

  const accountIds = accounts.map((account) => account.id);
  const jarIds = jars.map((jar) => jar.id);
  const incomeCategoryIds = incomeCategories.map((category) => category.id);
  const expenseCategoryIds = expenseCategories.map((category) => category.id);

  const transactionFormSchema = createTransactionFormSchema(
    accountIds,
    jarIds,
    incomeCategoryIds,
    expenseCategoryIds
  );

  return useForm({
    defaultValues: {
      amount: '',
      date: todayDateInputValue(),
      description: '',
      kind: 'income' as TransactionKind,
      accountId: '',
      categoryId: '',
      jarId: '',
    },
    validators: {
      onSubmit: ({ value }) => validateTransactionFormWithSchema(value, transactionFormSchema),
      onChange: ({ value }) => validateTransactionFormWithSchema(value, transactionFormSchema),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const amount = parsePositiveAmountToClp(value.amount);
        const dateISO = parseDateInputToISO(value.date);

        await financeCommands.createTransaction({
          kind: value.kind,
          accountId: value.accountId,
          categoryId: value.categoryId,
          jarId: value.jarId,
          amount,
          dateISO,
          description: value.description.trim(),
        });

        await navigate({ to: '/movements' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create transaction';
        formApi.setErrorMap({
          ...formApi.state.errorMap,
          onSubmit: { form: message, fields: {} },
        });
      }
    },
  });
};

export const TransactionsNew = () => {
  const { accounts } = useAccounts();
  const { jars } = useJars();

  const form = useTransactionForm();

  const selectedKind = useStore(form.store, (state) => state.values.kind);
  const { categories } = useCategories(selectedKind);

  return (
    <div className="w-full max-w-md p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Create Transaction</FieldLegend>
            <FieldGroup>
              <form.Field
                name="amount"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
                    <Input
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- user navigates here manually -> autofocus is fine
                      autoFocus
                      id={field.name}
                      name={field.name}
                      inputMode="decimal"
                      placeholder="10000"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                    />
                    <FieldError>{getFirstErrorMessage(field.state.meta.errors)}</FieldError>
                  </Field>
                )}
              />

              <form.Field
                name="date"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                    <Input
                      type="date"
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                    />
                    <FieldError>{getFirstErrorMessage(field.state.meta.errors)}</FieldError>
                  </Field>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      placeholder="Optional"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                    />
                  </Field>
                )}
              />

              <form.Field
                name="kind"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor="transaction-kind">Type</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        const kind = value as TransactionKind;
                        field.handleChange(kind);
                        form.setFieldValue('categoryId', '');
                      }}
                    >
                      <SelectTrigger id="transaction-kind">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError>{getFirstErrorMessage(field.state.meta.errors)}</FieldError>
                  </Field>
                )}
              />

              <form.Field
                name="accountId"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor="transaction-account">Account</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value);
                      }}
                    >
                      <SelectTrigger id="transaction-account">
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{getFirstErrorMessage(field.state.meta.errors)}</FieldError>
                  </Field>
                )}
              />

              <form.Field
                name="jarId"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor="transaction-jar">Jar</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value);
                      }}
                    >
                      <SelectTrigger id="transaction-jar">
                        <SelectValue placeholder="Select jar" />
                      </SelectTrigger>
                      <SelectContent>
                        {jars.map((jar) => (
                          <SelectItem key={jar.id} value={jar.id}>
                            {jar.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{getFirstErrorMessage(field.state.meta.errors)}</FieldError>
                  </Field>
                )}
              />

              <form.Field
                name="categoryId"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor="transaction-category">Category</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        field.handleChange(value);
                      }}
                    >
                      <SelectTrigger id="transaction-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{getFirstErrorMessage(field.state.meta.errors)}</FieldError>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldError>{getFirstErrorMessage(form.state.errors)}</FieldError>

          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Link to="/movements">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
