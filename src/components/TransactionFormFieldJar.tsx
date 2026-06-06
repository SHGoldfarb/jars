import { useJars } from 'src/hooks/useJars';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';

export const TransactionFormFieldJar = ({ form }: { form: TransactionFormType }) => {
  const { jars } = useJars();
  return (
    <form.Field name="jarId">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Jar">
          <TransactionFormFieldSelect
            field={field}
            placeholder="Select jar"
            options={jars.map((jar) => ({ value: jar.id, label: jar.name }))}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
