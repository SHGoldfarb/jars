import React from 'react';
import { Input } from 'src/components/ui/input';
import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';

export const TransferFormFieldDescription = ({
  form,
  inputRef,
}: {
  form: TransferFormType;
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
