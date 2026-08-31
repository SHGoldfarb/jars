import * as z from 'zod';

const decimalSchema = z.object({
  // Examples
  // { value: "125", decimalPlaces: 2 } = 1.25
  // { value: "-50", decimalPlaces: 0 } = -50
  // { value: "1", decimalPlaces: -2 } = 100
  value: z.string().regex(/^-?\d+$/),
  decimalPlaces: z.number().int(),
});

export type Decimal = z.infer<typeof decimalSchema>;

// Sign is determined solely by the `value` string: `decimalPlaces` scales
// magnitude but never flips sign. All-zero strings (including "000") are zero.
const isPositive = (decimal: Decimal): boolean =>
  !decimal.value.startsWith('-') && !/^0+$/.test(decimal.value);

const isNonNegative = (decimal: Decimal): boolean =>
  // "-0", "-00", ... represent zero and are therefore non-negative.
  !decimal.value.startsWith('-') || /^-0+$/.test(decimal.value);

export const Decimal = Object.assign(decimalSchema, {
  positive: () =>
    decimalSchema.refine(isPositive, 'Decimal must be positive').brand<'PositiveDecimal'>(),
  nonNegative: () =>
    decimalSchema
      .refine(isNonNegative, 'Decimal must be non-negative')
      .brand<'NonNegativeDecimal'>(),
});

export type PositiveDecimal = z.infer<ReturnType<typeof Decimal.positive>>;
export type NonNegativeDecimal = z.infer<ReturnType<typeof Decimal.nonNegative>>;

const scaleDecimalValueToPlaces = (decimalValue: Decimal, targetPlaces: number) => {
  if (!Number.isInteger(targetPlaces)) {
    throw new Error('targetPlaces must be an integer');
  }

  const diff = targetPlaces - decimalValue.decimalPlaces;

  if (diff < 0) {
    // This would require dividing and would lose precision if not divisible.
    // We avoid this by always choosing a targetPlaces >= both operands.
    throw new Error('targetPlaces must be >= decimal.decimalPlaces');
  }

  return decimalValue.value + '0'.repeat(diff);
};

const sumDecimals = (x: Decimal, y: Decimal): Decimal => {
  const targetPlaces = Math.max(x.decimalPlaces, y.decimalPlaces);
  const scaledX = scaleDecimalValueToPlaces(x, targetPlaces);
  const scaledY = scaleDecimalValueToPlaces(y, targetPlaces);
  const sumValue = Number(scaledX) + Number(scaledY);
  const result = Decimal.parse({
    value: sumValue.toString(),
    decimalPlaces: targetPlaces,
  });
  return result;
};

const negateStringNumber = (value: string): string => {
  return value.startsWith('-') ? value.slice(1) : `-${value}`;
};

const negateDecimal = (decimal: Decimal) =>
  Decimal.parse({
    value: negateStringNumber(decimal.value),
    decimalPlaces: decimal.decimalPlaces,
  });

const decimalToNumber = (value: Decimal) => {
  return Number(value.value) / 10 ** value.decimalPlaces;
};

const numberRegex = /^-?\d+(\.\d+)?$/;

const parseString = (value: string): Decimal => {
  const normalized = value.trim();
  if (!numberRegex.test(normalized)) {
    throw new Error('Amount must be a number');
  }

  const [wholePart, decimalPart = ''] = normalized.split('.');
  const combinedDigits = `${wholePart}${decimalPart}`;

  return {
    value: combinedDigits,
    decimalPlaces: decimalPart.length,
  };
};

export const decimal = {
  sum: sumDecimals,
  negate: negateDecimal,
  toNumber: decimalToNumber,
  parseString,
};
