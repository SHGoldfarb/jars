# Plan — Epic 9: Subcategories

**Target:** `docs/product/epics.md:262`–`277` — the whole epic.

## Context

Categories today are a flat list scoped to `income` or `expense` (Epic 4). Users who track
spending at any detail want a second level — `Groceries → Fruit` — without inflating the category
list. Epic 9 adds subcategories: owned by exactly one category, managed from the Categories
screen, and optionally attached to a transaction.

The evidence that the second level is already wanted is in the Money Manager importer: it read a
`Subcategory` column and flattened it into a category named `Needs / Groceries` because the model
had nowhere to put it. With subcategories in the model it imports them as subcategories, the
parent deduced from the row's own `Category` column.

**Shape of this plan:** vertical slices, like the Epic 7 plan. Each slice ends green
(`tsc -b`, lint, format, e2e) and is independently shippable.

## Decisions taken up front

1. **Subcategory is its own entity and its own Dexie store**, not a field on `Category`. It is
   `Identifiable + Archivable + Nameable + categoryId`, exactly the shape every other named entity
   already has, so `createDBTableRepository` and `byName` apply unchanged.
2. **Kind is inherited, never stored.** AC "inherits its kind" is satisfied by reading the parent's
   `kind`; a copy on the subcategory could disagree with its parent.
3. **Deleting a category does not cascade a write.** AC "makes its subcategories unavailable along
   with it" is a _query_ rule: `listSubcategories` drops any whose parent is archived. No fan-out
   write, and restoring a category would restore its subcategories coherently.
4. **Backup compatibility: version 4 only.** `DB_SCHEMA_VERSION` 3 → 4, `Backup.schemaVersion`
   stays `z.literal(DB_SCHEMA_VERSION)`. Backups taken before this epic are rejected with the
   existing "taken from an unsupported version of the app" message.
5. **The CSV export gains a `Subcategory` column**, filled for transactions only.
6. **Categories screen:** the list shows subcategories nested under their category; `Add
subcategory` lives on the category's own edit screen.
7. **An optional select must not drive the form's focus choreography.** See slice 2.

---

# Slice 1 — Create, edit, delete and list subcategories

**ACs:** `265`, `266`, `267`, `268`, `269`, `270`, `271`, and the subcategory half of `276`.

### Model

- **New `src/services/finance/model/entities/subcategory.ts`** — mirrors `category.ts`:
  ```ts
  export const Subcategory = z.object({
    ...Archivable.shape,
    ...Identifiable.shape,
    ...Nameable.shape,
    categoryId: idShape,
  });
  ```
- **`entities/index.ts`** — export it.
- **`entities/snapshot.ts`** — add `subcategories: z.array(Subcategory)`.

### Persistence

- **`infrastructure/db.ts`** — `DB_SCHEMA_VERSION = 4`; add
  `db.version(DB_SCHEMA_VERSION).stores({ subcategories: '&id, categoryId' })` (Dexie carries the
  unchanged stores forward, so only the new store is declared; the existing version-3
  `.upgrade()` stays as is). Add `'subcategories'` to `TABLE_NAMES`, to `tables`, and to the
  `snapshot()` fan-out.
- **`domain/repositories.ts`** — `SubcategoryRepository` (copy `CategoryRepository`, minus the
  kind-scoped lists), add `subcategories` to `FinanceRepositories`.
- **`infrastructure/repositories.ts`** — `createDBTableRepository(Subcategory, 'subcategories')`;
  widen that helper's `table` union with `'subcategories'`.

### Domain

- **New `domain/commands/subcategory.ts`** — `create({ id, name, categoryId })`, `rename`,
  `archive`, copied from `commands/category.ts` including its `ensureActive` guard. Register in
  `domain/commands/index.ts`.
- **`domain/queries.ts`** — `listSubcategories(subcategories, categories, { includeArchived })`:
  drop own-archived, drop any whose parent category is archived or absent, `.sort(byName)`. Reuse
  the existing `byName` rather than a second comparator. Expose it under
  `financeDomainQueries.subcategories`.

### Application

- **New `application/commands/subcategory.ts`** — `create({ categoryId, name })` (id from
  `generateId()`), `rename`, `archive`; register in `application/commands/index.ts`.
- **`application/queries.ts`** — `subcategories.list({ categoryId?, includeArchived? })`,
  `getById`, `lastOperationId`; add `deps.subcategories.getLastOperationId()` to
  `databaseStateId()` so the movements-month memo invalidates with it.
- **`services/finance/index.ts`** — export the `Subcategory` schema/type.

### UI

- **New `src/hooks/useSubcategories.ts`** (by `categoryId`) and `src/hooks/useSubcategory.ts`,
  both shaped like `useCategories.ts` / `useCategory.ts`.
- **New `src/components/CategoriesList.tsx`** — replaces the `GenericNameableList` call in
  `CategoriesIncome.tsx` and `CategoriesExpense.tsx`. It flattens categories and their
  subcategories into one ordered row list (`category`, then its subcategories alphabetically, then
  the next category) and hands it to the existing `GenericList`. Flattening rather than nesting
  matters: `GenericList` wraps a whole row in a `<Link>`, and a link inside a link is invalid
  markup. Subcategory rows carry an indent class and link to their own edit route.
- **New `src/components/SubcategoriesNew.tsx` / `SubcategoriesEdit.tsx`** — `GenericNameForm`
  callers, modelled on `CategoriesIncomeNew.tsx` and `CategoriesEdit.tsx`. Both return to
  `/categories/{parent kind}` on submit, cancel and delete.
- **`src/components/CategoriesEdit.tsx`** — add an `Add subcategory` link to
  `/categories/$categoryId/subcategories/new`.
- **New routes** `src/routes/categories/$categoryId.subcategories.new.tsx` and
  `src/routes/categories/subcategories/$subcategoryId.edit.tsx`, both under `/categories` so they
  keep the Income/Expense navbar. `src/routeTree.gen.ts` is generated by the TanStack router vite
  plugin — regenerate by running `pnpm dev` or `pnpm build`, never hand-edit.

### Tests

- **`src/tests/e2e/pages/categories.page.ts`** — subcategory row locator and an
  `expectSubcategoriesUnder(categoryName, names)` that asserts nesting and alphabetical order off
  the existing list-link assertion.
- **`src/tests/e2e/pages/categoriesForm.page.ts`** — `addSubcategoryButton`.
- **`src/tests/e2e/setup/actions.ts`** — `createSubcategory(kind, categoryName, name)` fixture.
- **New `src/tests/e2e/subcategories.spec.ts`** — one test per use case: create, edit, delete,
  nested + alphabetical listing, subcategories vanish with their category, and persistence across
  a reload.

---

# Slice 2 — Choose a subcategory on the transaction form

**ACs:** `272`, `273`, `274`, and the transaction half of `276`.

### The optional-select problem

`formSpec.isFieldActive` (`src/lib/formSpec.ts:60`) makes a field active when it is empty and the
one before it is not; `Form.tsx` opens the active select and hands focus down the chain. An
_optional_ select left empty would both pop open unasked and stall every field after it.

**Fix in `src/lib/formSpec.ts`:** add `optional?: boolean` to `FormFieldSelect`; an optional field
is never active, and a field's "previous value" is read from the nearest preceding non-optional
field. `fieldKey` follows the same rule, and keys on every select from that one onwards, so
choosing the optional subcategory re-opens what follows instead of dead-ending there.
`textFieldAfterSelect` needs no change. Net effect: picking a category opens the Account selector
as it does today, Subcategory waits quietly to be tapped, and tapping it leads on.

### Finance

- **`model/entities/transaction.ts`** — `subcategoryId: idShape.optional()`.
- **`domain/commands/transaction.ts`** — add it to `NewTransactionInput` (optional).
- **`application/commands/transaction.ts`** — add it to `CreateTransactionInput` (optional).

### transaction-form context

- **`domain/formSchema.ts`** — `subcategoryId: z.string()` in the validators (empty allowed:
  AC `274` makes it optional) and a default of `''`. Change `createFormSchema`'s four positional
  arrays to a single named-params object and add `subcategoryIdsByCategoryId: Record<string,
string[]>`; `superRefine` rejects a `subcategoryId` that is not among the selected category's
  own. Tying it to the picked category is what enforces "only the subcategories of the selected
  category" server-side of the UI.
- **`application/queries.ts`** — `getSubcategoriesForSelector(categoryId, transactionId)`,
  mirroring `getCategoriesForSelector`: active subcategories of that category, plus the one the
  edited transaction already points at even if it is unavailable, re-sorted with `byName`.
- **`application/formValues.ts`** — `subcategoryId: transaction.subcategoryId ?? ''`.

### UI

- **New `src/hooks/useTransactionFormSubcategories.ts`** — like
  `useTransactionFormCategories.ts`, keyed on the selected category id.
- **`src/hooks/useTransactionFormSpec.ts`** — a `Subcategory` select directly after `Category`,
  `optional: true`, options derived from `read('categoryId')` (empty list until a category is
  picked, which is the "empty until a category is selected" half of AC `273`); add
  `clears: ['subcategoryId']` to the `categoryId` field for the "resets when the category
  changes" half.
- **`src/components/TransactionForm.tsx`** — map `subcategoryId: values.subcategoryId || undefined`
  into the submitted `TransactionUnsaved`, so "no subcategory" is an absent field, not `''`.

### Tests

- **`src/tests/e2e/pages/transactionForm.page.ts`** — widen the combobox-name unions with
  `'Subcategory'`; the existing `selectOption` / `expectOptionsInOrder` helpers then cover it.
- **`src/tests/e2e/transactions.spec.ts`** — offers only the selected category's subcategories;
  resets when the category changes; saves with no subcategory; saves and reloads with one.

---

# Slice 3 — Show it wherever the category is shown

**ACs:** `275`, `276`.

- **`src/components/TransactionListItem.tsx`** — under the description, render
  `category · subcategory` when the transaction has one, falling back to the category name alone.
  Uses the new `useSubcategory` hook beside the existing `useCategory`.
- **`src/services/data-management/domain/movementsCsv.ts`** — a `Subcategory` column after
  `Category`, filled from the transaction branch of `cellsOf` only.
- **`src/services/data-management/application/commands.ts`** — load subcategories
  (`includeArchived: true`, same reasoning as the existing comment about archived names) and pass
  them to `toMovementsCsvRows`.
- **`src/services/data-management/domain/moneyManager.ts`** — imports Money Manager
  subcategories as subcategories: the `Category` column becomes a category of the row's kind, the
  `Subcategory` column a subcategory under it (memoized per category, so the same name under two
  categories is two subcategories), and the transaction carries both. `CATEGORY_SEPARATOR` and the
  `Needs / Groceries` flattening it existed for are gone. A row with no subcategory leaves the
  transaction without one.
- **`src/tests/e2e/settings.spec.ts`** — `schemaVersion` expectations 3 → 4 (lines ~145, ~211,
  ~496), the hand-written backup fixture gains a `subcategories` array, and the backup-contents
  test asserts the subcategory round-trips.
- **`src/tests/e2e/movements.spec.ts`** (or `transactions.spec.ts`) — a transaction's subcategory
  is visible in the movements list.
- One CSV export test asserting the new column.

---

# Verification

Run after each slice, from the repo root:

```bash
pnpm exec tsc -b
pnpm lint
pnpm format:check
pnpm exec playwright test --project=chromium -g 'subcategor'   # slice-local first
pnpm test:chromium                                             # full suite at the end
```

Per `AGENTS.md`, a Playwright timeout under load is not a broken test: re-run the single test with
`-g '<title>'` before treating any failure as real, and never widen a timeout.

Manual pass with `pnpm dev`, on a browser profile whose IndexedDB already holds data, to confirm
the version-3 → 4 upgrade leaves existing accounts, jars, categories and movements intact:

1. Categories → a category → `Add subcategory` → create two, out of alphabetical order.
2. Categories list shows them nested and alphabetical; rename and delete one.
3. Movements → Add transaction: the Subcategory selector is empty until a category is picked,
   offers only that category's subcategories, resets when the category changes, and the form still
   auto-advances Category → Account → Jar → Amount without stopping on it.
4. Save with a subcategory and without one; both appear correctly in the list and reload intact.
5. Delete the parent category; its subcategories disappear from the list and from the selector.
6. Settings → Create backup, then Load from backup on that file; then confirm a pre-epic backup is
   rejected with the unsupported-version message.

---

# Follow-ups to report, not to do

Per `AGENTS.md`, documentation drift is reported and left to the user:

- **`README.md`** — "`transactions` have 1 `account`, 1 `category` and 1 `jar`" is no longer the
  whole model once a transaction can carry a subcategory.
- **`docs/product/epics.md`** — Epic 9's boxes want ticking once the slices land; I will list them
  and wait for the go-ahead rather than edit the epic doc.
- **`docs/product/epics.md:244`–`245`** — Epic 8's import criteria describe the old flattening:
  a Money Manager category now becomes a category _and_ its `Subcategory` column a subcategory
  under it, and an imported transaction carries that subcategory. Both ticked lines are now
  incomplete rather than wrong.
