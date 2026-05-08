type Brand<K, T> = K & { readonly __brand: T }

// IDs as branded strings to reduce accidental mixing of entity IDs.
export type AccountId = Brand<string, 'AccountId'>
export type JarId = Brand<string, 'JarId'>
export type TransactionId = Brand<string, 'TransactionId'>
export type TransferId = Brand<string, 'TransferId'>
export type AllocationId = Brand<string, 'AllocationId'>
export type IncomeCategoryId = Brand<string, 'IncomeCategoryId'>
export type ExpenseCategoryId = Brand<string, 'ExpenseCategoryId'>

export type ISODateTimeString = string

export type Currency = 'CLP' | 'USD'

export type Decimal = {
  // Always integer. Should validate at runtime.
  // Examples
  // { value: 125, decimalPlaces: 2 } = 1.25
  // { value: 50, decimalPlaces: 0 } = 50
  // { value: 1, decimalPlaces: -2 } = 100
  value: bigint
  decimalPlaces: number
}

export type CurrencyAmount = {
  currency: Currency
  amountDecimal: Decimal
}

export type Archivable = {
  archivedAtISO?: ISODateTimeString
}

type CategoryBase = Archivable & {
  name: string
}

export type IncomeCategory = CategoryBase & {
  id: IncomeCategoryId
}

export type ExpenseCategory = CategoryBase & {
  id: ExpenseCategoryId
}


export type Account = Archivable & {
  id: AccountId
  name: string
}


export type Jar = Archivable & {
  id: JarId
  name: string
}

export type TransactionKind = 'income' | 'expense'

type TransactionBase = Archivable & {
  id: TransactionId
  kind: TransactionKind
  accountId: AccountId
  jarId: JarId
  amount: CurrencyAmount // Always positive; sign is derived from kind.
  dateISO: string
  notes: string
}

export type IncomeTransaction = TransactionBase & {
  kind: 'income',
  categoryId: IncomeCategoryId
}

export type ExpenseTransaction = TransactionBase & {
  kind: 'expense',
  categoryId: ExpenseCategoryId
}

export type Transaction = IncomeTransaction | ExpenseTransaction

export type Transfer = Archivable & {
  id: TransferId
  dateISO: string
  originAccountId: AccountId
  destinationAccountId: AccountId
  notes: string
  amount: CurrencyAmount // Always positive.
}

export type Allocation = Archivable & {
  id: AllocationId
  dateISO: string
  originJarId: JarId
  destinationJarId: JarId
  notes: string
  amount: CurrencyAmount // Always positive.
}



