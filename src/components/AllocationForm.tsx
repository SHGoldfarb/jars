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
import { AllocationUnsaved } from 'src/services/finance';
import { formUtils } from 'src/lib/formUtils';
import { useAllocationForm } from 'src/hooks/useAllocationForm';
import { type AllocationFormValues } from 'src/services/allocation-form';
import { AllocationFormFieldDate } from './AllocationFormFieldDate';
import { AllocationFormFieldJar } from './AllocationFormFieldJar';
import { AllocationFormFieldAmount } from './AllocationFormFieldAmount';
import { AllocationFormFieldDescription } from './AllocationFormFieldDescription';
import { useStore } from '@tanstack/react-form';

export const AllocationForm = ({
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  title: string;
  onSubmit: (value: AllocationUnsaved) => Promise<void>;
  onCancelRoute: string;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: AllocationFormValues;
}) => {
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const form = useAllocationForm({ onSubmit, defaultErrorMessage, defaultValues });
  const values = useStore(form.store, (state) => state.values);

  const handleDestinationJarChange = (newValue: string) => {
    // If the destination jar is set and amount is empty, focus the amount field 0.1 seconds later
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
              <AllocationFormFieldDate form={form} />
              <AllocationFormFieldJar
                form={form}
                name="originJarId"
                label="Origin jar"
                placeholder="Select origin jar"
                defaultOpen={!values.originJarId}
              />
              <AllocationFormFieldJar
                form={form}
                name="destinationJarId"
                label="Destination jar"
                placeholder="Select destination jar"
                defaultOpen={!!(values.originJarId && !values.destinationJarId)}
                onChange={handleDestinationJarChange}
                key={`destinationJar - ${values.originJarId}`}
              />
              <AllocationFormFieldAmount
                form={form}
                inputRef={amountInputRef}
                onEnter={() => {
                  descriptionInputRef.current?.focus();
                }}
              />
              <AllocationFormFieldDescription form={form} inputRef={descriptionInputRef} />
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
