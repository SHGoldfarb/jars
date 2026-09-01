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
import { TransferUnsaved } from 'src/services/finance';
import { formUtils } from 'src/lib/formUtils';
import { useTransferForm } from 'src/hooks/useTransferForm';
import { type TransferFormValues } from 'src/services/transfer-form';
import { TransferFormFieldDate } from './TransferFormFieldDate';
import { TransferFormFieldAccount } from './TransferFormFieldAccount';
import { TransferFormFieldAmount } from './TransferFormFieldAmount';
import { TransferFormFieldDescription } from './TransferFormFieldDescription';
import { useStore } from '@tanstack/react-form';

export const TransferForm = ({
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  title: string;
  onSubmit: (value: TransferUnsaved) => Promise<void>;
  onCancelRoute: string;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: TransferFormValues;
}) => {
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const form = useTransferForm({ onSubmit, defaultErrorMessage, defaultValues });
  const values = useStore(form.store, (state) => state.values);

  const handleDestinationAccountChange = (newValue: string) => {
    // If the destination account is set and amount is empty, focus the amount field 0.1 seconds later
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
              <TransferFormFieldDate form={form} />
              <TransferFormFieldAccount
                form={form}
                name="originAccountId"
                label="Origin account"
                placeholder="Select origin account"
                defaultOpen={!values.originAccountId}
              />
              <TransferFormFieldAccount
                form={form}
                name="destinationAccountId"
                label="Destination account"
                placeholder="Select destination account"
                defaultOpen={!!(values.originAccountId && !values.destinationAccountId)}
                onChange={handleDestinationAccountChange}
                key={`destinationAccount - ${values.originAccountId}`}
              />
              <TransferFormFieldAmount
                form={form}
                inputRef={amountInputRef}
                onEnter={() => {
                  descriptionInputRef.current?.focus();
                }}
              />
              <TransferFormFieldDescription form={form} inputRef={descriptionInputRef} />
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
