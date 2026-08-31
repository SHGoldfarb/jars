import * as z from 'zod';
import { decimal } from 'src/lib/decimal';
import type { CurrencyAmount } from './currency';

// Parsing a user-typed amount into a CurrencyAmount is a boundary concern shared by every
// form that captures money. It lives here rather than in lib/ because "an amount typed into
// a form is CLP" is a business decision, not a technical one.
//
// What a valid amount looks like is this module's rule; whether a form may leave the field
// blank is that form's, so schemas pipe their own requiredness into the parser.

const nonNegativeNumberRegex = /^\d+(\.\d+)?$/;

const parseAmountToCLP = (value: string): CurrencyAmount => ({
  currency: 'CLP',
  amountDecimal: decimal.parseString(value),
});

const parser = z
  .string()
  .trim()
  .regex(nonNegativeNumberRegex, 'Amount must be a non-negative number')
  .transform(parseAmountToCLP);

export const currencyInput = {
  parser,
};
