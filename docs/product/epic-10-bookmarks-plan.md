# Plan — Epic 10: Bookmarks

**Target:** `docs/product/epics.md:281`–`288` — the whole epic, plus deleting a bookmark, which
the ACs do not list but was asked for alongside them.

## Context

Many movements repeat: the monthly rent, the same supermarket from the same account and jar, the
salary allocation into the same jars. Today each one is typed from scratch, or the user hunts down
last month's copy and re-creates it by hand. Epic 10 lets the user save a movement as a
**bookmark** and later start a new movement from it, with every field pre-filled except the date.

The three movement forms already exist and already take `defaultValues` (that is how the edit
screens pre-fill them), so the epic is mostly: a new entity, a place to save it from, a place to
pick it from, and a way to turn it into form values.

**Shape of this plan:** vertical slices, like the Epic 7 and Epic 9 plans. Slices 1–4 each end
green (`tsc -b`, lint, format, e2e) and are independently shippable; Slice 5 updates the docs once
the feature is in.

## Decisions taken up front

1. **A bookmark is a snapshot, not a pointer.** It copies the movement's fields at the moment it
   is saved and is its own entity in its own Dexie store. A pointer (`movementId`) would make the
   bookmark change whenever the source movement is edited and disappear when it is deleted — the
   user bookmarks "rent as it is now", not "whatever that row becomes".
2. **One entity, a discriminated union on `movementType`.** The same discriminator
   `MovementListEntry` already uses (`'transaction' | 'transfer' | 'allocation'`), so code that
   switches on it reads the same in both places. Each branch is built from the movement's own
   schema minus `id`, `dateISO` and `archivedAtISO`, so a field added to a movement later is a
   field the bookmark carries without a second edit:
   ```ts
   const bookmarkFieldsOf = <T extends z.ZodObject>(movement: T) =>
     movement.omit({ id: true, dateISO: true, archivedAtISO: true }).shape;
   ```
   Not storing a date at all is what makes AC `288` hold by construction — there is nothing to
   carry over.
3. **Saving captures what is typed into the form.** The "Save as bookmark" button on a movement's
   edit screen bookmarks the form's current values, unsaved edits included — what the user sees is
   what gets bookmarked. The values are validated first with the form's own rules **minus the
   date** (a bookmark has none, so an empty or odd date must not block it); if they are invalid,
   the form shows the same errors Submit would and nothing is saved. Saving a bookmark never saves
   the movement itself.
4. **No name field.** A bookmark is listed with the same summary its movement row shows
   (accounts/jars, description, category, amount), minus the date.
5. **Duplicates are allowed.** After a save the button reads "Bookmarked" and is disabled until a
   field changes, so a double tap does not create two, but changing the values and saving again
   deliberately does.
6. **The bookmarks menu is a route, `/bookmarks`,** reached from an action on the Movements page.
   It is a `GenericList`, like every other list in the app, and carries `month` through so the
   form it opens can still cancel back to the month the user was browsing.
7. **Selecting a bookmark reuses the existing `new` routes** with a `bookmarkId` search param:
   `/transactions/new?bookmarkId=…`, `/transfers/new?…`, `/allocations/new?…`. No new form
   screens; creation, validation, and the post-submit redirect are exactly today's.
8. **Unavailable references are blanked, not resurrected.** If a bookmark points at an account,
   jar, category or subcategory that has since been deleted, that field opens empty and the form's
   existing focus flow opens it for the user to pick again. The create form validates against
   active entities only, so a pre-filled archived id would just fail on submit.
9. **Deleting a bookmark is a soft delete** (`archivedAtISO`), like every other entity, done from
   an edit mode on the bookmarks menu (Slice 4).
10. **A Money Manager import clears bookmarks.** The import replaces the whole database, and
    bookmarks are part of it.
11. **Backup compatibility: version 5 only.** `DB_SCHEMA_VERSION` 4 → 5; backups from before this
    epic are rejected with the existing unsupported-version message, as Epic 9 did.

---

# Slice 1 — Save a movement as a bookmark

**ACs:** `285`.

### Model

- **New `src/services/finance/model/entities/bookmark.ts`**:

  ```ts
  const bookmarkFieldsOf = <T extends z.ZodObject>(movement: T) =>
    movement.omit({ id: true, dateISO: true, archivedAtISO: true }).shape;

  const BookmarkBase = z.object({
    ...Identifiable.shape,
    ...Archivable.shape,
    createdAtISO: dateTimeShape,
  });

  export const TransactionBookmark = z.object({
    ...BookmarkBase.shape,
    ...bookmarkFieldsOf(Transaction),
    movementType: z.literal('transaction'),
  });
  // TransferBookmark, AllocationBookmark likewise

  export const Bookmark = z.discriminatedUnion('movementType', [
    TransactionBookmark,
    TransferBookmark,
    AllocationBookmark,
  ]);
  ```

  `createdAtISO` is what the menu orders by (newest first); `Archivable` is the soft delete of
  Slice 4.

- **`entities/index.ts`** — export it.
- **`entities/snapshot.ts`** — add `bookmarks: z.array(Bookmark)`.

### Persistence

- **`infrastructure/db.ts`** — `DB_SCHEMA_VERSION = 5`; add
  `db.version(DB_SCHEMA_VERSION).stores({ bookmarks: '&id' })` (version 4's declaration stays as
  it is, with its comment). Add `'bookmarks'` to `TABLE_NAMES`, `tables`, and the `snapshot()`
  fan-out. `replaceAll` and `clear` pick it up from `TABLE_NAMES`.
- **`domain/repositories.ts`** — `BookmarkRepository` (`getById`, `list`, `save`,
  `getLastOperationId`) and `bookmarks` on `FinanceRepositories`.
- **`infrastructure/repositories.ts`** — `createDBTableRepository` is typed on
  `T extends z.ZodObject`, and `Bookmark` is a `ZodDiscriminatedUnion`. Widen the constraint to
  `T extends z.ZodType` (it only ever calls `parse` / `safeParse`), rather than wrapping the union
  in an object or casting. Add `'bookmarks'` to its `table` union.

### Domain

- **New `domain/commands/bookmark.ts`**:
  - `BookmarkUnsaved` — the `Bookmark` union with `id`, `createdAtISO` and `archivedAtISO`
    omitted from each branch: exactly what a form can supply.
  - `create({ id, createdAtISO, ...input })` — parses with `Bookmark`.
  - `archive(bookmark)` — for Slice 4, written now beside its sibling.
  - Register in `domain/commands/index.ts`; export `BookmarkUnsaved` like `TransactionUnsaved`.
- **`domain/queries.ts`** — `listBookmarks(bookmarks, { includeArchived })`: drop archived, sort
  by `createdAtISO` descending. Expose under `financeDomainQueries.bookmarks`.

### Application

- **New `application/commands/bookmark.ts`** — `create(input: BookmarkUnsaved)` (id from
  `generateId()`, `createdAtISO` now), and `archive({ bookmarkId })` for Slice 4. Register in
  `application/commands/index.ts`.
- **`application/queries.ts`** — `bookmarks.list()`, `bookmarks.getById(id)`,
  `bookmarks.lastOperationId()`; add `deps.bookmarks.getLastOperationId()` to `databaseStateId()`
  for consistency with every other store.
- **`services/finance/index.ts`** — export `Bookmark` and `BookmarkUnsaved`.

### Form contexts: a date-less schema and a bookmark mapper

The form schemas are `z.object(validators).superRefine(...)`, and Zod 4 refuses `.omit()` on a
refined object. So each context separates the two pieces it already has:

- **`transaction-form/domain/formSchema.ts`** — lift the `superRefine` callback into a named
  `refineSelections(options)` and add
  `createBookmarkSchema(options) = z.object(omitDate(transactionValidators)).superRefine(refineSelections(options))`.
  `createFormSchema` becomes the same composition with the date kept, so both schemas share every
  rule except the date. Add `toBookmarkInput(parsed): BookmarkUnsaved` — `movementType` set to `'transaction'`, trimmed description, `subcategoryId: parsed.subcategoryId || undefined` (the same
  `''` → absent mapping `TransactionForm.tsx` does on submit; move that mapping here so both use
  one copy).
- **`movement-form/domain/formSchema.ts`** — the same split: `createValidators(noun)` minus
  `date`, the refine extracted, `createBookmarkSchema(noun, activeEndpointIds)`, and a
  `toBookmarkDraft(parsed)` returning the draft without `dateISO`.
- **`movement-form/application/kinds.ts`** — `MovementKind` gains
  `toBookmark: (draft: Omit<MovementDraft, 'dateISO'>) => BookmarkUnsaved`, written next to each
  kind's `toUnsaved` (it is the same field renaming plus `movementType`).
- Both barrels expose `createBookmarkSchema` and the mapper; `MovementFormUi` gains them too.

### UI

- **`src/components/Form.tsx`** — an optional, bookmark-agnostic `secondaryAction`:
  ```ts
  secondaryAction?: {
    label: string;
    doneLabel: string;
    schema: z.ZodType<TSecondary, TValues>;
    onAction: (parsed: TSecondary) => Promise<void>;
  };
  ```
  Clicking it validates the current values with **its own** schema through
  `formUtils.validateWithSchema`, writes any errors into the form's error map exactly as
  `onSubmit` does, and otherwise calls `onAction`. On success the button shows `doneLabel`,
  disabled, and records the values it saved; it re-enables once `values` differ from them
  (Decision 5). `type="button"`, so it never submits.
- **`src/components/FormActions.tsx`** — renders the secondary button after Delete.
- **`TransactionForm.tsx` / `MovementForm.tsx`** — accept an optional `onBookmark` and, when
  given, build the `secondaryAction` (`label: 'Save as bookmark'`, `doneLabel: 'Bookmarked'`,
  schema from `createBookmarkSchema`, mapping through the context's mapper). The bookmark schema
  takes the same option lists the submit schema already gets from `useTransactionFormSpec` /
  `useMovementFormSpec`, so those hooks return it alongside `schema`.
- **`TransactionsEdit.tsx`, `TransfersEdit.tsx`, `AllocationsEdit.tsx`** — pass
  `onBookmark={(input) => financeCommands.bookmarks.create(input)}`, calling the finance command
  directly per `CONTRIBUTING.md` (a plain create flow needs no form-specific command module).
  Only the edit screens get it: AC `285` is about an _existing_ movement. Offering it on the New
  screens later is the same one prop.

### Data management

- **`src/tests/e2e/settings.spec.ts`** — `schemaVersion` expectations 4 → 5 (lines ~134, ~196,
  ~408), the hand-written backup fixture gains `bookmarks: []`, and the backup-contents test
  creates one bookmark and asserts it round-trips through create backup → load from backup.
- **`src/services/data-management/domain/moneyManager.ts`** — the snapshot it builds gains
  `bookmarks: []`, which is what clears them on import (Decision 10).
- **CSV export:** unchanged. A bookmark is not a movement and has no date.

### Tests

- **`src/tests/e2e/pages/transactionForm.page.ts`, `transferForm.page.ts`,
  `allocationForm.page.ts`** — `bookmarkButton` (button named "Save as bookmark") and
  `bookmarkedButton` (button named "Bookmarked").
- Assertions for this slice live in Slice 2's tests: a saved bookmark is only observable through
  the menu, so "save" and "list" are one use case end to end. One exception that belongs here, in
  `transactions.spec.ts`: _an invalid form is not bookmarked_ — clear the amount, press Save as
  bookmark, the "Amount is required" error shows and the button still reads "Save as bookmark".

---

# Slice 2 — Bookmarks menu from the Movements page

**ACs:** `286`, and the "save" half of `285` made observable.

### Routing

- **`src/routes/movements.tsx`** — export a second schema for the pages a movement is _started_
  from:
  ```ts
  export const newMovementSearchSchema = movementsSearchSchema.extend({
    bookmarkId: z.uuidv4().optional().catch(undefined),
  });
  ```
  Same `.catch(undefined)` reasoning as `month`: a stale link degrades to a blank form, not an
  error boundary.
- **New `src/routes/bookmarks.tsx`** — `component: Bookmarks`, validating its search with
  `movementsSearchSchema` (it only needs to carry `month` through).
- `src/routeTree.gen.ts` is regenerated by the TanStack router vite plugin (`pnpm dev` /
  `pnpm build`), never hand-edited.

### UI

- **`src/components/Movements.tsx`** — a fourth action: label "Bookmarks", url `/bookmarks`,
  search `{ month }`.
- **`src/components/GenericList.tsx`** — items gain an optional `search` alongside `url`, typed as
  the union the app actually uses (`{ month?: YearMonthKey; bookmarkId?: string }`), passed to the
  row's `<Link>`. Today rows can only link to a bare path.
- **New `src/hooks/useBookmarks.ts`** — `useQuery` on `financeQueries.bookmarks.list()`, shaped
  like `useMovements` (returns `isPending` too, for the empty state).
- **New `src/components/Bookmarks.tsx`** — a `GenericList` of bookmarks. Each row's `url` is the
  matching `new` route (a `bookmarkUrl` switch on `movementType`, mirroring `movementUrl` in
  `Movements.tsx`) with `search: { month, bookmarkId }`. An empty-state line, "No bookmarks yet —
  open a movement and choose Save as bookmark", styled like the "No movements in …" line.
- **Rows reuse the movement row components.** `TransactionListItem`, `TransferListItem` and
  `AllocationListItem` currently take the full entity and always print its date. Widen each prop
  to the bookmark-compatible fields — the entity without `id`, `dateISO` and `archivedAtISO`, plus
  an optional `dateISO` — and render the date line only when there is one. A `Transaction` still
  satisfies the widened type, so `Movements.tsx` is unchanged, and a bookmark row looks exactly
  like the movement it came from. The kind label ("Transaction", "Transfer", "Allocation") stays —
  it is what tells two otherwise similar bookmarks apart.
- **New `src/components/BookmarkListItem.tsx`** — the `movementType` switch that picks one of the
  three, the same switch `Movements.tsx` does inline.

### Tests

- **`src/tests/e2e/pages/movements.page.ts`** — `bookmarksButton`.
- **New `src/tests/e2e/pages/bookmarks.page.ts`** — `getBookmark(description)`,
  `expectBookmarksInOrder(descriptions)`, `emptyMessage`; register it in `setup/pages.ts`.
- **New `src/tests/e2e/bookmarks.spec.ts`**:
  - _a movement of each kind can be saved as a bookmark and is listed in the bookmarks menu_ —
    create a transaction, a transfer and an allocation; save each from its edit screen; open
    Movements → Bookmarks; all three are listed, newest first, each with its kind label and
    without a date.
  - _a bookmark saves what is typed, not what is stored_ — open a transaction, change its
    description without submitting, Save as bookmark, Cancel; the bookmark shows the new
    description and the movement still shows the old one. (Pins Decision 3.)
  - _a bookmark keeps the movement as it was when it was saved_ — bookmark, then edit and delete
    the movement; the bookmark is unchanged. (Pins Decision 1.)
  - _the bookmarks menu says so when it is empty_.
  - _bookmarks persist across a reload_.

---

# Slice 3 — Start a movement from a bookmark

**ACs:** `287`, `288`.

### transaction-form context

- **`application/formValues.ts`** — split `toFormValues` into the date-less part
  (`amount`, `description`, `kind`, `accountId`, `categoryId`, `subcategoryId`, `jarId`) and the
  date. `toFormValues(transaction)` keeps its signature and adds the stored date; the bookmark
  path spreads the date-less part over `getDefaultValues()`, so the date is _literally_ the form's
  default — AC `288` is satisfied by reusing the one place that default lives, not by re-deriving
  "today".
- **`application/queries.ts`** — `getFormValuesFromBookmark(bookmarkId)`:
  - reads the bookmark; returns `undefined` if it is missing, archived, or not a
    `'transaction'` bookmark (a hand-edited URL), so the screen falls back to a blank form;
  - reads the selectors' own option lists — `getAccountsForSelector(undefined)`,
    `getJarsForSelector(undefined)`, `getCategoriesForSelector(kind, undefined)`,
    `getSubcategoriesByCategoryForSelector(undefined)` — and blanks every id that is not among
    them (Decision 8). Using the selector queries, rather than re-implementing "is it active",
    means the pre-fill can never offer something the selector would not. A subcategory is kept
    only when its category was kept _and_ it is in that category's group.

### movement-form context

- **`application/kinds.ts`** — `MovementKind` gains `bookmarkType: 'transfer' | 'allocation'`.
  `endpointsOf` is narrowed to take only the endpoint fields (`originAccountId` /
  `destinationAccountId`, and likewise for jars), so the same function reads a movement or its
  bookmark.
- **`application/formValues.ts`** — same split as the transaction form; the bookmark path spreads
  over `movementFormSchema.getDefaultValues()`.
- **`application/queries.ts`** — `getFormValuesFromBookmark(bookmarkId)`, symmetric with the
  transaction one: `undefined` on a missing/archived/wrong-type bookmark, endpoints blanked
  unless `getEndpointsForSelector(undefined)` offers them. Add it to `MovementFormUi.queries`.

### UI

- **`src/routes/transactions/new.tsx`, `transfers/new.tsx`, `allocations/new.tsx`** — validate
  their search with `newMovementSearchSchema`.
- **New `src/hooks/useTransactionFormBookmarkValues.ts`** and
  **`src/hooks/useMovementFormBookmarkValues.ts`** — `useQuery` on the queries above, `enabled`
  only when a `bookmarkId` is present. Return `{ values, isPending }`.
- **`TransactionsNew.tsx`, `TransfersNew.tsx`, `AllocationsNew.tsx`** — read `bookmarkId` from
  the search; while its values are pending render nothing (the edit screens already do this with
  `if (!transaction) return null`), then pass `defaultValues={values}`. `Form` reads
  `defaultValues` once on mount, which is why it must not mount before they arrive.
- **Focus flow:** nothing to change. With every field filled, no select is "active", so nothing
  pops open. With a blanked field, `formSpec.isFieldActive` makes it the active one and `Form`
  opens it — exactly the "pick it again" behaviour Decision 8 wants. Worth one manual check that
  a pre-filled Subcategory does not trigger the optional-field offer (it should not: offers start
  only from `handleSelected`, i.e. a user selection).

### Tests

Added to `src/tests/e2e/bookmarks.spec.ts`:

- _selecting a transaction bookmark opens the transaction form with everything but the date
  pre-filled_ — bookmark a transaction dated `DEFAULT_MOVEMENT_DATE` with a subcategory; open it
  from the menu; the form title is "Create Transaction"; amount, description, type, account, jar,
  category and subcategory show the bookmarked values; the date shows today, pinned with
  `page.clock` so the expected value is hardcoded rather than computed (per `CONTRIBUTING.md`).
  Submitting creates a _second_ transaction; the original is untouched.
- _selecting a transfer bookmark …_ and _selecting an allocation bookmark …_ — the same, against
  their forms.
- _a bookmark whose jar has been deleted opens with the jar left for the user to pick_ — bookmark,
  delete the jar (its balance is zero once the transaction is deleted too), open the bookmark; the
  Jar selector is empty and open, every other field is filled.
- _cancelling a form opened from a bookmark returns to the month it was started from_ — extends
  the existing "cancelling a new movement…" check in `movements.spec.ts` rather than duplicating
  it.

---

# Slice 4 — Delete a bookmark

**Not in the ACs as written;** Slice 5 adds it to the epic.

- **`application/commands/bookmark.ts`** — `archive({ bookmarkId })` (already stubbed in
  Slice 1).
- **`src/components/Bookmarks.tsx`** — rows are whole `<Link>`s, so a Delete button cannot live
  inside one (a button in a link is invalid markup, and the click would navigate). An "Edit"
  list action toggles an edit mode in component state: rows are rendered without a `url`
  (`GenericList` already renders those as plain `Item`s) and each gets a Delete button; the action
  reads "Done" to leave it. Delete calls `financeCommands.bookmarks.archive` directly, with no
  confirmation step — the same as deleting a movement today. Edit mode is hidden when the list is
  empty.
- **Tests**, in `bookmarks.spec.ts`: _a deleted bookmark is no longer listed and does not come
  back after a reload_; in edit mode, tapping a row does not open a form.

### Money Manager import clears bookmarks

- **`src/tests/e2e/moneyManagerImport.spec.ts`** — extend _the import is confirmed, then replaces
  the current data…_: save a bookmark before importing and assert the bookmarks menu is empty
  afterwards. If seeding is the cheaper setup, give `setup/seed.ts` a `bookmarks` option rather
  than clicking through the form. (It fits here, after the menu exists to observe it.)

---

# Slice 5 — Update the docs

Asked for explicitly, so this is the one place this epic edits documentation:

- **`README.md`**
  - _Key features_: a **Bookmarks** bullet — save a movement as a bookmark and start new movements
    from it, pre-filled except for the date.
  - _Modeling → Entities_: add `bookmarks`: a saved copy of a transaction, transfer or allocation,
    without its date.
- **`docs/product/epics.md`**
  - The heading `## Epic 10 - Bookmarks` → `## Epic 10 — Bookmarks`, matching every other epic.
  - Add the AC that Slice 4 delivered: "A bookmark can be deleted from the bookmarks menu".
  - Spell out the save behaviour Decision 3 chose under AC `285`: the bookmark is what is typed
    into the form, not what is stored.
  - Tick every Epic 10 box.
- **`CONTRIBUTING.md`** — no change expected (no new context or folder). Re-read its _Folder
  Structure_ against the tree once the slices land and fix anything that has drifted.
- **`AGENTS.md`** — no change.

---

# Verification

Run after each slice, from the repo root:

```bash
pnpm exec tsc -b
pnpm lint
pnpm format:check
pnpm exec playwright test --project=chromium -g 'bookmark'   # slice-local first
pnpm test:chromium                                           # full suite at the end
```

Per `AGENTS.md`, a Playwright timeout under load is not a broken test: re-run the single test with
`-g '<title>'` before treating any failure as real, and never widen a timeout. The new spec's
cross-kind tests create several entities; `test.slow()` may be declared on them when written, not
in reaction to a timeout.

Manual pass with `pnpm dev`, on a browser profile whose IndexedDB already holds data, to confirm
the version-4 → 5 upgrade leaves everything intact:

1. Open an existing transaction, change its description without submitting → Save as bookmark →
   the button reads "Bookmarked"; change a field and it re-enables. Cancel: the movement is
   unchanged.
2. Clear the amount → Save as bookmark: the amount error shows, nothing is saved.
3. Bookmark a transfer and an allocation too.
4. Movements → Bookmarks: three rows, newest first, no dates, each labelled with its kind.
5. Pick each: the right form opens, every field pre-filled, date is today, no selector pops open.
   Submit: a new movement appears on today's month; the original is unchanged.
6. Delete the account a transfer bookmark uses; open that bookmark: Origin account is empty and
   open, the rest is filled.
7. Bookmarks → Edit → Delete one → Done; it is gone, and stays gone after a reload.
8. Settings → Create backup, Load from backup on that file: bookmarks survive. A pre-epic
   (version 4) backup is rejected with the unsupported-version message.
9. Settings → Import from Money Manager, then Clear all data: the bookmarks menu is empty after
   each.
