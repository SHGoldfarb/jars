import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useTransactionFormAccounts } from 'src/hooks/useTransactionFormAccounts';
import { useTransactionEditCurrentTransaction } from 'src/hooks/useTransactionEditCurrentTransaction';

export const TransactionFormFieldAccount = ({
  form,
  defaultOpen,
}: {
  form: TransactionFormType;
  defaultOpen: boolean;
}) => {
  const transactionBeingEdited = useTransactionEditCurrentTransaction();
  const accounts = useTransactionFormAccounts(transactionBeingEdited?.accountId ?? undefined);

  return (
    <form.Field name="accountId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label={'Account'}>
          <TransactionFormFieldSelect
            field={field}
            placeholder={'Select account'}
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            defaultOpen={defaultOpen}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
