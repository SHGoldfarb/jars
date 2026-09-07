import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from 'src/components/ui/field';
import { Button } from 'src/components/ui/button';
import { formUtils } from 'src/lib/formUtils';
import { useMovementForm } from 'src/hooks/useMovementForm';
import { useMovementFormEndpoints } from 'src/hooks/useMovementFormEndpoints';
import {
  type MovementDraft,
  type MovementFormUi,
  type MovementFormValues,
} from 'src/services/movement-form';
import { MovementFormFieldDate } from './MovementFormFieldDate';
import { MovementFormFieldEndpoint } from './MovementFormFieldEndpoint';
import { MovementFormFieldAmount } from './MovementFormFieldAmount';
import { MovementFormFieldDescription } from './MovementFormFieldDescription';
import { useStore } from '@tanstack/react-form';

export const MovementForm = ({
  movementForm,
  movementId,
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  movementForm: MovementFormUi;
  movementId?: string;
  title: string;
  onSubmit: (draft: MovementDraft) => Promise<void>;
  onCancelRoute: string;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: MovementFormValues;
}) => {
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const endpoints = useMovementFormEndpoints(movementForm, movementId);
  const form = useMovementForm({
    movementForm,
    activeEndpointIds: endpoints.map(({ id }) => id),
    onSubmit,
    defaultErrorMessage,
    defaultValues,
  });
  const values = useStore(form.store, (state) => state.values);
  const endpointNoun = movementForm.endpointNoun.singular;

  const handleDestinationChange = (newValue: string) => {
    // If the destination endpoint is set and amount is empty, focus the amount field 0.1 seconds later
    if (newValue) {
      setTimeout(() => {
        if (!values.amount) {
          amountInputRef.current?.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-md p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void form.handleSubmit();
        }}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>{title}</FieldLegend>
            <FieldGroup>
              <MovementFormFieldDate form={form} />
              <MovementFormFieldEndpoint
                form={form}
                name="originId"
                label={`Origin ${endpointNoun}`}
                placeholder={`Select origin ${endpointNoun}`}
                endpoints={endpoints}
                defaultOpen={!values.originId}
              />
              <MovementFormFieldEndpoint
                form={form}
                name="destinationId"
                label={`Destination ${endpointNoun}`}
                placeholder={`Select destination ${endpointNoun}`}
                endpoints={endpoints}
                defaultOpen={!!(values.originId && !values.destinationId)}
                onChange={handleDestinationChange}
                key={`destination - ${values.originId}`}
              />
              <MovementFormFieldAmount
                form={form}
                inputRef={amountInputRef}
                onEnter={() => {
                  descriptionInputRef.current?.focus();
                }}
              />
              <MovementFormFieldDescription form={form} inputRef={descriptionInputRef} />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldError>{formUtils.getFirstErrorMessage(form.state.errors)}</FieldError>

          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Link to={onCancelRoute}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            {onDelete ? (
              <Button variant="destructive" type="button" onClick={onDelete}>
                Delete
              </Button>
            ) : null}
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
};
