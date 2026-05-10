export interface Decimal {
  // Examples
  // { value: 125, decimalPlaces: 2 } = 1.25
  // { value: 50, decimalPlaces: 0 } = 50
  // { value: 1, decimalPlaces: -2 } = 100
  value: bigint;
  decimalPlaces: number; // Always integer.
}
