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
import { formUtils } from 'src/lib/formUtils';
import { useTransactionForm } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldAmount } from './TransactionFormFieldAmount';
import { TransactionFormFieldDate } from './TransactionFormFieldDate';
import { TransactionFormFieldDescription } from './TransactionFormFieldDescription';
import { TransactionFormFieldKind } from './TransactionFormFieldKind';
import { TransactionFormFieldAccount } from './TransactionFormFieldAccount';
import { TransactionFormFieldJar } from './TransactionFormFieldJar';
import { TransactionFormFieldCategory } from './TransactionFormFieldCategory';
import { type TransactionFormValues } from 'src/lib/transactionFormUtils';

export const TransactionForm = ({
  title,
  onSubmit,
  onCancelRoute,
  onDelete,
  defaultErrorMessage,
  defaultValues,
}: {
  title: string;
  onSubmit: (value: TransactionUnsaved) => Promise<void>;
  onCancelRoute: string;
  onDelete?: () => void;
  defaultErrorMessage: string;
  defaultValues?: TransactionFormValues;
}) => {
  const form = useTransactionForm({ onSubmit, defaultErrorMessage, defaultValues });
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
              <TransactionFormFieldKind form={form} />
              <TransactionFormFieldCategory form={form} />
              <TransactionFormFieldAccount form={form} />
              <TransactionFormFieldJar form={form} />
              <TransactionFormFieldAmount form={form} />
              <TransactionFormFieldDate form={form} />
              <TransactionFormFieldDescription form={form} />
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
