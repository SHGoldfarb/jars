import { test, expect } from '@playwright/test';
import { decimal } from 'src/services/finance/use-cases/decimal';

test.describe('toNumber', () => {
  test('converts Decimal to number correctly', () => {
    const cases = [
      { decimalValue: { value: BigInt(1234), decimalPlaces: 2 }, numberValue: 12.34 },
      { decimalValue: { value: BigInt(1234), decimalPlaces: 0 }, numberValue: 1234 },
      { decimalValue: { value: BigInt(1234), decimalPlaces: -2 }, numberValue: 123400 },
    ];

    cases.forEach(({ decimalValue, numberValue }) => {
      const result = decimal.toNumber(decimalValue);
      expect(result).toBe(numberValue);
    });
  });
});
