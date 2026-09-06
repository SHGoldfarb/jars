import { Input } from 'src/components/ui/input';
import { type AllocationFormType } from 'src/hooks/useAllocationForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';

export const AllocationFormFieldDate = ({ form }: { form: AllocationFormType }) => (
  <form.Field name="date">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Date">
        <Input type="datetime-local" {...formUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
