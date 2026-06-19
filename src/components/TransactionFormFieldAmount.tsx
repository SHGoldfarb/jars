import React, { useRef, useEffect } from 'react';
import { Input } from 'src/components/ui/input';
import { type TransactionFormType } from 'src/hooks/useTransactionForm';
import { TransactionFormFieldWrapper } from 'src/components/TransactionFormFieldWrapper';
import { transactionFormUtils } from 'src/lib/transactionFormUtils';
import { useStore } from '@tanstack/react-form';

export const TransactionFormFieldAmount = ({
  form,
  descriptionInputRef,
}: {
  form: TransactionFormType;
  descriptionInputRef?: React.RefObject<HTMLInputElement | null>;
}) => {
  const jarId = useStore(form.store, (state) => state.values.jarId);
  const amount = useStore(form.store, (state) => state.values.amount);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (jarId && !amount) {
      // Defer focus to let Radix UI Select finish its focus restoration
      // after the popover closes. Without this, Radix UI steals focus
      // from the amount input immediately after jarId changes.
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [jarId, amount]);

  return (
    <form.Field name="amount">
      {(field) => (
        <TransactionFormFieldWrapper field={field} label="Amount">
          <Input
            ref={inputRef}
            inputMode="decimal"
            placeholder="10000"
            {...transactionFormUtils.inputProps(field)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                descriptionInputRef?.current?.focus();
              }
            }}
          />
        </TransactionFormFieldWrapper>
      )}
    </form.Field>
  );
};
