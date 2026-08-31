import { decimal } from 'src/lib/decimal';
import type { CurrencyAmount } from 'src/services/shared';
import * as z from 'zod';

// Shared helpers for movement-style forms (transactions, transfers): fields for
// amount, date and description behave identically across them.

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 16);

const dateLocalToUTC = (date: Date) =>
  new Date(date.getTime() - new Date().getTimezoneOffset() * 60000);

const todayDateInputValue = () => toDateInputValue(dateLocalToUTC(new Date()));

const nonNegativeNumberRegex = /^\d+(\.\d+)?$/;

const parseAmountToCLP = (value: string): CurrencyAmount => {
  const amountDecimal = decimal.parseString(value);

  return {
    currency: 'CLP',
    amountDecimal,
  };
};

const parseDateInputToISO = (value: string) => {
  const normalized = value.trim();

  const date = new Date(`${normalized}:00.000Z`);
  if (Number.isNaN(date.valueOf())) {
    throw new Error('Date must be valid');
  }

  return date.toISOString();
};

const amountValidator = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .regex(nonNegativeNumberRegex, 'Amount must be a non-negative number')
  .transform((val) => parseAmountToCLP(val));

const dateValidator = z.string().trim().min(1, 'Date is required').transform(parseDateInputToISO);

const inputProps = <
  T extends {
    name: unknown;
    state: { value: unknown };
    handleBlur: unknown;
    handleChange: (value: T['state']['value']) => unknown;
  },
>(
  field: T
): {
  id: T['name'];
  name: T['name'];
  value: T['state']['value'];
  onBlur: T['handleBlur'];
  onChange: (e: { target: { value: T['state']['value'] } }) => void;
} => ({
  id: field.name,
  name: field.name,
  value: field.state.value,
  onBlur: field.handleBlur,
  onChange: (e) => {
    field.handleChange(e.target.value);
  },
});

export const movementFormUtils = {
  toDateInputValue,
  dateLocalToUTC,
  todayDateInputValue,
  parseAmountToCLP,
  parseDateInputToISO,
  nonNegativeNumberRegex,
  amountValidator,
  dateValidator,
  inputProps,
};
