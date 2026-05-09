import type { Allocation, AccountId, JarId, Transaction, Transfer } from '../model'
import type { CurrencyAmount } from '../../shared'
import { currencies } from '../../shared'
import { validateApplicationState } from '../policies'

type Balances = {
    accounts: Record<AccountId, CurrencyAmount>
    jars: Record<JarId, CurrencyAmount>
}

const addToRecord = <K extends string>(record: Record<K, CurrencyAmount>, key: K, delta: CurrencyAmount) => {
    const current = record[key]
    record[key] = current ? currencies.sum(current, delta) : delta
}

export const computeBalances = (
    transactions: Transaction[],
    transfers: Transfer[],
    allocations: Allocation[],
): Balances => {
    validateApplicationState(allocations, transfers, transactions)

    const accounts = {} as Record<AccountId, CurrencyAmount>
    const jars = {} as Record<JarId, CurrencyAmount>

    for (const tx of transactions) {
        const signedAmount = tx.kind === 'income' ? tx.amount : currencies.negate(tx.amount)
        addToRecord(accounts, tx.accountId, signedAmount)
        addToRecord(jars, tx.jarId, signedAmount)
    }

    for (const transfer of transfers) {
        addToRecord(accounts, transfer.originAccountId, currencies.negate(transfer.amount))
        addToRecord(accounts, transfer.destinationAccountId, transfer.amount)
    }

    for (const allocation of allocations) {
        addToRecord(jars, allocation.originJarId, currencies.negate(allocation.amount))
        addToRecord(jars, allocation.destinationJarId, allocation.amount)
    }

    return { accounts, jars }
}