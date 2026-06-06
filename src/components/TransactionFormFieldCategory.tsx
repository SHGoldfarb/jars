import { useStore } from '@tanstack/react-form';
import { useCategories } from 'src/hooks/useCategories';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldCategory = ({ form }: { form: TransactionFormType }) => {
  const selectedKind = useStore(form.store, (state) => state.values.kind);
  const { categories } = useCategories(selectedKind);
  return (
    <form.Field name="categoryId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Category">
          <TransactionFormFieldSelect
            field={field}
            placeholder="Select Category"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
