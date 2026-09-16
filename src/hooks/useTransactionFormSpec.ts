import { useTransactionEditCurrentTransaction } from 'src/hooks/useTransactionEditCurrentTransaction';
import { useTransactionFormAccounts } from 'src/hooks/useTransactionFormAccounts';
import { useTransactionFormCategories } from 'src/hooks/useTransactionFormCategories';
import { useTransactionFormJars } from 'src/hooks/useTransactionFormJars';
import type { FormFieldOption, FormFieldSpec } from 'src/lib/formSpec';
import { transactionForm, type TransactionFormValues } from 'src/services/transaction-form';

const toOptions = (entities: { id: string; name: string }[]): FormFieldOption[] =>
  entities.map(({ id, name }) => ({ value: id, label: name }));

// The form's whole shape: the ordered fields - which the generic form also derives its focus
// flow from - and the schema the selections in those fields have to validate against. Both
// kinds of category are fetched because the schema validates against both, and which one the
// selector offers follows whatever type is picked.
export const useTransactionFormSpec = () => {
  const transaction = useTransactionEditCurrentTransaction();
  const accounts = useTransactionFormAccounts(transaction?.id);
  const jars = useTransactionFormJars(transaction?.id);
  const incomeCategories = useTransactionFormCategories('income', transaction?.id);
  const expenseCategories = useTransactionFormCategories('expense', transaction?.id);

  const fields: FormFieldSpec<TransactionFormValues>[] = [
    { kind: 'date', name: 'date', label: 'Date' },
    {
      kind: 'select',
      name: 'kind',
      label: 'Type',
      placeholder: 'Select type',
      options: [
        { value: 'income', label: 'Income' },
        { value: 'expense', label: 'Expense' },
      ],
      clears: ['categoryId'],
    },
    {
      kind: 'select',
      name: 'categoryId',
      label: 'Category',
      placeholder: 'Select Category',
      // Until a type is picked there is no category list to offer, only the two it chooses between.
      options: (read) => {
        const kind = read('kind');
        if (!kind) {
          return [];
        }
        return toOptions(kind === 'income' ? incomeCategories : expenseCategories);
      },
    },
    {
      kind: 'select',
      name: 'accountId',
      label: 'Account',
      placeholder: 'Select account',
      options: toOptions(accounts),
    },
    {
      kind: 'select',
      name: 'jarId',
      label: 'Jar',
      placeholder: 'Select jar',
      options: toOptions(jars),
    },
    { kind: 'text', name: 'amount', label: 'Amount', placeholder: '10000', inputMode: 'decimal' },
    { kind: 'text', name: 'description', label: 'Description' },
  ];

  return {
    fields,
    schema: transactionForm.createFormSchema(
      accounts.map(({ id }) => id),
      jars.map(({ id }) => id),
      incomeCategories.map(({ id }) => id),
      expenseCategories.map(({ id }) => id)
    ),
  };
};
