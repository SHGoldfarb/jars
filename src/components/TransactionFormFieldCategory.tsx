import { useStore } from '@tanstack/react-form';
import { useTransactionFormCategories } from 'src/hooks/useTransactionFormCategories';
import { useTransactionEditCurrentTransaction } from 'src/hooks/useTransactionEditCurrentTransaction';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldCategory = ({
  form,
  defaultOpen,
}: {
  form: TransactionFormType;
  defaultOpen?: boolean;
}) => {
  const transactionBeingEdited = useTransactionEditCurrentTransaction();
  const selectedKind = useStore(form.store, (state) => state.values.kind);
  const categories = useTransactionFormCategories(
    selectedKind,
    transactionBeingEdited?.id ?? undefined
  );

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
            defaultOpen={defaultOpen}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
