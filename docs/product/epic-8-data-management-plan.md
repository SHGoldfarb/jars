# Plan — Epic 8: Data Management

**Target:** `docs/product/epics.md:191`–`260` — the whole epic.

**Shape of this plan:** one step per user-visible action, plus a scaffold step first and a docs step
last. Step 1 puts the Settings screen and its five buttons on screen doing nothing; steps 2–6 give
each button its behaviour, one at a time. Every step ends green (`tsc -b`, lint, format, e2e) and is
independently shippable — the epic can stop after any step and leave the app coherent, with the
not-yet-implemented buttons still visibly inert rather than half-wired.

Unlike Epics 6 and 7, this epic has no form and no new entity. It is the first one that:

- writes to **every** table at once, atomically (`replaceAll`, `clear`);
- crosses the browser file boundary in both directions (download, file picker);
- replaces data the whole app has memoized, from a screen that displays none of it — so the caches
  under the queries have to be dropped with it (see decisions 3 and 4).

Those three are the whole engineering content of the epic. Everything else is mapping code.

---

## Decisions taken up front

### 1. A new bounded context: `src/services/data-management/`

Backup, restore, CSV export and Money Manager import are file-format concerns, not finance rules.
They get their own context that sits beside `balances/` and `movement-form/` and consumes
`services/finance`'s barrel. It never sees Dexie, never sees React, and holds no display formatting
(see decision 5).

```
src/services/data-management/
  index.ts                      dataManagement = { commands, backup, moneyManager }
  domain/
    backup.ts                   Backup envelope schema, BACKUP_SCHEMA_VERSION, parseBackupFile
    moneyManager.ts             the column contract, row schema, rows -> FinanceSnapshot mapping
    result.ts                   ParseResult<T> discriminated union
  application/
    commands.ts                 createBackup, restoreFromBackup, importMoneyManagerExcel, clearAllData
```

### 2. Finance grows one new port: the database snapshot

`FinanceRepositories` today is six per-entity repositories with `getById` / `list` / `save`. Whole-
database read, replace and clear do not belong on any one of them, so finance gains a seventh member:

```ts
export interface FinanceDatabaseRepository {
  snapshot(): Promise<FinanceSnapshot>;
  replaceAll(snapshot: FinanceSnapshot): Promise<void>; // atomic
  clear(): Promise<void>; // atomic
}
```

`FinanceSnapshot` is a new model entity — `z.object({ accounts: z.array(Account), jars: …, categories: …, transactions: …, transfers: …, allocations: … })` — so the same schema validates a restore
file and types the dump. `data-management` builds and consumes `FinanceSnapshot`; only
`finance/infrastructure/db.ts` knows it is Dexie underneath.

### 3. Atomicity lives in `db.ts`, and every memoized version must bump

`db.ts` currently exposes six `memoizedTable`s whose `getMap` is memoized against a per-table version
that only `upsert` bumps. Two changes:

- `makeVersionedMemoize` already returns `upVersion`; `memoizedTable` must re-export it so `DB` can
  invalidate a table it wrote through some other path.
- `DB` gains `snapshot`, `replaceAll` and `clear`, implemented with a single Dexie transaction over
  all six stores:

  ```ts
  const tables = [db.table('accounts') /* … */];
  const replaceAll = async (snapshot: FinanceSnapshot) => {
    await db.transaction('rw', tables, async () => {
      await Promise.all(tables.map((table) => table.clear()));
      await Promise.all(/* bulkPut each entity array into its table */);
    });
    bumpAllVersions();
  };
  ```

  Dexie aborts and rolls the whole transaction back on any failure, which is ACs `218`, `241` and
  `258`. Bumping the versions **after** the commit is the right order: an over-eager bump only costs
  a recompute, a missed bump serves stale data forever.

**This is the one place a mistake is invisible.** A restore that writes correctly but leaves
`getMap`'s memoized map in place shows the old data until a reload, and every balance keyed on
`lastOperationId` stays stale with it.

### 4. No react-query invalidation is needed; the memoized Dexie maps are the whole problem

ACs `219`, `249` and `259` ("the app reflects the change without a manual page refresh") need no
`queryClient.invalidateQueries()` call after a write.

Settings displays nothing derived from the database, so no query is mounted when a restore, import or
clear runs. The user reaches data only by navigating, which mounts a route component for the first
time, and `QueryClient` is constructed with no defaults (`src/main.tsx:20`): `staleTime` is `0`, so
every cached entry is stale immediately, and `refetchOnMount` is `true`, so mounting refetches it.
Nothing DB-derived stays mounted across a navigation either — `RootLayout` renders only the navbar,
and the sole layout route, `/categories`, is not reachable without leaving Settings. That is the same
mechanism every existing create and edit flow already relies on: none of them invalidate anything;
they navigate.

**So the layer that actually needs invalidating is the one underneath.** `getMap` is memoized against
a per-table version, and a refetch of a stale query calls straight back into it. If `replaceAll` and
`clear` don't bump those versions, the refetch returns the pre-restore map and the data is stale
_permanently_, reload or not — which is why decision 3 spells the bump out and why the tests in step 3
navigate to Movements without reloading rather than trusting the write.

Revisit only if Settings itself grows something DB-derived — a record count, a "last backup" line —
because that query would be mounted at the moment its data is replaced.

### 5. The CSV is written in the format the user typed, not the format the app displays

The app's display formats are the wrong rule for a file a spreadsheet reads:

- `formatDateISO` is `toLocaleString(undefined, …)` — **the browser's** locale. The same database
  exports as `2/10/2026, 9:00:00 AM` on one machine and `10/2/2026, 9:00:00` on another, and neither
  is unambiguously parseable without knowing which.
- `formatCurrencyAmount` emits a currency symbol, so `Amount` becomes text: no `SUM`, no sorting. And
  CLP renders as `$1.000`, which a spreadsheet in a `.`-decimal locale reads as one peso.
- It couples the file format to the UI. Any later display tweak — hiding cents, showing relative
  dates — silently changes the format of a file people have scripts and spreadsheets pointed at.

The intent behind the AC is the right one: don't leak the implementation into the file — no
`2026-02-10T09:00:00.000Z`, no `{ value: '1000', decimalPlaces: 0 }`, no ids. **The format that
satisfies that intent without any of the problems above is the one the user typed in the first
place**, which is neither the stored form nor the displayed form:

| Column     | Written as         | Where it comes from                                                                                                                                                           |
| ---------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Date`     | `2026-02-10 09:00` | `datetime-local` gives `YYYY-MM-DDTHH:mm` and `dateInput.parseToISO` pins it to UTC, so `dateISO.slice(0, 16)` with the `T` replaced by a space is the field's own value back |
| `Amount`   | `1000`, `1234.56`  | `currencyInput`'s regex is `^\d+(\.\d+)?$` — plain digits, `.` decimal, no separators                                                                                         |
| `Currency` | `CLP` / `USD`      | `CurrencyAmount.currency`, domain data rather than a symbol                                                                                                                   |

Both are ISO-shaped, locale-independent, sortable, and parsed as a date and a number by every
spreadsheet. The time survives, which matters because the form captures it to the minute.

This is AC `229` (`epics.md:229`):

> - [ ] Amounts are written as plain decimal numbers alongside a currency column, and dates as
>       `YYYY-MM-DD HH:mm`, so the file is unambiguous in a spreadsheet whatever the reader's locale;
>       no internal representation (ISO timestamps, decimal objects, ids) appears in the file

No display formatter is involved, so the row mapping sits in the context alongside the other formats
and the dependency direction in `CONTRIBUTING.md` never comes into it:

- `src/lib/csv.ts` — `csv.serialize(rows: string[][])` and `csv.parse(text)`: RFC 4180 quoting and
  splitting, no domain knowledge. A technical primitive, exactly what `lib/` is for.
- `src/services/data-management/domain/movementsCsv.ts` — `MovementListEntry[]` plus name lookups to
  `string[][]`. `src/presentation/` plays no part in the export.
- **Edit `src/lib/decimal.ts`** — add `decimal.toDecimalString(d)`, placing the point from `value` and
  `decimalPlaces` by string manipulation. `decimal.toNumber` divides by a power of ten and is a float;
  it is fine behind `Intl` for display, but a data file this app can be judged by should not round.

**No CSV library is added.** `csv.serialize` is ~15 lines, `csv.parse` ~40, and papaparse would still
leave the escaping tests to write. This is the case `CONTRIBUTING.md` carves out for unit tests: the
quoting edge cases are critical and awkward to reach through the UI, so `csv.ts` and
`decimal.toDecimalString` get bench tests in `src/tests/unit/`, and the e2e suite covers only that the
exported file opens correctly.

### 6. Confirmations use shadcn's `alert-dialog`

There is no dialog primitive in `src/components/ui/` yet. `radix-ui` is already a dependency, so:

```bash
pnpm exec shadcn add alert-dialog
```

`role="alertdialog"` plus an accessible name gives the e2e suite a real locator without any test-only
attribute. If the CLI can't add it against the `radix-mira` style, hand-write the wrapper over
`radix-ui`'s `AlertDialog` in the same shape as `select.tsx`.

### 7. Errors are returned, not thrown

Rejecting a file is an expected outcome, not an exception. The parsing entry points return

```ts
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };
```

so the UI renders `error` in a `role="alert"` region and TypeScript forces the failure branch to be
handled. `error` is the user-facing sentence the ACs ask for (`215`, `239`), built from the zod
issue's path and message.

### 8. The backup's schema version

`db.ts` declares Dexie versions 2 and 3. Extract `export const DB_SCHEMA_VERSION = 3` there, use it
in `db.version(DB_SCHEMA_VERSION)`, and have the backup envelope carry it. Restore validates with
`z.literal(DB_SCHEMA_VERSION)` — any other value is "unsupported schema version" (AC `215`). When a
version 4 arrives, the literal becomes a union and the restore gains an upgrade path; the constant is
the seam that makes that a local change.

### 9. Reading `.xlsx` takes a dependency, and only `src/lib/xlsx.ts` may name it

Decision 5 refused a CSV library because serializing and splitting quoted fields is ~55 lines. An
`.xlsx` is not that: it is a ZIP archive of XML parts where the sheet holds numeric references into a
shared string table and dates are serial numbers counted from a workbook epoch. Hand-rolling that is
a project, not a helper, so this one step does add a dependency.

**`read-excel-file`.** Read-only, browser-first (`readXlsxFile(blob)`), ships its own TypeScript
types, and hands back cells already decoded as `string | number | boolean | Date | null` — the shared
string table and the date serials, the two things a hand-rolled reader gets quietly wrong, are
resolved before any mapping code runs.

- Not `xlsx` (SheetJS): the copy on npm is an old release, and current versions are published from
  the vendor's own registry — a second registry in `.npmrc` for one feature. Its cell model is also
  untyped enough to fight `AGENTS.md`'s rules.
- Not `exceljs`: a writer as well as a reader, and much bigger, for a feature that only ever reads.

**Containment.** The library is named in exactly one file:

```ts
// src/lib/xlsx.ts
export type XlsxCell = string | number | boolean | Date | null;
export const xlsx = {
  readRows: async (file: Blob): Promise<XlsxCell[][]> => {
    const { default: readXlsxFile } = await import('read-excel-file');
    // …first sheet, rows as cells
  },
};
```

Two properties fall out of that shape. The `await import(...)` keeps the reader out of the initial
bundle — a PWA should not ship a ZIP/XML parser to every user for a button most never press — and
because `readRows` returns plain rows, everything downstream of it is pure data that tests can write
by hand (step 6's test split rests on this). `lib/` is the right tier: reading a workbook into rows
has no more domain knowledge than `csv.parse`.

---

# Step 1 — The Settings screen, with five inert actions

**ACs:** `199`, `200`, `201`.

No data touched anywhere. This step is the whole surface the epic hangs off, so the later steps are
each "replace one no-op handler".

### UI

- **New `src/components/SettingsAction.tsx`** — one action card: title, a sentence saying what it
  does, an optional destructive warning line, and either a `Button` or a file `<input>`-backed
  trigger. Props typed as a discriminated union on `kind: 'button' | 'file'` so the file variant is
  the only one that can carry `accept` and `onFile`.
- **New `src/components/Settings.tsx`** — the five actions in order, wrapped in the `Card` primitive
  the rest of the app uses, plus a `role="alert"` status region (empty until step 3) that later steps
  write errors and confirmations into. Copy text:

  | Action                            | Description                                                                      | Warning                                                       |
  | --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
  | `Create backup`                   | Downloads a JSON file with all your accounts, jars, categories and movements.    | —                                                             |
  | `Load from backup`                | Restores a JSON backup created by this app.                                      | Replaces all current data. This cannot be undone.             |
  | `Export to CSV`                   | Downloads your movements as a spreadsheet file.                                  | —                                                             |
  | `Import from Money Manager Excel` | Imports an Excel file exported by the Money Manager app.                         | Replaces all current data. This cannot be undone.             |
  | `Clear all data`                  | Removes all accounts, jars, categories, transactions, transfers and allocations. | All current data is permanently lost and cannot be recovered. |

- **Edit `src/components/RootLayout.tsx`** — a fifth entry `{ name: 'Settings', href: '/settings' }`
  after Categories (AC `199`).
- **New `src/routes/settings.tsx`** — `createFileRoute('/settings')({ component: Settings })`.
  `routeTree.gen.ts` regenerates on `pnpm dev` / build.

Handlers this step: each button's `onClick` is a `// step N` comment and nothing else. Nothing is
disabled — a disabled button can't be asserted on for its description text, and the next five steps
land quickly.

### Tests

- **New `src/tests/e2e/pages/settings.page.ts`** — `actionButton(name)`, `actionDescription(name)`,
  `fileInput(name)`, `statusMessage`, and (from step 2 on) `confirmDialog` helpers.
- **Edit `src/tests/e2e/pages/rootLayout.page.ts`** — widen `navButton`'s name union with `'Settings'`.
- **Edit `src/tests/e2e/setup/pages.ts`** — `settingsPage` fixture.
- **New `src/tests/e2e/settings.spec.ts`**:
  - _settings is reachable from the main navigation_ — click `Settings`, the five action titles are
    visible (ACs `199`, `200`).
  - _each action explains itself, and the destructive ones warn_ — assert the five descriptions and
    the three warning sentences, hardcoded (AC `201`).

**Done when:** the Settings screen exists with all five actions described, and clicking any of them
does nothing.

---

# Step 2 — Create backup (JSON)

**ACs:** `205`, `206`, `207`, `208`, `209`.

The read half of the snapshot port. Nothing is written anywhere in this step, which makes it the
cheapest place to get `FinanceSnapshot` right.

### Finance

- **New `src/services/finance/model/entities/snapshot.ts`** — `FinanceSnapshot` as in decision 2;
  export from `model/entities/index.ts`. Because it is built from the existing entity schemas, AC
  `206` (every persisted field, ids and archived markers included) holds by construction.
- **Edit `src/services/finance/infrastructure/db.ts`** — `DB_SCHEMA_VERSION`, `memoizedTable`
  re-exporting `upVersion`, and `DB.snapshot()` reading all six `getMap`s.
- **Edit `domain/repositories.ts`** — `FinanceDatabaseRepository` (`snapshot` only for now; the two
  writers land in step 3), added to `FinanceRepositories` as `database`.
- **Edit `infrastructure/repositories.ts`** — implement it over `DB`, parsing through
  `FinanceSnapshot` so nothing unvalidated leaves persistence.
- **Edit `application/queries.ts`** — `database: { snapshot: () => deps.database.snapshot() }`.
- **Edit `finance/index.ts`** — export `FinanceSnapshot` and `DB_SCHEMA_VERSION`.

### data-management

- **New `domain/backup.ts`**:

  ```ts
  export const Backup = z.object({
    schemaVersion: z.literal(DB_SCHEMA_VERSION),
    createdAtISO: z.iso.datetime(),
    data: FinanceSnapshot,
  });
  ```

  plus `backupFileName(date: Date)` returning `jars-backup-YYYY-MM-DD.json` (AC `208`).

- **New `application/commands.ts`** — `createBackup()` reads the snapshot, wraps it in the envelope,
  returns `{ fileName, contents }`. It reads and formats; it writes nothing (AC `209`).
- **New `index.ts`** — the barrel, named exports only.

### lib and UI

- **New `src/lib/fileDownload.ts`** — `downloadTextFile({ fileName, contents, mimeType })`: Blob,
  `URL.createObjectURL`, a synthetic anchor click, `revokeObjectURL`. Technical, no domain knowledge.
- **New `src/hooks/useDataManagement.ts`** — the one hook the Settings screen uses; this step gives it
  `createBackup`. Later steps add the other four actions.
- **Edit `Settings.tsx`** — wire the `Create backup` button.

### Tests — edit `settings.spec.ts`

- _create backup downloads a JSON file named for today_ — `test.use({ timezoneId: 'UTC' })`, create
  the default data plus one transaction, click `Create backup`, take the download from
  `page.waitForEvent('download')`, assert `suggestedFilename()` matches
  `/^jars-backup-\d{4}-\d{2}-\d{2}\.json$/` and carries today's date (computed in the test with plain
  `Date`, never with app code).
- _the backup contains the full database state_ — read the downloaded file, `JSON.parse` it, and
  assert `schemaVersion`, the six entity arrays, and that the transaction's `id`, `amount`,
  `dateISO`, `description`, `accountId`, `jarId` and `categoryId` are all present (ACs `205`, `206`,
  `207`).
- _creating a backup leaves the data untouched_ — movements list is unchanged afterwards (AC `209`).

**Done when:** a user can download a complete, versioned backup file.

---

# Step 3 — Load from backup (JSON)

**ACs:** `213`–`221`.

The heaviest step: the write half of the port, the validation and the confirmation.

### Finance

- **Edit `db.ts`** — `replaceAll` and `clear` as in decision 3.
- **Edit `domain/repositories.ts`** — add `replaceAll` and `clear` to `FinanceDatabaseRepository`.
- **New `domain/commands/database.ts`** — `database.replaceAll = (snapshot: unknown) => FinanceSnapshot.parse(snapshot)`:
  the domain rule that only fully valid snapshots reach persistence. Registered in
  `domain/commands/index.ts`.
- **New `application/commands/database.ts`** — `replaceAll(snapshot)` (parse via the domain command,
  then `deps.database.replaceAll`) and `clear()`. Registered in `application/commands/index.ts`.

### data-management

- **New `domain/result.ts`** — `ParseResult<T>`.
- **Edit `domain/backup.ts`** — `parseBackupFile(text: string): ParseResult<FinanceSnapshot>`:
  1. `JSON.parse` in a try/catch → `'The file is not valid JSON.'`
  2. `Backup.safeParse` → on failure, a sentence naming the first issue's path and message; the
     `schemaVersion` literal mismatch is reported as `'This backup was taken from an unsupported version of the app.'`
     A CSV file fails at step 1, which is AC `233` for free — and gets a test.
- **Edit `application/commands.ts`** — `restoreFromBackup(text)`: parse, and only on `ok` call
  `financeCommands.database.replaceAll`. A rejected file never reaches a writer, so AC `216` holds
  structurally rather than by care.

### UI

- **Edit `SettingsAction.tsx`** / **`Settings.tsx`** — the file variant: a hidden `<input type="file" accept="application/json">`
  behind a labelled trigger, then the `AlertDialog` confirm ("This replaces all current data and it
  cannot be recovered") before anything runs (AC `214`). Cancel clears the picked file.
- **Edit `useDataManagement.ts`** — read the file with `file.text()`, call the command, then set a
  success or an error status from the returned `ParseResult`. No cache handling (decision 4).

### Tests — edit `settings.spec.ts` (files fed with `setInputFiles({ name, mimeType, buffer })`, no fixtures on disk)

- _round trip: backup then restore reproduces the data_ — create default data, a transaction, a
  transfer and an allocation; download the backup; `Clear all data`… **not available until step 4**, so
  instead delete the transaction through the UI, restore the backup, and assert the deleted movement
  is back and balances match the pre-backup values (ACs `217`, `221`).
- _restore replaces data rather than merging_ — back up state A, create movement X, restore state A,
  assert X is gone (AC `217`).
- _a restored database survives a reload_ — `page.reload()` after a restore (AC `220`).
- _the restore is confirmed first_ — pick a file, assert the dialog text, Cancel, assert nothing
  changed (AC `214`).
- _invalid files are rejected with an explanation_ — one test per case, each asserting the message and
  that the movements list is untouched (ACs `215`, `216`):
  - not JSON at all,
  - JSON missing the `jars` array,
  - a transaction with a non-UUID `accountId`,
  - `schemaVersion: 99`,
  - a CSV exported by the app (AC `233` — moves here in step 5 once `Export to CSV` exists; until
    then, a hand-written CSV string).
- _restored data appears without a manual refresh_ — after the restore, navigate to Movements
  **without reloading** and assert the restored movements (AC `219`). This is the test that fails if
  `replaceAll` writes correctly but leaves the memoized maps in place (decision 3).

**Done when:** a backup file can be loaded back, bad files bounce with a reason, and the screen
reflects the result without a reload.

---

# Step 4 — Clear all data

**ACs:** `254`–`260`.

Small, because step 3 built everything it needs: `DB.clear`, `financeCommands.database.clear` and the
confirmation dialog.

- **Edit `data-management/application/commands.ts`** — `clearAllData()`.
- **Edit `useDataManagement.ts`** / **`Settings.tsx`** — wire the button, reusing the same dialog
  component with the copy from AC `255`, and the description listing all six entity kinds (AC `254`).

### Tests — edit `settings.spec.ts`

- _cancelling the confirmation leaves everything in place_ (AC `256`).
- _confirming empties the database_ — create default data and one of each movement kind, confirm, then
  assert Movements, Accounts, Jars and both Categories tabs are all empty **without reloading**
  (ACs `257`, `259`).
- _the database stays empty across a reload_ — `page.reload()`, still empty (AC `260`).

Also **edit the step 3 round-trip test** to use `Clear all data` between backup and restore now that
it exists — that is the sequence AC `221` actually describes.

**Done when:** the user can wipe the database from Settings, and only on purpose.

---

# Step 5 — Export to CSV

**ACs:** `225`–`233`.

No writes at all; the trickiest part is which names to look up.

### lib and context

- **New `src/lib/csv.ts`** — `csv.serialize(rows)`: quote a field when it contains `,`, `"`, `\r` or
  `\n`, doubling inner quotes; join with `\r\n`. `csv.parse(text)` lands here too (step 6 needs it),
  but only `serialize` is used now.
- **Edit `src/lib/decimal.ts`** — `decimal.toDecimalString` (decision 5).
- **New `src/services/data-management/domain/movementsCsv.ts`** —
  `toMovementsCsvRows({ movements, accounts, jars, categories })`. Header, then one row per movement:

  `Type,Date,Description,Amount,Currency,Account,Category,Jar,Origin account,Destination account,Origin jar,Destination jar`

  | Movement    | Type                 | Filled                              |
  | ----------- | -------------------- | ----------------------------------- |
  | transaction | `Income` / `Expense` | Account, Category, Jar              |
  | transfer    | `Transfer`           | Origin account, Destination account |
  | allocation  | `Allocation`         | Origin jar, Destination jar         |

  `Type` carries the kind (AC `226`) without a second column. Unfilled cells are empty strings; no ids
  anywhere (AC `225`); `Date` and `Amount`/`Currency` per decision 5's table.

  **The lookup nuance:** movements are fetched with the default `includeArchived: false`, but the
  accounts, jars and categories used to resolve names are fetched with `includeArchived: true` — a live
  movement may point at an archived jar, and it still has to print that jar's name. Entities nothing
  references are simply never looked up, which is ACs `227` and `228`.

### Wiring

- **Edit `data-management/application/commands.ts`** — `exportMovementsCsv({ movements, … })` returns
  `{ fileName, contents }` like `createBackup`, with `jars-export-YYYY-MM-DD.csv` (AC `231`).
- **Edit `useDataManagement.ts`** — fetch the four lists, call the command, `downloadTextFile` with
  `text/csv`. The mapping must not be recomputed in tests.

### Tests — edit `settings.spec.ts`

Content assertions need no `locale` fixture: the formats in decision 5 are locale-independent.
`timezoneId: 'UTC'` is set for the filename, which comes from today's date.

- _export downloads a CSV named for today_ (AC `231`).
- _every movement kind is exported with names instead of ids_ — one transaction, one transfer and one
  allocation with known values; read the file and assert the header line and the three rows verbatim,
  with `2026-02-10 09:00`, `1000` and `CLP` hardcoded (ACs `225`, `226`, `229`).
- _amounts and dates carry no internal representation_ — assert the file contains no `T`/`Z`
  timestamp, no `decimalPlaces`, and no id (ACs `229`, `225`).
- _entities no movement references are absent_ — create an extra jar and an extra category, use
  neither, assert their names do not appear in the file; archive one of them and assert the same
  (ACs `227`, `228`).
- _values with separators, quotes and newlines survive_ — a description like `Lunch, "the good one"\nwith friends`;
  assert the exported field is quoted with doubled quotes and that re-parsing the file yields the
  original string (AC `230`). Descriptions and entity names are now the only fields that can need
  quoting at all.
- _an exported CSV is not accepted by Load from backup_ — download the CSV, feed it to the restore
  picker, assert the "not valid JSON" error and that no data changed (AC `233`).
- _exporting leaves the data untouched_ (AC `232`).
- **New unit tests in `src/tests/unit/`** for `csv.serialize` / `csv.parse` round-tripping quotes,
  embedded newlines, empty fields and trailing newlines, and for `decimal.toDecimalString` across
  positive, zero and negative `decimalPlaces`. This is the carve-out in `CONTRIBUTING.md`, not a
  duplicate of the e2e above.

**Done when:** movements open cleanly in a spreadsheet, with dates and amounts a spreadsheet
understands, and the file is one-way.

---

# Step 6 — Import from Money Manager Excel

**ACs:** `237`–`250`.

> **Blocking input: a real Money Manager export.** The parser's whole job is to recognise one
> specific file, and its column names, date format, amount format and how a transfer is represented
> cannot be guessed safely. Before this step starts, drop a real (small, anonymised) export at
> `src/tests/e2e/fixtures/money-manager-sample.xlsx` and pin the contract against it. Everything below
> is written against the **assumed** shape and must be re-checked, not trusted. A workbook hides more
> than a text file did, so check these five specifically:
>
> 1. **Is it really `.xlsx`?** Money Manager may hand out `.xls` (a different, older binary format) or
>    a CSV named like a spreadsheet. `read-excel-file` reads `.xlsx` only; anything else changes
>    decision 9.
> 2. **Which sheet, and is row 1 the header?** The plan assumes the first sheet with the header on the
>    first row. Exports often carry a title row or a summary block above the table.
> 3. **Are `Date` cells real dates or text?** A formatted date cell arrives as a `Date`; a text date
>    arrives as a string and needs parsing with a known format.
> 4. **Is `Amount` a number cell or text?** A number cell arrives as a `number`; text may carry a
>    currency symbol and thousands separators.
> 5. **How is a transfer written?** One row, or a `Transfer-Out` / `Transfer-In` pair.

**Assumed contract** — the first sheet, a header row containing at least `Date`, `Account`,
`Category`, `Note`, `Amount`, `Income/Expense`, plus a counterpart-account column for transfer rows;
`Income/Expense` holding `Income`, `Expense`, `Transfer-Out` and `Transfer-In`.

### Reading (`src/lib/xlsx.ts`, decision 9)

`xlsx.readRows(file)` → `XlsxCell[][]`, first sheet, library loaded on demand. It knows nothing about
Money Manager: a workbook that is not a readable `.xlsx` throws here, and the command turns that into
the "not a readable spreadsheet" rejection (AC `239`). **Everything after this line is plain rows**,
which is what keeps the mapping pure and testable.

### Mapping rules (`domain/moneyManager.ts`)

`toFinanceSnapshot(rows: XlsxCell[][]): ParseResult<FinanceSnapshot>` — no `File`, no library, no
`await`. A row is read by looking its columns up through the header index built from row 1.

- **Header check first.** A missing required column is the "does not carry the columns a Money Manager
  export has" rejection, named explicitly: `'Missing column: Income/Expense.'` (AC `239`).
- **Accounts → jars.** One `Jar` per distinct `Account` value, keyed by name so a name mentioned by 50
  rows yields one jar (AC `242`).
- **One `Cash` account.** Created once; every transaction points at it (ACs `243`, `247`).
- **Categories.** Keyed by `(name, kind)`, kind taken from the row's `Income/Expense` (AC `244`). A
  name used by both an income and an expense row therefore produces **two** categories, which is the
  only reading of "the kind implied by the rows that use them" that does not lose data. Transfer rows
  contribute no category.
- **Income / Expense rows → transactions** with amount, date, description, kind, category, the mapped
  jar, and the `Cash` account (AC `245`).
- **Transfer rows → allocations**, origin and destination jars from the row's two accounts (AC `246`).
  If the export writes a transfer as a `Transfer-Out` / `Transfer-In` **pair**, only `Transfer-Out`
  becomes an allocation and `Transfer-In` rows are dropped — otherwise every transfer doubles. Confirm
  against the sample; this is the single likeliest source of a wrong import.
- **No transfers** are ever produced (AC `247`) — there is only one account.
- **Amounts.** A `number` cell is turned into a decimal string with `String(Math.abs(value))` and fed
  to `currencyInput.parser`; a `string` cell has thousands separators and any sign stripped first.
  The model stores a non-negative amount and carries direction in `kind` (AC `248`). Anything the
  parser rejects — text, a blank, or a number that `String()` renders in exponent notation — is a
  named rejection quoting the row number, never a silent `0`. A number cell is an IEEE double, so the
  exact decimal the sheet holds is whatever `String()` round-trips; that is the value the spreadsheet
  itself displays, and it is the closest the file gets to an authoritative amount.
- **Dates.** A `Date` cell is taken as-is (`read-excel-file` resolves the serial against the workbook
  epoch); a `string` cell is parsed with the sample's format. Either way the result is normalised to
  `z.iso.datetime()`; a cell that is neither is a named rejection quoting the row number and the
  offending value (ACs `239`, `248`).
- The result carries ids from `generateId()`, so it feeds the exact same `replaceAll` path step 3
  built — atomicity and "rejected leaves data untouched" come free (ACs `240`, `241`).

### Wiring

- **Edit `application/commands.ts`** — `importMoneyManagerExcel(file: Blob)`: `xlsx.readRows` inside a
  `try`, the throw mapped to `{ ok: false, error: 'The file could not be read as a spreadsheet.' }`,
  then `toFinanceSnapshot`, then `replaceAll`.
- **Edit `useDataManagement.ts`** — the file goes to the command as a `Blob`; unlike the restore there
  is no `await file.text()`, because a binary read of an `.xlsx` through `text()` would corrupt it.
  Status messages mirror the restore's.
- **Edit `Settings.tsx`** — step 1 shipped this action worded for a CSV, so the rename lands here.
  Title: `Import from Money Manager Excel`. Description: `Imports an Excel file exported by the Money Manager app.`
  Then `accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"`, the
  `confirmation` prop with the same copy as the restore (AC `238`), and `notImplementedFile` replaced
  by the real handler.
- **Rename ripples:** `settings.page.ts`'s action-name union and the three copy lists at the top of
  `settings.spec.ts` carry the old title and description strings.
- **Edit `package.json`** — `read-excel-file` (decision 9).

### Tests

The e2e/unit split is different here, and deliberately. Every rejection case needs its own **binary**
fixture, which cannot be written in the test file the way a bad CSV string could — authoring six
workbooks by hand to assert six sentences is not a better test than asserting them against rows. So:
the real file is proven end to end, and the per-row rules are proven over rows.

**New `src/tests/e2e/moneyManagerImport.spec.ts`** (this suite is big enough to leave `settings.spec.ts` focused).
`setInputFiles` takes the fixture path directly, so no fixture has to be built at runtime.

- _imports a Money Manager export_ — the sample fixture; assert the `Cash` account exists, the jars
  match the file's accounts, the categories match with their kinds, and the movements appear on
  Movements with the file's amounts and dates, all hardcoded from the fixture (ACs `242`–`246`, `248`).
  This is the test that proves the workbook reader, the date serials included.
- _transfer rows become allocations and no transfers_ — assert the allocation row is on Movements and
  that no transfer row is (ACs `246`, `247`).
- _balances are consistent after an import_ — assert the `Cash` account balance and each jar balance,
  hardcoded (AC `250`).
- _the import replaces existing data_ — pre-existing movement is gone afterwards (AC `241`).
- _the import is confirmed first_, and cancelling changes nothing (AC `238`).
- _a file that is not a spreadsheet is rejected_ — feed it the JSON backup fixture, assert the message
  and that nothing changed (ACs `239`, `240`). One e2e rejection is enough to prove the error reaches
  the `role="alert"` region and the data survived.
- _imported data appears without a manual refresh and survives a reload_ (AC `249`).

**New unit tests in `src/tests/unit/`** over `toFinanceSnapshot`, with rows written as literal
`XlsxCell[][]` — the carve-out in `CONTRIBUTING.md` for logic that is critical and awkward to reach
through the UI:

- a repeated account or category is created once, and a category name used as both income and expense
  yields two categories (ACs `242`, `244`);
- a `Date` cell and a text date both normalise to the same ISO value, and a number cell and a text
  amount both reach the same `CurrencyAmount` (AC `248`);
- the named rejections, one assertion each: a missing required column, an unparseable amount, an
  unparseable date (AC `239`).

**Done when:** a real Money Manager `.xlsx` export lands in the app as jars, categories, transactions
and allocations under a single `Cash` account.

---

# Step 7 — Close the docs out

No code. `AGENTS.md` bars agents from editing documentation on their own initiative; **the user asked
for this epic**, which authorises exactly the edits below and nothing else. Anything else that looks
stale gets reported, not fixed.

1. **`docs/product/epics.md`** — tick the Epic 8 criteria (`199`–`260`) as their steps land, and carry
   `## Epic 8 — Data Management [IN PROGRESS]` from step 1 until step 6 is green, matching how Epics 6
   and 7 were run.
2. **`CONTRIBUTING.md` → "Folder Structure"** — one addition and one amendment, in the existing wording:
   - under `src/services/`: ``- `data-management/` - backup, restore, CSV export and Money Manager import (`application/`, `domain/`)``
   - `src/lib/`'s parenthetical gains `CSV serialization`, `xlsx reading` and `file download`.
     `src/presentation/` is untouched (decision 5).

No `docs/tech-debt.md` entry: the epic adds no deferred work. The one thing worth writing down —
that cache freshness rides on route remounts — is a property of the existing design, not debt this
epic introduces, and decision 4 records the condition that would change it.

**Done when:** `epics.md` reflects what shipped and the folder list matches the tree.

---

## File summary

**New (21):**

```
src/services/finance/model/entities/snapshot.ts
src/services/finance/domain/commands/database.ts                 (step 3)
src/services/finance/application/commands/database.ts            (step 3)
src/services/data-management/index.ts
src/services/data-management/domain/result.ts                    (step 3)
src/services/data-management/domain/backup.ts
src/services/data-management/domain/moneyManager.ts              (step 6)
src/services/data-management/application/commands.ts
src/lib/fileDownload.ts
src/lib/csv.ts                                                   (step 5)
src/lib/xlsx.ts                                                  (step 6)
src/services/data-management/domain/movementsCsv.ts              (step 5)
src/hooks/useDataManagement.ts
src/components/Settings.tsx
src/components/SettingsAction.tsx
src/components/ui/alert-dialog.tsx                               (shadcn, step 3)
src/routes/settings.tsx
src/tests/e2e/pages/settings.page.ts
src/tests/e2e/settings.spec.ts
src/tests/e2e/moneyManagerImport.spec.ts                         (step 6)
src/tests/e2e/fixtures/money-manager-sample.xlsx                 (step 6, supplied by the user)
```

**Edited:**

```
src/services/finance/infrastructure/db.ts          DB_SCHEMA_VERSION, upVersion, snapshot/replaceAll/clear
src/services/finance/infrastructure/repositories.ts database repository
src/services/finance/domain/repositories.ts        FinanceDatabaseRepository
src/services/finance/domain/commands/index.ts      (step 3)
src/services/finance/application/commands/index.ts (step 3)
src/services/finance/application/queries.ts        database.snapshot
src/services/finance/model/entities/index.ts
src/services/finance/index.ts
src/components/RootLayout.tsx                      Settings nav entry
src/tests/e2e/pages/rootLayout.page.ts             'Settings' in the nav union
src/tests/e2e/setup/pages.ts                       settingsPage fixture
src/lib/decimal.ts                                 toDecimalString                     (step 5)
src/tests/unit/unit.spec.ts                        csv + decimal strings (step 5), Money Manager rows (step 6)
package.json                                       read-excel-file                     (step 6)
src/routeTree.gen.ts                               regenerated

docs/product/epics.md                              ACs ticked                          (step 7)
CONTRIBUTING.md                                    folder list                         (step 7)
```

**Dependencies:** one, `read-excel-file`, and only for step 6 (decision 9). No CSV and no file-saver
dependency (decision 5); the other addition is a shadcn component generated into
`src/components/ui/`.

## Checks

Per step:

```bash
pnpm exec tsc -b
pnpm lint
pnpm format:check
pnpm test:chromium
```

`pnpm test` before the epic is called done — file downloads and `setInputFiles` behave differently
enough across Chromium, Firefox and WebKit that the full matrix is worth running here specifically.

## Out of scope

- **Referential integrity on restore.** The ACs require every record to pass its own schema, not that
  a transaction's `jarId` names a jar present in the file. A hand-edited backup can therefore restore
  a movement pointing at a missing jar, which renders as a blank name. Adding a cross-entity check to
  the snapshot validation is ~20 lines in `finance/domain/commands/database.ts` and would close it —
  **worth deciding on before step 3 rather than after**, since it changes what "valid file" means.
- **Merging instead of replacing.** All three write actions replace the whole database, per the ACs.
- **Exporting archived movements.** The CSV lists what the app lists, so deleted (archived) movements
  are excluded; the JSON backup keeps them, which is why the backup is the thing that round-trips.
- **Encrypting or uploading backups anywhere.** Files stay on the user's device.
- **Epic 9 statistics.**
