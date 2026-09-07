import { useForm } from '@tanstack/react-form';
import { formUtils } from 'src/lib/formUtils';
import type { MovementDraft, MovementFormUi, MovementFormValues } from 'src/services/movement-form';

export const useMovementForm = ({
  movementForm,
  activeEndpointIds,
  onSubmit,
  defaultErrorMessage,
  defaultValues,
}: {
  movementForm: MovementFormUi;
  activeEndpointIds: string[];
  onSubmit: (draft: MovementDraft) => Promise<void>;
  defaultErrorMessage: string;
  defaultValues?: MovementFormValues;
}) => {
  const formSchema = movementForm.createFormSchema(activeEndpointIds);

  return useForm({
    defaultValues: defaultValues ?? movementForm.getDefaultValues(),
    validators: {
      onSubmit: ({ value }: { value: Parameters<typeof formUtils.validateWithSchema>[0] }) =>
        formUtils.validateWithSchema(value, formSchema),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await onSubmit(movementForm.toDraft(formSchema.parse(value)));
      } catch (error) {
        const message = error instanceof Error ? error.message : defaultErrorMessage;
        formApi.setErrorMap({
          ...formApi.state.errorMap,
          onSubmit: { form: message, fields: {} },
        });
      }
    },
  });
};

export type MovementFormType = ReturnType<typeof useMovementForm>;
