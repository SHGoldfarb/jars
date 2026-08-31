# Plan — Epic 6 AC: "User can create a transfer"

**Target AC:** `docs/product/epics.md:127` —
_"User can create a transfer specifying: origin account, destination account, amount, date, and description"_

**Scope:** create-transfer flow + coupled validation (`epics.md:127`–`131`, `143`–`150`) + minimal
transfer rows on the Movements screen. Edit/delete, visual-distinction polish, and
archived-account-on-edit are explicitly deferred.

---

## What already exists (from the `wip transfers` commit)

- `src/services/finance/model/entities/transfer.ts` — `Transfer = Movement + originAccountId + destinationAccountId`
- `TransferRepository` contract + `transferRepository` (Dexie-backed, via `createDBTableRepository`)
- Dexie `transfers` store: `&id, originAccountId, destinationAccountId` (db version 2 — **no migration needed**)
- `financeQueries.transfers.list({ orderBy })` and `.getById`, plus `financeDomainQueries.transfers.list`

Missing: the write path, the form/UI/route stack, and rendering transfers anywhere.

---

## 1. Domain layer — write path

**New `src/services/finance/domain/commands/transfer.ts`** (mirrors `transaction.ts`):

- `TransferUnsaved` = `Transfer` shape with `id` optional.
- `NewTransferInput` = zod object picking `id, originAccountId, destinationAccountId, amount, dateISO, description` from `Transfer.shape`.
- `transfers` object:
  - `create(input: NewTransferInput)` → enforce **origin ≠ destination** here
    (throw `Error('Origin and destination accounts must be different')`), then `Transfer.parse(input)`.
  - `update(input: Transfer)` / `archive(...)` — add for parity now (one-liners; used by the deferred
    edit/delete work). Low cost, keeps the module shaped like `transactions`.

**Edit `src/services/finance/domain/commands/index.ts`:**

- import `transfers`, add to `financeDomainCommands`, re-export `TransferUnsaved`.

## 2. Application layer — write path

**New `src/services/finance/application/commands/transfer.ts`** (mirrors `transaction.ts`, minus the
balance/restore concerns — those are Epic 8):

```ts
export const createTransferCommands = (deps: FinanceRepositories) => ({
  create: async (input: CreateTransferInput) => {
    const transfer = financeDomainCommands.transfers.create({ id: generateId(), ...input });
    return deps.transfers.save(transfer);
  },
  update: async (transfer: Transfer) =>
    deps.transfers.save(financeDomainCommands.transfers.update(transfer)),
  archive: async ({ transferId }: { transferId: string }) => {
    const current = await deps.transfers.getById(transferId);
    return deps.transfers.save(financeDomainCommands.transfers.archive(current));
  },
});
```

**Edit `src/services/finance/application/commands/index.ts`:** add `transfers: createTransferCommands(deps)`.

Queries need no change.

## 3. `transfer-form` application service

New bounded service under `src/services/transfer-form/` (lighter than `transaction-form` — no balance gates):

- **`application/queries.ts`** — `transferFormQueries.getAccountsForSelector(transferId: string | undefined)`.
  Returns active accounts, plus (when `transferId` is set) the transfer's origin/destination accounts
  even if archived. Structured like `transactionFormQueries.getAccountsForSelector` so the deferred
  edit work can rely on the archived-account inclusion (AC `155`) without reshaping it.

No `commands.ts` module for now. Create is a plain proxy to `financeCommands.transfers.create`, so
`TransfersNew` calls that directly — matching `AccountsNew` / `JarsNew`. A `transfer-form` commands
module is introduced only when the deferred edit/delete/balance-restore work gives it real
orchestration to hold (the way `transaction-form` carries `submitEditTransaction`).

## 4. Shared form utils (small refactor for DRY + type safety)

`src/lib/transactionFormUtils.ts` contains reusable, movement-agnostic helpers. Extract these into
**`src/lib/movementFormUtils.ts`**:

- `toDateInputValue`, `dateLocalToUTC`, `parseDateInputToISO`
- `parseAmountToCLP`, `nonNegativeNumberRegex`
- the `amount` and `date` zod validators (identical rules to transactions → satisfies AC `128`, `129`)
- `inputProps`

`transactionFormUtils.ts` re-imports from there (no behavior change). Then:

**New `src/lib/transferFormUtils.ts`:**

- `TransferFormValues = { amount: string; date: string; description: string; originAccountId: string; destinationAccountId: string }`
- `getDefaultValues()` — `date` = today via shared helper (AC `129`), rest empty
- `toFormValues(transfer)` — for the deferred edit work
- `createFormSchema(activeAccountIds: string[])` =
  `z.object({ amount, date, description, originAccountId: required, destinationAccountId: required }).superRefine(...)`:
  - `originAccountId` ∈ `activeAccountIds` → `'Origin account must be active'` (AC `131`)
  - `destinationAccountId` ∈ `activeAccountIds` → `'Destination account must be active'` (AC `131`)
  - `originAccountId !== destinationAccountId` → `'Origin and destination accounts must be different'`,
    path `['destinationAccountId']` (AC `130`, `145`)

## 5. Hooks

- **`src/hooks/useTransferForm.ts`** — mirrors `useTransactionForm.ts` (tanstack `useForm`, `onSubmit`
  parses via schema, maps `date`→`dateISO`, trims description).
- **`src/hooks/useTransferFormValidate.ts`** — mirrors `useTransactionFormValidate.ts`; pulls active
  accounts from `useTransferFormAccounts`, builds `createFormSchema(accountIds)`.
- **`src/hooks/useTransferFormAccounts.ts`** — `useQuery(['transferFormQueries.getAccountsForSelector', transferId], …)`.
- **`src/hooks/useMovements.ts`** — `useQuery(['financeQueries.listMovements'], () => financeQueries.movements.list())`.
  Replaces the old `useTransactions` hook for the Movements screen; `useTransactions.ts` and the
  transient `useTransfers.ts` are deleted (nothing else referenced them).

## 6. Components

**Presentational field components** — the tiny ones (`TransactionFormFieldDate`, `…Description`,
`…Amount`, `…FieldWrapper`) are typed to `TransactionFormType`. Rather than fight generics over the
tanstack form type, **duplicate them** as `TransferFormFieldDate/Description/Amount` (~15 lines each)
importing the shared `movementFormUtils`. `TransactionFormFieldSelect` and `TransactionFormFieldWrapper`
are already structurally typed — reuse those directly.

- **`src/components/TransferFormFieldAccount.tsx`** — parameterized: props `form`,
  `name: 'originAccountId' | 'destinationAccountId'`, `label`, `placeholder`, `defaultOpen?`.
  Renders `TransactionFormFieldSelect` with all active accounts. No cross-field option filtering —
  origin ≠ destination is enforced solely by the schema (a `excludeAccountId` filter was dropped
  during implementation: it would have made AC `130` unreachable through the UI and untestable, and
  the transaction form does no cross-field option filtering either).
- **`src/components/TransferForm.tsx`** — mirrors `TransactionForm.tsx`. Fields in order:
  Date → Origin account → Destination account → Amount → Description. Submit / Cancel (`/movements`).
  No delete for now. Skip the auto-open/auto-advance choreography for v1 (plain selects).
- **`src/components/TransfersNew.tsx`** — `handleSubmit` → `financeCommands.transfers.create(value)`
  → `navigate({ to: '/movements' })` (same shape as `AccountsNew` / `JarsNew`).
- **`src/components/TransferListItem.tsx`** — icon + origin account name → destination account name
  (via `useAccount`), description, `formatCurrencyAmount(amount)`, `formatDateISO(dateISO)`. Use a
  distinct lucide icon (e.g. `ArrowLeftRightIcon`) so it's minimally distinguishable — full polish is
  deferred AC `139`.

## 7. Movements listing (minimal interleave)

The merge + sort is a **query in the `finance` service**, not component logic (`Movement` is already a
domain concept there and both entity types are owned by that bounded context — no new service):

- **`src/services/finance/domain/queries.ts`** — new `listMovements(transactions, transfers, params)`
  reusing `listTransactions` / `listTransfers` for the `includeArchived` filter, then merging and
  re-sorting via the existing `orderMovements`. Exports
  `type MovementListEntry = ({ movementType: 'transaction' } & Transaction) | ({ movementType: 'transfer' } & Transfer)`
  (`movementType` tag, since `Transaction` already has its own `kind` field). Registered as
  `financeDomainQueries.movements.list`.
- **`src/services/finance/application/queries.ts`** — `financeQueries.movements.list(params?)` fetches
  both repos and delegates to the domain query. Default order is `dateISO` desc (satisfies AC `137`'s sort).

`src/components/Movements.tsx` now just calls `useMovements()`, attaches a `url` per entry
(`/transactions/$id/edit` for transactions, `undefined` for transfers), and renders
`movementType === 'transfer' ? <TransferListItem transfer={item} /> : <TransactionListItem transaction={item} />`.

`GenericList` change: replace `addLabel` / `addUrl` with a single
`actions: { label: string; url: string }[]` (exported as `GenericListAction`) rendered as link rows,
and make item `url` optional (`T extends { id: string; url?: string }`) — rows without a `url` render
un-wrapped instead of inside a `<Link>`. All callers move to `actions`: `Accounts`, `Jars`,
`GenericNameableList` (which also swaps its own `addLabel`/`addUrl` for `actions`, propagated from
`CategoriesIncome` / `CategoriesExpense`). Movements passes both add rows via `actions`. Transfer
rows have no `url` for now, so they are non-interactive until the deferred `/transfers/$transferId/edit`
route exists.

`src/tests/e2e/movements.spec.ts` — the "sorted by date descending" test indexes `nth()` into the
list's links; the new "Add transfer" link shifts those, so it now filters `hasNotText: /^Add /` and
indexes from `nth(0)`.

## 8. Route

**New `src/routes/transfers/new.tsx`:**

```ts
export const Route = createFileRoute('/transfers/new')({ component: TransfersNew });
```

`src/routeTree.gen.ts` is regenerated by the TanStack Router plugin on `pnpm dev` / build.

## 9. Tests

**E2E — new `src/tests/e2e/pages/transferForm.page.ts`** (mirror `transactionForm.page.ts`):
`submitButton`, `amountInput`, `dateInput`, `descriptionInput`, `originAccountSelect`,
`destinationAccountSelect`, `selectOriginAccount(name)`, `selectDestinationAccount(name)`, `fill*`
helpers. No `page.goto` helper — tests reach the form by clicking (`navButton('Movements')` →
`createTransferButton`); the app loads once via the `rootLayoutPage` fixture's `page.goto('/')`.

**Wiring:** add `transferFormPage` fixture in `src/tests/e2e/setup/pages.ts`; add `createTransfer(params)`
action in `src/tests/e2e/setup/actions.ts`; add `createTransferButton` to `movements.page.ts`.
Transfer rows aren't links, so the create/persist assertions use plain `page.getByText(...)` on the
user-visible content (`origin → destination`, description, formatted amount, formatted date) rather
than scoping to a row element.

**New `src/tests/e2e/transfers.spec.ts`** (each validation isolated, matching the transaction suite):

- **can create a transfer** — create 2 accounts, fill origin/destination/amount/date/description,
  submit, assert the row appears on Movements with `origin → destination`, formatted amount, formatted
  date (AC `127`, `148`–`150`).
- **persists across a page reload** — create via `createTransfer`, `page.reload()`, still visible
  (AC `150`).
- **date defaults to today** — open form, assert `dateInput` value equals
  `transferFormUtils.getDefaultValues().date` (AC `129`).
- **required fields** — submit empty → "Origin account is required" / "Destination account is
  required" / "Amount is required" (AC `143`).
- **amount must be a positive number** — origin+destination valid, `asdf` → "Amount must be a
  positive number"; `0` → "Amount must be greater than zero" (AC `128`, `144`, `146`).
- **origin ≠ destination** — pick the same account for both → "Origin and destination accounts must be
  different" (AC `130`, `145`).
- **only active accounts selectable** — create an account, archive it, assert it's absent from both
  selectors (AC `131`).

No unit test — behavior is fully covered e2e. Unit tests are reserved for logic that is both hard to
exercise through behavior and critical to get exactly right (e.g. the LRU cache in `unit.spec.ts`);
the origin ≠ destination rule is neither.

## 10. Checks to run

```bash
pnpm exec tsc -b
pnpm lint
pnpm format:check
pnpm test:chromium
```

---

## File summary

**New:**

- `src/services/finance/domain/commands/transfer.ts`
- `src/services/finance/application/commands/transfer.ts`
- `src/services/transfer-form/application/queries.ts`
- `src/lib/movementFormUtils.ts`
- `src/lib/transferFormUtils.ts`
- `src/hooks/useTransferForm.ts`
- `src/hooks/useTransferFormValidate.ts`
- `src/hooks/useTransferFormAccounts.ts`
- `src/hooks/useMovements.ts`
- `src/components/TransferForm.tsx`
- `src/components/TransferFormFieldAccount.tsx`
- `src/components/TransferFormFieldDate.tsx`
- `src/components/TransferFormFieldAmount.tsx`
- `src/components/TransferFormFieldDescription.tsx`
- `src/components/TransfersNew.tsx`
- `src/components/TransferListItem.tsx`
- `src/routes/transfers/new.tsx`
- `src/tests/e2e/pages/transferForm.page.ts`
- `src/tests/e2e/transfers.spec.ts`

**Edited:**

- `src/services/finance/domain/commands/index.ts`
- `src/services/finance/application/commands/index.ts`
- `src/services/finance/domain/queries.ts` (+ `application/queries.ts`) — `movements.list` query
- `src/lib/transactionFormUtils.ts` (re-import shared helpers)
- `src/components/Movements.tsx`
- `src/components/GenericList.tsx` — `actions: GenericListAction[]` replaces `addLabel`/`addUrl`; optional item `url`
- `src/components/GenericNameableList.tsx`, `Accounts.tsx`, `Jars.tsx`, `CategoriesIncome.tsx`, `CategoriesExpense.tsx` — moved to `actions`
- `src/routeTree.gen.ts` (regenerated for `/transfers/new`)
- `src/tests/e2e/setup/pages.ts`
- `src/tests/e2e/setup/actions.ts`
- `src/tests/e2e/pages/movements.page.ts`
- `src/tests/e2e/movements.spec.ts` (index shift from the new "Add transfer" link)

**Deleted:** `src/hooks/useTransactions.ts`, `src/hooks/useTransfers.ts` (superseded by `useMovements`).

---

## Deferred (later Epic 6 ACs)

- `/transfers/$transferId/edit` route, `TransfersEdit`, `useTransferEditCurrentTransfer`, edit/delete
  command wiring, archived-account inclusion in the selector query (`epics.md:132`–`134`, `155`)
- Visual-distinction polish on the Movements screen (`epics.md:139`)
- Account balance derived from transfers (Epic 8)
