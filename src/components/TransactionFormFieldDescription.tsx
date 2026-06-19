import React from 'react';
import { Input } from 'src/components/ui/input';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';

export const TransactionFormFieldDescription = ({
  form,
  inputRef,
}: {
  form: TransactionFormType;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) => (
  <form.Field name="description">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Description">
        <Input ref={inputRef} {...transactionFormUtils.inputProps(field)} />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
