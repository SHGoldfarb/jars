import { useStore } from '@tanstack/react-form';
import { type MovementFormType } from 'src/hooks/useMovementForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { TransactionFormFieldSelect } from './TransactionFormFieldSelect';
import { type MovementEndpointOption } from 'src/services/movement-form';

export const MovementFormFieldEndpoint = ({
  form,
  name,
  label,
  placeholder,
  endpoints,
  defaultOpen,
  onChange,
}: {
  form: MovementFormType;
  name: 'originId' | 'destinationId';
  label: string;
  placeholder: string;
  endpoints: MovementEndpointOption[];
  defaultOpen?: boolean;
  onChange?: (value: string) => void;
}) => {
  const otherName = name === 'originId' ? 'destinationId' : 'originId';
  const otherEndpointId = useStore(form.store, (state) => state.values[otherName]);

  return (
    <form.Field name={name}>
      {(field) => (
        <TransactionFormFieldWrapper field={field} label={label}>
          <TransactionFormFieldSelect
            field={field}
            placeholder={placeholder}
            options={endpoints
              .filter((endpoint) => endpoint.id !== otherEndpointId)
              .map((endpoint) => ({ value: endpoint.id, label: endpoint.name }))}
            defaultOpen={defaultOpen}
            onChange={onChange}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
