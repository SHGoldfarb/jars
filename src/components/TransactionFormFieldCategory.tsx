import { useStore } from '@tanstack/react-form';
import { useCategoriesExpense, useCategoriesIncome } from 'src/hooks/useCategories';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldCategory = ({ form }: { form: TransactionFormType }) => {
  const selectedKind = useStore(form.store, (state) => state.values.kind);
  const categoryId = useStore(form.store, (state) => state.values.categoryId);
  const { categories: incomeCategories } = useCategoriesIncome();
  const { categories: expenseCategories } = useCategoriesExpense();

  const categories =
    selectedKind === 'expense'
      ? expenseCategories
      : selectedKind === 'income'
        ? incomeCategories
        : [];

  return (
    <form.Field name="categoryId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Category">
          <TransactionFormFieldSelect
            key={selectedKind || 'empty'}
            field={field}
            placeholder="Select Category"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            defaultOpen={!!selectedKind && !categoryId}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
