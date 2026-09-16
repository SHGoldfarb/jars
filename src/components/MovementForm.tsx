import { Form } from 'src/components/Form';
import { useMovementFormSpec } from 'src/hooks/useMovementFormSpec';
import type { YearMonthKey } from 'src/lib/yearMonth';
import {
  type MovementDraft,
  type MovementFormUi,
  type MovementFormValues,
} from 'src/services/movement-form';

export const MovementForm = ({
  movementForm,
  movementId,
  title,
  onSubmit,
  cancelMonth,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  movementForm: MovementFormUi;
  movementId?: string;
  title: string;
  onSubmit: (draft: MovementDraft) => Promise<void>;
  // Cancelling always goes back to Movements; this is the month it should land on.
  cancelMonth?: YearMonthKey;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: MovementFormValues;
}) => {
  const { fields, schema } = useMovementFormSpec(movementForm, movementId);

  return (
    <Form
      title={title}
      fields={fields}
      defaultValues={defaultValues ?? movementForm.getDefaultValues()}
      schema={schema}
      onSubmit={(values) => onSubmit(movementForm.toDraft(values))}
      defaultErrorMessage={defaultErrorMessage}
      cancel={{ to: '/movements', search: { month: cancelMonth } }}
      onDelete={onDelete}
    />
  );
};
