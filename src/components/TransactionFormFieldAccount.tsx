import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useTransactionFormAccounts } from 'src/hooks/useTransactionFormAccounts';

export const TransactionFormFieldAccount = ({
  form,
  defaultOpen,
}: {
  form: TransactionFormType;
  defaultOpen: boolean;
}) => {
  const accountId = form.getFieldValue('accountId');

  // param should either be a valid account id or undefined,
  // we add `|| undefined` because empty string is not a valid account id
  const accounts = useTransactionFormAccounts(accountId || undefined);

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
