# Plan — Epic 7: Allocations

**Target:** `docs/product/epics.md:153`–`189` — the whole epic.

**Shape of this plan:** vertical slices. Unlike the Epic 6 plan
(`epic-6-transfer-create-plan.md`), which walked the stack layer by layer for a single AC, each
slice below is one user-visible capability carried from the Dexie table up to a Playwright test.
Every slice ends green (`tsc -b`, lint, format, e2e) and is independently shippable, so the epic can
stop after any slice and still leave the app coherent.

Allocations are the jar-side mirror of transfers: `Movement + originJarId + destinationJarId`. The
transfer stack landed in Epic 6 is the template throughout — the plan names the transfer file to copy
for each new one, and flags the two places where allocations genuinely differ.

---

## Where allocations differ from transfers

Two differences, both decided here so the slices can stay mechanical:

1. **Jar balances already have a consumer.** `JarsEdit` disables Delete on a non-zero balance
   (`epics.md:110`), so slice 4 changes behaviour that already has tests, not just a number on screen.
2. **The `allocations` Dexie store already exists.** `db.ts:12` declares
   `allocations: '&id, originJarId, destinationJarId'` in version 2 and `db.ts:64` already memoizes
   the table. **No Dexie version bump and no migration anywhere in this epic.**

Everything else — the amount rule, form choreography, selector cross-filtering, list interleaving,
archived-entity inclusion — is the transfer behaviour with `jar` substituted for `account`.

## Amounts

Non-negative, exactly as for transfers and transactions (`epics.md:162`, `180`): the form schema pipes
into the existing `currencyInput.parser`, which yields `'Amount must be a non-negative number'` and
accepts `0`. **No new value object, no change to `src/services/shared/` or `src/lib/decimal.ts`, and no
amount guard in the domain command** — `Allocation` carries `Movement`'s plain `CurrencyAmount`, and a
zero-amount allocation is a legal fixture the tests lean on (slice 5).

## Duplication vs. abstraction

After this epic there are three near-identical form stacks (transaction, transfer, allocation), and
a fourth copy of `FieldDate` / `FieldAmount` / `FieldDescription` that differ only in which
`FormType` they are typed against. **Recommendation: duplicate now, abstract later.** The transfer
stack set this precedent deliberately (Epic 6 plan, §6) and a generic two-endpoint movement form is a
refactor worth doing against three known-good examples, not while writing the third. Slice 7 records
it in `docs/tech-debt.md` as:

> - [ ] **Collapse the transfer and allocation form stacks** — `TransferForm*`/`AllocationForm*`,
>       `useTransferForm*`/`useAllocationForm*` and `services/transfer-form`/`services/allocation-form`
>       differ only in the endpoint entity (account vs jar). A generic two-endpoint movement form
>       would remove ~15 files.

---

# Slice 1 — Create an allocation and see it on Movements

**ACs:** `161`, `162`, `163`, `164`, `165` (create side), `171`, `172`, `177`, `178`, `179`, `180`, `184`.

The big slice: it drags the whole Allocation stack into existence. Everything after it is small.

### Model

**New `src/services/finance/model/entities/allocation.ts`** — mirrors `transfer.ts`:

```ts
export const Allocation = z.object({
  ...Movement.shape,
  originJarId: idShape,
  destinationJarId: idShape,
});
```

**Edit `entities/index.ts`** — export it. **Delete `entities/legacy.ts`**: its only content is the
`Allocation` type marked `NOT YET IMPLEMENTED`, nothing imports it, and this slice is what implements
it. (`entities/index.ts` never re-exported it, so the delete touches no other file.)

### Persistence

- **Edit `domain/repositories.ts`** — `AllocationRepository` (copy `TransferRepository`), add
  `allocations` to `FinanceRepositories`.
- **Edit `infrastructure/repositories.ts`** — add `'allocations'` to the `createDBTableRepository`
  table union, `const allocationRepository: AllocationRepository = createDBTableRepository(Allocation, 'allocations')`,
  register it in `repositories`.
- `infrastructure/db.ts` — **untouched** (see difference 4 above).

### Commands

- **New `domain/commands/allocation.ts`** — copy `transfer.ts`: `AllocationUnsaved`,
  `NewAllocationInput`, `ensureDistinctJars` (message `'Origin and destination jars must be different'`),
  `create` / `update` / `archive`. The amount needs no guard here — `currencyInput.parser` already
  rejects negatives at the form boundary, exactly as for transfers.
- **New `application/commands/allocation.ts`** — copy `application/commands/transfer.ts` verbatim with
  the names swapped.
- **Edit `domain/commands/index.ts`** and **`application/commands/index.ts`** — register `allocations`,
  re-export `AllocationUnsaved`.

### Queries and the Movements interleave

`financeDomainQueries` grows a third near-identical list function. `listTransactions` and
`listTransfers` are already byte-for-byte identical apart from their parameter type; rather than paste
a third, **extract `listMovementsOfType = <T extends Movement>(items: T[], params) => …`** in
`domain/queries.ts` and define all three list queries in terms of it. This is the one refactor slice 1
does beyond copying, and it shrinks the file.

`listMovements` currently takes `(transactions, transfers, params)`. A third positional array of the
same shape is an easy call-site mistake, so **change its signature to
`listMovements({ transactions, transfers, allocations }, params)`** and extend the union:

```ts
export type MovementListEntry =
  | ({ movementType: 'transaction' } & Transaction)
  | ({ movementType: 'transfer' } & Transfer)
  | ({ movementType: 'allocation' } & Allocation);
```

**Edit `application/queries.ts`** — an `allocations` block copied from `transfers` (`list`, `getById`,
`lastOperationId`), and `movements.list` fetches the third repo. **Edit `finance/index.ts`** — export
`Allocation` and `AllocationUnsaved`.

### `allocation-form` context

**New `src/services/allocation-form/`**, mirroring `transfer-form/` (no `commands.ts`: create is a plain
proxy to `financeCommands.allocations.create`, so `AllocationsNew` calls it directly, per
`CONTRIBUTING.md`'s "don't add a layer that only forwards"):

- `application/queries.ts` — `getJarsForSelector(allocationId: string | undefined)`, copied from
  `transferFormQueries.getAccountsForSelector` (the two-missing-ids version). It already handles the
  archived case slice 5 needs; slice 1 only ever passes `undefined`.
- `domain/formSchema.ts` — `AllocationFormValues` (`amount`, `date`, `description`, `originJarId`,
  `destinationJarId`), `getDefaultValues()` (date = today, AC `163`), and `createFormSchema(activeJarIds)`
  with `amount: z.string().trim().min(1, 'Amount is required').pipe(currencyInput.parser)`
  (ACs `177`, `180`), required origin/destination messages (AC `177`), `description: z.string()`
  (AC `178`), and a `superRefine` carrying the three cross-field rules from `transfer-form`:
  origin active / destination active (AC `165`) and origin ≠ destination on path
  `['destinationJarId']` (ACs `164`, `179`).
- `index.ts` — the barrel: `{ queries, getDefaultValues, createFormSchema }` plus the
  `AllocationFormValues` type. `toFormValues` is added in slice 2, when something reads it.

### Hooks

Copies of the transfer hooks: **`useAllocationForm.ts`** (exports `AllocationFormType`),
**`useAllocationFormValidate.ts`**, **`useAllocationFormJars.ts`**.

One deviation: `useTransferFormValidate` and `TransferFormFieldAccount` both call
`useTransferEditCurrentTransfer()`. That hook uses `useParams({ strict: false })`, whose param union is
generated from the route tree — so it cannot compile before the edit route exists. **In slice 1 both
call sites pass `undefined` with a `// slice 2 threads the allocation being edited through here`
comment**; slice 2 replaces them. No `useAllocation` / `useAllocationEditCurrentAllocation` yet.

### Components

- **New `AllocationFormFieldDate` / `…Amount` / `…Description`** — copies of the `TransferForm*`
  equivalents, retyped to `AllocationFormType`. They keep reusing `TransactionFormFieldWrapper`, which
  is already structurally typed.
- **New `AllocationFormFieldJar.tsx`** — copy of `TransferFormFieldAccount.tsx`: props
  `name: 'originJarId' | 'destinationJarId'`, and the same `.filter(jar => jar.id !== otherJarId)`
  cross-selector exclusion.
- **New `AllocationForm.tsx`** — copy of `TransferForm.tsx`, including the focus choreography that
  commit `7c4a65a` added: origin selector auto-opens, picking origin opens destination, picking
  destination focuses Amount, Enter on Amount focuses Description, and the destination selector's
  `key={...}` remount keyed on the origin jar id.
- **New `AllocationsNew.tsx`** — copy of `TransfersNew.tsx`; `financeCommands.allocations.create` then
  `navigate({ to: '/movements' })`.
- **New `AllocationListItem.tsx`** — copy of `TransferListItem.tsx` with `useJar`, rendering
  `origin → destination` and the literal `Allocation` in `ItemDescription` (ACs `172`, and a first cut
  at `173`; slice 6 does the real work). Icon: pick a distinct lucide glyph, e.g. `PiggyBankIcon` or
  `SplitIcon` — not `ArrowLeftRightIcon`, which transfers own.
- **Edit `Movements.tsx`** — third branch in the render callback, third entry in `actions`
  (`{ label: 'Add allocation', url: '/allocations/new' }`), and `movementUrl` returns `undefined` for
  allocations until slice 2 creates the edit route. `GenericList` already renders url-less rows
  un-wrapped, so no change there.

### Route

**New `src/routes/allocations/new.tsx`** — `createFileRoute('/allocations/new')({ component: AllocationsNew })`.
`routeTree.gen.ts` regenerates on `pnpm dev`/build.

### Tests

**New `src/tests/e2e/pages/allocationForm.page.ts`** — copy of `transferForm.page.ts`;
`ComboboxName = 'Origin jar' | 'Destination jar'`, `selectOriginJar` / `selectDestinationJar`.
**Edit `setup/pages.ts`** (`allocationFormPage` fixture), **`setup/actions.ts`**
(`createAllocation(params: CreateAllocationParams)`, copied from `createTransfer` unchanged),
**`pages/movements.page.ts`** (`createAllocationButton`).

`movements.spec.ts` needs **no** change: its ordering test already filters `hasNotText: /^Add /`, so the
extra action row doesn't shift the `nth()` indexes.

**New `src/tests/e2e/allocations.spec.ts`** — `test.use({ locale: 'en-US', timezoneId: 'UTC' })`, one
behaviour per test, expected strings hardcoded (never recomputed with app formatters):

| test                                                                                                                                                                                                                                                                                                         | ACs                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| can create an allocation — two jars, fill every field, assert `origin → destination`, description, `$150.000`, `5/20/2026, 3:20:00 PM` via `page.getByText` (rows aren't links yet)                                                                                                                          | `161`, `171`, `172` |
| persists across a page reload — `createAllocation`, `page.reload()`, still visible                                                                                                                                                                                                                           | `184`               |
| allocation date defaults to today                                                                                                                                                                                                                                                                            | `163`               |
| required fields — submit empty → the three required messages                                                                                                                                                                                                                                                 | `177`               |
| amount must be a non-negative number — `asdf` and `-1` each → `'Amount must be a non-negative number'`                                                                                                                                                                                                       | `162`, `180`        |
| amount can be zero — a `0` allocation submits and shows `$0` on Movements (pins the rule slice 5's fixture depends on)                                                                                                                                                                                       | `162`, `180`        |
| a selected jar is not offered in the other selector                                                                                                                                                                                                                                                          | —                   |
| origin and destination must be different — bypasses the selector filter by picking destination first, then origin, then re-picking destination via the remounted selector; if the filter makes the state unreachable through the UI, drop this test and note that `165`'s filter enforces `179` structurally | `164`, `179`        |
| only active jars are selectable — create, `deleteJar`, absent from both selectors                                                                                                                                                                                                                            | `165`               |
| focus flows from one field to the next                                                                                                                                                                                                                                                                       | —                   |

**Done when:** a user can add an allocation from Movements, it survives a refresh, and every
validation message above is reachable. `pnpm exec tsc -b && pnpm lint && pnpm format:check && pnpm test:chromium`.

---

# Slice 2 — Edit an allocation

**ACs:** `166`, `165` (edit side).

- **New `src/services/allocation-form/application/formValues.ts`** — `toFormValues(allocation)`, copy of
  the transfer one; export it from the barrel.
- **New `src/hooks/useAllocation.ts`** and **`src/hooks/useAllocationEditCurrentAllocation.ts`** — copies
  of `useTransfer.ts` / `useTransferEditCurrentTransfer.ts`.
- **Edit `useAllocationFormValidate.ts`** and **`AllocationFormFieldJar.tsx`** — replace slice 1's
  `undefined` with `useAllocationEditCurrentAllocation()?.id`, deleting the two comments left there.
- **New `src/components/AllocationsEdit.tsx`** — copy of `TransfersEdit.tsx` minus the delete button
  (slice 3): loads the allocation, `financeCommands.allocations.update({ ...allocation, ...value })`,
  back to `/movements`.
- **New `src/routes/allocations/$allocationId.edit.tsx`**.
- **Edit `Movements.tsx`** — `movementUrl` now returns `/allocations/${id}/edit`; allocation rows become
  links.
- **Edit `allocations.spec.ts`** — the create test's `page.getByText` assertions move to
  `movementsPage.getMovement(description)` now that rows are links (same tightening the transfer suite
  got). **New test: can edit an allocation** — copy the transfer version: create with `createAllocation`,
  open the row, assert every field is populated, change all five, assert the new values on the row and
  that the old description is gone.

**Done when:** every field of an existing allocation can be changed (AC `166`) and the form still
refuses inactive jars on the edit path (AC `165`).

---

# Slice 3 — Delete an allocation

**AC:** `167`.

- **Edit `AllocationsEdit.tsx`** — pass `onDelete` calling `financeCommands.allocations.archive({ allocationId })`
  (the command already exists from slice 1) and navigate to `/movements`.
- **Edit `setup/actions.ts`** — `deleteAllocation(description)` fixture, copy of `deleteTransfer`.
- **Edit `allocations.spec.ts`** — **can delete an allocation**: create, open, Delete, assert the row is
  gone from Movements.

Archived allocations are already excluded from the list: `listMovementsOfType` filters on
`archivedAtISO` and `movements.list` defaults `includeArchived` to `false`.

**Done when:** an allocation can be deleted and disappears from Movements.

---

# Slice 4 — Allocations count toward jar balances

**AC:** `188`.

The first slice that changes behaviour outside the allocation stack.

- **Edit `src/services/balances/domain/queries.ts`**:

  ```ts
  // An allocation moves money between jars, so it leaves account balances untouched.
  const applyAllocation = (balances: Balances, allocation: Allocation) => {
    addTo(balances.jars, allocation.originJarId, currency.negate(allocation.amount));
    addTo(balances.jars, allocation.destinationJarId, allocation.amount);
    return balances;
  };
  ```

  `computeBalancesUncached` takes a third array and folds it; `createBalancesGetters` takes
  `allocations` in its params object. `createCacheForFunction` is variadic, so the manual cache needs
  no change.

- **Edit `src/services/balances/application/queries.ts`** — fetch `financeQueries.allocations.list()`
  and add `financeQueries.allocations.lastOperationId()` as a third segment of `dataStateId`.
  **Missing this is the one silent bug in the slice**: balances would go stale after an allocation is
  written and only refresh when a transaction or transfer happened to bump the key.
- Nothing in the UI changes — `JarItem`, `useJarBalance` and `JarsEdit`'s `disableDeleteButton` all read
  through `balances.queries.jars`.

**Tests — edit `src/tests/e2e/jars.spec.ts`** (this is jar-balance behaviour; it belongs with the
existing balance specs):

- **allocations move balance between jars** — create two jars and an income transaction of `10000` into
  jar A, then an allocation of `4000` from A to B; assert jar A shows `$6.000` and jar B shows `$4.000`
  (hardcoded, not recomputed).
- **delete button is disabled for a jar whose balance comes from an allocation** — mirrors the existing
  `delete button is disabled for jars with non zero balance` test, with the balance created by an
  allocation instead of a transaction. Guards AC `110` against the new money path.

**Done when:** jar balances and the jar delete guard both account for allocations.

---

# Slice 5 — Archived jars stay visible when editing

**AC:** `189`.

`allocationFormQueries.getJarsForSelector` was written for this in slice 1 and slice 2 wired the id
through, so this slice is very likely **test-only** — write the test first and only touch code if it
fails.

**New test in `allocations.spec.ts`** — a direct copy of the transfer suite's equivalent, which works
because `0` is a legal amount: a zero allocation A → B leaves both jar balances at zero, so both jars
stay archivable even after slice 4.

1. Create jars A and B.
2. `createAllocation` A → B with `amount: '0'`.
3. `deleteJar(A)`, `deleteJar(B)`.
4. Open the allocation from Movements and assert both archived jars are still offered in both
   selectors.

This makes the slice independent of slice 4; it is ordered after it only so the test is written
against the final balance behaviour.

**Done when:** editing an allocation that references archived jars still shows them.

---

# Slice 6 — Allocations are visually distinguishable

**AC:** `173`.

Slice 1 gave allocation rows their own icon and an `Allocation` label, which is the same treatment
transfers got. Three movement kinds in one list is where that stops being enough, so this slice is a
deliberate pass over `TransactionListItem`, `TransferListItem` and `AllocationListItem` together:

- Keep the three icons distinct (`CircleDollarSignIcon` / `ArrowLeftRightIcon` / the allocation glyph).
- Transactions colour the amount emerald or rose by kind; transfers and allocations are neither income
  nor expense, so leave their amounts in the default colour and let the icon plus the
  `origin → destination` title carry the distinction. If that reads as too subtle in the browser, tint
  the icon per movement type rather than the amount — no new component, one `className`.
- Check it against the real app (`pnpm dev`, or the `run` skill), not just the DOM.

**Test — edit `movements.spec.ts`**: a `movements list shows the three movement kinds` test that creates
one transaction, one transfer and one allocation and asserts all three rows are present with their own
type labels, interleaved in date-descending order (AC `171`'s interleave, which no test covers today —
the existing ordering test uses transactions only).

**Done when:** the three kinds are tellable apart at a glance and the interleave is pinned by a test.

---

# Slice 7 — Close the docs out

No code. `AGENTS.md` bars agents from editing documentation on their own initiative; **the user
explicitly asked for these three edits as part of this epic**, which is the authorization for them.
Anything else that looks stale still gets reported, not fixed.

### 1. `docs/product/epics.md`

Tick the Epic 7 acceptance criteria (`159`–`189`) as their slices land, and carry the header status
the way Epic 6 does (`## Epic 6 — Transfers [IN PROGRESS]`): mark Epic 7 `[IN PROGRESS]` when slice 1
starts and drop the marker once slice 6 is green.

### 2. `CONTRIBUTING.md` — "Folder Structure"

The bounded-context list under `src/services/` names every context and is now missing one. Add it
next to the transfer entry, matching the existing wording:

```
  - `allocation-form/` - allocation form orchestration (`application/`, `domain/`)
```

### 3. `docs/tech-debt.md`

Add the entry drafted under "Duplication vs. abstraction" above. The file is currently empty apart
from its example comment, so this is the first real item and sets the shape for the next one:

```markdown
- [ ] **Collapse the transfer and allocation form stacks** — `TransferForm*`/`AllocationForm*`,
      `useTransferForm*`/`useAllocationForm*` and `services/transfer-form`/`services/allocation-form`
      differ only in the endpoint entity (account vs jar). A generic two-endpoint movement form
      would remove ~15 files.
```

A second entry is worth proposing at the same time, for the gap named under "Out of scope" — but
it describes behaviour the user hasn't ruled on, so raise it and let them decide rather than writing
it in unprompted:

```markdown
- [ ] **Movement edits don't restore the archived entity they give a balance to** — `transaction-form`
      restores an archived jar or account when an edit gives it a non-zero balance; transfer and
      allocation edits don't, so an archived account or jar can silently end up holding money.
```

**Done when:** `epics.md` reflects what shipped, `CONTRIBUTING.md`'s folder list matches the tree, and
the deferred refactor is written down instead of living only in this plan.

---

## File summary

**New (23):**

```
src/services/finance/model/entities/allocation.ts
src/services/finance/domain/commands/allocation.ts
src/services/finance/application/commands/allocation.ts
src/services/allocation-form/index.ts
src/services/allocation-form/application/queries.ts
src/services/allocation-form/application/formValues.ts        (slice 2)
src/services/allocation-form/domain/formSchema.ts
src/hooks/useAllocationForm.ts
src/hooks/useAllocationFormValidate.ts
src/hooks/useAllocationFormJars.ts
src/hooks/useAllocation.ts                                    (slice 2)
src/hooks/useAllocationEditCurrentAllocation.ts               (slice 2)
src/components/AllocationForm.tsx
src/components/AllocationFormFieldJar.tsx
src/components/AllocationFormFieldDate.tsx
src/components/AllocationFormFieldAmount.tsx
src/components/AllocationFormFieldDescription.tsx
src/components/AllocationsNew.tsx
src/components/AllocationsEdit.tsx                            (slice 2)
src/components/AllocationListItem.tsx
src/routes/allocations/new.tsx
src/routes/allocations/$allocationId.edit.tsx                 (slice 2)
src/tests/e2e/pages/allocationForm.page.ts
src/tests/e2e/allocations.spec.ts
```

**Edited:**

```
src/services/finance/model/entities/index.ts
src/services/finance/domain/repositories.ts         AllocationRepository
src/services/finance/domain/commands/index.ts
src/services/finance/domain/queries.ts              listMovementsOfType extraction + 3-way listMovements
src/services/finance/application/commands/index.ts
src/services/finance/application/queries.ts
src/services/finance/infrastructure/repositories.ts
src/services/finance/index.ts
src/services/balances/domain/queries.ts             applyAllocation           (slice 4)
src/services/balances/application/queries.ts        allocations in dataStateId (slice 4)
src/components/Movements.tsx
src/components/TransactionListItem.tsx, TransferListItem.tsx                   (slice 6)
src/tests/e2e/setup/pages.ts, setup/actions.ts
src/tests/e2e/pages/movements.page.ts
src/tests/e2e/jars.spec.ts                                                     (slice 4)
src/tests/e2e/movements.spec.ts                                                (slice 6)
src/routeTree.gen.ts                                regenerated

docs/product/epics.md                               ACs ticked                 (slice 7)
CONTRIBUTING.md                                     allocation-form in the folder list (slice 7)
docs/tech-debt.md                                   deferred form-stack refactor (slice 7)
```

**Deleted:** `src/services/finance/model/entities/legacy.ts`.

**Unchanged, deliberately:** `src/services/finance/infrastructure/db.ts` — the `allocations` store and
its memoized table are already there.

## Checks

Per slice:

```bash
pnpm exec tsc -b
pnpm lint
pnpm format:check
pnpm test:chromium
```

`pnpm test` before the epic is called done.

## Out of scope

- **Restoring an archived jar when an allocation edit gives it a balance.** Epic 5 does this for
  transaction edits (`transaction-form`'s `submitEditTransaction`); Epic 6 did _not_ do it for
  transfers and accounts, and Epic 7's ACs don't ask for it either. Once slice 4 lands, editing an
  allocation can leave an archived jar holding money — the same gap transfers already have with
  accounts. Slice 7 proposes a `docs/tech-debt.md` entry covering both at once, rather than a
  one-sided fix here.
- The form-stack deduplication described under "Duplication vs. abstraction", recorded as tech debt in
  slice 7.
- Epic 8 data management and Epic 9 statistics.
