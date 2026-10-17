import { useMovementFormDescriptions } from 'src/hooks/useMovementFormDescriptions';
import { useMovementFormEndpoints } from 'src/hooks/useMovementFormEndpoints';
import type { FormFieldSpec } from 'src/lib/formSpec';
import { clpInputMask } from 'src/presentation/formatters/currencyInputMask';
import type { MovementFormUi, MovementFormValues } from 'src/services/movement-form';

// The form's whole shape: the ordered fields - which the generic form also derives its focus
// flow from - and the schema the endpoints in those fields have to validate against.
export const useMovementFormSpec = (
  movementForm: MovementFormUi,
  movementId: string | undefined
) => {
  const endpoints = useMovementFormEndpoints(movementForm, movementId);
  const descriptions = useMovementFormDescriptions(movementForm);
  const noun = movementForm.endpointNoun.singular;

  // An endpoint cannot be both ends of the same movement, so each selector drops whatever the
  // other one is holding.
  const endpointOptions = (excludedId: string) =>
    endpoints
      .filter((endpoint) => endpoint.id !== excludedId)
      .map((endpoint) => ({ value: endpoint.id, label: endpoint.name }));

  const fields: FormFieldSpec<MovementFormValues>[] = [
    { kind: 'date', name: 'date', label: 'Date' },
    {
      kind: 'select',
      name: 'originId',
      label: `Origin ${noun}`,
      placeholder: `Select origin ${noun}`,
      options: (read) => endpointOptions(read('destinationId')),
    },
    {
      kind: 'select',
      name: 'destinationId',
      label: `Destination ${noun}`,
      placeholder: `Select destination ${noun}`,
      options: (read) => endpointOptions(read('originId')),
    },
    {
      kind: 'text',
      name: 'amount',
      label: 'Amount',
      placeholder: clpInputMask.format('10000'),
      inputMode: 'decimal',
      mask: clpInputMask,
    },
    { kind: 'text', name: 'description', label: 'Description', suggestions: descriptions },
  ];

  const endpointIds = endpoints.map(({ id }) => id);

  return {
    fields,
    schema: movementForm.createFormSchema(endpointIds),
    bookmarkSchema: movementForm.createBookmarkSchema(endpointIds),
  };
};
