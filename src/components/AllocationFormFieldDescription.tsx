import React from 'react';
import { Input } from 'src/components/ui/input';
import { type AllocationFormType } from 'src/hooks/useAllocationForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';

export const AllocationFormFieldDescription = ({
  form,
  inputRef,
}: {
  form: AllocationFormType;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) => (
  <form.Field name="description">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Description">
        <Input ref={inputRef} {...formUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
