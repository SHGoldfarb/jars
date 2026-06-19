import { useStore } from '@tanstack/react-form';
import { useJars } from 'src/hooks/useJars';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldJar = ({ form }: { form: TransactionFormType }) => {
  const { jars } = useJars();
  const accountId = useStore(form.store, (state) => state.values.accountId);
  const jarId = useStore(form.store, (state) => state.values.jarId);

  return (
    <form.Field name="jarId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Jar">
          <TransactionFormFieldSelect
            key={accountId || 'empty'}
            field={field}
            placeholder="Select jar"
            options={jars.map((jar) => ({ value: jar.id, label: jar.name }))}
            defaultOpen={!!accountId && !jarId}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
