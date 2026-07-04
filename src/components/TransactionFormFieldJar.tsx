import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useTransactionFormJars } from 'src/hooks/useTransactionFormJars';
import { useTransactionEditCurrentTransaction } from 'src/hooks/useTransactionEditCurrentTransaction';

export const TransactionFormFieldJar = ({
  form,
  defaultOpen,
}: {
  form: TransactionFormType;
  defaultOpen: boolean;
}) => {
  const transactionBeingEdited = useTransactionEditCurrentTransaction();
  const jars = useTransactionFormJars(transactionBeingEdited?.id ?? undefined);

  return (
    <form.Field name="jarId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Jar">
          <TransactionFormFieldSelect
            field={field}
            placeholder="Select jar"
            options={jars.map((jar) => ({ value: jar.id, label: jar.name }))}
            defaultOpen={defaultOpen}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
