

import type { CurrencyAmount, Decimal } from './entities'
import { validateDecimal } from './invariants'

const scaleDecimalValueToPlaces = (decimal: Decimal, targetPlaces: number): bigint => {
    validateDecimal(decimal)
    if (!Number.isInteger(targetPlaces)) {
        throw new Error('targetPlaces must be an integer')
    }

    const diff = targetPlaces - decimal.decimalPlaces

    if (diff < 0) {
        // This would require dividing and would lose precision if not divisible.
        // We avoid this by always choosing a targetPlaces >= both operands.
        throw new Error('targetPlaces must be >= decimal.decimalPlaces')
    }

    return decimal.value * 10n ** BigInt(diff)
}

const sumDecimals = (x: Decimal, y: Decimal): Decimal => {
    validateDecimal(x)
    validateDecimal(y)

    const targetPlaces = Math.max(x.decimalPlaces, y.decimalPlaces)
    const scaledX = scaleDecimalValueToPlaces(x, targetPlaces)
    const scaledY = scaleDecimalValueToPlaces(y, targetPlaces)
    const sumValue = scaledX + scaledY

    const result: Decimal = {
        value: sumValue,
        decimalPlaces: targetPlaces,
    }

    validateDecimal(result)
    return result
}


export const sumCurrencyAmounts = (x: CurrencyAmount, y: CurrencyAmount) => {
    if (x.currency !== y.currency) {
        throw new Error('Cant sum different currencies')
    }

    return sumDecimals(x.amountDecimal, y.amountDecimal)
}