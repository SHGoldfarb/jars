import { useStore } from '@tanstack/react-form';
import { type AllocationFormType } from 'src/hooks/useAllocationForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { useAllocationFormJars } from 'src/hooks/useAllocationFormJars';
import { useAllocationEditCurrentAllocation } from 'src/hooks/useAllocationEditCurrentAllocation';

export const AllocationFormFieldJar = ({
  form,
  name,
  label,
  placeholder,
  defaultOpen,
  onChange,
}: {
  form: AllocationFormType;
  name: 'originJarId' | 'destinationJarId';
  label: string;
  placeholder: string;
  defaultOpen?: boolean;
  onChange?: (value: string) => void;
}) => {
  const allocationBeingEdited = useAllocationEditCurrentAllocation();
  const jars = useAllocationFormJars(allocationBeingEdited?.id);
  const otherName = name === 'originJarId' ? 'destinationJarId' : 'originJarId';
  const otherJarId = useStore(form.store, (state) => state.values[otherName]);

  return (
    <form.Field name={name}>
      {(field) => (
        <TransactionFormFieldWrapper field={field} label={label}>
          <TransactionFormFieldSelect
            field={field}
            placeholder={placeholder}
            options={jars
              .filter((jar) => jar.id !== otherJarId)
              .map((jar) => ({ value: jar.id, label: jar.name }))}
            defaultOpen={defaultOpen}
            onChange={onChange}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
