import React from 'react';
import { Input } from 'src/components/ui/input';
import { type TransferFormType } from 'src/hooks/useTransferForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { formUtils } from 'src/lib/formUtils';

export const TransferFormFieldAmount = ({
  form,
  onEnter,
  inputRef,
}: {
  form: TransferFormType;
  onEnter: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) => (
  <form.Field name="amount">
    {(field) => (
      <TransactionFormFieldWrapper field={field} label="Amount">
        <Input
          ref={inputRef}
          inputMode="decimal"
          placeholder="10000"
          {...formUtils.inputProps(field)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onEnter();
            }
          }}
        />
      </TransactionFormFieldWrapper>
    )}
  </form.Field>
);
