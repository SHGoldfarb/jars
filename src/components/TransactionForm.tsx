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
import { TransactionUnsaved } from 'src/services/finance';
import type { YearMonthKey } from 'src/lib/yearMonth';
import { formUtils } from 'src/lib/formUtils';
import { useTransactionForm } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldAmount } from './TransactionFormFieldAmount';
import { TransactionFormFieldDate } from './TransactionFormFieldDate';
import { TransactionFormFieldDescription } from './TransactionFormFieldDescription';
import { TransactionFormFieldKind } from './TransactionFormFieldKind';
import { TransactionFormFieldAccount } from './TransactionFormFieldAccount';
import { TransactionFormFieldJar } from './TransactionFormFieldJar';
import { TransactionFormFieldCategory } from './TransactionFormFieldCategory';
import { type TransactionFormValues } from 'src/services/transaction-form';
import { useStore } from '@tanstack/react-form';

export const TransactionForm = ({
  title,
  onSubmit,
  cancelMonth,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  title: string;
  onSubmit: (value: TransactionUnsaved) => Promise<void>;
  // Cancelling always goes back to Movements; this is the month it should land on.
  cancelMonth?: YearMonthKey;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: TransactionFormValues;
}) => {
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const form = useTransactionForm({ onSubmit, defaultErrorMessage, defaultValues });
  const values = useStore(form.store, (state) => state.values);

  const handleJarChange = (newValue: string) => {
    // If jar is set and amount is still empty, focus the amount field 0.1 seconds later. The
    // emptiness is read off the input itself rather than the `values` of this render, which are
    // the ones from before the change and always show an empty amount: by the time the timer
    // fires the amount may have been typed, and stealing focus then lands the next keystrokes in
    // the wrong field.
    if (newValue) {
      setTimeout(() => {
        if (!amountInputRef.current?.value) {
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
              <TransactionFormFieldDate form={form} />
              <TransactionFormFieldKind form={form} defaultOpen={!values.kind} />
              <TransactionFormFieldCategory
                form={form}
                defaultOpen={!!(values.kind && !values.categoryId)}
                key={`category - ${values.kind}`}
              />
              <TransactionFormFieldAccount
                form={form}
                defaultOpen={!!(values.categoryId && !values.accountId)}
                key={`account - ${values.categoryId}`}
              />
              <TransactionFormFieldJar
                form={form}
                defaultOpen={!!(values.accountId && !values.jarId)}
                onChange={handleJarChange}
                key={`jar - ${values.accountId}`}
              />
              <TransactionFormFieldAmount
                form={form}
                inputRef={amountInputRef}
                onEnter={() => {
                  descriptionInputRef.current?.focus();
                }}
              />
              <TransactionFormFieldDescription form={form} inputRef={descriptionInputRef} />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldError>{formUtils.getFirstErrorMessage(form.state.errors)}</FieldError>

          <Field orientation="horizontal">
            <Button type="submit">Submit</Button>
            <Link to="/movements" search={{ month: cancelMonth }}>
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
