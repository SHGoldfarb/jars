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

const scaleDecimalValueToPlaces = (decimal: Decimal, targetPlaces: number) => {
  if (!Number.isInteger(targetPlaces)) {
    throw new Error('targetPlaces must be an integer');
  }

  const diff = targetPlaces - decimal.decimalPlaces;

  if (diff < 0) {
    // This would require dividing and would lose precision if not divisible.
    // We avoid this by always choosing a targetPlaces >= both operands.
    throw new Error('targetPlaces must be >= decimal.decimalPlaces');
  }

  return decimal.value * 10n ** BigInt(diff);
};

const sumDecimals = (x: Decimal, y: Decimal): Decimal => {
  const targetPlaces = Math.max(x.decimalPlaces, y.decimalPlaces);
  const scaledX = scaleDecimalValueToPlaces(x, targetPlaces);
  const scaledY = scaleDecimalValueToPlaces(y, targetPlaces);
  const sumValue = scaledX + scaledY;

  return Decimal.parse({
    value: sumValue,
    decimalPlaces: targetPlaces,
  });
};

const negateDecimal = (decimal: Decimal): Decimal => ({
  value: -decimal.value,
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
  const amountValue = BigInt(combinedDigits);

  return {
    value: amountValue,
    decimalPlaces: decimalPart.length,
  };
};

export const decimal = {
  sum: sumDecimals,
  negate: negateDecimal,
  toNumber: decimalToNumber,
  parseString,
};
