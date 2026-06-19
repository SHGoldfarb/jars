import { useStore } from '@tanstack/react-form';
import { useAccounts } from 'src/hooks/useAccounts';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldAccount = ({ form }: { form: TransactionFormType }) => {
  const { accounts } = useAccounts();
  const categoryId = useStore(form.store, (state) => state.values.categoryId);
  const accountId = useStore(form.store, (state) => state.values.accountId);

  return (
    <form.Field name="accountId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label={'Account'}>
          <TransactionFormFieldSelect
            key={categoryId || 'empty'}
            field={field}
            placeholder={'Select account'}
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            defaultOpen={!!categoryId && !accountId}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
