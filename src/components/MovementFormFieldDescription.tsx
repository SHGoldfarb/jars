import React from 'react';
import { Input } from 'src/components/ui/input';
import { type MovementFormType } from 'src/hooks/useMovementForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';

export const MovementFormFieldDescription = ({
  form,
  inputRef,
}: {
  form: MovementFormType;
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
