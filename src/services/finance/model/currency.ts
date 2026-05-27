import * as z from 'zod';

export const Decimal = z.object({
  // Examples
  // { value: 125, decimalPlaces: 2 } = 1.25
  // { value: 50, decimalPlaces: 0 } = 50
  // { value: 1, decimalPlaces: -2 } = 100
  value: z.bigint(),
  decimalPlaces: z.number().int(),
});

export type Decimal = z.infer<typeof Decimal>;

export const CurrencyAmount = z.object({
  currency: z.enum(['CLP', 'USD']),
  amountDecimal: Decimal,
});

export type CurrencyAmount = z.infer<typeof CurrencyAmount>;
